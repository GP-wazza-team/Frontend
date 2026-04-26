import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import AdminStatsCards from '../components/admin/AdminStatsCards'
import ModelCostBreakdown from '../components/admin/ModelCostBreakdown'
import DailyMetricsChart from '../components/admin/DailyMetricsChart'
import AdminRunsTable from '../components/admin/AdminRunsTable'
import RunDetailDrawer from '../components/admin/RunDetailDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToastStore } from '../store/toastStore'
import { Shield, RefreshCw, Calendar } from 'lucide-react'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useUIStore()
  const { addToast } = useToastStore()

  // Guard: redirect non-admins
  useEffect(() => {
    if (user && !user.is_admin && user?.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const [stats, setStats] = useState({})
  const [modelCosts, setModelCosts] = useState([])
  const [dailyMetrics, setDailyMetrics] = useState([])
  const [runs, setRuns] = useState([])
  const [runsTotal, setRunsTotal] = useState(0)
  const [runsPage, setRunsPage] = useState(1)
  const [runsFilters, setRunsFilters] = useState({})
  const [selectedRun, setSelectedRun] = useState(null)
  const [runDetail, setRunDetail] = useState(null)
  const [runToDelete, setRunToDelete] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState({
    stats: true,
    modelCosts: true,
    dailyMetrics: true,
    runs: true,
  })

  const loadAll = useCallback(async () => {
    setLoading({ stats: true, modelCosts: true, dailyMetrics: true, runs: true })
    try {
      const [statsData, modelData, dailyData, runsData] = await Promise.all([
        adminService.getStats(days),
        adminService.getModelCostBreakdown(days),
        adminService.getDailyMetrics(days),
        adminService.getRuns(runsPage, 25, runsFilters),
      ])
      setStats(statsData || {})
      setModelCosts(Array.isArray(modelData) ? modelData : [])
      setDailyMetrics(Array.isArray(dailyData) ? dailyData : [])
      setRuns(Array.isArray(runsData?.items) ? runsData.items : runsData?.runs || [])
      setRunsTotal(runsData?.total || 0)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
    } finally {
      setLoading({ stats: false, modelCosts: false, dailyMetrics: false, runs: false })
    }
  }, [days, runsPage, runsFilters])

  useEffect(() => {
    if (user?.is_admin || user?.role === 'admin') {
      loadAll()
    }
  }, [loadAll, user])

  const handleRunClick = async (run) => {
    setSelectedRun(run)
    try {
      const detail = await adminService.getRunDetail(run.id)
      setRunDetail(detail)
    } catch (err) {
      console.error('Failed to load run detail:', err)
      setRunDetail(run)
    }
  }

  const handleDelete = async () => {
    if (!runToDelete) return
    try {
      await adminService.deleteRun(runToDelete.id)
      setRuns((prev) => prev.filter((r) => r.id !== runToDelete.id))
      setRunsTotal((prev) => Math.max(0, prev - 1))
      addToast('Run deleted successfully', 'success')
    } catch (err) {
      console.error('Delete failed:', err)
      addToast('Failed to delete run', 'error')
    } finally {
      setRunToDelete(null)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await adminService.exportRuns(runsFilters)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `runs-export-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const dayOptions = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 },
  ]

  if (!user?.is_admin && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-48px)]">
        <div className="text-center">
          <Shield size={40} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-slideUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} style={{ color: 'var(--accent)' }} />
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Full system analytics and run inspection.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Day Range Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
            {dayOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className="px-3 py-1 rounded-md text-[12px] font-medium transition-all"
                style={{
                  backgroundColor: days === opt.value ? 'var(--accent)' : 'transparent',
                  color: days === opt.value ? 'white' : 'var(--text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={loadAll}
            className="p-2 rounded-lg transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyMetricsChart data={dailyMetrics} metric="cost" />
        <DailyMetricsChart data={dailyMetrics} metric="runs" />
      </div>

      {/* Model Cost Breakdown */}
      <ModelCostBreakdown data={modelCosts} totalCost={stats.total_cost_usd || 0} />

      {/* Runs Table */}
      <AdminRunsTable
        runs={runs}
        total={runsTotal}
        page={runsPage}
        limit={25}
        loading={loading.runs}
        onPageChange={(p) => setRunsPage(p)}
        onRunClick={handleRunClick}
        onDelete={(run) => setRunToDelete(run)}
        onExport={handleExport}
        filters={runsFilters}
        onFilterChange={(f) => { setRunsFilters(f); setRunsPage(1) }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!runToDelete}
        title="Delete Run"
        message={`Are you sure you want to delete Run #${runToDelete?.id}? This will remove the run record and associated analytics. Generated assets will NOT be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDelete}
        onCancel={() => setRunToDelete(null)}
      />

      {/* Run Detail Drawer */}
      {selectedRun && (
        <RunDetailDrawer
          run={runDetail || selectedRun}
          onClose={() => { setSelectedRun(null); setRunDetail(null) }}
        />
      )}
    </div>
  )
}
