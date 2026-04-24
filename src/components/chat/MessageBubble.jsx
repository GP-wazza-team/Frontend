import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { Zap } from 'lucide-react'

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
  const mediaItems = message.media || []

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-slideUp`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/20">
          <Zap size={14} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-slate-900 text-white rounded-tr-sm'
              : 'bg-gray-100 text-slate-800 rounded-tl-sm'
          }`}
        >
          <div className="space-y-2.5">
            {parts.map((part, i) => {
              if (part.type === 'image') {
                return (
                  <div key={i} className="overflow-hidden rounded-xl mt-1">
                    <img
                      src={part.value}
                      alt="Generated"
                      className="w-full max-h-80 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <a
                      href={part.value}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 underline text-xs hidden break-all font-medium"
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
              return part.value.trim() ? (
                <p key={i} className="whitespace-pre-wrap break-words">{part.value.trim()}</p>
              ) : null
            })}
          </div>

          {mediaItems.length > 0 && (
            <div className="mt-2.5 space-y-2.5">
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

        <span className="text-[11px] text-gray-400 px-1 font-medium">
          {formatTime(message.created_at || message.timestamp)}
        </span>
      </div>

      {isUser && <div className="flex-shrink-0 w-8" />}
    </div>
  )
}

export default MessageBubble
