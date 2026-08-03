/* ═══════════════════════════════════════════════════════════════════════════
   THE SHELL

     ┌────────────────────────────────────────────────────────────────────────┐
     │  TOP BAR  56px   mark · page · live run ···· [ACTION] balance account  │
     ├──────────────┬─────────────────────────────────────────────────────────┤
     │              │                                                         │
     │  RAIL 216px  │  <main>  the work                                       │
     │  labelled    │                                                         │
     │              │                                                         │
     └──────────────┴─────────────────────────────────────────────────────────┘

   LEFT RAIL = WHERE YOU ARE. CENTRE = THE THING. Selection properties belong
   in a panel the route owns, never in the rail; navigation never appears in a
   properties panel. Every reference product in this register obeys that split
   and it is the rule that keeps the shell legible.

   WHAT THIS REPLACES. A 56px icon-only spine of unlabelled hand-drawn marks,
   plus a 240px panel that had to force itself open on arrival because it was
   the only home for a route's controls, plus a 36px status bar. Three tiers of
   chrome, none of which said a word. Now: one bar that names things, one rail
   that names destinations.

   ⚠ HEIGHT: nothing here may reintroduce a viewport calc. <main> is a grid
   child that owns its own scrolling, so children use h-full, never
   calc(100vh - <a number>). Three files used to hardcode that against a header
   height and broke every time it changed.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
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
        <TopBar onLogout={handleLogout} onToggleRail={() => setSidebarOpen(!sidebarOpen)} />
        <ToastContainer />

        {/* `sidebarOpen` drives BOTH tiers of this now: the drawer below
            1024px (.rail--open) and a real collapse above it
            (.shell--rail-closed). Principle 1 — panels collapse, there is a
            path to media-only — was only honoured on a handheld before, so a
            desktop user could not put the chrome away at all. The toggle that
            reverses it lives in the top bar and is visible at every width,
            which matters because `sidebarOpen` is persisted: a rail closed
            yesterday must be recoverable today. */}
        <div className={`shell flex-1 min-h-0${sidebarOpen ? '' : ' shell--rail-closed'}`}>
          <Sidebar />

          {/* The drawer scrim. Only below 900px, where the rail overlays the
              page — above that the rail is in flow and a full-screen button
              over the app would be a bug. */}
          {sidebarOpen && (
            <button
              type="button"
              className="scrim lg:hidden"
              aria-label={language === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
              onClick={() => setSidebarOpen(false)}
              style={{ insetBlockStart: 'var(--topbar)' }}
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
