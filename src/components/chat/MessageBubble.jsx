/* ═══════════════════════════════════════════════════════════════════════════
   ONE TURN OF THE TRANSCRIPT

   BUBBLES ARE GONE. Both roles sit in the same content column on the app-wide
   56px gutter grid, at the same measure:

     USER       an indented block on --sunk carrying a 2px --signal seam on its
                inline-start edge. The gutter reads "you".
     ASSISTANT  flush, no container at all, plain ink on the board. The gutter
                carries the turn index in Commit Mono.

   The repeated "W" glyph is deleted. A mark that appears on every single
   assistant turn carries no information, and it was the only thing in the app
   still wearing the display face on a working screen.

   Generated media breaks out of the prose measure into a FRAME — the artifact
   IS the message, and it renders at its true aspect ratio.

   THE COMMIT SEAM: when a plan message resolved as 'confirmed', the transcript
   draws a permanent 2px --signal rule with the authorised figure stamped in the
   gutter. Scroll back through a two-hour session and every point at which money
   started moving is visible at a glance. It is derived entirely from state that
   already exists — message.resolved, message.resolution, plan.total_cost_usd.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Retry, Note, Expand, useRtl } from '../Icon'
import { Money } from '../ui/Money'
import PlanReviewCard from './PlanReviewCard'
import ClarificationCard from './ClarificationCard'
import { useLightbox } from '../MediaLightbox'
import { useChatText, TurnRow } from './chatKit'
import Frame from '../ui/Frame'

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

const IMAGE_EXTS = /\.(png|jpg|jpeg|gif|webp)(\?|$)/i
const VIDEO_EXTS = /\.(mp4|mov|webm|avi)(\?|$)/i

function isImageUrl(str) {
  return typeof str === 'string' && (IMAGE_EXTS.test(str) || str.includes('/image/'))
}
function isVideoUrl(str) {
  return typeof str === 'string' && (VIDEO_EXTS.test(str) || str.includes('/video/'))
}

function parseContent(content) {
  if (!content) return []
  // Match both absolute http(s) URLs and relative /api/assets/... paths
  const urlRegex = /(https?:\/\/[^\s]+|\/api\/assets\/[^\s]+)/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = urlRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }
    const url = match[0]
    if (isImageUrl(url)) {
      parts.push({ type: 'image', value: url })
    } else if (isVideoUrl(url)) {
      parts.push({ type: 'video', value: url })
    } else {
      parts.push({ type: 'link', value: url })
    }
    lastIndex = match.index + url.length
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }
  return parts
}

/* ── MEDIA ───────────────────────────────────────────────────────────────── */

/** Every image, video and audio clip in the transcript goes through one object.
 *  Nothing is object-cover: a tool that sells 9:16 and 21:9 never crops. */
function MediaFrame({ type, url, caption = [], openMedia, tx }) {
  // A dead URL must not leave a broken-image glyph sitting in the transcript.
  // The original fell back to the raw link; so does this, inside the well.
  const [broken, setBroken] = useState(false)

  if (type === 'audio') {
    return (
      <Frame caption={[...caption, 'audio']} maxWidth={520}>
        <audio controls className="w-full" src={url} />
      </Frame>
    )
  }
  if (type === 'video') {
    return (
      <Frame
        caption={[...caption, 'video']}
        maxWidth={520}
        actions={
          <button
            type="button"
            onClick={() => openMedia(url, 'video')}
            className="text-action"
            style={{ padding: 0 }}
            title={tx('openOriginal')}
            aria-label={tx('openOriginal')}
          >
            <Expand size={14} />
          </button>
        }
      >
        <video
          controls
          src={url}
          style={{ display: 'block', inlineSize: '100%', blockSize: 'auto', maxBlockSize: 420 }}
          onDoubleClick={() => openMedia(url, 'video')}
        />
      </Frame>
    )
  }
  return (
    <Frame
      caption={[...caption, 'image']}
      maxWidth={520}
      actions={!broken && (
        <button
          type="button"
          onClick={() => openMedia(url, 'image')}
          className="text-action"
          style={{ padding: 0 }}
          title={tx('openOriginal')}
          aria-label={tx('openOriginal')}
        >
          <Expand size={14} />
        </button>
      )}
    >
      {broken ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="underline break-all block"
          style={{ color: 'var(--signal)', fontSize: 12, textUnderlineOffset: 3 }}
        >
          {url}
        </a>
      ) : (
        <img
          src={url}
          alt=""
          className="cursor-zoom-in"
          style={{ display: 'block', inlineSize: '100%', blockSize: 'auto', maxBlockSize: 420 }}
          onClick={() => openMedia(url, 'image')}
          onError={() => setBroken(true)}
        />
      )}
    </Frame>
  )
}

/**
 * Multi-scene results arrive as a flat scenes[] on the run result. Rendering
 * them grouped keeps a 4-scene story readable instead of collapsing into an
 * undifferentiated pile of media. The scene index sits in the same numeral
 * column the plan card's script uses, so a scene keeps its identity from the
 * work order all the way to the print.
 */
function SceneResults({ scenes, tx }) {
  const openMedia = useLightbox()
  if (!scenes || scenes.length === 0) return null
  return (
    <div className="flex flex-col" style={{ marginBlockStart: 12 }}>
      {scenes.map((scene) => (
        <div
          key={scene.scene_number}
          className="grid grid-cols-[36px_minmax(0,1fr)] items-start"
          style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--etch)' }}
        >
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start', paddingBlockStart: 4 }}>
            {String(scene.scene_number).padStart(2, '0')}
          </span>
          <div className="min-w-0 flex flex-col gap-2">
            {scene.video_url ? (
              <MediaFrame
                type="video"
                url={scene.video_url}
                caption={[`${tx('scene')} ${scene.scene_number}`]}
                openMedia={openMedia}
                tx={tx}
              />
            ) : (
              (scene.image_urls || []).map((url, i) => (
                <MediaFrame
                  key={i}
                  type="image"
                  url={url}
                  caption={[`${tx('scene')} ${scene.scene_number}`]}
                  openMedia={openMedia}
                  tx={tx}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Media carried by a message loaded from history.
 *
 * The server stores every URL a run produced on the assistant message, but the
 * message TEXT only ever contains the final scene's link. Without reading
 * `attachments`, reopening a four-scene chat showed one video and dropped the
 * rest. URLs already present in the text are skipped so they don't render twice.
 */
function attachmentMedia(message) {
  const attachments = message.attachments || []
  if (attachments.length === 0) return []
  const inText = message.content || ''
  return attachments
    .filter((url) => typeof url === 'string' && url && !inText.includes(url))
    .map((url) => ({ type: isVideoUrl(url) ? 'video' : 'image', url }))
}

/* ── THE SEAM ─────────────────────────────────────────────────────────────── */

function CommitSeam({ usd, tx }) {
  const hasFigure = Number.isFinite(Number(usd)) && Number(usd) > 0
  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center" style={{ marginBlock: 12 }}>
      <span className="wz-gutter" style={{ paddingInlineEnd: 12 }}>
        {hasFigure
          ? <Money usd={usd} style={{ fontSize: 11, color: 'var(--signal)' }} />
          : <span style={{ fontSize: 10, color: 'var(--signal)' }}>{tx('authorised')}</span>}
      </span>
      <span aria-hidden="true" style={{ blockSize: 2, backgroundColor: 'var(--signal)', display: 'block' }} />
    </div>
  )
}

/* ── THE TURN ─────────────────────────────────────────────────────────────── */

function MessageBubble({ message, handlers, index }) {
  const openMedia = useLightbox()
  const { tx } = useChatText()
  const rtl = useRtl()
  const isUser = message.role === 'user'
  const parts = parseContent(message.content)
  // `media` is set by the live flow; `attachments` comes back from history. A
  // reloaded chat has only the latter, so both have to render.
  const mediaItems = [...(message.media || []), ...attachmentMedia(message)]
  const [showTime, setShowTime] = useState(false)

  const stamp = formatTime(message.created_at || message.timestamp)

  // Interactive cards replace the turn entirely — they own their own chrome and
  // they run to the full grid width. The docket is a work order, not a message.
  if (message.kind === 'plan' && message.plan) {
    return (
      <div className="settle">
        <TurnRow span>
          <PlanReviewCard
            plan={message.plan}
            resolved={message.resolved}
            outcome={message.resolution}
            busy={message.busy}
            previews={message.previews}
            catalog={handlers?.modelCatalog}
            onEdit={(field, text) => handlers?.onEdit?.(message.runId, field, text)}
            onEditScript={(scenes) => handlers?.onEditScript?.(message.runId, scenes)}
            onPreview={(type) => handlers?.onPreview?.(message.runId, type)}
            onRevise={(feedback) => handlers?.onRevise?.(message.runId, feedback)}
            onConfirm={() => handlers?.onConfirm?.(message.runId)}
            onCancel={() => handlers?.onCancel?.(message.runId)}
            onSettings={(settings) => handlers?.onSettings?.(message.runId, settings)}
          />
        </TurnRow>
        {message.resolved && message.resolution === 'confirmed' && (
          <CommitSeam usd={message.plan?.total_cost_usd} tx={tx} />
        )}
      </div>
    )
  }

  if (message.kind === 'clarification' && message.questions) {
    return (
      <TurnRow span className="settle">
        <ClarificationCard
          questions={message.questions}
          resolved={message.resolved}
          resolution={message.resolution}
          busy={message.busy}
          onSubmit={(answers) => handlers?.onClarify?.(message.runId, answers)}
          onCancel={() => handlers?.onCancel?.(message.runId)}
        />
      </TurnRow>
    )
  }

  // An error line is a state, not a sentence in grey. It reads in --state-fail
  // with the note mark in the gutter, so a failure is findable when scrolling.
  const isError = typeof message.content === 'string' && message.content.startsWith('Error:')

  const gutter = (
    <span className="flex flex-col gap-1" style={{ textAlign: 'start' }}>
      {isUser ? (
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{tx('you')}</span>
      ) : isError ? (
        <Note size={14} style={{ color: 'var(--state-fail)' }} />
      ) : (
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      {/* The timestamp lives in the gutter, not floating beside the text. */}
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: 'var(--ink-3)',
          textAlign: 'start',
          opacity: showTime ? 1 : 0,
          transition: 'opacity 120ms var(--ease)',
        }}
      >
        {stamp}
      </span>
    </span>
  )

  const body = (
    <>
      <div className="flex flex-col gap-3">
        {parts.map((part, i) => {
          if (part.type === 'image' || part.type === 'video') {
            return (
              <MediaFrame key={i} type={part.type} url={part.value} openMedia={openMedia} tx={tx} />
            )
          }
          if (part.type === 'link') {
            return (
              <a
                key={i}
                href={part.value}
                target="_blank"
                rel="noreferrer"
                className="underline break-all"
                style={{ color: 'var(--signal)', textUnderlineOffset: 3, fontSize: 13 }}
              >
                {part.value}
              </a>
            )
          }
          return part.value.trim() ? (
            <p
              key={i}
              className="whitespace-pre-wrap break-words"
              style={{
                fontSize: 15,
                lineHeight: 'var(--lh-body)',
                color: isError ? 'var(--state-fail)' : 'var(--ink)',
                maxInlineSize: '68ch',
              }}
            >
              {part.value.trim()}
            </p>
          ) : null
        })}
      </div>

      {mediaItems.length > 0 && (
        <div className="flex flex-col gap-3" style={{ marginBlockStart: 12 }}>
          {mediaItems.map((item, idx) => (
            <MediaFrame key={idx} type={item.type} url={item.url} openMedia={openMedia} tx={tx} />
          ))}
        </div>
      )}

      <SceneResults scenes={message.scenes} tx={tx} />

      {message.failedRunId && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2" style={{ marginBlockStart: 8 }}>
          {/* FILLED MARK: retrying resumes a paid run. It stays a text action —
              the commit gate is the only filled surface in this application. */}
          <button
            type="button"
            onClick={() => handlers?.onRetry?.(message.failedRunId, index)}
            className="text-action"
          >
            <Retry size={16} />
            {tx('retry')}
          </button>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{tx('retryHint')}</span>
        </div>
      )}
    </>
  )

  return (
    <TurnRow
      gutter={gutter}
      className="settle"
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {isUser ? (
        <div
          className="cut cut-md"
          style={{
            backgroundColor: 'var(--sunk)',
            /* the seam bar on the inline-start edge — an inset shadow, because
               clip-path would eat a border on the cut corner */
            boxShadow: `inset ${rtl ? '-2px' : '2px'} 0 0 0 var(--signal)`,
            paddingBlock: 10,
            paddingInlineStart: 14,
            paddingInlineEnd: 19,
            maxInlineSize: '72ch',
          }}
        >
          {body}
        </div>
      ) : (
        body
      )}
    </TurnRow>
  )
}

export default MessageBubble
