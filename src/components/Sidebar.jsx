/* ═══════════════════════════════════════════════════════════════════════════
   THE RAIL — AND IT IS NOW THE ONLY CHROME.

   There is no top bar. On a desktop screen this column is the entire frame
   around the work, running the full height of the window:

     ┌─────────────┐
     │  ▣  مِخيال   │   THE IDENTITY, alone, in its own zone with a rule under
     ├─────────────┤   it. Not a row item competing with the destinations.
     │ مساحة العمل  │
     │ لوحة التحكم  │   WHERE YOU ARE. The destinations, one marked current.
     │ المكتبة      │
     │ الإعدادات    │
     ├─────────────┤
     │ project ▾   │   WHAT YOU ARE WORKING ON, and where you switch it.
     │             │
     │     ⋯       │   ← the gap. The bottom block is pinned, not floated up.
     │ ● run…      │   WHAT IS HAPPENING (only while a run is live).
     │ rصيد   1,240│   WHAT IT COSTS (only when there is something to say).
     ├─────────────┤
     │ ● عبدالمجيد  │   WHO YOU ARE, on the bottom edge. Menu opens upward.
     └─────────────┘

   WHY THE PROJECT LIST IS BACK HERE. An earlier pass moved it OUT of the rail
   and into the top bar, on the argument that the rail answers "where you are"
   and a bar answers "what you are working on" — two questions, two controls.
   That argument was right about the questions and is now moot about the
   housing: there is no bar to put the second control in. So both live here,
   and the separation is made the way it should have been made in the first
   place — by ZONE, not by furniture. Destinations sit in the nav under the
   brand; the project switcher sits below them, apart, with its own control
   affordance. Nothing about its behaviour changed; see Chrome.jsx.

   ⚠ SCROLLING BELONGS TO THE NAV, NOT TO THE RAIL. `.rail` is overflow:visible
   so the project menu and the account menu can escape a 216px column. Only
   `.rail__scroll` scrolls. Putting `overflow` back on `.rail` clips both
   menus at its inner edge — see the warning in Chrome.jsx and .rail in
   index.css.

   COLLAPSING. `sidebarOpen` drives the DRAWER below 1024px and nothing else.
   Above 1024px the rail is permanent, exactly as in the reference layout, and
   there is deliberately no desktop collapse: the control that reversed it
   lived in the top bar, and a persisted "closed" with nothing to reopen it
   would strand a user with no navigation at all.
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { Chat, Ledger, Library, Admin, Settings } from './Icon'
import { RailBrand, ProjectSwitcher, LiveRun, RailLedger, AccountMenu } from './Chrome'

function Sidebar({ onLogout }) {
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
      className={`rail${sidebarOpen ? ' rail--open' : ''}`}
      aria-label={ar ? 'التنقل' : 'Primary'}
    >
      <RailBrand />

      {/* THE ONLY SCROLLING REGION, and it holds the destinations and nothing
          else. A long list scrolls inside this box; the brand above and
          everything below stay put. Nothing with a popover may be placed in
          here — this element clips on both axes. */}
      <div className="rail__scroll">
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
      </div>

      {/* Apart from the destinations and below them, because switching a
          project is not the same act as going somewhere. OUTSIDE the scroller
          because its menu is 300px and has to spill out over <main>. Renders
          nothing at all when no project is open, and its rule goes with it. */}
      <ProjectSwitcher ar={ar} t={t} />

      {/* THE BOTTOM BLOCK, on the floor of the rail. It gets there because
          .rail__scroll takes flex: 1 and eats the slack — there is no spacer
          element, the gap is simply the absence of content. */}
      <div className="rail__foot">
        <LiveRun t={t} />
        <RailLedger ar={ar} t={t} />
        <AccountMenu onLogout={onLogout} />
      </div>
    </aside>
  )
}

export default Sidebar
