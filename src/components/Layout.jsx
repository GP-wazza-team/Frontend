/* ═══════════════════════════════════════════════════════════════════════════
   THE SHELL — ONE COLUMN OF CHROME, AND NOTHING ELSE.

   DESKTOP (≥1024px)                    HANDHELD (<1024px)
     ┌──────────────┬─────────────┐       ┌───────────────────┐
     │              │  ▣ مِخيال    │       │ ☰   ▣ مِخيال       │  56px, and it
     │              ├─────────────┤       ├───────────────────┤  exists ONLY to
     │   <main>     │  nav        │       │                   │  hold ☰. The
     │   the work   │  project    │       │      <main>       │  rail is a
     │              │             │       │                   │  drawer over
     │              ├─────────────┤       │                   │  the page.
     │              │  account    │       │                   │
     └──────────────┴─────────────┘       └───────────────────┘
        NO BAR OF ANY KIND

   WHAT THIS REPLACES. First a 56px icon spine + a 240px panel + a 36px status
   bar — three tiers that said nothing. Then a top bar + a rail — two tiers,
   which is one too many: the bar and the rail were both chrome, both
   persistent, and they competed for the same jobs. Now there is one.

   ⚠ HEIGHT: nothing here may reintroduce a viewport calc. <main> is a grid
   child that owns its own scrolling, so children use h-full, never
   calc(100vh - <a number>). Three files used to hardcode that against a header
   height and broke every time it changed. The handheld bar makes this WORSE,
   not better, because it exists at one breakpoint only — a calc against it is
   wrong above 1024px by exactly 56px.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import MobileBar from './Chrome'
import ToastContainer from './ToastContainer'
import { RunStatusProvider } from './RunStatusContext'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { dashboardService } from '../services/dashboardService'
import { authService } from '../services/authService'

function Layout() {
  const { setApiConnected, sidebarOpen, setSidebarOpen, language } = useUIStore()
  const { refreshToken, logout } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await dashboardService.checkHealth()
        setApiConnected(true)
      } catch (error) {
        setApiConnected(false)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [setApiConnected])

  /* The rail is a drawer below 900px. Navigating must close it, or the page
     you just chose renders underneath a panel still covering it. */
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch (_) {}
    logout()
    window.location.href = '/login'
  }

  return (
    <RunStatusProvider>
      {/* h-shell, not h-screen: Safari's 100vh is the height WITHOUT the URL
          bar, so a 100vh shell hides its own bottom row — here, the chat
          composer — behind the browser chrome until you scroll. */}
      <div className="flex flex-col h-shell overflow-hidden" style={{ backgroundColor: 'var(--page)' }}>
        <MobileBar onToggleRail={() => setSidebarOpen(!sidebarOpen)} />
        <ToastContainer />

        {/* `sidebarOpen` now drives the HANDHELD DRAWER ONLY (.rail--open).
            The desktop collapse it also used to drive is gone: the control
            that reversed it lived in the top bar, and `sidebarOpen` is
            persisted — so a rail closed on a desktop yesterday would come back
            closed today with nothing anywhere on the screen able to reopen it.
            Above 1024px the rail is simply always there. */}
        <div className="shell flex-1 min-h-0">
          <Sidebar onLogout={handleLogout} />

          {/* The drawer scrim. Only below 900px, where the rail overlays the
              page — above that the rail is in flow and a full-screen button
              over the app would be a bug. */}
          {sidebarOpen && (
            <button
              type="button"
              className="scrim scrim--below-bar lg:hidden"
              aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className="min-w-0 min-h-0 overflow-auto safe-inset">
            <Outlet />
          </main>
        </div>
      </div>
    </RunStatusProvider>
  )
}

export default Layout
