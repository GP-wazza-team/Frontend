import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { useUIStore } from '../../store/uiStore'
import { Sparkles, Wand2, Image, Film, PenTool } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
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
    <div className="flex flex-col items-center justify-center h-full gap-8 px-4 animate-scaleIn">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/20 animate-pulse-glow">
          <Sparkles size={32} className="text-white" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full blur-2xl -z-10" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          <span className="gradient-text">WAZZA</span>
        </h2>
        <p className="text-white/30 text-sm max-w-sm">
          {t('enterPrompt')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {examples.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.06] text-white/30 text-sm
              hover:border-violet-500/30 hover:text-white/60 hover:bg-white/[0.03] transition-all duration-300 cursor-default group"
          >
            <Icon size={16} className="text-violet-400/50 group-hover:text-violet-400 transition-colors flex-shrink-0" />
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
        <div className="max-w-4xl mx-auto space-y-5">
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
