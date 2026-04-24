import React, { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import StatsCards from '../components/dashboard/StatsCards'
import CostChart from '../components/dashboard/CostChart'
import ProviderChart from '../components/dashboard/ProviderChart'
import RecentRuns from '../components/dashboard/RecentRuns'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [costHistory, setCostHistory] = useState([])
  const [providerUsage, setProviderUsage] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useUIStore()
  const { user } = useAuthStore()

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [statsData, costData, providerData, runsData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getCostHistory(30),
        dashboardService.getProviderUsage(),
        dashboardService.getRecentRuns(10),
      ])
      setStats(statsData)
      setCostHistory(Array.isArray(costData) ? costData : [])
      setProviderUsage(Array.isArray(providerData) ? providerData : [])
      setRecentRuns(Array.isArray(runsData) ? runsData : [])
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto animate-slideUp">
      <div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Here's what's happening with your AI generation activity.</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CostChart data={costHistory} />
        </div>
        <div>
          <ProviderChart data={providerUsage} />
        </div>
      </div>

      <RecentRuns runs={recentRuns} />
    </div>
  )
}

export default DashboardPage
