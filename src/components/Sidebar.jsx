/* ═══════════════════════════════════════════════════════════════════════════
   THE RAIL — two tiers, always present, inset-inline-start: 0.

   This replaces the old 260px chat-only sidebar that was rendered on every
   route while the REAL navigation (Dashboard, Admin, Assets, Settings) hid
   inside a popup under the avatar. A dense admin table used to get squeezed
   by a chat list that is irrelevant on that page. That was the IA failure.

   TIER 1 — THE SPINE. 56px, fixed, NEVER collapses, on every protected route.
     the mark · the destination stack · the account marker.
     ACTIVE STATE is a 2px bar inset on the spine's inline-start edge, full row
     height, in --ink, plus the mark stepping from --ink-3 to --ink. Never a
     dot under the item, never a pill behind it. The bar slides between rows
     over 180ms as one shared element.

   TIER 2 — THE PANEL. 240px, route-contextual, driven by the EXISTING
   `sidebarOpen` boolean. `sidebarOpen` now toggles the PANEL only; the spine
   is permanent.
     /  → the chat list, working exactly as it does now.
     everything else → whatever the route mounts into <RailPanelPortal>.

   Every handler, the ConfirmDialog, the chatService calls, the scroll-into-view
   effect and the filtered() logic are unchanged. What changed is what renders
   and where.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useReducedMotion } from './ui/useReducedMotion'
import { chatService } from '../services/chatService'
import { useChatStore } from '../store/chatStore'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { clearAllStores } from '../utils/clearStores'
import ConfirmDialog from './ConfirmDialog'
import Meter from './ui/Meter'
import {
  Mark, Chat, Ledger, Library, Admin, Settings,
  Account, NewJob, Search, Amend, Strike, Check, Close, SignOut,
} from './Icon'

const PANEL_SLOT_ID = 'wz-rail-panel-slot'

/* Routes mount their own rail-panel controls through this. The slot node is
   committed to the DOM by the rail before any page effect runs, so a single
   lookup on mount is enough.

     import { RailPanelPortal } from '../components/Sidebar'
     <RailPanelPortal><RangeRocker …/></RailPanelPortal>

   ⚠ THE PANEL IS OPENED WHEN A ROUTE MOUNTS CONTROLS INTO IT. `sidebarOpen` is
   persisted, and the Tier-2 container it gates is inline-size 0 / inert when
   false. Without this, a user who collapsed the panel once on the chat route
   would arrive at /admin with NO Export CSV, NO status filter, NO search, NO
   range rocker and NO section index anywhere on screen, and no affordance
   saying they exist — those were page-header controls before the rail moved
   them. A route that has nothing to mount never calls this, so the chat list
   keeps honouring the collapse.

   ONCE PER ROUTE PER SESSION, not once per mount. Firing on every mount meant
   /dashboard, /admin, /assets and /settings re-opened the panel on EVERY
   visit, which silently overrode an explicit collapse the moment the user
   navigated anywhere. The first arrival on a route reveals its controls; after
   that the user's own toggle is the only thing that moves the panel. */
const forcedRoutes = new Set()

export function RailPanelPortal({ children }) {
  const [node, setNode] = useState(null)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const { pathname } = useLocation()

  useEffect(() => {
    setNode(document.getElementById(PANEL_SLOT_ID))
    if (!forcedRoutes.has(pathname)) {
      forcedRoutes.add(pathname)
      setSidebarOpen(true)
    }
  }, [setSidebarOpen, pathname])

  return node ? createPortal(children, node) : null
}

const ROW = 44   // the destination row height, and the marker's travel unit

function Destination({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className="relative flex items-center justify-center w-full transition-colors duration-state"
      style={{ blockSize: ROW, color: active ? 'var(--ink)' : 'var(--ink-3)' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--ink-2)' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--ink-3)' }}
    >
      <Icon size={20} />
    </button>
  )
}

/* ONE marker element for the whole stack, slid by transform. Deliberately not
   a shared-layout animation across mount/unmount: that measures absolute
   boxes, and a language flip re-mirrors the rail mid-flight, which strands the
   marker in the middle of the panel. A single element positioned with
   inset-inline-start and moved on the block axis cannot get that wrong. */
function RailMarker({ index, reduce }) {
  if (index < 0) return null
  return (
    <span
      aria-hidden="true"
      className="absolute start-0"
      style={{
        insetBlockStart: 0,
        inlineSize: 2,
        blockSize: ROW,
        background: 'var(--ink)',
        transform: `translateY(${index * ROW}px)`,
        transition: reduce ? 'none' : 'transform 180ms var(--ease)',
      }}
    />
  )
}

function Sidebar({ onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, language, t } = useUIStore()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const { chats, setChats, currentChatId, setCurrentChatId, setMessages, removeChat } = useChatStore()
  const [loadingChats, setLoadingChats] = useState(true)
  const [creatingChat, setCreatingChat] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const editInputRef = useRef(null)
  const menuRef = useRef(null)
  const listRef = useRef(null)
  const reduce = useReducedMotion()

  useEffect(() => { loadChats() }, [])
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // Scroll active chat into view
  useEffect(() => {
    if (currentChatId && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-chat-id="${currentChatId}"]`)
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentChatId])

  const loadChats = async () => {
    try {
      setLoadingChats(true)
      const data = await chatService.getChats()
      setChats(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load chats:', error)
      addToast('Failed to load chats', 'error')
    } finally {
      setLoadingChats(false)
    }
  }

  const handleNewChat = async () => {
    if (creatingChat) return
    setCreatingChat(true)
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
      const detail = error?.response?.data?.detail || error?.message || 'Unknown error'
      addToast('Failed to create chat: ' + detail, 'error')
    } finally {
      setCreatingChat(false)
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
      addToast('Failed to load messages', 'error')
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      await chatService.deleteChat(chatId)
      removeChat(chatId)
      addToast('Chat deleted', 'success')
    } catch (error) {
      console.error('Failed to delete chat:', error)
      addToast('Failed to delete chat', 'error')
    } finally {
      setConfirmDelete(null)
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
      addToast('Failed to rename chat', 'error')
    } finally {
      setEditingId(null)
      setEditingTitle('')
    }
  }

  const filtered = chats.filter(
    (c) => String(c.id).includes(search) || (c.title && c.title.toLowerCase().includes(search.toLowerCase()))
  )

  const ar = language === 'ar'
  const isChatPage = location.pathname === '/'
  const isAdmin = user?.is_admin || user?.role === 'admin'

  /* Admin has no translation key in the store today, and the store is frozen.
     Inline the pair, exactly as Sidebar already inlines 'تسجيل الخروج'. */
  const adminLabel = ar ? 'الإدارة' : 'Admin'

  const destinations = [
    { to: '/', icon: Chat, label: t('chat') },
    { to: '/dashboard', icon: Ledger, label: t('dashboard') },
    { to: '/assets', icon: Library, label: t('assets') },
    ...(isAdmin ? [{ to: '/admin', icon: Admin, label: adminLabel }] : []),
    { to: '/settings', icon: Settings, label: t('settings') },
  ]

  const panelLegend = {
    '/': t('chat'),
    '/dashboard': t('dashboard'),
    '/assets': t('assets'),
    '/admin': adminLabel,
    '/settings': t('settings'),
  }[location.pathname] || t('chat')

  return (
    <>
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Chat"
        message="This chat and all its messages will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={() => handleDeleteChat(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <div
        className="relative flex h-full shrink-0 z-rail"
        style={{ backgroundColor: 'var(--panel)' }}
      >
        {/* ── TIER 1 · THE SPINE ─────────────────────────────────────────── */}
        <nav
          aria-label={ar ? 'التنقل' : 'Primary'}
          className="flex flex-col shrink-0 h-full"
          style={{ inlineSize: 'var(--rail-spine)', borderInlineEnd: '1px solid var(--etch)' }}
        >
          <div className="flex items-center justify-center h-14" style={{ color: 'var(--ink)' }}>
            <Mark size={20} />
          </div>

          <div className="relative flex flex-col mt-3">
            <RailMarker index={destinations.findIndex((d) => d.to === location.pathname)} reduce={reduce} />
            {destinations.map((d) => (
              <Destination
                key={d.to}
                icon={d.icon}
                label={d.label}
                active={location.pathname === d.to}
                onClick={() => navigate(d.to)}
              />
            ))}
          </div>

          <div className="flex-1" />

          {/* Account. The only thing docked at the foot of the spine — the
              theme and language rockers live in the status bar, where they can
              carry the words the Rocker spec requires. */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              title={user?.name || user?.email || (ar ? 'الحساب' : 'Account')}
              aria-label={user?.name || (ar ? 'الحساب' : 'Account')}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center justify-center h-12 w-full transition-colors duration-state"
              style={{ color: menuOpen ? 'var(--ink)' : 'var(--ink-3)' }}
              onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.color = 'var(--ink-2)' }}
              onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.color = 'var(--ink-3)' }}
            >
              <Account size={20} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute settle plate plate--flush overlay-cast z-overlay"
                style={{
                  insetBlockEnd: 8,
                  insetInlineStart: 'calc(var(--rail-spine) - 8px)',
                  inlineSize: 232,
                  boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
                  paddingBlock: 8,
                }}
              >
                <p
                  className="truncate"
                  style={{
                    color: 'var(--ink-3)',
                    fontSize: 11,
                    paddingBlock: '4px 8px',
                    paddingInlineStart: 16,
                    paddingInlineEnd: 24,   /* clears the 8px cut */
                  }}
                  title={user?.email}
                >
                  {user?.email}
                </p>
                <div style={{ borderBlockStart: '1px solid var(--etch)' }} />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); clearAllStores(); onLogout() }}
                  className="text-action text-action--danger w-full"
                  style={{ paddingBlock: 10, paddingInlineStart: 16, paddingInlineEnd: 16 }}
                >
                  <SignOut size={16} />
                  {ar ? 'تسجيل الخروج' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ── TIER 2 · THE PANEL ─────────────────────────────────────────────
            In flow on a desktop, an OVERLAY on a handheld.

            The spine (32px there) plus this panel would otherwise claim most
            of a 390pt screen and squeeze the route into a column too narrow to
            read. Overlaying keeps the panel at a usable width and leaves the
            page beneath it intact, which is also what a phone user expects a
            drawer to do. `.rail-panel--overlay` is applied by width only, so
            the desktop composition is untouched. */}
        <div
          className={`h-full overflow-hidden flex flex-col rail-panel${sidebarOpen ? ' rail-panel--open' : ''}`}
          style={{
            inlineSize: sidebarOpen ? 'var(--rail-panel)' : 0,
            borderInlineEnd: sidebarOpen ? '1px solid var(--etch)' : 'none',
            transition: 'inline-size 180ms var(--ease)',
          }}
          aria-hidden={!sidebarOpen}
          inert={sidebarOpen ? undefined : ''}
        >
          <div style={{ inlineSize: 'var(--rail-panel)' }} className="flex flex-col h-full">
            <div style={{ padding: '16px 16px 0 16px' }}>
              <span className="legend">{panelLegend}</span>
            </div>

            {/* Routes mount their own controls here. */}
            <div id={PANEL_SLOT_ID} style={{ paddingInline: 16 }} />

            {isChatPage && (
              <>
                <div style={{ padding: '8px 16px 0 16px' }}>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    disabled={creatingChat}
                    className="text-action"
                  >
                    <NewJob size={16} />
                    {t('newChat')}
                    {creatingChat && (
                      <Meter cells={5} mode="indeterminate" tone="ink" label={t('loading')} />
                    )}
                  </button>
                </div>

                {chats.length > 3 && (
                  <div style={{ padding: '8px 16px 0 16px' }}>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="field field--sm"
                        style={{ paddingInlineStart: 32 }}
                        aria-label={t('search')}
                      />
                      <Search
                        size={14}
                        className="absolute top-1/2 -translate-y-1/2 start-[10px] pointer-events-none"
                        style={{ color: 'var(--ink-3)' }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide" style={{ padding: '12px 8px' }} ref={listRef}>
                  {loadingChats ? (
                    <div className="flex flex-col gap-1" aria-busy="true">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skel" style={{ blockSize: 32 }} />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ padding: '8px' }}>
                      <span className="legend">{search ? t('search') : t('noChats')}</span>
                      <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>
                        {search
                          ? (ar ? 'لا نتائج مطابقة.' : 'Nothing matches that.')
                          : (ar ? 'ابدأ مهمة جديدة لفتح سجل.' : 'Start a new job to open a transcript.')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {filtered.map((chat) => {
                        const active = currentChatId === chat.id && isChatPage
                        return (
                          <div
                            key={chat.id}
                            data-chat-id={chat.id}
                            onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                            className="group relative flex items-center transition-colors duration-state"
                            style={{
                              blockSize: 32,
                              paddingInlineStart: 12,
                              paddingInlineEnd: 4,
                              cursor: 'pointer',
                              backgroundColor: active ? 'var(--panel-hover)' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--panel-hover)' }}
                            onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            {active && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 start-0"
                                style={{ inlineSize: 2, background: 'var(--ink)' }}
                              />
                            )}

                            {editingId === chat.id ? (
                              <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                <input
                                  ref={editInputRef}
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditing()
                                    if (e.key === 'Escape') cancelEditing()
                                  }}
                                  className="field field--sm min-w-0 flex-1"
                                  aria-label={ar ? 'اسم الدردشة' : 'Chat title'}
                                />
                                <button type="button" onClick={saveEditing} className="text-action" style={{ color: 'var(--state-done)', padding: 4 }} aria-label="Save">
                                  <Check size={14} />
                                </button>
                                <button type="button" onClick={cancelEditing} className="text-action" style={{ padding: 4 }} aria-label="Cancel">
                                  <Close size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p
                                  className="truncate flex-1"
                                  style={{ fontSize: 12, color: active ? 'var(--ink)' : 'var(--ink-2)' }}
                                >
                                  {chat.title || `Chat #${chat.id}`}
                                </p>
                                {/* .stow: reachable by keyboard through
                                    focus-within, and always visible on a
                                    coarse pointer — a tap on the row selects
                                    the chat, so hover-gating made rename and
                                    delete unreachable on a tablet. */}
                                <span className="flex items-center gap-0.5 stow">
                                  <button
                                    type="button"
                                    onClick={(e) => startEditing(e, chat)}
                                    className="text-action"
                                    style={{ padding: 4 }}
                                    aria-label={`Rename ${chat.title || `Chat #${chat.id}`}`}
                                  >
                                    <Amend size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(chat.id) }}
                                    className="text-action text-action--danger"
                                    style={{ padding: 4 }}
                                    aria-label={`${t('deleteChat')} ${chat.title || `Chat #${chat.id}`}`}
                                  >
                                    <Strike size={14} />
                                  </button>
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {!isChatPage && <div className="flex-1" />}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
