import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, MessageSquare, BarChart3, Image, Settings, Globe, LogOut, Coins, Sparkles } from 'lucide-react'
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
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 ltr:left-4 rtl:right-4 z-50 p-2.5 rounded-xl glass hover:bg-white/10 transition-all md:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative h-screen w-64 flex flex-col transition-all duration-500 ease-out z-40
          ${sidebarOpen ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-64 rtl:-right-64 md:ltr:left-0 md:rtl:right-0'}
        `}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl border-r border-white/[0.06]" />

        <div className="relative flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="gradient-text">WAZZA</span>
            </h1>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${
                    active
                      ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <Icon size={18} className={`transition-colors ${active ? 'text-violet-400' : 'group-hover:text-violet-400'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {active && (
                    <div className="ltr:ml-auto rtl:mr-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-500/50" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-violet-500/20">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.name}</p>
                  <p className="text-white/30 text-xs truncate">{user.email}</p>
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

            {/* Credits */}
            {user?.role === 'user' && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-sm"
              >
                <Coins size={14} className="text-violet-400" />
                <span className="text-white/50">
                  {isAr ? 'الرصيد' : 'Credits'}
                </span>
              </Link>
            )}

            {/* Language */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-sm text-white/50"
            >
              <Globe size={16} />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* API status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm">
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-rose-400 shadow-lg shadow-rose-500/50'}`} />
              <span className={apiConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {apiConnected ? t('connected') : t('disconnected')}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 transition-all text-sm text-white/40"
            >
              <LogOut size={16} />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
