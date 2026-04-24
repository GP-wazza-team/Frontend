import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, Settings, Globe, Server, Info } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { dashboardService } from '../services/dashboardService'

function SettingsPage() {
  const { language, setLanguage, apiConnected, t } = useUIStore()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    checkApiHealth()
    const interval = setInterval(checkApiHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkApiHealth = async () => {
    try {
      const data = await dashboardService.checkHealth()
      setHealth(data)
    } catch (error) {
      setHealth({ status: 'error', message: error.message })
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto animate-slideUp">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 border border-violet-500/20 flex items-center justify-center">
          <Settings className="text-violet-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>
          <p className="text-white/30 text-sm">Configure your platform preferences</p>
        </div>
      </div>

      {/* Language */}
      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Globe size={18} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{t('language')}</h3>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setLanguage('ar')}
            className={`w-full px-5 py-4 rounded-xl border transition-all duration-300 text-left flex items-center gap-4 ${
              language === 'ar'
                ? 'border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                : 'border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.03]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              language === 'ar' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.04] text-white/30'
            }`}>
              ع
            </div>
            <div>
              <p className="font-medium text-white">العربية</p>
              <p className="text-sm text-white/30">Arabic (RTL)</p>
            </div>
            {language === 'ar' && (
              <CheckCircle size={20} className="text-violet-400 ltr:ml-auto rtl:mr-auto" />
            )}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`w-full px-5 py-4 rounded-xl border transition-all duration-300 text-left flex items-center gap-4 ${
              language === 'en'
                ? 'border-violet-500/40 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                : 'border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.03]'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              language === 'en' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.04] text-white/30'
            }`}>
              A
            </div>
            <div>
              <p className="font-medium text-white">English</p>
              <p className="text-sm text-white/30">English (LTR)</p>
            </div>
            {language === 'en' && (
              <CheckCircle size={20} className="text-violet-400 ltr:ml-auto rtl:mr-auto" />
            )}
          </button>
        </div>
      </div>

      {/* API Status */}
      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Server size={18} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">{t('apiStatus')}</h3>
        </div>

        <div
          className={`p-5 rounded-xl border flex items-start gap-4 ${
            apiConnected
              ? 'border-emerald-500/20 bg-emerald-500/5'
              : 'border-rose-500/20 bg-rose-500/5'
          }`}
        >
          {apiConnected ? (
            <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={22} />
          ) : (
            <AlertCircle className="text-rose-400 flex-shrink-0 mt-0.5" size={22} />
          )}
          <div>
            <p className="font-medium text-white">
              {apiConnected ? t('connected') : t('disconnected')}
            </p>
            {health?.message && <p className="text-sm text-white/30 mt-1">{health.message}</p>}
            {health?.version && (
              <p className="text-sm text-white/30 mt-1">Version: {health.version}</p>
            )}
          </div>
        </div>

        <button
          onClick={checkApiHealth}
          className="mt-4 btn-outline text-sm"
        >
          Refresh Status
        </button>
      </div>

      {/* About */}
      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Info size={18} className="text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">About</h3>
        </div>
        <div className="space-y-3 text-white/30 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <p>WAZZA AI Platform v1.0.0</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <p>React + Vite frontend</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p>FastAPI backend</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
