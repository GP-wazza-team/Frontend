import React, { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, Pencil, Check, X, BarChart3, Image, LogOut, Zap, Search } from 'lucide-react'
import { chatService } from '../services/chatService'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

function formatRelative(dateStr) {
  if (!dateStr) return ''
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    return `${Math.floor(diff / 86400)}d`
  } catch {
    return ''
  }
}

function Sidebar({ onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, language } = useUIStore()
  const { user } = useAuthStore()
  const { chats, setChats, currentChatId, setCurrentChatId, setMessages, removeChat } = useChatStore()
  const [loadingChats, setLoadingChats] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const editInputRef = useRef(null)

  useEffect(() => { loadChats() }, [])
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
      navigate('/')
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
      navigate('/')
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
    (c) => String(c.id).includes(search) || (c.title && c.title.toLowerCase().includes(search.toLowerCase()))
  )

  const isActive = (path) => location.pathname === path
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <div
        className={`fixed h-screen flex flex-col transition-all duration-300 z-50 ${
          sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
        }`}
        style={{ backgroundColor: 'var(--bg)', borderRight: '1px solid var(--border)' }}
      >
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <Plus size={15} />
            New Chat
          </button>
        </div>

        {/* Search */}
        {chats.length > 3 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md pl-7 pr-2.5 py-1.5 text-[12px] outline-none transition-all"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid transparent' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
              />
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-2">
          {loadingChats ? (
            <div className="space-y-1 px-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 rounded-md animate-pulse" style={{ backgroundColor: 'var(--border)' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-1.5">
              <MessageSquare size={16} style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{search ? 'No results' : 'No chats yet'}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                  className="group relative px-2.5 py-2 rounded-md cursor-pointer transition-all duration-150"
                  style={currentChatId === chat.id && location.pathname === '/' ? { backgroundColor: 'rgba(128,128,128,0.08)' } : {}}
                  onMouseEnter={(e) => { if (!(currentChatId === chat.id && location.pathname === '/')) e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.04)' }}
                  onMouseLeave={(e) => { if (!(currentChatId === chat.id && location.pathname === '/')) e.currentTarget.style.backgroundColor = 'transparent' }}
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
                        className="flex-1 rounded px-2 py-1 text-[12px] outline-none min-w-0"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
                      />
                      <button onClick={saveEditing} className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 flex-shrink-0">
                        <Check size={11} />
                      </button>
                      <button onClick={cancelEditing} className="p-1 rounded hover:bg-rose-500/10 text-rose-400 flex-shrink-0">
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pr-14">
                      <MessageSquare size={13} className="flex-shrink-0" style={{ color: currentChatId === chat.id && location.pathname === '/' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                      <p className="text-[13px] truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{chat.title || `Chat #${chat.id}`}</p>
                    </div>
                  )}

                  {editingId !== chat.id && (
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => startEditing(e, chat)} className="p-1 rounded transition-all" style={{ color: 'var(--text-tertiary)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                        <Pencil size={10} />
                      </button>
                      <button onClick={(e) => handleDeleteChat(e, chat.id)} className="p-1 rounded hover:text-rose-400 transition-all" style={{ color: 'var(--text-tertiary)' }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom: Dashboard, Assets, User */}
        <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex gap-1 mb-1">
            <Link
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-[12px] font-medium transition-all"
              style={isActive('/dashboard') ? { backgroundColor: 'rgba(128,128,128,0.08)', color: 'var(--text-primary)' } : { color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { if (!isActive('/dashboard')) { e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
              onMouseLeave={(e) => { if (!isActive('/dashboard')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}}
            >
              <BarChart3 size={14} />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/assets"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-[12px] font-medium transition-all"
              style={isActive('/assets') ? { backgroundColor: 'rgba(128,128,128,0.08)', color: 'var(--text-primary)' } : { color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { if (!isActive('/assets')) { e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.04)'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
              onMouseLeave={(e) => { if (!isActive('/assets')) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}}
            >
              <Image size={14} />
              <span>Assets</span>
            </Link>
          </div>

          {/* User + Sign out */}
          <div className="flex items-center gap-2 px-2 py-2 rounded-md" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: 'var(--accent)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{user?.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
              title={language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}
            >
              <LogOut size={13} className="text-rose-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className={`shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-[260px]' : 'w-0'}`} />
    </>
  )
}

export default Sidebar
