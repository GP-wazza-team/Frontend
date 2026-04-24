import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, MessageSquare, BarChart3, Image, Settings, Globe, LogOut, Coins } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen, language, setLanguage, apiConnected, t } = useUIStore()
  const { user, refreshToken, logout } = useAuthStore()
  const isAr = language === 'ar'

  const menuItems = [
    { path: '/', icon: MessageSquare, label: t('chat') },
    { path: '/dashboard', icon: BarChart3, label: t('dashboard') },
    { path: '/assets', icon: Image, label: t('assets') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken)
    } catch (_) {}
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 ltr:left-4 rtl:right-4 z-50 p-2 rounded-lg bg-[#1a1a2e] hover:bg-[#2a2a3e] transition-colors md:hidden"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed md:relative h-screen w-64 bg-[#1a1a2e] border-r border-[#2a2a3e] p-6 flex flex-col transition-all duration-300 z-40
          ${sidebarOpen ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-64 rtl:-right-64 md:ltr:left-0 md:rtl:right-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <Globe className="text-[#6c63ff]" size={28} />
          <h1 className="text-xl font-bold text-white">WAZZA</h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#6c63ff] text-white'
                    : 'text-gray-300 hover:bg-[#2a2a3e]'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="space-y-3 border-t border-[#2a2a3e] pt-4">
          {/* User info */}
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0f0f0f]">
              <div className="w-8 h-8 rounded-full bg-[#6c63ff] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-gray-500 text-xs truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Tester badge */}
          {user?.role === 'tester' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 text-xs font-medium">
                {isAr ? 'حساب تجريبي' : 'Tester account'}
              </span>
            </div>
          )}

          {/* Credits (only for regular users) */}
          {user?.role === 'user' && (
            <Link
              to="/settings"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0f0f0f] hover:bg-[#2a2a3e] transition-colors text-sm"
            >
              <Coins size={14} className="text-[#6c63ff]" />
              <span className="text-gray-300">
                {isAr ? 'الرصيد' : 'Credits'}
              </span>
            </Link>
          )}

          {/* Language */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f0f] hover:bg-[#2a2a3e] transition-colors text-sm text-gray-300"
          >
            <Globe size={16} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* API status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f0f] text-sm">
            <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={apiConnected ? 'text-green-400' : 'text-red-400'}>
              {apiConnected ? t('connected') : t('disconnected')}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm text-gray-400"
          >
            <LogOut size={16} />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
