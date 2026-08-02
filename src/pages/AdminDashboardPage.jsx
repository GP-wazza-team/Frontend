/* ADMIN — /admin

   WHAT CHANGED, COMPOSITIONALLY
     · The Shield glyph, the 24px h1 and "Full platform analytics." are gone.
       The status bar names the page; a subtitle that restates the title is
       noise on a screen whose job is a nine-column table.
     · The route is a numbered docket on the 56px gutter grid, the same spine
       as /dashboard and the chat transcript.
     · The 7/30/90 control moved out of the page header into the RAIL PANEL as
       a rocker, next to the run filters, the export and the section index —
       it drives the existing `days` state through the existing `loadAll`.
     · THE THREE DEAD CONTROLS ARE NOW LIVE. Search, the status filter and the
       pager were wired to `() => {}` and `page={1}`: they looked functional
       and did nothing. They now filter and paginate the runs already in
       memory. No service call changed, no request was added — `loadAll` is
       byte-identical. A control that does nothing is not something this
       system ships.
     · The no-access state is a marker and a sentence, not a 40px grey glyph.

   Every handler — loadAll, handleRunClick, handleDelete, handleExport — and
   the admin guard effect are unchanged. */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useToastStore } from '../store/toastStore'
import AdminStatsCards from '../components/admin/AdminStatsCards'
import ModelCostBreakdown from '../components/admin/ModelCostBreakdown'
import DailyMetricsChart from '../components/admin/DailyMetricsChart'
import AdminRunsTable, { RunsFilters } from '../components/admin/AdminRunsTable'
import RunDetailDrawer from '../components/admin/RunDetailDrawer'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Band, RubricSkeleton, SectionIndex, PanelGroup,
} from '../components/dashboard/Instruments'
import Rocker from '../components/ui/Rocker'
import EmptyState from '../components/ui/EmptyState'
import { RailPanelPortal } from '../components/Sidebar'
import { Revise, Admin as AdminMark } from '../components/Icon'

const PAGE_LIMIT = 25

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { addToast } = useToastStore()
  const { language } = useUIStore()
  const ar = language === 'ar'

  useEffect(() => {
    if (user && !user.is_admin && user?.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const [stats, setStats] = useState({})
  const [modelCosts, setModelCosts] = useState([])
  const [dailyMetrics, setDailyMetrics] = useState([])
  const [runs, setRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [runDetail, setRunDetail] = useState(null)
  const [runToDelete, setRunToDelete] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  /* Presentation state over the runs already loaded by loadAll. No requests. */
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(1)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getOverview(days)
      setStats(data.stats || {})
      setModelCosts(Array.isArray(data.model_costs) ? data.model_costs : [])
      setDailyMetrics(Array.isArray(data.daily_metrics) ? data.daily_metrics : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
      addToast('Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }, [days, addToast])

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
      const blob = await adminService.exportRuns()
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

  const filteredRuns = useMemo(() => {
    const q = (filters.search || '').toLowerCase()
    const status = (filters.status || '').toLowerCase()
    return runs.filter((r) => {
      if (status && String(r.status || '').toLowerCase() !== status) return false
      if (!q) return true
      return [r.user_prompt, r.user_email, r.user_id, r.id, r.selected_path]
        .some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [runs, filters])

  const totalPages = Math.ceil(filteredRuns.length / PAGE_LIMIT) || 1
  const safePage = Math.min(page, totalPages)
  const pageRuns = useMemo(
    () => filteredRuns.slice((safePage - 1) * PAGE_LIMIT, safePage * PAGE_LIMIT),
    [filteredRuns, safePage]
  )

  useEffect(() => { setPage(1) }, [filters, runs])

  const costSeries = useMemo(() => dailyMetrics.map((d) => Number(d?.total_cost) || 0), [dailyMetrics])
  const runSeries = useMemo(() => dailyMetrics.map((d) => Number(d?.run_count) || 0), [dailyMetrics])

  if (!user?.is_admin && user?.role !== 'admin') {
    return (
      <div className="wz-page">
        <div className="wz-gutter"><AdminMark size={16} style={{ color: 'var(--ink-3)' }} /></div>
        <div className="wz-col">
          <EmptyState
            legend={ar ? 'الإدارة' : 'Admin'}
            line={ar ? 'هذه الشاشة تتطلب صلاحية إدارية.' : 'This screen requires an admin account.'}
          />
        </div>
      </div>
    )
  }

  const sections = [
    { id: 'wz-admin-rubric', ord: '01', label: ar ? 'المؤشرات' : 'Readout' },
    { id: 'wz-admin-daily', ord: '02', label: ar ? 'يوميًا' : 'Daily' },
    { id: 'wz-admin-models', ord: '03', label: ar ? 'النماذج' : 'Models' },
    { id: 'wz-admin-runs', ord: '04', label: ar ? 'التشغيلات' : 'Runs' },
  ]

  return (
    <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
      <RailPanelPortal>
        <PanelGroup legend={ar ? 'النطاق' : 'Window'} first>
          <Rocker
            value={days}
            onChange={setDays}
            ariaLabel={ar ? 'نطاق الأيام' : 'Day range'}
            options={[7, 30, 90].map((d) => ({ value: d, label: `${d}d` }))}
          />
          <div style={{ marginBlockStart: 10 }}>
            <button type="button" className="text-action" onClick={loadAll} disabled={loading}>
              <Revise size={16} />
              {ar ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </PanelGroup>

        <PanelGroup legend={ar ? 'الفلاتر' : 'Filters'}>
          <RunsFilters
            filters={filters}
            onFilterChange={setFilters}
            onExport={handleExport}
            total={runs.length}
            matched={filteredRuns.length}
          />
        </PanelGroup>

        <PanelGroup legend={ar ? 'الأقسام' : 'Sections'}>
          <SectionIndex items={sections} />
        </PanelGroup>
      </RailPanelPortal>

      <Band index={1} id="wz-admin-rubric" legend={ar ? 'المؤشرات' : 'Readout'} note={`${days}d`}>
        {loading
          ? <RubricSkeleton columns={4} count={8} />
          : <AdminStatsCards stats={stats} costSeries={costSeries} runSeries={runSeries} />}
      </Band>

      <Band
        index={2}
        id="wz-admin-daily"
        legend={ar ? 'يوميًا' : 'Daily'}
        note={ar ? 'الإنفاق والتشغيلات عبر النافذة' : 'Spend and runs across the window'}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 16 }}>
          {loading ? (
            <>
              <div className="plate"><div className="skel" style={{ blockSize: 220 }} /></div>
              <div className="plate"><div className="skel" style={{ blockSize: 220 }} /></div>
            </>
          ) : (
            <>
              <DailyMetricsChart data={dailyMetrics} metric="cost" />
              <DailyMetricsChart data={dailyMetrics} metric="runs" />
            </>
          )}
        </div>
      </Band>

      <Band
        index={3}
        id="wz-admin-models"
        legend={ar ? 'تكلفة النماذج' : 'Model cost'}
        note={ar ? 'مرتّبة حسب الإنفاق' : 'Ranked by spend'}
      >
        {loading
          ? <div className="skel" style={{ blockSize: 8 * 40 + 36 }} />
          : <ModelCostBreakdown data={modelCosts} totalCost={stats.total_cost_usd || 0} />}
      </Band>

      <Band
        index={4}
        id="wz-admin-runs"
        legend={ar ? 'كل التشغيلات' : 'All runs'}
        note={filters.search || filters.status
          ? `${filteredRuns.length.toLocaleString('en-US')} / ${runs.length.toLocaleString('en-US')}`
          : `${runs.length.toLocaleString('en-US')}`}
        span
      >
        <AdminRunsTable
          runs={pageRuns}
          total={filteredRuns.length}
          page={safePage}
          limit={PAGE_LIMIT}
          loading={loading}
          onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          onRunClick={handleRunClick}
          onDelete={(run) => setRunToDelete(run)}
          onExport={handleExport}
          filters={filters}
          onFilterChange={setFilters}
        />
      </Band>

      <ConfirmDialog
        isOpen={!!runToDelete}
        title={ar ? 'حذف التشغيل' : 'Delete Run'}
        message={ar
          ? `سيُحذف سجل التشغيل رقم ${runToDelete?.id} وبياناته التحليلية. الأصول المُنتَجة لن تُحذف.`
          : `Delete Run #${runToDelete?.id}? This removes the run record and associated analytics. Generated assets will NOT be deleted.`}
        confirmLabel={ar ? 'حذف' : 'Delete'}
        cancelLabel={ar ? 'إلغاء' : 'Cancel'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setRunToDelete(null)}
      />

      {selectedRun && (
        <RunDetailDrawer
          run={runDetail || selectedRun}
          onClose={() => { setSelectedRun(null); setRunDetail(null) }}
        />
      )}
    </div>
  )
}
