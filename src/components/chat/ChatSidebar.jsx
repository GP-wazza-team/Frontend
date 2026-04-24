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
    <div className="w-72 h-full flex flex-col bg-slate-900/50 backdrop-blur-xl border-r border-white/[0.06] flex-shrink-0 relative">
      {/* New chat button */}
      <div className="p-4 border-b border-white/[0.06]">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-violet-500/30
            text-white text-sm font-medium transition-all duration-300 group"
        >
          <Plus size={16} className="text-violet-400 group-hover:scale-110 transition-transform" />
          {t('newChat')}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2
              text-sm text-white placeholder-white/20 focus:border-violet-500/30 focus:outline-none focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3">
        {loadingChats ? (
          <div className="space-y-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={20} className="text-white/10" />
            <p className="text-white/20 text-xs">{t('noChats')}</p>
          </div>
        ) : (
          <div className="space-y-1 mt-1">
            {filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 ${
                  currentChatId === chat.id
                    ? 'bg-violet-500/10 border border-violet-500/20'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {editingId === chat.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing()
                        if (e.key === 'Escape') cancelEditing()
                      }}
                      className="flex-1 bg-slate-950 border border-violet-500/40 rounded-lg px-2 py-1
                        text-sm text-white outline-none min-w-0"
                    />
                    <button
                      onClick={saveEditing}
                      className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-400 flex-shrink-0 transition-colors"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 flex-shrink-0 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'bg-white/[0.04] text-white/30'
                    }`}>
                      <MessageSquare size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/80 truncate font-medium">
                        {chat.title || `Chat #${chat.id}`}
                      </p>
                      <p className="text-xs text-white/25 mt-0.5">
                        {formatRelative(chat.created_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                {editingId !== chat.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => startEditing(e, chat)}
                      className="p-1.5 rounded-lg hover:bg-violet-500/20 text-white/20 hover:text-violet-400 transition-all"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all"
                    >
                      <Trash2 size={11} />
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
