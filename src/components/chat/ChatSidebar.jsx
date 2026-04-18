import React, { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Search, MessageSquare, Pencil, Check, X } from 'lucide-react'
import { chatService } from '../../services/chatService'
import { useChatStore } from '../../store/chatStore'
import { useUIStore } from '../../store/uiStore'

function formatRelative(dateStr) {
  if (!dateStr) return ''
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  } catch {
    return ''
  }
}

function ChatSidebar() {
  const { chats, setChats, currentChatId, setCurrentChatId, setMessages, removeChat } =
    useChatStore()
  const { t } = useUIStore()
  const [loadingChats, setLoadingChats] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const editInputRef = useRef(null)

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const loadChats = async () => {
    try {
      setLoadingChats(true)
      const data = await chatService.getChats()
      setChats(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load chats:', error)
    } finally {
      setLoadingChats(false)
    }
  }

  const handleNewChat = async () => {
    try {
      const chat = await chatService.createChat()
      useChatStore.setState((state) => ({
        chats: [chat, ...state.chats],
        currentChatId: chat.id,
        messages: [],
      }))
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleSelectChat = async (chatId) => {
    if (chatId === currentChatId) return
    try {
      setCurrentChatId(chatId)
      const data = await chatService.getMessages(chatId)
      setMessages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this chat?')) return
    try {
      await chatService.deleteChat(chatId)
      removeChat(chatId)
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const startEditing = (e, chat) => {
    e.stopPropagation()
    setEditingId(chat.id)
    setEditingTitle(chat.title || `Chat #${chat.id}`)
  }

  const cancelEditing = (e) => {
    e?.stopPropagation()
    setEditingId(null)
    setEditingTitle('')
  }

  const saveEditing = async (e) => {
    e?.stopPropagation()
    if (!editingTitle.trim()) return cancelEditing()
    try {
      const updated = await chatService.renameChat(editingId, editingTitle.trim())
      useChatStore.setState((state) => ({
        chats: state.chats.map((c) => (c.id === editingId ? { ...c, title: updated.title } : c)),
      }))
    } catch (error) {
      console.error('Failed to rename chat:', error)
    } finally {
      setEditingId(null)
      setEditingTitle('')
    }
  }

  const filtered = chats.filter(
    (c) =>
      String(c.id).includes(search) ||
      (c.title && c.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="w-64 h-full flex flex-col bg-[#0d0d1a] border-r border-[#1e1e2e] flex-shrink-0">
      {/* New chat button */}
      <div className="p-3 border-b border-[#1e1e2e]">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-[#6c63ff] hover:bg-[#5a52e0] text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          {t('newChat')}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#13131f] border border-[#2a2a3e] rounded-lg pl-8 pr-3 py-2
              text-sm text-white placeholder-gray-600 focus:border-[#6c63ff] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-2">
        {loadingChats ? (
          <div className="space-y-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[#13131f] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={20} className="text-gray-600" />
            <p className="text-gray-600 text-xs">{t('noChats')}</p>
          </div>
        ) : (
          <div className="space-y-1 mt-1">
            {filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-[#6c63ff]/20 border border-[#6c63ff]/40'
                    : 'hover:bg-[#13131f] border border-transparent'
                }`}
              >
                {editingId === chat.id ? (
                  /* Inline rename input */
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing()
                        if (e.key === 'Escape') cancelEditing()
                      }}
                      className="flex-1 bg-[#0f0f1a] border border-[#6c63ff] rounded-lg px-2 py-1
                        text-sm text-white outline-none min-w-0"
                    />
                    <button
                      onClick={saveEditing}
                      className="p-1 rounded-lg hover:bg-green-500/20 text-green-400 flex-shrink-0"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  /* Normal view */
                  <div className="flex items-center gap-2 pr-14">
                    <MessageSquare
                      size={13}
                      className={`flex-shrink-0 ${currentChatId === chat.id ? 'text-[#6c63ff]' : 'text-gray-500'}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-200 truncate">
                        {chat.title || `Chat #${chat.id}`}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatRelative(chat.created_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons (rename + delete) — only in normal view */}
                {editingId !== chat.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => startEditing(e, chat)}
                      className="p-1 rounded-lg hover:bg-[#6c63ff]/20 text-gray-500 hover:text-[#6c63ff] transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatSidebar
