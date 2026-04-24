import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, MessageSquare, BarChart3, Image, Settings, Globe, LogOut, Coins, Zap } from 'lucide-react'
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
        className="fixed top-4 ltr:left-4 rtl:right-4 z-50 p-2.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all md:hidden"
      >
        {sidebarOpen ? <X size={20} className="text-slate-600" /> : <Menu size={20} className="text-slate-600" />}
      </button>

      <div
        className={`fixed md:relative h-screen w-64 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40
          ${sidebarOpen ? 'ltr:left-0 rtl:right-0' : 'ltr:-left-64 rtl:-right-64 md:ltr:left-0 md:rtl:right-0'}
        `}
      >
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Zap className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">WAZZA</h1>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                    active
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-orange-500' : ''} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ltr:ml-auto rtl:mr-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
            )}

            {user?.role === 'tester' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-amber-700 text-xs font-semibold">
                  {isAr ? 'حساب تجريبي' : 'Tester account'}
                </span>
              </div>
            )}

            {user?.role === 'user' && (
              <Link
                to="/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-slate-600"
              >
                <Coins size={14} className="text-orange-500" />
                <span className="font-medium">{isAr ? 'الرصيد' : 'Credits'}</span>
              </Link>
            )}

            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm text-slate-500 font-medium"
            >
              <Globe size={16} />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm">
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={`font-medium ${apiConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
                {apiConnected ? t('connected') : t('disconnected')}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all text-sm text-slate-400 font-medium"
            >
              <LogOut size={16} />
              <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
