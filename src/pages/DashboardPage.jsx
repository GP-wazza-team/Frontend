import React, { useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import StatsCards from '../components/dashboard/StatsCards'
import CostChart from '../components/dashboard/CostChart'
import ProviderChart from '../components/dashboard/ProviderChart'
import RecentRuns from '../components/dashboard/RecentRuns'
import { useUIStore } from '../store/uiStore'

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
      // all three return flat arrays directly
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
        <span className="text-gray-400">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('dashboard')}</h1>
        <p className="text-gray-400">Monitor your AI generation activity and costs</p>
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
