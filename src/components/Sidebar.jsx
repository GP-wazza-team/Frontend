/* ═══════════════════════════════════════════════════════════════════════════
   THE RAIL — NAVIGATION, AND NOTHING ELSE.

   PRINCIPLE 11: LEFT RAIL = WHERE YOU ARE. The rail names the five
   destinations and marks the one you are on. That is its whole job.

   WHAT LEFT, AND WHERE IT WENT. This file used to be the only home for the
   conversation list — create, select, search, rename, delete. So opening a
   project from the workspace grid pushed a second copy of that project into
   the rail, and the rail stopped being "where you are" and started being "what
   you are working on" as well. Those are two different questions and they get
   two different controls.

   The list now lives in the TOP BAR, as a PROJECT SWITCHER on the open
   project's name — the pattern Frame.io (workspace switcher), YouTube Studio
   (channel switcher) and Google Cloud (project picker) all converge on: the
   rail is WHERE YOU ARE, the bar names WHAT YOU ARE WORKING ON and is where
   you switch it. Every handler moved verbatim; see TopBar.jsx.

   Also gone: the Tier-2 panel slot and the RailPanelPortal export. No route
   mounts into it any more — the pages hold their own controls — so the slot
   was a hidden div and the portal was dead code.

   COLLAPSING. `sidebarOpen` drives the drawer below 1024px (see .rail in
   index.css) AND a real collapse above it (see .shell--rail-closed). The
   toggle in the top bar is visible at every width, so a collapsed rail is
   always recoverable.
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { Chat, Ledger, Library, Admin, Settings } from './Icon'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen, language, t } = useUIStore()
  const { user } = useAuthStore()

  const ar = language === 'ar'
  const isAdmin = user?.is_admin || user?.role === 'admin'

  /* Admin has no translation key in the store today, and the store is frozen.
     Inline the pair, exactly as this file already inlined its other strings. */
  const adminLabel = ar ? 'الإدارة' : 'Admin'

  const destinations = [
    /* THE WORKSPACE, not "Chat". This route is where your projects live and
       where you pick one up again; the conversation is what happens inside a
       project, not the name of the place. */
    { to: '/', icon: Chat, label: ar ? 'مساحة العمل' : 'Workspace' },
    { to: '/dashboard', icon: Ledger, label: t('dashboard') },
    /* The page this opens is titled "المكتبة / Library"; the rail must not
       call the same destination something else. */
    { to: '/assets', icon: Library, label: ar ? 'المكتبة' : 'Library' },
    ...(isAdmin ? [{ to: '/admin', icon: Admin, label: adminLabel }] : []),
    { to: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <aside
      id="wz-rail"
      className={`rail flex flex-col${sidebarOpen ? ' rail--open' : ''}`}
      aria-label={ar ? 'التنقل' : 'Primary'}
    >
      <nav>
        {destinations.map((d) => (
          <button
            key={d.to}
            type="button"
            onClick={() => { navigate(d.to); if (window.innerWidth < 1024) setSidebarOpen(false) }}
            className="navlink"
            aria-current={location.pathname === d.to ? 'page' : undefined}
          >
            <d.icon size={16} />
            <span className="truncate">{d.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1" />
    </aside>
  )
}

export default Sidebar
