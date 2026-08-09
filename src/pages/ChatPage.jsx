/* ═══════════════════════════════════════════════════════════════════════════
   THE WORKSPACE

   This route has two states, and the first one is new.

     NO PROJECT OPEN — THE GRID. A returning customer used to land on an empty
     chat box suggesting a perfume-bottle prompt. On a media product, with
     their own finished work sitting one API call away, that is a dead end.
     Now the workspace opens on the WORK: a grid of project blocks, each
     showing the newest thing that project produced. Picking one opens its
     transcript and they carry on writing.

     A PROJECT OPEN — THE TRANSCRIPT. Named at the top with a way back to the
     grid, the conversation in the middle, the live run stated as a FIELD
     above the composer, and the composer pinned at the bottom.

   THE AUTHORISATION IS IN THE WORK ORDER. It used to be mounted into the top
   bar through <TopBarAction>, on the argument that a bar slot cannot be
   scrolled past. There is no top bar any more, and the argument was the weaker
   one anyway: it put the press that spends money in a corner of the window,
   far from the figure it was committing, so the number you were agreeing to
   and the control you agreed with were never in the eye at once. It now
   renders directly under the total inside PlanReviewCard. Still exactly one
   filled control on the screen — it is simply in the document.

   ⚠ WHAT DID NOT CHANGE, AND MUST NOT. The entire run lifecycle below —
   messages addressed BY ARRAY INDEX, the socket-drop recovery that re-queries
   /active-run because a completion is broadcast exactly once and never
   replayed, the restore-on-mount path, and every guard around them — is
   carried over unaltered. This was a visual and structural rebuild. Nothing in
   the transport was touched to make a layout work.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react'
import ChatMessages from '../components/chat/ChatMessages'
import PromptInput from '../components/chat/PromptInput'
import { useChatText, isoDay } from '../components/chat/chatKit'
import { useRunStatus } from '../components/RunStatusContext'
import { Duration } from '../components/ui/Money'
import { Caret, Strike } from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import { useUIStore } from '../store/uiStore'
import { useChatStore } from '../store/chatStore'
import { generateService } from '../services/generateService'
import { assetService } from '../services/assetService'
import { chatService } from '../services/chatService'
import { describeError } from '../services/errorText'

/* ── THE RUN BAND ─────────────────────────────────────────────────────────
   Pinned ABOVE the composer and OUTSIDE the scroll container, so the
   machine's state cannot leave the screen while it is spending money.

   It is a READER, not a controller. `patchMessage` keeps writing its progress
   line into the transcript exactly as it did — this is an additional surface
   over the same values and it owns no behaviour of its own.

   Status is a FIELD: a word, and the one dot in this system allowed to move.
   The bar beside it is a JOB progress bar, not a media time axis, so it fills
   in the reading direction and mirrors correctly (A4). */
function RunBand({ phase, percent, sceneNumber, elapsedMs, onStop }) {
  const { t } = useUIStore()
  const { tx } = useChatText()
  const hasPercent = typeof percent === 'number' && Number.isFinite(percent)

  return (
    <div
      className="shrink-0 px-4 sm:px-6"
      style={{
        background: 'var(--card)',
        borderBlockStart: '1px solid var(--line)',
        paddingBlock: 10,
      }}
    >
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
        style={{ maxInlineSize: 900, marginInline: 'auto' }}
      >
        <span className="st st--run truncate" style={{ maxInlineSize: 320 }}>
          {phase || t('generating')}
        </span>

        {sceneNumber ? (
          <span className="caption">
            {tx('scene')} <span className="mono">{sceneNumber}</span>
          </span>
        ) : null}

        {hasPercent && (
          <div className="bar" style={{ flex: '1 1 120px', maxInlineSize: 260 }} aria-hidden="true">
            <i className="bar__fill" style={{ inlineSize: `${Math.round(percent * 100)}%` }} />
          </div>
        )}

        {Number.isFinite(elapsedMs) && (
          <span className="caption flex items-center gap-2" style={{ marginInlineStart: 'auto' }}>
            {tx('elapsed')}
            <Duration ms={elapsedMs} style={{ color: 'var(--ink-2)' }} />
          </span>
        )}

        {/* Cooperative: the scene at the provider finishes and is kept;
            nothing after it starts or is charged. Present whenever the band
            is — a run you cannot stop is a run you don't control. */}
        {onStop && (
          <button type="button" className="btn-t btn-t--danger" onClick={onStop} title={tx('stopWhy')}>
            {tx('stopRun')}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── THE PROJECT GRID ─────────────────────────────────────────────────────
   PRINCIPLE 6: media aspect drives card aspect. A Gulf client orders 16:9 and
   9:16 in the same project, so a fixed-aspect grid looks broken.

   Nothing in the pipeline reliably writes an aspect ratio into an asset's
   metadata, so the tile does not trust one. It reads the metadata if it is
   there (which arrives as `metadata`, and sometimes as a JSON *string*), and
   otherwise MEASURES the real ratio off the decoded frame — naturalWidth on
   an image, videoWidth on loadedmetadata for a clip — and settles to it.
   Wide until proven tall; never a guess presented as a fact.

   PRINCIPLE 7: at most three facts under a thumbnail. Title, status, date. */

function assetMeta(asset) {
  const raw = asset?.metadata_json ?? asset?.metadata
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Pick the chat's clips in play order and combine them into one film.
 *
 * Selection IS the ordering: each tap appends the clip to the sequence and
 * stamps it with its position, tapping again removes it. No drag-and-drop —
 * an order you dial in by tapping 1, 2, 3 is the same order with far less
 * machinery, and it works on a phone.
 */
function CombineDialog({ chatId, isOpen, onClose, onDone, tx }) {
  const [clips, setClips] = useState(null) // null = loading
  const [order, setOrder] = useState([])   // asset ids, in chosen play order
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setClips(null)
    setOrder([])
    setError(null)
    assetService.getChatAssets(chatId, 100)
      .then((list) => {
        const videos = list.filter((a) => (a.asset_type || '').toLowerCase() === 'video')
        // Oldest first — scene 1 was made first, so the natural reading order
        // of the grid is already the film's order.
        setClips(videos.reverse())
      })
      .catch(() => setClips([]))
  }, [isOpen, chatId])

  if (!isOpen) return null

  const toggle = (id) => {
    setOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const combine = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await assetService.stitchVideos(chatId, order)
      onDone(result?.url)
      onClose()
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Could not combine the clips')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center" style={{ padding: 16 }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--scrim)' }} onClick={busy ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tx('combineVideos')}
        className="relative settle overlay-cast"
        style={{
          inlineSize: '100%', maxInlineSize: 640, maxBlockSize: '85vh', overflowY: 'auto',
          backgroundColor: 'var(--panel)', boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
          padding: 24,
        }}
      >
        <h2 className="page-title" style={{ marginBlockEnd: 4 }}>{tx('combineVideos')}</h2>
        <p className="caption" style={{ marginBlockEnd: 16 }}>{tx('combinePick')}</p>

        {clips === null ? (
          <div className="skel" style={{ blockSize: 120 }} />
        ) : clips.length < 2 ? (
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>{tx('combineNoVideos')}</p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {clips.map((clip) => {
              const position = order.indexOf(clip.id)
              const picked = position >= 0
              return (
                <button
                  key={clip.id}
                  type="button"
                  onClick={() => toggle(clip.id)}
                  disabled={busy}
                  className="relative"
                  aria-pressed={picked}
                  style={{
                    borderRadius: 'var(--r-sm)', overflow: 'hidden', padding: 0,
                    boxShadow: picked
                      ? 'inset 0 0 0 2px var(--ink)'
                      : 'inset 0 0 0 1px var(--line)',
                  }}
                >
                  <video src={clip.url} muted playsInline preload="metadata"
                    style={{ display: 'block', inlineSize: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                  {picked && (
                    <span
                      className="mono"
                      style={{
                        position: 'absolute', insetBlockStart: 6, insetInlineStart: 6,
                        background: 'var(--ink)', color: 'var(--panel)',
                        borderRadius: 999, inlineSize: 24, blockSize: 24,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                      }}
                    >
                      {position + 1}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: 'var(--bad)', marginBlockStart: 12 }}>{error}</p>
        )}

        <div className="flex items-center justify-end gap-6" style={{ marginBlockStart: 20 }}>
          <button type="button" onClick={onClose} disabled={busy} className="text-action">
            {tx('cancel')}
          </button>
          <button
            type="button"
            onClick={combine}
            disabled={busy || order.length < 2}
            className="btn-q btn-q--sm"
            title={tx('combineWhy')}
          >
            {busy
              ? tx('combining')
              : `${tx('combineGo')}${order.length >= 2 ? ` (${order.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProjectTile({ chat, asset, tx, onOpen, onDelete }) {
  const meta = assetMeta(asset)
  const declaredTall = meta.aspect_ratio === '9:16' || meta.orientation === 'vertical'
  const [tall, setTall] = useState(declaredTall)
  const isVideo = asset?.asset_type === 'video'

  // Fall back through chat title → asset id → "Untitled". Never "undefined".
  const title = (chat.title || '').trim() || (asset?.id ? String(asset.id).slice(0, 8) : tx('untitled'))
  const day = isoDay(chat.updated_at || chat.created_at)

  const measure = (w, h) => { if (w > 0 && h > 0) setTall(h > w) }

  return (
    /* A wrapper, because the tile itself is a <button> and a delete control
       cannot legally nest inside it. The delete sits over the corner and
       stops the click from opening the project it is removing. */
    <div className="relative">
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-action text-action--danger absolute"
          style={{ insetInlineEnd: 8, insetBlockStart: 8, zIndex: 1, padding: 4 }}
          aria-label={`${tx('deleteProject')} — ${title}`}
          title={tx('deleteProject')}
        >
          <Strike size={14} />
        </button>
      )}
    <button type="button" className="tile group" onClick={onOpen} title={title}>
      {/* THE DARK WELL IS FOR MEDIA. With nothing generated yet there is no
          media to judge, and the well rendered as a solid black rectangle that
          read as a failed image rather than as an empty project. An empty
          project gets a quiet page-toned panel that says so in words. */}
      <div
        className={`thumb ${tall ? 'thumb--tall' : 'thumb--wide'}`}
        style={asset ? undefined : { background: 'var(--card-2)', borderBlockEnd: '1px solid var(--line)' }}
      >
        {!asset && (
          <span className="caption" style={{ color: 'var(--ink-3)' }}>{tx('stEmpty')}</span>
        )}
        {asset && (isVideo ? (
          /* preload="metadata" gives a poster frame without pulling the whole
             clip. Forty autoplaying videos is a bandwidth bill. */
          <video
            src={asset.url}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => measure(e.currentTarget.videoWidth, e.currentTarget.videoHeight)}
          />
        ) : (
          <img
            src={asset.url}
            alt=""
            loading="lazy"
            onLoad={(e) => measure(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
          />
        ))}
        {/* A project with nothing in it yet gets a clean dark well. No broken
            image, no invented placeholder graphic. */}
      </div>

      <div className="tile__meta">
        <div className="tile__name">{title}</div>
        <div className="tile__row">
          <span className={`st ${asset ? 'st--ok' : 'st--idle'}`} style={{ fontSize: 12 }}>
            {asset ? tx('stReady') : tx('stEmpty')}
          </span>
          {day && <span className="mono" style={{ marginInlineStart: 'auto' }}>{day}</span>}
        </div>
      </div>
    </button>
    </div>
  )
}

// A message that is nothing but "retry" (or the Arabic equivalent) after a
// failed run is the Retry button said out loud. Anything with more to it —
// "retry but make it night" — is a real new request and must not be swallowed.
const RETRY_PHRASE = /^(retry|resume|try again|again|continue|go on|أعد|أعد المحاولة|إعادة|اعد|كمل|أكمل|اكمل|حاول مرة أخرى|جرب مرة أخرى)[\s!.،؟?]*$/i

function ChatPage() {
  const { chats, currentChatId, setCurrentChatId, messages, setMessages, addMessage, updateMessage, loading, setLoading } = useChatStore()
  const { tx } = useChatText()
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

  // ── THE WORKSPACE GRID'S DATA ─────────────────────────────────────────────
  // The chat list itself is owned by the top bar's project switcher and
  // already sits in the store — it is read here, never fetched a second time.
  // (It used to be loaded by the rail; the rail is navigation now.) What this
  // page adds is one
  // page of recent assets, reduced to the newest asset per chat so every block
  // can show the work it stands for.
  const [workByChat, setWorkByChat] = useState({})
  const [workLoading, setWorkLoading] = useState(true)
  // Chat id awaiting delete confirmation from the workspace grid, or null.
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  // The combine-videos picker.
  const [combineOpen, setCombineOpen] = useState(false)

  // ── PRESENTATION-ONLY RUN TELEMETRY ───────────────────────────────────────
  // The same values `openRunSocket`'s onmessage already parses out of the
  // payload, held as local state so the run band and the top bar can read
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

  /* One page of recent assets, reduced to the newest per chat. The list comes
     back newest-first, so the FIRST asset seen for a chat id is the one that
     represents it. A failure here must never blank the grid: the projects are
     still openable without a thumbnail. */
  useEffect(() => {
    let cancelled = false
    assetService.getAssets(1, 40)
      .then(({ assets }) => {
        if (cancelled) return
        const newest = {}
        for (const asset of Array.isArray(assets) ? assets : []) {
          if (asset?.chat_id && !newest[asset.chat_id]) newest[asset.chat_id] = asset
        }
        setWorkByChat(newest)
      })
      .catch((error) => {
        console.error('Could not load recent work:', error)
      })
      .finally(() => { if (!cancelled) setWorkLoading(false) })
    return () => { cancelled = true }
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
  //
  // Leaving the project entirely — the top bar's "All projects", or the open
  // project being deleted from the switcher, both of which null currentChatId
  // from outside this file — has to tear the socket down exactly the way
  // switching projects does. Otherwise the previous chat's progress keeps
  // being written into a messages array that no longer belongs to it. The RUN
  // is untouched and still going server-side; reopening the project re-queries
  // /active-run and picks it up, which is the same contract as a chat switch.
  useEffect(() => {
    if (!currentChatId) { endRun(); return undefined }
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
    // Presentation only: the band and the top bar have nothing left to read.
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
  // Reload the chat from the server and drop the local progress placeholder.
  // The backend writes every finished scene (and every final result) into the
  // chat as its own message with its video attached, in order — so the server
  // history IS the truth. Rendering from it means each clip appears exactly
  // once, at the bottom, and the live view becomes identical to a refresh.
  const reloadHistoryAfterRun = async () => {
    try {
      const data = await chatService.getMessages(currentChatId)
      if (Array.isArray(data)) setMessages(data)
    } catch (error) {
      console.error('Could not reload chat history after the run:', error)
    }
    progressTargetRef.current = null
  }

  const renderCompletion = async (data, runId) => {
    const target = progressTargetRef.current

    // A failure is NOT persisted as a normal message, so it can't come from a
    // history reload — it stays a local error row, and keeps the run id so the
    // plan and any finished scenes can be resumed. `data.error` is the agent's
    // own words and gets its own field so the row prints it verbatim.
    if (data.status !== 'completed' || !data.result) {
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

    // Success in every shape — one scene, a whole film, a stop, or one scene of
    // a scene-by-scene run — has already been written into the chat by the
    // backend. Reload it rather than patching media into the spinner: patching
    // left the same clip showing twice (once as the live `media`, once as the
    // persisted `attachments` when history reloaded) and could land it above
    // the card instead of at the bottom. One reload fixes both.
    const result = data.result
    await reloadHistoryAfterRun()

    // Scene-by-scene: the run is parked for the next decision, so put the
    // continuation card (scene N of M, priced per scene) below the scene that
    // just landed.
    if (result.status === 'paused') {
      try {
        const active = await generateService.getActiveRun(currentChatId)
        if (active?.status === 'awaiting_confirmation' && active.plan) {
          renderPlanResponse(active.plan, runId)
          if (active.previews?.length > 0) {
            patchMessage(cardIndexRef.current, { previews: active.previews })
          }
          return
        }
      } catch {
        // The card can't be rebuilt right now — the scene is safe in the chat,
        // and reopening the project restores the gate via /active-run.
      }
    }

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
        // The SAME values, published for the run band and the top bar. This
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

    // Without these two, a socket that dies mid-run leaves the band spinning
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

        // The run is alive and only the CHANNEL died — so get the channel
        // back instead of giving up. This is the bug where a finished video
        // never appeared until a manual refresh: the completion event is
        // broadcast once, to whoever is connected at that instant, and after
        // a drop nobody was. Each retry lands back here on failure, and the
        // active-run check above catches a run that finished while we were
        // disconnected.
        patchMessage(progressTargetRef.current, {
          content: 'Connection dropped — reconnecting to the run…',
        })
        runFinishedRef.current = false
        setTimeout(() => {
          openRunSocket(runId).catch(() => {
            reportLostContact(detail, short)
          })
        }, 3000)
        return
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
    //
    // EXCEPT a run parked awaiting confirmation: the only way such a run has
    // assets is scene-by-scene mode, and there every finished scene already
    // wrote its own message into the history just loaded — repeating them
    // here is the "why do I see the videos twice" bug.
    if (status !== 'awaiting_confirmation' && assets?.length > 0) {
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

  const handleSendPrompt = async (prompt, attachmentFile = null, sketchMode = false) => {
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
          imageAttachmentUrl = await assetService.uploadImage(attachmentFile, chatId, sketchMode)
        } catch (err) {
          console.error('Failed to upload attachment:', err)
        }
      }

      // The upload can fail while the prompt still goes through (above swallows
      // the error on purpose, so a dead S3 does not eat the user's text). With
      // no file there is no sketch, and telling the backend otherwise would put
      // it into sketch mode with nothing to read.
      const isSketchRun = sketchMode && Boolean(imageAttachmentUrl)

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

      const startedRun = await generateService.start(
        chatId, prompt, imageAttachmentUrl, isSketchRun,
      )
      setActiveRunId(startedRun.run_id)
      progressTargetRef.current = progressIndex

      const socket = await openRunSocket(startedRun.run_id)

      // Plan only — nothing is generated until the user confirms.
      const result = await generateService.plan(
        startedRun.run_id, imageAttachmentUrl, isSketchRun,
      )
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

  const handleConfirm = (runId, options = {}) => withCardBusy(async (index) => {
    // Guarded truthiness on purpose: the card's plain press hands the click
    // event through this argument, and a MouseEvent must not read as a mode.
    const pauseAfterScene = options?.pauseAfterScene === true

    // Read before the patch: this is what the user just authorised, and it is
    // what the session spend in the top bar accumulates. Presentation only —
    // the figure comes off the card that is already on screen.
    const cardPlan = useChatStore.getState().messages[index]?.plan
    const authorised = Number(
      pauseAfterScene ? cardPlan?.per_scene_cost_usd : cardPlan?.total_cost_usd
    )

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
      await generateService.confirm(runId, { pauseAfterScene })
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
          + ' — your plan is still here, press Authorise again once it is sorted.',
      })
      closeSocket()
      progressTargetRef.current = null
      setAwaitingUser(true)
      setLoading(false)
    }
  })

  /**
   * The stop button during generation. Cancel is cooperative server-side: the
   * scene at the provider finishes and is kept, nothing after it starts. The
   * run's own completion event (status "cancelled") closes things out — this
   * handler only asks and narrates, it does not tear the run down itself.
   */
  const handleStop = async () => {
    if (!activeRunId) return
    try {
      await generateService.cancel(activeRunId)
      patchMessage(progressTargetRef.current, {
        content: 'Stopping — the scene being rendered will finish and be kept; nothing after it is charged…',
      })
    } catch (error) {
      pushError(error, 'Could not stop the run', { runId: activeRunId })
    }
  }

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

  /* ── OPENING A PROJECT ───────────────────────────────────────────────────
     Exactly the path the rail takes: set the current chat id and let the
     effect above own everything that follows — loading the transcript AND
     re-querying /active-run so an unfinished run is picked back up. There is
     deliberately no second implementation of "open a chat"; a parallel one
     would drift from the run-restoration and message-index behaviour the rest
     of this file depends on. */
  const openProject = (chatId) => {
    if (chatId === currentChatId) return
    setMessages([])
    setCurrentChatId(chatId)
  }

  /* Going back tears the run down exactly the way a chat switch does. The run
     itself keeps going server-side; reopening the project re-queries
     /active-run and picks it up again. */
  const backToWorkspace = () => {
    endRun()
    setMessages([])
    setCurrentChatId(null)
  }

  const startProject = async () => {
    try {
      const chat = await chatService.createChat()
      useChatStore.setState((state) => ({
        chats: [chat, ...state.chats],
        currentChatId: chat.id,
        messages: [],
      }))
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  /* THE SCAN FOR A WORK ORDER AWAITING AUTHORISATION IS GONE, with the top-bar
     button it fed. It walked the message array backwards on every render to
     find the one unresolved plan, purely so a control mounted OUTSIDE the
     transcript could know which run it was committing. The card renders its own
     authorisation now and already holds its own plan, its own `busy` and its
     own runId, so the derivation had no consumer left. Deleted rather than left
     as an unused memo — see PlanReviewCard's footer. */

  const openChat = chats.find((c) => c.id === currentChatId)
  const openTitle = (openChat?.title || '').trim() || tx('untitled')

  /* ── THE WORKSPACE GRID ─────────────────────────────────────────────────── */
  if (!currentChatId) {
    return (
      <div className="main">
        <div className="pagehead">
          <div className="min-w-0">
            <h1 className="page-title">{tx('workspace')}</h1>
            <p className="page-sub">{tx('workspaceSub')}</p>
          </div>
          <div className="shrink-0" style={{ marginInlineStart: 'auto' }}>
            {/* The one filled button on this screen. */}
            <button type="button" className="btn" onClick={startProject}>
              {tx('newProject')}
            </button>
          </div>
        </div>

        <div className="sechead">
          <h2 className="sec-title">{tx('projects')}</h2>
        </div>

        {workLoading && chats.length === 0 ? (
          <div className="grid-media">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <div className="skel" style={{ aspectRatio: '16/9', borderRadius: 0 }} />
                <div style={{ padding: 13 }}>
                  <div className="skel" style={{ blockSize: 12, inlineSize: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="card card-pad">
            <h3 className="sec-title">{tx('noProjects')}</h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, marginBlockStart: 2, marginBlockEnd: 12 }}>{tx('noProjectsLine')}</p>
            <button type="button" className="btn-q btn-q--sm" onClick={startProject}>
              {tx('newProject')}
            </button>
          </div>
        ) : (
          <div className="grid-media">
            {chats.map((chat) => (
              <ProjectTile
                key={chat.id}
                chat={chat}
                asset={workByChat[chat.id]}
                tx={tx}
                onOpen={() => openProject(chat.id)}
                onDelete={() => setConfirmDeleteId(chat.id)}
              />
            ))}
          </div>
        )}

        <ConfirmDialog
          isOpen={!!confirmDeleteId}
          title={tx('deleteProject')}
          message={tx('deleteProjectWhy')}
          confirmLabel={tx('deleteProject')}
          cancelLabel={tx('cancel')}
          danger
          onConfirm={async () => {
            const chatId = confirmDeleteId
            try {
              await chatService.deleteChat(chatId)
              useChatStore.getState().removeChat(chatId)
            } catch (error) {
              pushError(error, 'Could not delete the project')
            } finally {
              setConfirmDeleteId(null)
            }
          }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </div>
    )
  }

  /* ── THE TRANSCRIPT ──────────────────────────────────────────────────────
     Three bands: the head and the composer are pinned, the transcript scrolls.
     No viewport calc — <main> is a grid child with a definite height, so this
     is simply h-full. */
  return (
    <div className="flex flex-col h-full min-h-0">
      <header
        className="shrink-0 px-4 sm:px-6"
        style={{ background: 'var(--card)', borderBlockEnd: '1px solid var(--line)', paddingBlock: 12 }}
      >
        {/* THE WAY BACK SITS ON THE LEADING EDGE. It used to sit inside the
            900px centred column, which parked it in the middle of the bar with
            nothing to its outside — a breadcrumb belongs at the edge you read
            from. `inset-inline-start` by construction: it is simply first in a
            full-width flex row, so it is the far RIGHT in Arabic and the far
            LEFT in English with nothing hard-coded.

            The title is .sec-title (16px/600), not .page-title (26px). This is
            a persistent header above a scrolling transcript, not a page hero;
            at hero size it dominated the screen and ate the height the
            transcript needs. Full title stays in `title`. */}
        <div className="flex items-center gap-3">
          <button type="button" className="btn-t shrink-0" onClick={backToWorkspace}>
            <Caret size={15} direction="start" />
            {tx('workspace')}
          </button>
          {/* <bdi>: a project title is written in the language of the prompt,
              and an English title inside the Arabic UI otherwise has its
              punctuation dragged to the wrong end (A3). */}
          <h1 className="sec-title truncate min-w-0" title={openTitle}><bdi>{openTitle}</bdi></h1>

          {/* On the trailing edge, apart from the way back. Opens a picker of
              this project's clips; the dialog explains itself from there. */}
          <button
            type="button"
            className="btn-q btn-q--sm"
            style={{ marginInlineStart: 'auto' }}
            onClick={() => setCombineOpen(true)}
            title={tx('combineWhy')}
          >
            {tx('combineVideos')}
          </button>
        </div>
      </header>

      <CombineDialog
        chatId={currentChatId}
        isOpen={combineOpen}
        onClose={() => setCombineOpen(false)}
        onDone={(url) => {
          // Appended locally rather than refetching history — a refetch would
          // wipe a live plan card. The backend persisted its own copy of this
          // message, so the next open of the chat shows the same thing.
          addMessage({
            role: 'assistant',
            content: tx('combinedReady'),
            media: url ? [{ type: 'video', url }] : [],
            created_at: new Date().toISOString(),
          })
        }}
        tx={tx}
      />

      <ChatMessages
        messages={messages}
        loading={loading}
        handlers={handlers}
        onSubmit={handleSendPrompt}
        phase={phase}
      />

      {composerDisabled && (
        <RunBand
          phase={phase}
          percent={percent}
          sceneNumber={sceneNumber}
          elapsedMs={elapsedMs}
          onStop={activeRunId && loading ? handleStop : null}
        />
      )}

      <PromptInput onSubmit={handleSendPrompt} disabled={composerDisabled} />
    </div>
  )
}

export default ChatPage
