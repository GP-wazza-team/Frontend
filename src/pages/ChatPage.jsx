import React, { useEffect, useRef, useState } from 'react'
import ChatMessages from '../components/chat/ChatMessages'
import PromptInput from '../components/chat/PromptInput'
import { useChatText } from '../components/chat/chatKit'
import { useRunStatus } from '../components/RunStatusContext'
import Meter from '../components/ui/Meter'
import { Duration } from '../components/ui/Money'
import { ShapeRun } from '../components/Icon'
import { useUIStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { generateService } from '../services/generateService'
import { chatService } from '../services/chatService'
import { assetService } from '../services/assetService'
import { describeError } from '../services/errorText'

/**
 * THE RUN STRIP.
 *
 * Progress used to be a text string mutating in place inside a message that
 * scrolled away mid-generation. This is a fixed strip pinned ABOVE the composer
 * and OUTSIDE the scroll container, so the machine's state cannot leave the
 * screen while it is spending money.
 *
 * It is a READER, not a controller. `patchMessage` keeps writing its progress
 * line into the transcript exactly as it did — the strip is an additional
 * surface over the same values, and it owns no behaviour of its own.
 */
function RunStrip({ phase, percent, sceneNumber, elapsedMs }) {
  const { t } = useUIStore()
  const { tx } = useChatText()
  const hasPercent = typeof percent === 'number' && Number.isFinite(percent)

  return (
    <div
      className="shrink-0 grid items-center chat-pad"
      style={{
        // var(--rail-spine), not a literal 56px: the gutter narrows to 32px
        // below 640px and a hardcoded track would leave the strip's legend
        // misaligned against every other row in the app.
        gridTemplateColumns: 'var(--rail-spine) minmax(0, 1fr)',
        backgroundColor: 'var(--panel)',
        borderBlockStart: '1px solid var(--etch)',
        paddingInline: 24,
        paddingBlock: 8,
      }}
    >
      <span className="wz-gutter" style={{ fontSize: 10 }}>{tx('runLegend')}</span>

      <div className="flex items-center gap-4 min-w-0">
        <span className="marker marker--run">
          <ShapeRun size={10} />
          <span className="truncate">{phase || t('generating')}</span>
        </span>

        {sceneNumber ? (
          <span className="mono shrink-0" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {tx('scene')} {String(sceneNumber).padStart(2, '0')}
          </span>
        ) : null}

        <Meter
          cells={5}
          value={hasPercent ? percent : 0}
          mode={hasPercent ? 'determinate' : 'indeterminate'}
          tone="signal"
          label={t('generating')}
        />

        {Number.isFinite(elapsedMs) && (
          <span className="ms-auto flex items-center gap-2 shrink-0">
            <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{tx('elapsed')}</span>
            <Duration ms={elapsedMs} style={{ fontSize: 11, color: 'var(--ink-2)' }} />
          </span>
        )}
      </div>
    </div>
  )
}

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
  // Chat id whose next history-load effect should be skipped — see that
  // effect below for why. Holds the id, not a bool, so a rapid second
  // chat-create can't accidentally suppress the wrong chat's load.
  const skipNextHistoryLoad = useRef(null)
  // True once a run has reached a terminal state (completed, failed, cancelled,
  // or torn down by a chat switch). Guards the socket's error/close handlers so
  // the expected close after a completion is not reported as a lost connection.
  const runFinishedRef = useRef(false)
  const [activeRunId, setActiveRunId] = useState(null)
  // True while a card is on screen waiting for the user. The run is still open,
  // but nothing is executing — so the prompt box stays usable and the user can
  // walk away from the run by simply typing something else.
  const [awaitingUser, setAwaitingUser] = useState(false)
  // Which models this deployment can actually run, for the plan card's picker.
  // Fetched once; the card falls back to showing the run's current model until
  // it arrives, so a slow or failed fetch never blocks reviewing a plan.
  const [modelCatalog, setModelCatalog] = useState(null)

  // ── PRESENTATION-ONLY RUN TELEMETRY ───────────────────────────────────────
  // The same values `openRunSocket`'s onmessage already parses out of the
  // payload, held as local state so the run strip and the status bar can read
  // them. No store gains state, no service changes, and the transcript's
  // progress line is written exactly as before.
  const { publish, clear } = useRunStatus()
  const [phase, setPhase] = useState(null)
  const [percent, setPercent] = useState(null)
  const [sceneNumber, setSceneNumber] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(null)
  const [sessionCostUsd, setSessionCostUsd] = useState(0)

  // Elapsed is a local clock, started when a run becomes active and stopped
  // when it ends. It reports nothing the server does not already know.
  useEffect(() => {
    if (!activeRunId) {
      setElapsedMs(null)
      return undefined
    }
    const started = Date.now()
    setElapsedMs(0)
    const id = setInterval(() => setElapsedMs(Date.now() - started), 1000)
    return () => clearInterval(id)
  }, [activeRunId])

  useEffect(() => {
    publish({ activeRunId, loading, awaitingUser, phase, percent, sceneNumber, elapsedMs, sessionCostUsd })
  }, [activeRunId, loading, awaitingUser, phase, percent, sceneNumber, elapsedMs, sessionCostUsd, publish])

  // Leaving the chat leaves nothing stale in the status bar.
  useEffect(() => () => clear(), [clear])

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
  //
  // Skipped entirely for a chat this same tab just created (see
  // handleSendPrompt): its local `messages` is already correct and running
  // ahead of the server — the optimistic "Starting generation..." placeholder
  // and the plan/clarification card only ever exist client-side, never
  // persisted as chat messages. Without this guard, this fetch can resolve
  // mid-flow and silently replace that array with the server's shorter one
  // while cardIndexRef still points into the old, longer array — the next
  // message-array write then lands past the end and corrupts the list.
  //
  // The guard has to come before endRun(): the run this tab just started is
  // the one we would be tearing down, and there is no unfinished run to
  // restore for a chat created moments ago.
  useEffect(() => {
    if (!currentChatId) return
    if (skipNextHistoryLoad.current === currentChatId) {
      skipNextHistoryLoad.current = null
      return
    }
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
    // Set before the socket closes: closing fires onclose, and that handler
    // must not report a dropped connection for a run we deliberately ended.
    runFinishedRef.current = true
    closeSocket()
    cardIndexRef.current = null
    progressTargetRef.current = null
    setActiveRunId(null)
    setAwaitingUser(false)
    setLoading(false)
    // Presentation only: the strip and the status bar have nothing left to read.
    setPhase(null)
    setPercent(null)
    setSceneNumber(null)
  }

  /**
   * Put a failure in the transcript as a FAILURE, not as a sentence.
   *
   * `errorTitle` is the operation that failed and `errorDetail` is whatever the
   * server or the agent actually said — kept as separate fields so the row can
   * show both, and so nothing depends on sniffing the content string. `content`
   * is still written for chat history, which is plain text on the server.
   */
  const pushError = (error, fallback = 'Generation failed', { runId = null } = {}) => {
    const detail = describeError(error, fallback)
    addMessage({
      role: 'assistant',
      kind: 'error',
      errorTitle: fallback,
      errorDetail: detail,
      errorRunId: runId,
      content: `Error: ${detail}`,
      created_at: new Date().toISOString(),
    })
    // Anything that reaches here is worth having in the console with its stack
    // intact — the row above is the readable summary, not the whole record.
    console.error(`[${fallback}]`, error)
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
      // `data.error` is the agent's own message, and it is the single most
      // useful string in this whole flow — it is what the pipeline said when it
      // gave up. It gets its own field so the row prints it verbatim instead of
      // burying it in prose.
      patchMessage(target, {
        kind: 'error',
        errorTitle: 'Generation failed',
        errorDetail: data.error || 'The run stopped without reporting a reason',
        errorRunId: runId,
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
        // The SAME values, published for the run strip and the status bar. This
        // adds a reader; it changes nothing about the line above.
        setPhase(data.message || null)
        setPercent(Number.isFinite(Number(data.progress))
          ? Math.min(1, Math.max(0, Number(data.progress) / 100))
          : null)
        setSceneNumber(data.scene_number || null)
      } catch {
        // Ignore malformed WebSocket messages and keep the current progress text.
      }
    }

    // Without these two, a socket that dies mid-run leaves the strip spinning
    // on its last progress line forever: no completion event ever arrives, so
    // nothing clears it and nothing says why. The run itself is usually still
    // alive on the server, which is why this reports a lost CHANNEL rather than
    // a failed run — the work is not gone, the reporting is.
    //
    // `runFinishedRef` separates this from the ordinary close that follows a
    // completion event, and it is set before endRun() because endRun() closes
    // the socket, which re-enters onclose.
    const reportLostContact = async (detail, short) => {
      if (runFinishedRef.current) return
      runFinishedRef.current = true

      // A dropped socket is NOT the same as a failed run, and most of the time
      // it isn't even a problem — the run keeps going server-side and writes
      // its result into the chat when it finishes. So ask the server what
      // actually happened before telling the user anything went wrong.
      //
      // This is the difference between "your video is ready" and a spinner
      // that never stops: the completion event is broadcast once, to whoever
      // is connected at that instant, and is not replayed.
      try {
        const active = await generateService.getActiveRun(currentChatId)
        const stillRunning = active && (active.status === 'running' || active.status === 'pending')
        if (!stillRunning) {
          // The run is over. Chat history is authoritative and already holds
          // the result message the success path wrote, with its attachments.
          const data = await chatService.getMessages(currentChatId)
          if (Array.isArray(data)) setMessages(data)
          endRun()
          return
        }
      } catch {
        // Fall through to the error row — if we cannot reach the server to ask,
        // reporting the lost connection is the honest outcome.
      }

      const patch = {
        kind: 'error',
        errorTitle: 'Lost contact with the run',
        errorDetail: detail,
        errorRunId: runId,
        content: `Error: ${short}`,
        // Resumable: the plan and any finished scenes are still server-side.
        failedRunId: runId,
      }

      // While a card is on screen there is no progress line to overwrite, and
      // patchMessage(null) is a silent no-op — the one outcome this whole
      // change exists to prevent. Append instead.
      if (progressTargetRef.current === null || progressTargetRef.current === undefined) {
        addMessage({ role: 'assistant', created_at: new Date().toISOString(), ...patch })
      } else {
        patchMessage(progressTargetRef.current, patch)
      }
      endRun()
    }

    socket.onerror = () => {
      reportLostContact(
        'The progress connection dropped. The run may still be going on the server — reopen this chat to pick it up.',
        'the progress connection dropped',
      )
    }

    socket.onclose = (event) => {
      // 1000 is a normal close; anything else ended the stream unexpectedly.
      if (event.code === 1000) return
      reportLostContact(
        `The progress connection closed unexpectedly (code ${event.code}${event.reason ? `: ${event.reason}` : ''}). The run may still be going on the server — reopen this chat to pick it up.`,
        `the progress connection closed (code ${event.code})`,
      )
    }

    runFinishedRef.current = false
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
        skipNextHistoryLoad.current = chat.id
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
      pushError(error, 'Could not save the edit', { runId })
    }
  })

  const handleEditScript = (runId, scenes) => withCardBusy(async (index) => {
    try {
      const updated = await generateService.editScript(runId, scenes)
      patchMessage(index, { plan: updated, busy: false })
    } catch (error) {
      pushError(error, 'Could not save the script', { runId })
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
      pushError(error, 'Could not change the output settings', { runId })
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
      pushError(error, 'Could not generate the preview', { runId })
    }
  })

  const handleRevise = (runId, feedback) => withCardBusy(async (index) => {
    addMessage({ role: 'user', content: feedback, created_at: new Date().toISOString() })
    try {
      const result = await generateService.revise(runId, feedback)
      // Revise returns a fresh plan (or new questions) — swap the card in place.
      renderPlanResponse(result, runId, { replaceIndex: index })
    } catch (error) {
      pushError(error, 'Could not revise the plan', { runId })
      patchMessage(index, { busy: false })
    }
  })

  const handleClarify = (runId, answers) => withCardBusy(async (index) => {
    try {
      const result = await generateService.clarify(runId, answers)
      renderPlanResponse(result, runId, { replaceIndex: index })
    } catch (error) {
      pushError(error, 'Could not submit your answers', { runId })
      patchMessage(index, { busy: false })
    }
  })

  const handleCancel = (runId) => withCardBusy(async (index) => {
    try {
      await generateService.cancel(runId)
      patchMessage(index, { resolved: true, resolution: 'cancelled', busy: false })
      addMessage({ role: 'assistant', content: 'Generation cancelled.', created_at: new Date().toISOString() })
    } catch (error) {
      pushError(error, 'Could not cancel the run', { runId })
    } finally {
      endRun()
    }
  })

  const handleConfirm = (runId) => withCardBusy(async (index) => {
    // Read before the patch: this is what the user just authorised, and it is
    // what the session spend in the status bar accumulates. Presentation only —
    // the figure comes off the card that is already on screen.
    const authorised = Number(useChatStore.getState().messages[index]?.plan?.total_cost_usd)

    patchMessage(index, { resolved: true, resolution: 'confirmed' })
    if (Number.isFinite(authorised)) setSessionCostUsd((total) => total + authorised)
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
      // Nothing was spent, so the session total gives it back.
      if (Number.isFinite(authorised)) setSessionCostUsd((total) => Math.max(0, total - authorised))
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

  const composerDisabled = loading || (!!activeRunId && !awaitingUser)

  /* Three bands: the transcript scrolls, the run strip and the composer are
     pinned. No viewport calc — <main> is a flex child with a definite height,
     so the page is simply h-full. */
  return (
    <div className="flex flex-col h-full min-h-0" style={{ backgroundColor: 'var(--paper)' }}>
      <ChatMessages
        messages={messages}
        loading={loading}
        handlers={handlers}
        onSubmit={handleSendPrompt}
        phase={phase}
      />
      {composerDisabled && (
        <RunStrip phase={phase} percent={percent} sceneNumber={sceneNumber} elapsedMs={elapsedMs} />
      )}
      <PromptInput onSubmit={handleSendPrompt} disabled={composerDisabled} />
    </div>
  )
}

export default ChatPage
