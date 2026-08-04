/* ═══════════════════════════════════════════════════════════════════════════
   THE TOP BAR — 56px

     [☰] [mark وازا]  PROJECT ▾  · live run ······  [ACTION]  balance  [account]

   All seven reference products in this register (Frame.io, YouTube Studio,
   Premiere, CapCut, Descript, Runway, Kapwing) converge on this bar, and three
   rules fall out of it:

     · THE PRIMARY ACTION SITS AT THE FAR END, ALONE. Export, CREATE, Share.
       Routes mount theirs through <TopBarAction>, so there is exactly one
       filled control on the screen and it is always in the same place.
     · IDENTITY IS DOUBLED, and YouTube Studio is the clearest example: the
       thing you are managing is named on the left, and WHO YOU ARE sits at
       the far right. The account menu is the only home for sign-out now that
       the icon spine is gone.
     · THE THING YOU ARE WORKING ON IS NAMED HERE, AND SWITCHED HERE. That is
       the <ProjectSwitcher> below — Frame.io's workspace switcher, YouTube
       Studio's channel switcher, Google Cloud's project picker.

   WHAT MOVED HERE. The old 36px status bar is deleted; the live run and the
   session cost moved here, the rockers and the API marker into the account
   menu. And, in this pass, THE WHOLE CONVERSATION LIST out of the rail: the
   rail is WHERE YOU ARE (principle 11), so a project you have open does not
   belong in it. Creating, selecting, searching, renaming and deleting a
   project all happen in the switcher now, with the same handlers, the same
   service calls and the same optimistic updates they had in Sidebar.jsx.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mark, Account, SignOut, ShapeDone, ShapeFail, Caret, NewJob, Search, Amend, Strike, Check, Close } from './Icon'
import Rocker from './ui/Rocker'
import { Money, Duration } from './ui/Money'
import { useChatText } from './chat/chatKit'
import ConfirmDialog from './ConfirmDialog'
import { useRunStatus } from './RunStatusContext'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { useToastStore } from '../store/toastStore'
import { chatService } from '../services/chatService'
import { useCredits } from '../hooks/useCredits'
import { CREDITS_ENABLED } from '../config/features'
import { clearAllStores } from '../utils/clearStores'

const ACTION_SLOT_ID = 'wz-topbar-action-slot'

/** Mount a route's ONE primary action into the top bar. Use it for the action
 *  that spends money or produces the deliverable, and nothing else — the slot
 *  is the reason there is exactly one filled button on any screen. */
export function TopBarAction({ children }) {
  const [node, setNode] = useState(null)
  useEffect(() => { setNode(document.getElementById(ACTION_SLOT_ID)) }, [])
  return node ? createPortal(children, node) : null
}

/* The live run, stated compactly. A run in flight is the only thing in this
   system that animates, and it animates by BREATHING a 7px dot (see .st--run)
   rather than by filling a gauge. Status is a field, not an event. */
function LiveRun({ ar, t }) {
  const { status } = useRunStatus()
  const live = status.activeRunId != null || status.loading
  if (!live) return null

  const hasPercent = typeof status.percent === 'number' && Number.isFinite(status.percent)

  return (
    <div className="hidden md:flex items-center gap-3 min-w-0">
      <span className="st st--run truncate" style={{ maxInlineSize: 220 }}>
        {status.phase || t('generating')}
      </span>
      {hasPercent && (
        <div className="bar" style={{ inlineSize: 88 }} aria-hidden="true">
          <i className="bar__fill" style={{ inlineSize: `${Math.round(status.percent * 100)}%` }} />
        </div>
      )}
      {Number.isFinite(status.elapsedMs) && (
        <Duration ms={status.elapsedMs} style={{ color: 'var(--ink-3)', fontSize: 12 }} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE PROJECT SWITCHER

   NO PROJECT OPEN → it is the page name, exactly as before.
   A PROJECT OPEN  → it is that project's name with a caret, and the menu under
   it is the whole conversation list that used to fill the rail.

   ⚠ OPENING A PROJECT GOES THROUGH ONE PATH AND ONE PATH ONLY: clear the
   messages, then set currentChatId. ChatPage's effect on currentChatId is what
   loads the transcript AND re-queries /active-run to pick up a run that is
   still going server-side — a completion is broadcast exactly once and never
   replayed, so a second, parallel "open a chat" implementation here would
   silently lose finished work. There is deliberately no fetch in this file's
   selection handler.
   ═══════════════════════════════════════════════════════════════════════════ */
function ProjectSwitcher({ ar, t, pageName }) {
  const navigate = useNavigate()
  const { tx } = useChatText()
  const { addToast } = useToastStore()

  /* Selectors, not the whole store: `messages` is rewritten on every progress
     tick of a live run, and subscribing to it would re-render the top bar
     several times a second for a list that has not changed. */
  const chats = useChatStore((s) => s.chats)
  const currentChatId = useChatStore((s) => s.currentChatId)
  const setCurrentChatId = useChatStore((s) => s.setCurrentChatId)
  const setMessages = useChatStore((s) => s.setMessages)
  const removeChat = useChatStore((s) => s.removeChat)

  const [open, setOpen] = useState(false)
  const [loadingChats, setLoadingChats] = useState(true)
  const [creatingChat, setCreatingChat] = useState(false)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const rootRef = useRef(null)
  const editInputRef = useRef(null)

  /* THE LIST IS LOADED HERE, ONCE. It used to be loaded by the rail, which is
     no longer the thing that needs it. This component is mounted
     unconditionally by the top bar on every protected route, so the fetch runs
     exactly once per app mount — not once per route, and not twice. */
  useEffect(() => {
    let cancelled = false
    chatService.getChats()
      .then((data) => {
        if (cancelled) return
        useChatStore.setState({ chats: Array.isArray(data) ? data : [] })
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Failed to load chats:', error)
        addToast('Failed to load chats', 'error')
      })
      .finally(() => { if (!cancelled) setLoadingChats(false) })
    return () => { cancelled = true }
    // addToast is stable for the life of the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  // Same dismissal contract as the account menu: outside click and Escape.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape' && !editingId) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, editingId])

  // Closing the menu abandons a half-typed rename rather than leaving it
  // stranded in state, ready to reappear the next time the menu opens.
  useEffect(() => { if (!open) { setEditingId(null); setEditingTitle('') } }, [open])

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
      setOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Failed to create chat:', error)
      const detail = error?.response?.data?.detail || error?.message || 'Unknown error'
      addToast('Failed to create chat: ' + detail, 'error')
    } finally {
      setCreatingChat(false)
    }
  }

  const handleSelectChat = (chatId) => {
    setOpen(false)
    if (chatId !== currentChatId) {
      // THE path. Nothing else. See the block comment above.
      setMessages([])
      setCurrentChatId(chatId)
    }
    navigate('/')
  }

  const handleDeleteChat = async (chatId) => {
    const wasCurrent = chatId === useChatStore.getState().currentChatId
    try {
      await chatService.deleteChat(chatId)
      // removeChat nulls currentChatId when the deleted chat was the open one,
      // which is what drops ChatPage back to the workspace grid.
      removeChat(chatId)
      addToast('Chat deleted', 'success')
      if (wasCurrent) navigate('/')
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

  const openChat = chats.find((c) => c.id === currentChatId)
  const hasProject = currentChatId != null
  const openTitle = (openChat?.title || '').trim() || tx('untitled')

  const allProjects = ar ? 'كل المشاريع' : 'All projects'

  /* NO PROJECT OPEN. The bar names the page, exactly as it did before — and
     there is no switcher control, because there would be nothing to switch. */
  if (!hasProject) {
    return <span className="hidden lg:inline caption" style={{ color: 'var(--ink-3)' }}>{pageName}</span>
  }

  return (
    <div className="relative min-w-0" ref={rootRef}>
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

      {/* The name of the thing you are working on. It truncates; it never
          stretches the bar. <bdi> because a title is written in the language
          of the prompt, and an English title in the Arabic UI otherwise has
          its punctuation dragged to the wrong end (A3). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-t min-w-0"
        style={{ maxInlineSize: 260, fontSize: 14, fontWeight: 600 }}
        aria-expanded={open}
        aria-haspopup="menu"
        title={openTitle}
      >
        <bdi className="truncate min-w-0">{openTitle}</bdi>
        <Caret size={14} direction="down" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={tx('projects')}
          className="absolute card overlay-cast settle z-overlay"
          style={{ insetBlockStart: 40, insetInlineStart: 0, inlineSize: 300, maxInlineSize: '86vw', padding: 8 }}
        >
          {chats.length > 3 && (
            <div className="relative" style={{ marginBlockEnd: 8 }}>
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
          )}

          <div className="overflow-y-auto scrollbar-hide" style={{ maxBlockSize: 300, marginInline: -8 }}>
            {loadingChats ? (
              <div className="flex flex-col gap-1" style={{ padding: '0 8px' }} aria-busy="true">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skel" style={{ blockSize: 30 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p style={{ padding: '6px 16px 10px', color: 'var(--ink-2)', fontSize: 13 }}>
                {search
                  ? (ar ? 'لا نتائج مطابقة.' : 'Nothing matches that.')
                  : (ar ? 'ابدأ مشروعاً جديداً.' : 'Start a new project.')}
              </p>
            ) : (
              filtered.map((chat) => {
                const active = chat.id === currentChatId
                const label = chat.title || `Chat #${chat.id}`
                return (
                  <div
                    key={chat.id}
                    role="menuitem"
                    tabIndex={editingId === chat.id ? -1 : 0}
                    aria-current={active ? 'true' : undefined}
                    onClick={() => editingId !== chat.id && handleSelectChat(chat.id)}
                    onKeyDown={(e) => {
                      if (editingId === chat.id) return
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectChat(chat.id) }
                    }}
                    className="group relative flex items-center transition-colors duration-state"
                    style={{
                      blockSize: 32,
                      paddingInlineStart: 16,
                      paddingInlineEnd: 8,
                      cursor: 'pointer',
                      backgroundColor: active ? 'var(--card-2)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--card-2)' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-0 start-0"
                        style={{ inlineSize: 2, background: 'var(--accent)' }}
                      />
                    )}

                    {editingId === chat.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={editInputRef}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation()
                            if (e.key === 'Enter') saveEditing()
                            if (e.key === 'Escape') cancelEditing()
                          }}
                          className="field field--sm min-w-0 flex-1"
                          aria-label={ar ? 'اسم المشروع' : 'Project title'}
                        />
                        <button type="button" onClick={saveEditing} className="text-action" style={{ color: 'var(--state-done)', padding: 4 }} aria-label={ar ? 'حفظ' : 'Save'}>
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={cancelEditing} className="text-action" style={{ padding: 4 }} aria-label={ar ? 'إلغاء' : 'Cancel'}>
                          <Close size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <bdi
                          className="truncate flex-1"
                          style={{ fontSize: 13, color: active ? 'var(--ink)' : 'var(--ink-2)' }}
                        >
                          {label}
                        </bdi>
                        {/* .stow: reachable by keyboard through focus-within,
                            and ALWAYS visible on a coarse pointer — a tap on
                            the row opens the project, so hover-gating made
                            rename and delete unreachable on a tablet. */}
                        <span className="flex items-center gap-0.5 stow">
                          <button
                            type="button"
                            onClick={(e) => startEditing(e, chat)}
                            className="text-action"
                            style={{ padding: 4 }}
                            aria-label={`${ar ? 'إعادة تسمية' : 'Rename'} ${label}`}
                          >
                            <Amend size={14} />
                          </button>
                          <button
                            type="button"
                            /* The menu closes so the dialog stands alone —
                               two dismissable layers stacked on one Escape is
                               how a confirm gets answered by accident. */
                            onClick={(e) => { e.stopPropagation(); setOpen(false); setConfirmDelete(chat.id) }}
                            className="text-action text-action--danger"
                            style={{ padding: 4 }}
                            aria-label={`${t('deleteChat')} ${label}`}
                          >
                            <Strike size={14} />
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <div style={{ borderBlockStart: '1px solid var(--line)', margin: '8px -8px' }} />

          <button
            type="button"
            role="menuitem"
            onClick={handleNewChat}
            disabled={creatingChat}
            className="btn-t w-full"
            style={{ padding: '6px 8px' }}
          >
            <NewJob size={15} />
            {tx('newProject')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); setMessages([]); setCurrentChatId(null); navigate('/') }}
            className="btn-t w-full"
            style={{ padding: '6px 8px' }}
          >
            {allProjects}
          </button>
        </div>
      )}
    </div>
  )
}

function TopBar({ onLogout, onToggleRail }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { darkMode, setDarkMode, language, setLanguage, apiConnected, sidebarOpen, t } = useUIStore()
  const { user } = useAuthStore()
  const { status } = useRunStatus()
  const { credits, loading: creditsLoading } = useCredits()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const ar = language === 'ar'

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  const pageName = {
    '/': ar ? 'مساحة العمل' : 'Workspace',
    '/dashboard': t('dashboard'),
    /* Must match the page's own <h1> and the rail label. Three names for one
       destination is how a product starts feeling unfinished. */
    '/assets': ar ? 'المكتبة' : 'Library',
    '/admin': ar ? 'الإدارة' : 'Admin',
    '/settings': t('settings'),
  }[location.pathname] || t('chat')

  const initials = (user?.name || user?.email || '?').trim().slice(0, 2).toUpperCase()

  return (
    <header className="topbar safe-inset">
      {/* THE RAIL TOGGLE, AT EVERY WIDTH. It used to be lg:hidden, which meant
          a desktop user could not put the chrome away — principle 1 says
          panels collapse and there is a path to media-only. It is also the
          only way back from a collapsed rail, and `sidebarOpen` is persisted,
          so it must never itself be hidden. */}
      <button
        type="button"
        className="btn-i"
        onClick={onToggleRail}
        aria-expanded={sidebarOpen}
        aria-controls="wz-rail"
        aria-label={sidebarOpen
          ? (ar ? 'إخفاء التنقل' : 'Hide navigation')
          : (ar ? 'إظهار التنقل' : 'Show navigation')}
        title={sidebarOpen
          ? (ar ? 'إخفاء التنقل' : 'Hide navigation')
          : (ar ? 'إظهار التنقل' : 'Show navigation')}
      >
        <svg className="wz-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 shrink-0"
        style={{ fontWeight: 600, fontSize: 16, color: 'var(--ink)' }}
      >
        <Mark size={19} />
        <span className="hidden sm:inline">وازا</span>
      </button>

      {/* WHAT YOU ARE WORKING ON — named here, switched here. */}
      <ProjectSwitcher ar={ar} t={t} pageName={pageName} />

      <LiveRun ar={ar} t={t} />

      <div className="flex-1" />

      {/* THE PRIMARY ACTION. One per screen, always here. */}
      <div id={ACTION_SLOT_ID} className="flex items-center gap-2" />

      {/* Session spend. Shown only once something has actually been spent, so
          an idle screen carries no figure it does not need. */}
      {status.sessionCostUsd > 0 && (
        <span className="hidden lg:flex items-center gap-2">
          <span className="caption">{t('cost')}</span>
          <Money usd={status.sessionCostUsd} style={{ color: 'var(--ink)', fontSize: 13 }} />
        </span>
      )}

      {/* THE BALANCE. Gated behind CREDITS_ENABLED — see src/config/features.js.
          The whole surface is built and wired, and stays hidden until the flag
          is switched on, so a half-tested balance cannot interrupt a test run. */}
      {CREDITS_ENABLED && (
        <button
          type="button"
          /* /settings, not /billing: there is no /billing route in App.jsx and
             a control that bounces through `*` back to the chat screen is a
             dead control. Repoint this when a billing route actually exists. */
          onClick={() => navigate('/settings')}
          className="hidden sm:block text-end shrink-0"
          style={{ lineHeight: 1.25 }}
          title={ar ? 'الرصيد' : 'Balance'}
        >
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {creditsLoading || credits == null
              ? <span className="skel" style={{ display: 'inline-block', inlineSize: 44, blockSize: 13 }} />
              : <span className="mono">{credits.toLocaleString('en-US')}</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ar ? 'رصيد' : 'credits'}</div>
        </button>
      )}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={user?.name || (ar ? 'الحساب' : 'Account')}
          title={user?.email}
          className="grid place-items-center"
          style={{
            inlineSize: 32, blockSize: 32, borderRadius: '50%',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            fontWeight: 600, fontSize: 12,
          }}
        >
          {initials === '?' ? <Account size={16} /> : initials}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute card overlay-cast settle z-overlay"
            style={{ insetBlockStart: 40, insetInlineEnd: 0, inlineSize: 248, padding: 8 }}
          >
            <p className="truncate" style={{ fontSize: 12, color: 'var(--ink-3)', padding: '4px 8px 8px' }} title={user?.email}>
              {user?.email}
            </p>
            <div style={{ borderBlockStart: '1px solid var(--line)', margin: '0 -8px 8px' }} />

            <div style={{ padding: '0 8px 8px' }}>
              <div className="label" style={{ marginBlockEnd: 6 }}>{t('theme')}</div>
              <Rocker
                ariaLabel={t('theme')}
                value={darkMode}
                onChange={setDarkMode}
                options={[{ value: false, label: t('light') }, { value: true, label: t('dark') }]}
              />
            </div>
            <div style={{ padding: '0 8px 10px' }}>
              <div className="label" style={{ marginBlockEnd: 6 }}>{t('language')}</div>
              <Rocker
                ariaLabel={t('language')}
                value={language}
                onChange={setLanguage}
                options={[{ value: 'en', label: t('english') }, { value: 'ar', label: t('arabic') }]}
              />
            </div>

            <div style={{ borderBlockStart: '1px solid var(--line)', margin: '0 -8px 8px' }} />
            <div className="flex items-center gap-2" style={{ padding: '0 8px 8px', fontSize: 12, color: 'var(--ink-3)' }}>
              {apiConnected ? <ShapeDone size={9} style={{ color: 'var(--ok)' }} /> : <ShapeFail size={9} style={{ color: 'var(--bad)' }} />}
              <span>{apiConnected ? t('connected') : t('disconnected')}</span>
            </div>

            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); clearAllStores(); onLogout() }}
              className="btn-t btn-t--danger w-full"
              style={{ padding: '8px' }}
            >
              <SignOut size={15} />
              {ar ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default TopBar
