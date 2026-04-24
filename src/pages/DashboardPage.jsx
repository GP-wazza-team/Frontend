import React, { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import StatsCards from '../components/dashboard/StatsCards'
import CostChart from '../components/dashboard/CostChart'
import ProviderChart from '../components/dashboard/ProviderChart'
import RecentRuns from '../components/dashboard/RecentRuns'
import { useUIStore } from '../store/uiStore'
import { BarChart3 } from 'lucide-react'

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [costHistory, setCostHistory] = useState([])
  const [providerUsage, setProviderUsage] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useUIStore()

  useEffect(() => {
    loadDashboard()
  }, [])

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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm font-medium">{t('loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-slideUp">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
          <BarChart3 className="text-orange-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
          <p className="text-gray-400 text-sm">Monitor your AI generation activity and costs</p>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostChart data={costHistory} />
        <ProviderChart data={providerUsage} />
      </div>

      <RecentRuns runs={recentRuns} />
    </div>
  )
}

export default DashboardPage
