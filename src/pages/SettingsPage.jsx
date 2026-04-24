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
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
          <Settings className="text-violet-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('settings')}</h1>
          <p className="text-gray-400 text-sm">Configure your platform preferences</p>
        </div>
      </div>

      {/* Language */}
      <div className="card-light p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-orange-50">
            <Globe size={18} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('language')}</h3>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setLanguage('ar')}
            className={`w-full px-5 py-4 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
              language === 'ar'
                ? 'border-orange-300 bg-orange-50 shadow-sm'
                : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              language === 'ar' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}>
              ع
            </div>
            <div>
              <p className="font-semibold text-slate-900">العربية</p>
              <p className="text-sm text-gray-400">Arabic (RTL)</p>
            </div>
            {language === 'ar' && (
              <CheckCircle size={20} className="text-orange-500 ltr:ml-auto rtl:mr-auto" />
            )}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`w-full px-5 py-4 rounded-xl border transition-all duration-200 text-left flex items-center gap-4 ${
              language === 'en'
                ? 'border-orange-300 bg-orange-50 shadow-sm'
                : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
              language === 'en' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
            }`}>
              A
            </div>
            <div>
              <p className="font-semibold text-slate-900">English</p>
              <p className="text-sm text-gray-400">English (LTR)</p>
            </div>
            {language === 'en' && (
              <CheckCircle size={20} className="text-orange-500 ltr:ml-auto rtl:mr-auto" />
            )}
          </button>
        </div>
      </div>

      {/* API Status */}
      <div className="card-light p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-emerald-50">
            <Server size={18} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t('apiStatus')}</h3>
        </div>

        <div
          className={`p-5 rounded-xl border flex items-start gap-4 ${
            apiConnected
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-rose-200 bg-rose-50/50'
          }`}
        >
          {apiConnected ? (
            <CheckCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={22} />
          ) : (
            <AlertCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={22} />
          )}
          <div>
            <p className="font-semibold text-slate-900">
              {apiConnected ? t('connected') : t('disconnected')}
            </p>
            {health?.message && <p className="text-sm text-gray-400 mt-1">{health.message}</p>}
            {health?.version && (
              <p className="text-sm text-gray-400 mt-1">Version: {health.version}</p>
            )}
          </div>
        </div>

        <button
          onClick={checkApiHealth}
          className="mt-4 btn-secondary-light text-sm"
        >
          Refresh Status
        </button>
      </div>

      {/* About */}
      <div className="card-light p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-xl bg-sky-50">
            <Info size={18} className="text-sky-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">About</h3>
        </div>
        <div className="space-y-3 text-gray-400 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <p>WAZZA AI Platform v1.0.0</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
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
