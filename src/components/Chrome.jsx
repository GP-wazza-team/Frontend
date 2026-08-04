/* ═══════════════════════════════════════════════════════════════════════════
   CHROME — the pieces the rail is assembled from, plus the handheld bar.

   THERE IS NO TOP BAR. This file was one, 56px, spanning the window. It is now
   a parts bin for <Sidebar>, which is the only chrome on a desktop screen:

     ┌──────────┬─────────┐   the rail runs the FULL height of the window,
     │          │  mark   │   holds the identity alone at the top, the
     │   main   ├─────────┤   destinations in the middle, and who you are
     │          │   nav   │   pinned to the bottom edge.
     │          │ project │
     │          │         │
     │          ├─────────┤
     │          │ account │
     └──────────┴─────────┘

   WHY THE BAR WENT. It was a second, competing home for chrome running along
   the top of every screen, and most of what it carried belonged to the rail
   anyway — the identity, who you are, where you are. What was left was a route
   label that repeated the page's own <h1>, and a portal slot.

   WHAT HAPPENED TO THE PRIMARY ACTION. It used to mount here through
   <TopBarAction>, so the press that spends money sat in a corner, far from the
   figure it was committing. That portal is gone. The authorisation now renders
   inside the work order itself, directly under the total — see the footer of
   PlanReviewCard. One filled control on the screen is still the rule; it is
   simply in the document rather than in a bar above it.

   ⚠ NOTHING IN THIS FILE MAY ASSUME A WINDOW-WIDTH CONTAINER any more. Every
   export lands in a 216px rail, so a row of items that used to spread along a
   1600px bar has to stack. Where that changed a component, the reason is on
   the component.

   THE PROJECT SWITCHER stays exactly as it was built — same handlers, same
   service calls, same optimistic updates. Only its housing moved.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

/* The live run, stated compactly. A run in flight is the only thing in this
   system that animates, and it animates by BREATHING a 7px dot (see .st--run)
   rather than by filling a gauge. Status is a field, not an event.

   STACKED, NOT A ROW. In the bar this was phase · bar · elapsed side by side
   across whatever width was going spare. A 216px rail has no spare width, so
   the phase takes its own line and the meter and the clock share the one
   under it. Same three facts, same order, turned ninety degrees. */
export function LiveRun({ t }) {
  const { status } = useRunStatus()
  const live = status.activeRunId != null || status.loading
  if (!live) return null

  const hasPercent = typeof status.percent === 'number' && Number.isFinite(status.percent)

  return (
    <div className="min-w-0" style={{ padding: '10px 11px' }}>
      <span className="st st--run truncate" style={{ maxInlineSize: '100%' }}>
        {status.phase || t('generating')}
      </span>
      {(hasPercent || Number.isFinite(status.elapsedMs)) && (
        <div className="flex items-center gap-2" style={{ marginBlockStart: 8 }}>
          {hasPercent && (
            <div className="bar" style={{ flex: 1 }} aria-hidden="true">
              <i className="bar__fill" style={{ inlineSize: `${Math.round(status.percent * 100)}%` }} />
            </div>
          )}
          {Number.isFinite(status.elapsedMs) && (
            <Duration ms={status.elapsedMs} style={{ color: 'var(--ink-3)', fontSize: 12 }} />
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   THE PROJECT SWITCHER

   NO PROJECT OPEN → nothing at all. See the note at the early return.
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
export function ProjectSwitcher({ ar, t }) {
  const navigate = useNavigate()
  const { tx } = useChatText()
  const { addToast } = useToastStore()

  /* Selectors, not the whole store: `messages` is rewritten on every progress
     tick of a live run, and subscribing to it would re-render the rail
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
     unconditionally by the rail on every protected route, so the fetch runs
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

  /* NO PROJECT OPEN → NOTHING. This slot used to print the current route's
     name here, which said the same thing THREE times on one screen: the rail
     already marks the destination you are on, and the page already carries it
     as its own <h1>. Worse, it was a dead label sitting in the position of a
     control — the switcher's own place — so it read as something you could
     press, and nothing happened when you did.

     This slot names WHAT YOU ARE WORKING ON, which is a project. When no
     project is open there is nothing to name and nothing to switch, so it
     renders nothing and the rail closes up around it.

     ⚠ THE MENU BELOW IS 300px WIDE INSIDE A 216px RAIL, ON PURPOSE. It escapes
     because `.rail` is `overflow: visible` and only its nav list scrolls —
     see the note on .rail in index.css. If anyone ever puts `overflow` back on
     the rail itself, this menu gets guillotined at the rail's inner edge and
     the rename and delete controls become unreachable. */
  if (!hasProject) return null

  return (
    <div className="rail__project relative min-w-0" ref={rootRef}>
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
        /* 100%, not a 260px cap: this used to sit in a bar with width to
           spare and now sits in a 216px column. */
        style={{ maxInlineSize: '100%', fontSize: 14, fontWeight: 600 }}
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
          /* OPENS UPWARD. In the top bar this dropped DOWN from a control at
             the top of the window. The switcher now sits near the FLOOR of the
             rail, just above the account, so a downward menu would run off the
             bottom of the viewport and be clipped by the shell's
             overflow-hidden — the list is capped at 300px plus a search field
             and a footer, which is far more than the room left below it. */
          style={{ insetBlockEnd: 'calc(100% + 6px)', insetInlineStart: 0, inlineSize: 300, maxInlineSize: '86vw', padding: 8 }}
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

/* ── THE BRAND, ALONE AT THE TOP OF THE RAIL ──────────────────────────────
   Its own zone with a rule under it, and nothing else in it. The identity is
   not a row item competing with the destinations; it sits above them and is
   separated from them, which is the whole reason the reference layout reads as
   composed rather than as a list with a logo stuck on the front. */
export function RailBrand() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="rail__brand"
      aria-label="مِخيال"
    >
      <Mark size={20} />
      <span style={{ fontWeight: 600, fontSize: 17 }}>مِخيال</span>
    </button>
  )
}

/* ── WHAT YOU HAVE, AND WHAT THIS SESSION HAS COST ───────────────────────
   Both are figures about money, so they sit together as one block rather than
   at opposite ends of a bar the way they used to. Each still appears only when
   it has something to say. */
export function RailLedger({ ar, t }) {
  const navigate = useNavigate()
  const { status } = useRunStatus()
  const { credits, loading: creditsLoading } = useCredits()

  const showCost = status.sessionCostUsd > 0
  if (!CREDITS_ENABLED && !showCost) return null

  return (
    <div style={{ padding: '10px 11px' }}>
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
          className="flex w-full items-baseline justify-between gap-2"
          title={ar ? 'الرصيد' : 'Balance'}
        >
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{ar ? 'رصيد' : 'Credits'}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {creditsLoading || credits == null
              ? <span className="skel" style={{ display: 'inline-block', inlineSize: 40, blockSize: 12 }} />
              : <span className="mono">{credits.toLocaleString('en-US')}</span>}
          </span>
        </button>
      )}

      {/* Session spend. Shown only once something has actually been spent, so
          an idle rail carries no figure it does not need. */}
      {showCost && (
        <div
          className="flex items-baseline justify-between gap-2"
          style={{ marginBlockStart: CREDITS_ENABLED ? 7 : 0 }}
        >
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('cost')}</span>
          <Money usd={status.sessionCostUsd} style={{ color: 'var(--ink)', fontSize: 13 }} />
        </div>
      )}
    </div>
  )
}

/* ── WHO YOU ARE — PINNED TO THE BOTTOM EDGE ──────────────────────────────
   In the bar this was a bare 32px avatar at the far end, because a bar has no
   room to name anyone. The rail does, so the account states the name it stands
   for instead of making you hover a circle of initials to find out.

   THE MENU OPENS UPWARD. It is anchored to the bottom of the window, so a
   downward menu would open straight off the screen. */
export function AccountMenu({ onLogout }) {
  const { darkMode, setDarkMode, language, setLanguage, apiConnected, t } = useUIStore()
  const { user } = useAuthStore()
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

  const initials = (user?.name || user?.email || '?').trim().slice(0, 2).toUpperCase()
  const displayName = (user?.name || '').trim() || user?.email || (ar ? 'الحساب' : 'Account')

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title={user?.email}
        className="rail__account"
      >
        <span className="rail__avatar" aria-hidden="true">
          {initials === '?' ? <Account size={15} /> : initials}
        </span>
        <bdi className="truncate min-w-0" style={{ fontSize: 13, fontWeight: 500 }}>{displayName}</bdi>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute card overlay-cast settle z-overlay"
          /* insetBlockEnd, not insetBlockStart: it grows up off the bottom. */
          style={{ insetBlockEnd: 'calc(100% + 6px)', insetInlineStart: 0, inlineSize: 248, maxInlineSize: '86vw', padding: 8 }}
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
  )
}

/* ── THE HANDHELD BAR ─────────────────────────────────────────────────────
   BELOW 1024px ONLY. On a desktop there is no bar of any kind — the rail is
   permanently in flow and carries everything. On a phone the rail is a drawer
   over the page, and a drawer needs something to open it, so this strip exists
   for exactly one reason: to hold that control.

   It carries the mark as well, because a phone screen with the rail closed
   would otherwise show no identity at all. Nothing else goes in here. If a
   third thing ever wants a place in this strip, it wants the rail. */
export default function MobileBar({ onToggleRail }) {
  const navigate = useNavigate()
  const { sidebarOpen, language } = useUIStore()
  const ar = language === 'ar'
  const label = sidebarOpen
    ? (ar ? 'إخفاء التنقل' : 'Hide navigation')
    : (ar ? 'إظهار التنقل' : 'Show navigation')

  return (
    <header className="topbar safe-inset lg:hidden">
      <button
        type="button"
        className="btn-i"
        onClick={onToggleRail}
        aria-expanded={sidebarOpen}
        aria-controls="wz-rail"
        aria-label={label}
        title={label}
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
        <span>مِخيال</span>
      </button>
    </header>
  )
}
