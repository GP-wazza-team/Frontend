import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { useUIStore } from '../../store/uiStore'
import { Globe, Sparkles } from 'lucide-react'

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#00d9ff] flex items-center justify-center">
        <Globe size={14} className="text-white" />
      </div>
      <div className="bg-[#13131f] border border-[#2a2a3e] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

function EmptyState({ t }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#00d9ff] flex items-center justify-center shadow-lg shadow-[#6c63ff]/20">
        <Sparkles size={28} className="text-white" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">WAZZA</h2>
        <p className="text-gray-400 text-sm max-w-sm">
          {t('enterPrompt')}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {[
          'Generate an image of a futuristic city',
          'Write a short story about space',
          'Create a video concept',
          'Describe a product idea',
        ].map((example) => (
          <div
            key={example}
            className="px-3 py-2 rounded-xl border border-[#2a2a3e] text-gray-400 text-xs cursor-default hover:border-[#6c63ff] hover:text-gray-200 transition-colors bg-[#13131f]"
          >
            {example}
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
    <div className="flex-1 overflow-y-auto px-4 py-6">
      {messages.length === 0 && !loading ? (
        <EmptyState t={t} />
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
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
