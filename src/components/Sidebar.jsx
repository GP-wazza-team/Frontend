import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, MessageSquare, BarChart3, Image, Settings, Globe, Moon } from 'lucide-react'
import { useUIStore } from '../store/uiStore'

function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen, language, setLanguage, apiConnected, t } = useUIStore()

  const menuItems = [
    { path: '/', icon: MessageSquare, label: t('chat') },
    { path: '/dashboard', icon: BarChart3, label: t('dashboard') },
    { path: '/assets', icon: Image, label: t('assets') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ]

  const isActive = (path) => location.pathname === path

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
        <div className="flex items-center gap-2 mb-8">
          <Globe className="text-[#6c63ff]" size={28} />
          <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
            WAZZA
          </h1>
        </div>

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

        <div className="space-y-3 border-t border-[#2a2a3e] pt-4">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f0f] hover:bg-[#2a2a3e] transition-colors text-sm"
          >
            <Globe size={16} />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f0f0f] text-sm">
            <Moon size={16} />
            <span className={apiConnected ? 'text-green-400' : 'text-red-400'}>
              {apiConnected ? t('connected') : t('disconnected')}
            </span>
          </div>
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
