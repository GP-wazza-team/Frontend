import React from 'react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { Globe, Moon, Sun, LogOut, Server } from 'lucide-react'

function SettingsPage() {
  const { darkMode, setDarkMode, language, setLanguage, t, apiConnected } = useUIStore()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="p-8 animate-slideUp">
      <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>{t('settings')}</h1>

      <div className="max-w-2xl space-y-4">
        {/* Appearance */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Moon size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDarkMode(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: !darkMode ? 'var(--accent)' : 'var(--bg-surface)',
                color: !darkMode ? 'white' : 'var(--text-secondary)',
                border: !darkMode ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              <Sun size={15} /> Light
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: darkMode ? 'var(--accent)' : 'var(--bg-surface)',
                color: darkMode ? 'white' : 'var(--text-secondary)',
                border: darkMode ? '1px solid var(--accent)' : '1px solid var(--border)'
              }}
            >
              <Moon size={15} /> Dark
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('language')}</h3>
          </div>
          <div className="flex gap-2">
            {['ar', 'en'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: language === lang ? 'var(--accent)' : 'var(--bg-surface)',
                  color: language === lang ? 'white' : 'var(--text-secondary)',
                  border: language === lang ? '1px solid var(--accent)' : '1px solid var(--border)'
                }}
              >
                {lang === 'ar' ? 'العربية' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* API Status */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Server size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('apiStatus')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {apiConnected ? t('apiConnected') : t('apiDisconnected')}
            </span>
          </div>
        </div>

        {/* Account */}
        {user && (
          <div className="surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <LogOut size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('account')}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                <LogOut size={14} /> {t('logout')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettingsPage
