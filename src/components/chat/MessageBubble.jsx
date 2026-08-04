/* ═══════════════════════════════════════════════════════════════════════════
   ONE TURN OF THE TRANSCRIPT

   WHAT WENT. The 56px numbered gutter and the zero-padded turn ordinal that
   ran down the leading edge of every message. Nobody has ever said "look at
   turn 07". Scene numbers are real and they stayed; turn numbers were an index
   into an array printed on the screen.

   WHAT A TURN IS NOW. A named row: who spoke, when, and what they said.
     USER       a quiet block on --card-2, capped at the prose measure.
     ASSISTANT  flush prose on the page, no container.
   Both carry a small role label and a .mono timestamp. Neither starts at
   opacity 0, and nothing is revealed by hover that is not also reachable by
   keyboard and always visible on a coarse pointer.

   THE MEDIA IS THE HERO. Generated work no longer arrives as a 520px inline
   attachment. A finished cut fills the content column inside a DARK WELL, and
   a multi-scene result is a PLAYER plus a shot strip — the scene you are
   judging at full size, every scene reachable in one click. The strip is a step
   sequence so it mirrors (scene 1 sits at the far right in Arabic); the
   player's own transport is inside dir="ltr" and does not. A4 says those two
   point in opposite directions on the same Arabic screen, and that is correct.

   THE COMMIT RECORD. A plan that was authorised keeps a permanent line in the
   transcript stating the figure that was authorised, so scrolling back through
   a two-hour session shows every point at which money started moving. It is a
   FIELD, not an event: a rule, a word and a number — no seam colour, no glow.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Retry, Note } from '../Icon'
import { Money } from '../ui/Money'
import PlanReviewCard from './PlanReviewCard'
import ClarificationCard from './ClarificationCard'
import { useLightbox } from '../MediaLightbox'
import { useChatText, MediaWell, clockTime } from './chatKit'

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

/* ── THE PLAYER ───────────────────────────────────────────────────────────
   A multi-scene run is a piece of work with parts, not a pile of clips. One
   scene plays at full size and the rest sit in a strip underneath — the shape
   every editing tool in this register uses, and the reason the strip class is
   in the design system. */

const SHOT_MEDIA = { inlineSize: '100%', blockSize: '100%', objectFit: 'contain', display: 'block' }

function SceneResults({ scenes, tx, openMedia }) {
  const [selected, setSelected] = useState(0)
  const index = Math.min(selected, scenes.length - 1)
  const scene = scenes[index]
  const url = scene?.video_url || (scene?.image_urls || [])[0]
  const type = scene?.video_url ? 'video' : 'image'

  return (
    <section style={{ marginBlockStart: 12 }}>
      {url && (
        <MediaWell
          type={type}
          url={url}
          caption={[`${tx('scene')} ${scene.scene_number}`, type]}
          onOpen={type === 'image' ? () => openMedia(url, 'image') : undefined}
          openLabel={tx('openOriginal')}
        />
      )}

      {/* A step sequence: this DOES mirror (A4). Scene 1 sits at the far right
          in Arabic, while the player's transport above it does not move. */}
      {scenes.length > 1 && (
        <div className="strip" style={{ marginBlockStart: 10 }}>
          {scenes.map((s, i) => {
            const thumb = s.video_url || (s.image_urls || [])[0]
            return (
              <button
                key={s.scene_number ?? i}
                type="button"
                className="shot"
                aria-selected={i === index}
                onClick={() => setSelected(i)}
                title={`${tx('scene')} ${s.scene_number ?? i + 1}`}
              >
                <span className="shot__thumb">
                  {/* preload="metadata" gives a poster frame without pulling
                      the whole clip. A strip of autoplaying video is a bill. */}
                  {s.video_url
                    ? <video src={s.video_url} muted playsInline preload="metadata" style={SHOT_MEDIA} />
                    : thumb
                      ? <img src={thumb} alt="" loading="lazy" style={SHOT_MEDIA} />
                      : null}
                </span>
                <span className="shot__label">
                  <span>{tx('scene')}</span>
                  <span className="mono">{s.scene_number ?? i + 1}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

/* ── THE COMMIT RECORD ────────────────────────────────────────────────────── */

function CommitRecord({ usd, tx }) {
  const hasFigure = Number.isFinite(Number(usd)) && Number(usd) > 0
  return (
    <div
      className="flex items-center gap-3"
      style={{ marginBlockStart: 12, paddingBlockStart: 10, borderBlockStart: '1px solid var(--line-2)' }}
    >
      <span className="st st--ok">{tx('approved')}</span>
      {hasFigure && <Money usd={usd} style={{ fontSize: 13, color: 'var(--ink-2)' }} />}
    </div>
  )
}

/* ── THE FAILURE REPORT ────────────────────────────────────────────────────
   Three lines, because they answer three different questions: WHAT operation
   failed, WHAT the server or agent actually said, and WHICH run to quote when
   asking about it. The detail is mono and selectable — it is a machine string
   and it exists to be copied into a bug report, so there is a control that
   does exactly that. */
function ErrorReport({ title, detail, runId, tx }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const payload = [title, detail, runId ? `run ${runId}` : null].filter(Boolean).join('\n')
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard is permission-gated and blocked outright on insecure
      // origins. The text is selectable regardless, so a failure here costs
      // nothing worth reporting.
    }
  }

  return (
    <div className="card card-pad" style={{ borderColor: 'var(--bad)', maxInlineSize: '72ch' }}>
      <div className="st st--bad" style={{ marginBlockEnd: 8 }}>{title}</div>

      {detail && (
        <p
          className="mono break-anywhere"
          style={{
            fontSize: 12,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
            whiteSpace: 'pre-wrap',
            userSelect: 'text',
            display: 'block',
          }}
        >
          {detail}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2" style={{ marginBlockStart: 12 }}>
        {runId && (
          <span className="caption">
            {tx('runRef')} <span className="mono" style={{ userSelect: 'text' }}>{runId}</span>
          </span>
        )}
        {detail && (
          <button type="button" onClick={copy} className="btn-t">
            <Note size={15} />
            {copied ? tx('copied') : tx('copyDetail')}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── THE TURN ─────────────────────────────────────────────────────────────── */

function MessageBubble({ message, handlers, index }) {
  // Defensive: a store bug or a stale index write can otherwise land an
  // undefined slot in the messages array, and that one bad message would take
  // the whole transcript down with it.
  //
  // This sits above the hooks, not between them. ChatMessages already skips
  // falsy slots, so a message going null unmounts this component outright
  // rather than re-rendering it — the hook order can never change underneath
  // a live instance.
  if (!message) return null

  const openMedia = useLightbox()
  const { tx } = useChatText()
  const isUser = message.role === 'user'
  const parts = parseContent(message.content)
  // `media` is set by the live flow; `attachments` comes back from history. A
  // reloaded chat has only the latter, so both have to render.
  const mediaItems = [...(message.media || []), ...attachmentMedia(message)]

  const stamp = clockTime(message.created_at || message.timestamp)

  /* Interactive cards replace the turn entirely — they own their own chrome
     and they run the full width of the column. A work order is a document,
     not a message, and it is allowed to be wider than the prose measure. */
  if (message.kind === 'plan' && message.plan) {
    return (
      <div className="settle">
        <PlanReviewCard
          plan={message.plan}
          resolved={message.resolved}
          outcome={message.resolution}
          busy={message.busy}
          previews={message.previews}
          catalog={handlers?.modelCatalog}
          onEdit={(field, text) => handlers?.onEdit?.(message.runId, field, text)}
          onEditScript={(scenes) => handlers?.onEditScript?.(message.runId, scenes)}
          onPreview={(type, characterName) => handlers?.onPreview?.(message.runId, type, characterName)}
          onRevise={(feedback) => handlers?.onRevise?.(message.runId, feedback)}
          onConfirm={() => handlers?.onConfirm?.(message.runId)}
          onCancel={() => handlers?.onCancel?.(message.runId)}
          onSettings={(settings) => handlers?.onSettings?.(message.runId, settings)}
        />
        {message.resolved && message.resolution === 'confirmed' && (
          <CommitRecord usd={message.plan?.total_cost_usd} tx={tx} />
        )}
      </div>
    )
  }

  if (message.kind === 'clarification' && message.questions) {
    return (
      <div className="settle">
        <ClarificationCard
          questions={message.questions}
          resolved={message.resolved}
          resolution={message.resolution}
          busy={message.busy}
          onSubmit={(answers) => handlers?.onClarify?.(message.runId, answers)}
          onCancel={() => handlers?.onCancel?.(message.runId)}
        />
      </div>
    )
  }

  // `kind` is the reliable signal. The content sniff stays for messages
  // reloaded from chat history, which the server stores as plain text and
  // which therefore carry no kind.
  const isError = message.kind === 'error' ||
    (typeof message.content === 'string' && message.content.startsWith('Error:'))
  const hasErrorReport = message.kind === 'error' && (message.errorTitle || message.errorDetail)

  const body = (
    <>
      {hasErrorReport && (
        <ErrorReport
          title={message.errorTitle || tx('somethingFailed')}
          detail={message.errorDetail}
          runId={message.errorRunId}
          tx={tx}
        />
      )}

      {/* The content string duplicates the report above verbatim — it exists so
          chat history (plain text, server-side) still reads correctly. */}
      <div className="flex flex-col gap-3" hidden={hasErrorReport}>
        {parts.map((part, i) => {
          if (part.type === 'image' || part.type === 'video') {
            return (
              <MediaWell
                key={i}
                type={part.type}
                url={part.value}
                caption={[tx('result'), part.type]}
                onOpen={part.type === 'image' ? () => openMedia(part.value, 'image') : undefined}
                openLabel={tx('openOriginal')}
              />
            )
          }
          if (part.type === 'link') {
            return (
              <a
                key={i}
                href={part.value}
                target="_blank"
                rel="noreferrer"
                className="break-anywhere"
                style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: 3, fontSize: 13 }}
              >
                {part.value}
              </a>
            )
          }
          return part.value.trim() ? (
            <p
              key={i}
              className="prose break-anywhere"
              style={{
                whiteSpace: 'pre-wrap',
                color: isError ? 'var(--bad)' : 'var(--ink)',
              }}
            >
              {part.value.trim()}
            </p>
          ) : null
        })}
      </div>

      {mediaItems.length > 0 && (
        <div className="flex flex-col gap-4" style={{ marginBlockStart: 12 }}>
          {mediaItems.map((item, idx) => (
            <MediaWell
              key={idx}
              type={item.type}
              url={item.url}
              caption={[isUser ? tx('attachment') : tx('result'), item.type]}
              maxWidth={isUser ? 320 : undefined}
              maxHeight={isUser ? 240 : undefined}
              onOpen={item.type === 'image' ? () => openMedia(item.url, 'image') : undefined}
              openLabel={tx('openOriginal')}
            />
          ))}
        </div>
      )}

      {message.scenes?.length > 0 && (
        <SceneResults scenes={message.scenes} tx={tx} openMedia={openMedia} />
      )}

      {message.failedRunId && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" style={{ marginBlockStart: 12 }}>
          {/* Quiet, not filled: resuming a paid run is a recovery, and the
              authorisation in the work order is the only filled control on
              this screen. */}
          <button
            type="button"
            onClick={() => handlers?.onRetry?.(message.failedRunId, index)}
            className="btn-q btn-q--sm"
          >
            <Retry size={15} />
            {tx('retry')}
          </button>
          <span className="caption">{tx('retryHint')}</span>
        </div>
      )}
    </>
  )

  return (
    <article className="settle" style={{ minInlineSize: 0 }}>
      <header className="flex items-baseline gap-3" style={{ marginBlockEnd: 6 }}>
        <span className="label">{isUser ? tx('you') : tx('wazza')}</span>
        {stamp && <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{stamp}</span>}
      </header>

      {isUser ? (
        <div
          className="card-2"
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--r)',
            padding: '12px 16px',
            maxInlineSize: '72ch',
          }}
        >
          {body}
        </div>
      ) : (
        body
      )}
    </article>
  )
}

export default MessageBubble
