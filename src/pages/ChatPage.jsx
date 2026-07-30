import React, { useEffect, useRef, useState } from 'react'
import ChatMessages from '../components/chat/ChatMessages'
import PromptInput from '../components/chat/PromptInput'
import { useChatStore } from '../store/chatStore'
import { generateService } from '../services/generateService'
import { chatService } from '../services/chatService'
import { assetService } from '../services/assetService'

// A message that is nothing but "retry" (or the Arabic equivalent) after a
// failed run is the Retry button said out loud. Anything with more to it —
// "retry but make it night" — is a real new request and must not be swallowed.
const RETRY_PHRASE = /^(retry|resume|try again|again|continue|go on|أعد|أعد المحاولة|إعادة|اعد|كمل|أكمل|اكمل|حاول مرة أخرى|جرب مرة أخرى)[\s!.،؟?]*$/i

function ChatPage() {
  const { currentChatId, messages, setMessages, addMessage, updateMessage, loading, setLoading } = useChatStore()
  const wsRef = useRef(null)
  // Index of the card message (plan or clarification) currently awaiting the user.
  const cardIndexRef = useRef(null)
  // Index of the message that live WebSocket progress should be written into.
  // Null while a card is on screen — there is nothing running to report then.
  const progressTargetRef = useRef(null)
  const [activeRunId, setActiveRunId] = useState(null)
  // True while a card is on screen waiting for the user. The run is still open,
  // but nothing is executing — so the prompt box stays usable and the user can
  // walk away from the run by simply typing something else.
  const [awaitingUser, setAwaitingUser] = useState(false)
  // Which models this deployment can actually run, for the plan card's picker.
  // Fetched once; the card falls back to showing the run's current model until
  // it arrives, so a slow or failed fetch never blocks reviewing a plan.
  const [modelCatalog, setModelCatalog] = useState(null)

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  useEffect(() => {
    generateService.getModels()
      .then(setModelCatalog)
      .catch((error) => {
        // Not fatal: without the catalog the card still shows quality and
        // aspect ratio, just no model list to switch between.
        console.error('Could not load the model list:', error)
      })
  }, [])

  // Load messages whenever currentChatId changes while on this page, then pick
  // up any run that chat left unfinished.
  useEffect(() => {
    if (!currentChatId) return
    let cancelled = false

    // Switching chats must not leave the previous chat's socket open, or its
    // progress would be written into this chat's messages.
    endRun()

    chatService.getMessages(currentChatId)
      .then((data) => {
        if (cancelled) return null
        if (Array.isArray(data)) setMessages(data)
        return generateService.getActiveRun(currentChatId)
      })
      .then((active) => {
        if (cancelled || !active) return
        restoreRun(active)
      })
      .catch((error) => {
        // A chat that can't report its active run is still readable, so this
        // never blocks loading the conversation.
        console.error('Could not restore the active run:', error)
      })

    return () => { cancelled = true }
    // restoreRun/endRun are stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId, setMessages])

  const waitForSocketOpen = (socket) => new Promise((resolve) => {
    if (socket.readyState === WebSocket.OPEN) {
      resolve()
      return
    }
    const timeout = window.setTimeout(resolve, 1500)
    socket.addEventListener('open', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
    socket.addEventListener('error', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
  })

  // Merge a patch into an existing message without clobbering its other fields.
  const patchMessage = (index, patch) => {
    if (index === null || index === undefined) return
    const current = useChatStore.getState().messages[index]
    if (!current) return
    updateMessage(index, { ...current, ...patch })
  }

  const closeSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const endRun = () => {
    closeSocket()
    cardIndexRef.current = null
    progressTargetRef.current = null
    setActiveRunId(null)
    setAwaitingUser(false)
    setLoading(false)
  }

  const pushError = (error, fallback = 'Generation failed') => {
    addMessage({
      role: 'assistant',
      content: `Error: ${error?.response?.data?.detail || error?.message || fallback}`,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * The backend returns either a plan (status 'awaiting_confirmation') or a set
   * of clarification questions (status 'awaiting_clarification') from /plan,
   * /revise and /clarify alike — so every caller routes through here.
   */
  const renderPlanResponse = (result, runId, { replaceIndex = null } = {}) => {
    const isClarification = result.status === 'awaiting_clarification'
    const card = isClarification
      ? {
          role: 'assistant',
          kind: 'clarification',
          runId,
          questions: result.questions || [],
          resolved: false,
          busy: false,
          created_at: new Date().toISOString(),
        }
      : {
          role: 'assistant',
          kind: 'plan',
          runId,
          plan: result,
          previews: [],
          resolved: false,
          busy: false,
          created_at: new Date().toISOString(),
        }

    if (replaceIndex !== null) {
      updateMessage(replaceIndex, card)
      cardIndexRef.current = replaceIndex
    } else {
      cardIndexRef.current = useChatStore.getState().messages.length
      addMessage(card)
    }
    // A card is now on screen and nothing is running, so stop routing progress
    // into the message the card just took over.
    progressTargetRef.current = null
    setAwaitingUser(true)
    setLoading(false)
  }

  /**
   * Terminal WebSocket event for the expensive half of a run. /confirm returns
   * as soon as the work is queued, so this — not the HTTP response — is where
   * generated media actually arrives.
   */
  const renderCompletion = (data, runId) => {
    const target = progressTargetRef.current

    if (data.status !== 'completed' || !data.result) {
      // Keep the run id on the message: the plan and any scenes it already
      // finished are still on the server, so this is resumable rather than
      // something the user has to describe from scratch.
      patchMessage(target, {
        content: `Error: ${data.error || 'Generation failed'}`,
        failedRunId: runId,
      })
      endRun()
      return
    }

    const result = data.result
    const media = []
    if (result.image_urls?.length > 0) {
      result.image_urls.forEach((url) => media.push({ type: 'image', url }))
    }
    if (result.video_url) {
      media.push({ type: 'video', url: result.video_url })
    }

    const scenes = result.scenes || []
    const multiScene = scenes.length > 1

    patchMessage(target, {
      content: multiScene
        ? `${scenes.length} scenes generated.`
        : (result.status === 'succeeded' ? 'Generation complete.' : `Status: ${result.status}`),
      // Multi-scene results render per scene; the flat media list would
      // otherwise only show the final scene.
      media: multiScene ? [] : media,
      scenes: multiScene ? scenes : [],
    })
    endRun()
  }

  /**
   * Open the run's progress socket and route its events. Shared by the initial
   * prompt and by retry, so a resumed run reports progress the same way.
   */
  const openRunSocket = async (runId) => {
    const socket = generateService.connectWebSocket(runId)
    wsRef.current = socket
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // /plan, /clarify and /revise also emit a completion event, but with
        // an awaiting_* status — those are already answered by their own HTTP
        // response and must not be mistaken for the end of the run.
        if (data.type === 'completion') {
          if (data.status === 'completed' || data.status === 'failed') {
            renderCompletion(data, runId)
          }
          return
        }
        if (data.type !== 'progress') return
        // Multi-scene runs report which scene they're on; a single global
        // percentage would otherwise appear to restart on every scene with no
        // explanation.
        const scene = data.scene_number ? `Scene ${data.scene_number} · ` : ''
        const prefix = data.progress ? `${scene}${data.progress}%` : `${scene}Working`
        // Follows the run across both phases: the pre-plan line first, then
        // the post-confirm line. Null while a card awaits the user.
        patchMessage(progressTargetRef.current, { content: `${prefix} - ${data.message}` })
      } catch {
        // Ignore malformed WebSocket messages and keep the current progress text.
      }
    }
    await waitForSocketOpen(socket)
    return socket
  }

  /**
   * Put a chat back where its unfinished run left it.
   *
   * None of the confirmation-gate UI was ever persisted — the plan card, the
   * pending questions and the live progress line all lived in this component's
   * state, so a refresh used to leave the conversation looking finished while
   * the run carried on server-side. Everything here is rebuilt from one
   * /active-run call.
   */
  const restoreRun = (active) => {
    const { run_id: runId, status, plan, questions, previews, assets, stale, retryable } = active

    // Media the run already produced. Shown first, because it happened first —
    // and because a run that is still going, or that died partway, has no
    // message carrying it (that is only written once the whole run succeeds).
    if (assets?.length > 0) {
      addMessage({
        role: 'assistant',
        content: assets.length === 1 ? 'Generated so far:' : `Generated so far (${assets.length}):`,
        attachments: assets,
        created_at: new Date().toISOString(),
      })
    }

    if (status === 'awaiting_confirmation' && plan) {
      renderPlanResponse(plan, runId)
      // Previews were paid for; restore them onto the card rather than making
      // the user regenerate them.
      if (previews?.length > 0) {
        patchMessage(cardIndexRef.current, { previews })
      }
      setActiveRunId(runId)
      return
    }

    if (status === 'awaiting_clarification' && questions?.length > 0) {
      renderPlanResponse({ status: 'awaiting_clarification', questions }, runId)
      setActiveRunId(runId)
      return
    }

    // A run that failed, or one stuck long enough to be dead, is offered for
    // resume — the server still holds its approved plan and the scenes it
    // already paid for, so this picks up rather than starting over.
    if (status === 'failed' || ((status === 'running' || status === 'pending') && stale)) {
      addMessage({
        role: 'assistant',
        content: retryable
          ? 'This run stopped before it finished.'
          : 'This run stopped before it finished, and is too early to resume — send the prompt again.',
        failedRunId: retryable ? runId : null,
        created_at: new Date().toISOString(),
      })
      return
    }

    if (status === 'running' || status === 'pending') {
      const index = useChatStore.getState().messages.length
      // Still alive: reattach so live progress resumes.
      addMessage({
        role: 'assistant',
        content: 'Still generating…',
        created_at: new Date().toISOString(),
      })
      setActiveRunId(runId)
      progressTargetRef.current = index
      setLoading(true)
      openRunSocket(runId).catch((error) => {
        console.error('Could not reattach to the run:', error)
        patchMessage(index, {
          content: 'This run is still generating, but live progress could not be reattached. Reopen the chat to check on it.',
        })
        setLoading(false)
      })
    }
  }

  /**
   * Resume a failed run rather than starting a new one. The server still holds
   * the approved plan and every scene it already finished, so this picks up
   * where the failure happened instead of re-planning from the prompt.
   */
  const handleRetry = async (runId, messageIndex) => {
    if (loading || activeRunId) return

    setLoading(true)
    setAwaitingUser(false)
    patchMessage(messageIndex, { content: 'Retrying...', failedRunId: null })
    setActiveRunId(runId)
    progressTargetRef.current = messageIndex

    try {
      await openRunSocket(runId)
      await generateService.retry(runId)
    } catch (error) {
      console.error('Failed to retry:', error)
      patchMessage(messageIndex, {
        content: `Error: ${error?.response?.data?.detail || error?.message || 'Retry failed'}`,
        failedRunId: runId,
      })
      endRun()
    }
  }

  /**
   * The most recent message, if it is a failure the user could still resume.
   * Only the last one counts — resuming a failure from further back would jump
   * over whatever the user did since.
   */
  const resumableRun = () => {
    const all = useChatStore.getState().messages
    return all.length ? (all[all.length - 1].failedRunId || null) : null
  }

  const handleSendPrompt = async (prompt, attachmentFile = null) => {
    if (loading) return

    // "retry" typed after a failure means the button, not a new prompt. Only a
    // bare retry word counts: "retry but at night" is a different request and
    // has to go through planning as usual.
    const isRetryPhrase = !attachmentFile && RETRY_PHRASE.test(prompt.trim())

    // "retry" while the plan card is still on screen means "try that again",
    // not "throw it away". The run never left AWAITING_CONFIRMATION — a
    // declined card or an empty balance is rejected before any work starts —
    // so confirming again is the whole fix once the user has topped up.
    if (isRetryPhrase && activeRunId && awaitingUser && cardIndexRef.current !== null) {
      addMessage({ role: 'user', content: prompt, created_at: new Date().toISOString() })
      await handleConfirm(activeRunId)
      return
    }

    const resumeId = resumableRun()
    if (resumeId && isRetryPhrase) {
      // Echo it like any other message and resume underneath, so the retry
      // reads as part of the conversation rather than the word vanishing.
      patchMessage(useChatStore.getState().messages.length - 1, { failedRunId: null })
      addMessage({ role: 'user', content: prompt, created_at: new Date().toISOString() })
      const progressIndex = useChatStore.getState().messages.length
      addMessage({ role: 'assistant', content: 'Retrying...', created_at: new Date().toISOString() })
      await handleRetry(resumeId, progressIndex)
      return
    }
    // A run that is mid-generation still owns the chat; one that is only
    // waiting on a card does not.
    if (activeRunId && !awaitingUser) return

    // Typing instead of answering the card abandons that run — otherwise the
    // only way out of a card is to answer it, which strands the chat when the
    // user has changed their mind.
    if (activeRunId && awaitingUser) {
      const abandonedIndex = cardIndexRef.current
      try {
        await generateService.cancel(activeRunId)
      } catch (error) {
        // Already cancelled, finished, or gone — either way the user is moving on.
        console.error('Could not cancel the abandoned run:', error)
      }
      patchMessage(abandonedIndex, { resolved: true, resolution: 'cancelled', busy: false })
      endRun()
    }

    try {
      setLoading(true)

      let chatId = currentChatId
      if (!chatId) {
        const chat = await chatService.createChat()
        chatId = chat.id
        useChatStore.setState((state) => ({
          chats: [chat, ...state.chats],
          currentChatId: chat.id,
          messages: [],
        }))
      }

      const title = prompt.length > 50 ? prompt.slice(0, 50).trimEnd() + '…' : prompt || 'Image upload'
      chatService.renameChat(chatId, title).then((updated) => {
        useChatStore.setState((state) => ({
          chats: state.chats.map((c) => (c.id === chatId ? { ...c, title: updated.title } : c)),
        }))
      }).catch(() => {})

      let imageAttachmentUrl = null
      let attachmentPreviewUrl = null
      if (attachmentFile) {
        attachmentPreviewUrl = URL.createObjectURL(attachmentFile)
        try {
          imageAttachmentUrl = await assetService.uploadImage(attachmentFile, chatId)
        } catch (err) {
          console.error('Failed to upload attachment:', err)
        }
      }
  
      addMessage({
        role: 'user',
        content: prompt,
        media: attachmentPreviewUrl ? [{ type: 'image', url: attachmentPreviewUrl }] : [],
        created_at: new Date().toISOString(),
      })

      const progressIndex = useChatStore.getState().messages.length
      addMessage({
        role: 'assistant',
        content: 'Starting generation...',
        created_at: new Date().toISOString(),
      })

      const startedRun = await generateService.start(chatId, prompt, imageAttachmentUrl)
      setActiveRunId(startedRun.run_id)
      progressTargetRef.current = progressIndex

      const socket = await openRunSocket(startedRun.run_id)

      // Plan only — nothing is generated until the user confirms.
      const result = await generateService.plan(startedRun.run_id, imageAttachmentUrl)
      renderPlanResponse(result, startedRun.run_id, { replaceIndex: progressIndex })
    } catch (error) {
      console.error('Failed to plan generation:', error)
      pushError(error, 'Could not plan the generation')
      endRun()
    }
  }

  // ── Card actions ──────────────────────────────────────────────────────────

  const withCardBusy = async (fn) => {
    const index = cardIndexRef.current
    patchMessage(index, { busy: true })
    // The card is mid-request; re-lock the prompt box so a new prompt can't
    // cancel the very run this call is trying to advance.
    setAwaitingUser(false)
    try {
      await fn(index)
    } finally {
      // The card may have been replaced or resolved by fn; only clear busy if
      // it's still the same pending card.
      const current = useChatStore.getState().messages[index]
      if (current && current.busy) patchMessage(index, { busy: false })

      // Whatever fn did, if an unresolved card is still on screen then nothing
      // is running and the user is back in control of the prompt box.
      const cardIndex = cardIndexRef.current
      const card = cardIndex === null ? null : useChatStore.getState().messages[cardIndex]
      if (card && !card.resolved) setAwaitingUser(true)
    }
  }

  const handleEdit = (runId, field, text) => withCardBusy(async (index) => {
    try {
      const updated = await generateService.edit(runId, field, text)
      patchMessage(index, { plan: updated, busy: false })
    } catch (error) {
      pushError(error, 'Could not save the edit')
    }
  })

  const handleEditScript = (runId, scenes) => withCardBusy(async (index) => {
    try {
      const updated = await generateService.editScript(runId, scenes)
      patchMessage(index, { plan: updated, busy: false })
    } catch (error) {
      pushError(error, 'Could not save the script')
    }
  })

  /**
   * Quality / aspect ratio / model change from the plan card.
   *
   * Free and instant server-side, so the card is updated in place rather than
   * being replaced — the user keeps their previews and stays exactly where they
   * were. The response carries any new warning about the combination (say,
   * 1080p on a model that only reaches 720p), which is why the whole plan is
   * swapped in rather than just the field that changed.
   */
  const handleSettings = (runId, settings) => withCardBusy(async (index) => {
    try {
      const updated = await generateService.updateSettings(runId, settings)
      patchMessage(index, { plan: updated, busy: false })
    } catch (error) {
      pushError(error, 'Could not change the output settings')
    }
  })

  const handlePreview = (runId, previewType, characterName = null) => withCardBusy(async (index) => {
    try {
      const preview = await generateService.preview(runId, previewType, characterName)
      const current = useChatStore.getState().messages[index]
      // Keyed by preview_type + character_name so re-previewing one character
      // (e.g. regenerating "Rogue") replaces only that character's card
      // instead of wiping out every other character's preview.
      const others = (current?.previews || []).filter(
        (p) => !(p.preview_type === preview.preview_type && p.character_name === preview.character_name)
      )
      patchMessage(index, { previews: [...others, preview], busy: false })
    } catch (error) {
      pushError(error, 'Could not generate the preview')
    }
  })

  const handleRevise = (runId, feedback) => withCardBusy(async (index) => {
    addMessage({ role: 'user', content: feedback, created_at: new Date().toISOString() })
    try {
      const result = await generateService.revise(runId, feedback)
      // Revise returns a fresh plan (or new questions) — swap the card in place.
      renderPlanResponse(result, runId, { replaceIndex: index })
    } catch (error) {
      pushError(error, 'Could not revise the plan')
      patchMessage(index, { busy: false })
    }
  })

  const handleClarify = (runId, answers) => withCardBusy(async (index) => {
    try {
      const result = await generateService.clarify(runId, answers)
      renderPlanResponse(result, runId, { replaceIndex: index })
    } catch (error) {
      pushError(error, 'Could not submit your answers')
      patchMessage(index, { busy: false })
    }
  })

  const handleCancel = (runId) => withCardBusy(async (index) => {
    try {
      await generateService.cancel(runId)
      patchMessage(index, { resolved: true, resolution: 'cancelled', busy: false })
      addMessage({ role: 'assistant', content: 'Generation cancelled.', created_at: new Date().toISOString() })
    } catch (error) {
      pushError(error, 'Could not cancel the run')
    } finally {
      endRun()
    }
  })

  const handleConfirm = (runId) => withCardBusy(async (index) => {
    patchMessage(index, { resolved: true, resolution: 'confirmed' })
    setLoading(true)
    setAwaitingUser(false)

    const progressIndex = useChatStore.getState().messages.length
    addMessage({ role: 'assistant', content: 'Generating...', created_at: new Date().toISOString() })
    // Live progress resumes here for the expensive half of the run.
    cardIndexRef.current = null
    progressTargetRef.current = progressIndex

    try {
      // Returns as soon as the work is queued. The generated media arrives
      // later on the WebSocket — see renderCompletion.
      await generateService.confirm(runId)
    } catch (error) {
      console.error('Failed to start generation:', error)
      // Rejected before any work began — out of credits, card declined, plan
      // gone stale. The run is untouched and still awaiting confirmation, so
      // put the card back rather than stranding it: once the user tops up,
      // Confirm works again and nothing has to be described a second time.
      patchMessage(index, { resolved: false, resolution: null, busy: false })
      cardIndexRef.current = index
      patchMessage(progressIndex, {
        content: `Error: ${error?.response?.data?.detail || error?.message || 'Generation failed'}`
          + ' — your plan is still here, press Confirm again once it is sorted.',
      })
      closeSocket()
      progressTargetRef.current = null
      setAwaitingUser(true)
      setLoading(false)
    }
  })

  const handlers = {
    onEdit: handleEdit,
    onEditScript: handleEditScript,
    onPreview: handlePreview,
    onRevise: handleRevise,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    onClarify: handleClarify,
    onRetry: handleRetry,
    onSettings: handleSettings,
    modelCatalog,
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full">
        <ChatMessages messages={messages} loading={loading} handlers={handlers} />
        <PromptInput onSubmit={handleSendPrompt} disabled={loading || (!!activeRunId && !awaitingUser)} />
      </div>
    </div>
  )
}

export default ChatPage
