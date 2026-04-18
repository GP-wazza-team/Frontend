import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
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
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('settings')}</h1>
        <p className="text-gray-400">Configure your platform preferences</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('language')}</h3>
        <div className="space-y-3">
          <button
            onClick={() => setLanguage('ar')}
            className={`w-full px-4 py-3 rounded-lg border transition-colors text-left ${
              language === 'ar'
                ? 'border-[#6c63ff] bg-[#6c63ff]/10'
                : 'border-[#2a2a3e] hover:border-[#6c63ff]'
            }`}
          >
            <p className="font-medium">العربية</p>
            <p className="text-sm text-gray-400">Arabic (RTL)</p>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`w-full px-4 py-3 rounded-lg border transition-colors text-left ${
              language === 'en'
                ? 'border-[#6c63ff] bg-[#6c63ff]/10'
                : 'border-[#2a2a3e] hover:border-[#6c63ff]'
            }`}
          >
            <p className="font-medium">English</p>
            <p className="text-sm text-gray-400">English (LTR)</p>
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('apiStatus')}</h3>

        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            apiConnected
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-red-500/30 bg-red-500/10'
          }`}
        >
          {apiConnected ? (
            <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div>
            <p className="font-medium">
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
          className="mt-4 btn-secondary"
        >
          Refresh Status
        </button>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">About</h3>
        <div className="space-y-2 text-gray-400 text-sm">
          <p>WAZZA AI Platform v1.0.0</p>
          <p>React + Vite frontend</p>
          <p>FastAPI backend</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
