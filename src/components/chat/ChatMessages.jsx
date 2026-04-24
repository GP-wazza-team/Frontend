import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { useUIStore } from '../../store/uiStore'
import { Zap, Wand2, Image, Film, PenTool } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
        <Zap size={14} className="text-white" />
      </div>
      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/20">
        <Zap size={28} className="text-white" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">WAZZA</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          {t('enterPrompt')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {examples.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 text-gray-500 text-sm
              hover:border-orange-200 hover:text-slate-700 hover:bg-orange-50/50 transition-all duration-200 cursor-default group bg-white"
          >
            <Icon size={16} className="text-orange-400 flex-shrink-0" />
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
