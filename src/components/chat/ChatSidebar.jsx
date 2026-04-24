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
    <div className="w-72 h-full flex flex-col bg-gray-50 border-r border-gray-100 flex-shrink-0">
      {/* New chat button */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-white border border-gray-200 text-slate-700 text-sm font-semibold
            hover:border-orange-300 hover:shadow-sm transition-all duration-200 group"
        >
          <Plus size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
          {t('newChat')}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2
              text-sm text-slate-900 placeholder-gray-400 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-3">
        {loadingChats ? (
          <div className="space-y-2 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare size={20} className="text-gray-300" />
            <p className="text-gray-400 text-xs">{t('noChats')}</p>
          </div>
        ) : (
          <div className="space-y-1 mt-1">
            {filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                className={`group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentChatId === chat.id
                    ? 'bg-white border border-orange-200 shadow-sm'
                    : 'hover:bg-white border border-transparent'
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
                      className="flex-1 bg-white border border-orange-300 rounded-lg px-2 py-1
                        text-sm text-slate-900 outline-none min-w-0 focus:ring-2 focus:ring-orange-100"
                    />
                    <button
                      onClick={saveEditing}
                      className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 flex-shrink-0 transition-colors"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 flex-shrink-0 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      currentChatId === chat.id
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <MessageSquare size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 truncate font-medium">
                        {chat.title || `Chat #${chat.id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatRelative(chat.created_at)}
                      </p>
                    </div>
                  </div>
                )}

                {editingId !== chat.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={(e) => startEditing(e, chat)}
                      className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-300 hover:text-orange-600 transition-all"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-300 hover:text-rose-600 transition-all"
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
