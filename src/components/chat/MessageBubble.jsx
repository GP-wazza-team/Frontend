import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { Globe } from 'lucide-react'

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

// Splits content into text parts and URL parts so we can render media inline
function parseContent(content) {
  if (!content) return []
  const urlRegex = /(https?:\/\/[^\s]+)/g
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
      parts.push({ type: 'text', value: url })
    }
    lastIndex = match.index + url.length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return parts
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const parts = parseContent(message.content)

  // also handle explicit media array (from generate response)
  const mediaItems = message.media || []

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slideIn`}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#00d9ff] flex items-center justify-center">
          <Globe size={14} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[#6c63ff] text-white rounded-tr-sm'
              : 'bg-[#13131f] border border-[#2a2a3e] text-gray-100 rounded-tl-sm'
          }`}
        >
          {/* Render content — detect image/video URLs and show as media */}
          <div className="space-y-2">
            {parts.map((part, i) => {
              if (part.type === 'image') {
                return (
                  <div key={i} className="overflow-hidden rounded-xl mt-1">
                    <img
                      src={part.value}
                      alt="Generated"
                      className="w-full max-h-80 object-cover rounded-xl"
                      onError={(e) => {
                        // fallback to link if image fails to load
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <a
                      href={part.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline text-xs hidden break-all"
                    >
                      {part.value}
                    </a>
                  </div>
                )
              }
              if (part.type === 'video') {
                return (
                  <div key={i} className="overflow-hidden rounded-xl mt-1">
                    <video controls className="w-full max-h-80 rounded-xl" src={part.value} />
                  </div>
                )
              }
              // plain text — only render if non-empty
              return part.value.trim() ? (
                <p key={i} className="whitespace-pre-wrap break-words">{part.value.trim()}</p>
              ) : null
            })}
          </div>

          {/* Explicit media array (from generate HTTP response) */}
          {mediaItems.length > 0 && (
            <div className="mt-2 space-y-2">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="overflow-hidden rounded-xl">
                  {item.type === 'image' && (
                    <img src={item.url} alt="Generated" className="w-full max-h-80 object-cover" />
                  )}
                  {item.type === 'video' && (
                    <video controls className="w-full max-h-80" src={item.url} />
                  )}
                  {item.type === 'audio' && (
                    <audio controls className="w-full" src={item.url} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <span className="text-xs text-gray-600 px-1">
          {formatTime(message.created_at || message.timestamp)}
        </span>
      </div>

      {/* Spacer for user side */}
      {isUser && <div className="flex-shrink-0 w-8" />}
    </div>
  )
}

export default MessageBubble
