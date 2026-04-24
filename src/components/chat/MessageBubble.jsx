import React, { useState } from 'react'
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
      parts.push({ type: 'link', value: url })
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
  const [showTime, setShowTime] = useState(false)

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
                      className="w-full max-h-80 object-cover rounded-lg"
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
                    <video controls className="w-full max-h-80 rounded-lg" src={part.value} />
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
                  {item.type === 'image' && <img src={item.url} alt="Generated" className="w-full max-h-80 object-cover" />}
                  {item.type === 'video' && <video controls className="w-full max-h-80" src={item.url} />}
                  {item.type === 'audio' && <audio controls className="w-full" src={item.url} />}
                </div>
              ))}
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
