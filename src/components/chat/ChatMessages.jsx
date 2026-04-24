import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { useUIStore } from '../../store/uiStore'
import { Zap, Wand2, Image, Film, PenTool } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn max-w-3xl mx-auto">
      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: 'var(--accent)' }}>
        <Zap size={11} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-1.5" style={{ backgroundColor: 'rgba(128,128,128,0.06)' }}>
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-tertiary)', animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function EmptyState({ t }) {
  const examples = [
    { icon: Image, text: 'Generate an image of a futuristic city' },
    { icon: PenTool, text: 'Write a short story about space' },
    { icon: Film, text: 'Create a video concept' },
    { icon: Wand2, text: 'Describe a product idea' },
  ]

  return (
    <div className="flex flex-col items-center justify-center h-full gap-7 px-4 animate-scaleIn">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
        <Zap size={24} className="text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>WAZZA</h2>
        <p className="text-sm max-w-sm" style={{ color: 'var(--text-tertiary)' }}>{t('enterPrompt')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {examples.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] transition-all duration-200 cursor-default"
            style={{ border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <Icon size={14} className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <span className="line-clamp-1">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatMessages({ messages, loading }) {
  const messagesEndRef = useRef(null)
  const { t } = useUIStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
      {messages.length === 0 && !loading ? (
        <EmptyState t={t} />
      ) : (
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  )
}

export default ChatMessages
