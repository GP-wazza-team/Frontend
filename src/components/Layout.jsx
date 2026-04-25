import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import ToastContainer from './ToastContainer'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { dashboardService } from '../services/dashboardService'
import { authService } from '../services/authService'
import { Settings, Sun, Moon, Zap, PanelLeft } from 'lucide-react'

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen, setApiConnected, darkMode, setDarkMode } = useUIStore()
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
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar onLogout={handleLogout} />
      <ToastContainer />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'ml-0' : ''}`}>
        {/* Top Header */}
        <header className="h-12 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              title="Toggle sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <Zap size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>WAZZA</span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: location.pathname === '/settings' ? 'var(--accent)' : 'var(--text-tertiary)' }}
              onMouseEnter={(e) => { if (location.pathname !== '/settings') e.currentTarget.style.color = 'var(--text-secondary)' }}
              onMouseLeave={(e) => { if (location.pathname !== '/settings') e.currentTarget.style.color = 'var(--text-tertiary)' }}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
