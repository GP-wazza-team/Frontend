/* ═══════════════════════════════════════════════════════════════════════════
   THE SHELL

     ┌──────┬────────────────────────────────────────────────────────────────┐
     │      │  STATUS BAR   36px                                             │
     │ RAIL ├────────────────────────────────────────────────────────────────┤
     │ 56 + │                                                                │
     │ 240  │  <main>  the mat — --paper, scrolls, min-h-0                    │
     │      │            pages render <div className="wz-page"> inside it     │
     └──────┴────────────────────────────────────────────────────────────────┘

   THE STATUS BAR replaces the old 48px header. It is 36px, and it carries the
   machine's state and its cost permanently, instead of leaving them inside a
   chat message that scrolls away.

     inline-start  the panel toggle · then either the live run (shape marker ·
                   phase legend · 5-cell meter · elapsed) or, when nothing is
                   running, the page name as a plain 13px line. There is no h1
                   in display type on a working screen, ever.
     inline-end    session spend · API link state · theme rocker · language
                   rocker.

   ⚠ HEIGHT: three files used to hardcode `calc(100vh-48px)` against the old
   header. The header is now 36px, and the fix is NOT a new magic number —
   <main> is a flex child with min-h-0, so children can simply use `h-full`.
   Pages must not reintroduce a viewport calc.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ToastContainer from './ToastContainer'
import { RunStatusProvider, useRunStatus } from './RunStatusContext'
import Meter from './ui/Meter'
import Rocker from './ui/Rocker'
import { Money, Duration } from './ui/Money'
import { Fold, ShapeRun, ShapeDone, ShapeFail } from './Icon'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { dashboardService } from '../services/dashboardService'
import { authService } from '../services/authService'

function StatusBar() {
  const location = useLocation()
  const {
    sidebarOpen, setSidebarOpen,
    darkMode, setDarkMode,
    language, setLanguage,
    apiConnected, t,
  } = useUIStore()
  const { status } = useRunStatus()

  const ar = language === 'ar'
  const pageName = {
    '/': t('chat'),
    '/dashboard': t('dashboard'),
    '/assets': t('assets'),
    '/admin': ar ? 'الإدارة' : 'Admin',
    '/settings': t('settings'),
  }[location.pathname] || t('chat')

  const live = status.activeRunId != null || status.loading
  const hasPercent = typeof status.percent === 'number' && Number.isFinite(status.percent)

  return (
    <header
      className="flex items-center shrink-0 gap-4 z-statusbar"
      style={{
        blockSize: 'var(--statusbar)',
        paddingInline: 12,
        backgroundColor: 'var(--panel)',
        borderBlockEnd: '1px solid var(--etch)',
      }}
    >
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-action"
        style={{ padding: 4 }}
        aria-expanded={sidebarOpen}
        aria-label={ar ? 'إظهار اللوحة الجانبية' : 'Toggle panel'}
        title={ar ? 'إظهار اللوحة الجانبية' : 'Toggle panel'}
      >
        <Fold size={16} />
      </button>

      {/* inline-start cluster */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {live ? (
          <>
            <span className="marker marker--run">
              <ShapeRun size={10} />
              <span className="truncate">{status.phase || t('generating')}</span>
            </span>
            <Meter
              cells={5}
              value={hasPercent ? status.percent : 0}
              mode={hasPercent ? 'determinate' : 'indeterminate'}
              tone="signal"
              label={t('generating')}
            />
            {Number.isFinite(status.elapsedMs) && (
              <Duration ms={status.elapsedMs} style={{ color: 'var(--ink-2)', fontSize: 11 }} />
            )}
          </>
        ) : (
          <span className="truncate" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{pageName}</span>
        )}
      </div>

      {/* inline-end cluster.

          Cost and the API marker were already width-gated. The two rockers
          are gated here too: their word labels ("Light"/"Dark",
          "English"/"العربية") are the whole point of the control and make the
          pair ~220px of a 390pt bar, which leaves the run phase — the one
          thing on this bar that changes minute to minute — about 60px to
          report itself in.

          Nothing is lost by moving them off a phone: Settings carries the same
          two Rockers, bound to the same setters. */}
      <div className="flex items-center gap-4 shrink-0">
        {status.sessionCostUsd > 0 && (
          <span className="hidden sm:flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t('cost')}</span>
            <Money usd={status.sessionCostUsd} style={{ color: 'var(--ink)', fontSize: 12 }} />
          </span>
        )}

        <span
          className={`marker ${apiConnected ? 'marker--done' : 'marker--fail'} hidden md:inline-flex`}
          title={t('apiStatus')}
        >
          {apiConnected ? <ShapeDone size={10} /> : <ShapeFail size={10} />}
          <span>{apiConnected ? t('connected') : t('disconnected')}</span>
        </span>

        <span className="hidden sm:flex items-center gap-4">
          <Rocker
            ariaLabel={t('theme')}
            value={darkMode}
            onChange={setDarkMode}
            options={[
              { value: false, label: t('light') },
              { value: true, label: t('dark') },
            ]}
          />

          <Rocker
            ariaLabel={t('language')}
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: t('english') },
              { value: 'ar', label: t('arabic') },
            ]}
          />
        </span>
      </div>
    </header>
  )
}

function Layout() {
  const { setApiConnected, sidebarOpen, setSidebarOpen, language } = useUIStore()
  const { refreshToken, logout } = useAuthStore()

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
          bar, so a 100vh shell hides its own bottom row — here, the composer —
          behind the browser chrome until you scroll. .h-shell resolves to
          100dvh where it exists and falls back to 100vh where it does not. */}
      <div className="flex h-shell overflow-hidden safe-inset" style={{ backgroundColor: 'var(--paper)' }}>
        <Sidebar onLogout={handleLogout} />
        <ToastContainer />

        {/* Closes the rail panel when it is overlaying the page. Rendered only
            below 640px (the class is display:none above it), because at
            desktop widths the panel is in flow and nothing is covered. */}
        {sidebarOpen && (
          <button
            type="button"
            className="rail-scrim"
            aria-label={language === 'ar' ? 'إغلاق اللوحة' : 'Close panel'}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <StatusBar />
          <main className="flex-1 min-h-0 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </RunStatusProvider>
  )
}

export default Layout
