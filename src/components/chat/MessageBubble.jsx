import React, { useState } from 'react'
import { Zap, RotateCw } from 'lucide-react'
import PlanReviewCard from './PlanReviewCard'
import ClarificationCard from './ClarificationCard'
import { useLightbox } from '../MediaLightbox'

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

/**
 * Multi-scene results arrive as a flat scenes[] on the run result. Rendering
 * them grouped keeps a 4-scene story readable instead of collapsing into an
 * undifferentiated pile of media.
 */
function SceneResults({ scenes }) {
  const openMedia = useLightbox()
  if (!scenes || scenes.length === 0) return null
  return (
    <div className="mt-2.5 flex flex-col gap-3">
      {scenes.map((scene) => (
        <div key={scene.scene_number} className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Scene {scene.scene_number}
          </span>
          {scene.video_url ? (
            <video
              controls
              className="w-full max-h-80 rounded-lg cursor-zoom-in"
              src={scene.video_url}
              onDoubleClick={() => openMedia(scene.video_url, 'video')}
            />
          ) : (
            (scene.image_urls || []).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Scene ${scene.scene_number}`}
                className="w-full max-h-80 object-cover rounded-lg cursor-zoom-in"
                onClick={() => openMedia(url, 'image')}
              />
            ))
          )}
        </div>
      ))}
    </div>
  )
}

function MessageBubble({ message, handlers, index }) {
  const openMedia = useLightbox()
  const isUser = message.role === 'user'
  const parts = parseContent(message.content)
  const mediaItems = message.media || []
  const [showTime, setShowTime] = useState(false)

  // Interactive cards replace the bubble entirely — they own their own chrome.
  if (message.kind === 'plan' && message.plan) {
    return (
      <div className="max-w-3xl mx-auto animate-slideUp">
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
      </div>
    )
  }

  if (message.kind === 'clarification' && message.questions) {
    return (
      <div className="max-w-3xl mx-auto animate-slideUp">
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

  return (
    <div
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slideUp max-w-3xl mx-auto`}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: 'var(--accent)' }}>
          <Zap size={11} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="text-[15px] leading-relaxed" style={{ color: isUser ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          <div className="space-y-2.5">
            {parts.map((part, i) => {
              if (part.type === 'image') {
                return (
                  <div key={i} className="overflow-hidden rounded-lg mt-1">
                    <img
                      src={part.value}
                      alt="Generated"
                      className="w-full max-h-80 object-cover rounded-lg cursor-zoom-in"
                      onClick={() => openMedia(part.value, 'image')}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <a href={part.value} target="_blank" rel="noreferrer" className="underline text-xs hidden break-all" style={{ color: 'var(--accent)' }}>
                      {part.value}
                    </a>
                  </div>
                )
              }
              if (part.type === 'video') {
                return (
                  <div key={i} className="overflow-hidden rounded-lg mt-1">
                    <video
                      controls
                      className="w-full max-h-80 rounded-lg cursor-zoom-in"
                      src={part.value}
                      onDoubleClick={() => openMedia(part.value, 'video')}
                    />
                  </div>
                )
              }
              if (part.type === 'link') {
                return (
                  <a key={i} href={part.value} target="_blank" rel="noreferrer" className="underline break-all" style={{ color: 'var(--accent)' }}>
                    {part.value}
                  </a>
                )
              }
              return part.value.trim() ? (
                <p key={i} className="whitespace-pre-wrap break-words">{part.value.trim()}</p>
              ) : null
            })}
          </div>
          {mediaItems.length > 0 && (
            <div className="mt-2.5 space-y-2.5">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg">
                  {item.type === 'image' && (
                    <img
                      src={item.url}
                      alt="Generated"
                      className="w-full max-h-80 object-cover cursor-zoom-in"
                      onClick={() => openMedia(item.url, 'image')}
                    />
                  )}
                  {item.type === 'video' && (
                    <video
                      controls
                      className="w-full max-h-80 cursor-zoom-in"
                      src={item.url}
                      onDoubleClick={() => openMedia(item.url, 'video')}
                    />
                  )}
                  {item.type === 'audio' && <audio controls className="w-full" src={item.url} />}
                </div>
              ))}
            </div>
          )}
          <SceneResults scenes={message.scenes} />
          {message.failedRunId && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlers?.onRetry?.(message.failedRunId, index)}
                className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                <RotateCw size={12} />
                Retry
              </button>
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                Picks up where it stopped — finished scenes aren't charged again.
              </span>
            </div>
          )}
        </div>
        <span
          className="text-[10px] px-0.5 transition-opacity duration-200"
          style={{ color: 'var(--text-tertiary)', opacity: showTime ? 1 : 0 }}
        >
          {formatTime(message.created_at || message.timestamp)}
        </span>
      </div>

      {isUser && <div className="flex-shrink-0 w-6" />}
    </div>
  )
}

export default MessageBubble
