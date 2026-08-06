/* ═══════════════════════════════════════════════════════════════════════════
   THE ADMIN CONSOLE — /admin

   Who reads this screen: whoever has to answer for the money. So it is built
   to be read like a company record, not like a dashboard template.

   WHAT THIS REPLACES
     · The numbered docket. Five "bands" hanging off a 56px gutter that ran
       zero-padded ordinals — 01, 02, 03 — down the leading edge of the page.
       An index into a list nobody was navigating. Gone, with the .wz-page /
       .wz-gutter / Band / SectionIndex apparatus behind it. This is .main and
       a real <h1>, which the application previously had nowhere at all.
     · THE RAIL PANEL. This route used to portal its ONLY search box, its
       status filter, its Export CSV button and its 7/30/90 range control into
       the left rail through <RailPanelPortal>. That panel is collapsible and
       persisted, so it had to force itself open on arrival or an admin who
       had once collapsed it arrived at /admin with no search, no filter and
       no export anywhere on screen. Every one of those controls is now inline
       on the page, beside the thing it acts on:
           range 7/30/90 + Refresh   → the page header, because the window
                                       scopes EVERY figure on the page, not
                                       just the table
           search + status + Export  → the toolbar row directly above the runs
                                       table, which is what they filter
       Nothing was dropped and nothing gained a second home.

   SELECTIVE DENSITY (principle 2). The eight summary figures and the drawer's
   three are judging surfaces and get cards, padding and 26px values. The runs
   table, the model ledger and the balance ledger are scanning surfaces and
   stay at .dtable density — 13px, 40px rows.

   THE PAGE RENDERS IMMEDIATELY. The heading, the window control, the section
   headings and the toolbar are present on the first paint; only the data
   regions carry skeletons. Nothing starts at opacity 0.

   NAMING TRAP, left exactly as it is: the admin stats block reports
   `total_cost_usd` and the admin DAILY series reports `total_cost` for the
   same quantity, while the user dashboard's daily series uses
   `total_cost_usd`. All three are correct against the backend. Do not
   normalise one into another.

   Every handler — loadAll, loadBalances, handleRunClick, handleDelete,
   handleExport — and the admin guard effect are unchanged.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '../services/adminService'
import describeError, { describeFailure } from '../services/errorText'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { useToastStore } from '../store/toastStore'
import AdminStatsCards, { AdminStatsSkeleton } from '../components/admin/AdminStatsCards'
import ModelCostBreakdown from '../components/admin/ModelCostBreakdown'
import ProviderBalances from '../components/admin/ProviderBalances'
import DailyMetricsChart from '../components/admin/DailyMetricsChart'
import AdminRunsTable, { RunsToolbar } from '../components/admin/AdminRunsTable'
import RunDetailDrawer from '../components/admin/RunDetailDrawer'
import AdminUsersTable from '../components/admin/AdminUsersTable'
import AdminActivityLog from '../components/admin/AdminActivityLog'
import ModelDefaults, { ModelDefaultsSkeleton } from '../components/admin/ModelDefaults'
import ConfirmDialog from '../components/ConfirmDialog'
import Rocker from '../components/ui/Rocker'
import EmptyState from '../components/ui/EmptyState'
import { Revise } from '../components/Icon'

const PAGE_LIMIT = 25
const RANGES = [7, 30, 90]

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
  const [error, setError] = useState(null)
  const [providerBalances, setProviderBalances] = useState([])
  const [balancesLoading, setBalancesLoading] = useState(false)
  const [configSlots, setConfigSlots] = useState([])
  const [configLoading, setConfigLoading] = useState(true)
  const [configSaving, setConfigSaving] = useState(false)

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
      setError(null)
    } catch (err) {
      console.error('Failed to load admin dashboard:', err)
      /* The toast is transient and this page is often left open. The reason
         also lands on the page itself, next to a retry that works. */
      setError(describeError(err, ar ? 'تعذّر تحميل بيانات الإدارة.' : 'Could not load the admin data.'))
      addToast('Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }, [days, addToast, ar])

  useEffect(() => {
    if (user?.is_admin || user?.role === 'admin') {
      loadAll()
    }
  }, [loadAll, user])

  const loadBalances = useCallback(async (refresh = false) => {
    setBalancesLoading(true)
    try {
      const data = await adminService.getProviderBalances(days, refresh)
      setProviderBalances(Array.isArray(data) ? data : [])
    } catch (err) {
      // A vendor being unreachable is not a reason to blank the whole
      // dashboard, so this failure is reported and otherwise swallowed. The
      // toast carries the reason, not just the fact — "Could not read provider
      // balances" alone leaves nothing to act on.
      console.error('Failed to load provider balances:', err)
      addToast(
        describeFailure(
          ar ? 'تعذّرت قراءة أرصدة المزودين' : 'Could not read provider balances',
          err,
        ),
        'error',
      )
    } finally {
      setBalancesLoading(false)
    }
  }, [days, addToast, ar])

  useEffect(() => {
    if (user?.is_admin || user?.role === 'admin') {
      loadBalances()
    }
  }, [loadBalances, user])

  /* MODEL DEFAULTS. Loaded on its own, not through the overview, because it is
     the one region here that does not depend on `days` — the window scopes
     every figure on this page, but not which model the pipeline runs on. */
  const loadConfig = useCallback(async () => {
    setConfigLoading(true)
    try {
      const data = await adminService.getConfig()
      setConfigSlots(Array.isArray(data?.slots) ? data.slots : [])
    } catch (err) {
      console.error('Failed to load model defaults:', err)
      addToast(
        describeFailure(ar ? 'تعذّرت قراءة النماذج الافتراضية' : 'Could not read the model defaults', err),
        'error',
      )
    } finally {
      setConfigLoading(false)
    }
  }, [addToast, ar])

  useEffect(() => {
    if (user?.is_admin || user?.role === 'admin') {
      loadConfig()
    }
  }, [loadConfig, user])

  /* Applied one stage at a time — the endpoint takes a single slot, so a
     partial success is possible and is reported as one. Stop at the first
     rejection rather than pressing on: the reasons compound (a missing key
     usually blocks more than one stage) and three stacked error toasts say
     less than the first one does. */
  const handleApplyConfig = useCallback(async (changes) => {
    if (!changes.length) return false
    setConfigSaving(true)
    let applied = 0
    let latest = null
    let ok = false
    try {
      for (const change of changes) {
        const data = await adminService.setModelDefault(change.key, change.model)
        latest = data?.config
        applied += 1
      }
      ok = true
      addToast(
        ar
          ? `تم تحديث ${applied} من النماذج الافتراضية`
          : `${applied} model default${applied === 1 ? '' : 's'} updated`,
        'success',
      )
      return true
    } catch (err) {
      console.error('Failed to apply model default:', err)
      addToast(
        describeFailure(
          applied
            ? (ar ? `طُبِّق ${applied} ثم توقّف` : `Applied ${applied}, then stopped`)
            : (ar ? 'تعذّر تطبيق التغيير' : 'Could not apply the change'),
          err,
        ),
        'error',
      )
      return false
    } finally {
      setConfigSaving(false)
      /* On success the last response already carries the refreshed config, so
         take it. A rejection has no config in its body and may have landed
         part of the batch, so re-read rather than infer — the selects must
         show what the server actually holds, not what we hoped it would. */
      if (ok && latest?.slots) setConfigSlots(latest.slots)
      else loadConfig()
    }
  }, [addToast, ar, loadConfig])

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
      addToast(
        describeFailure(ar ? 'تعذّر التصدير' : 'Export failed', err),
        'error',
      )
    }
  }

  const filteredRuns = useMemo(() => {
    const q = (filters.search || '').trim().toLowerCase()
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

  const isFiltered = Boolean(filters.search || filters.status)

  /* THE NO-ACCESS STATE. A heading and a sentence — it is still a page, so it
     still gets its <h1>. */
  if (!user?.is_admin && user?.role !== 'admin') {
    return (
      <div className="main main--narrow">
        <div className="pagehead">
          <h1 className="page-title">{ar ? 'الإدارة' : 'Admin'}</h1>
        </div>
        <div className="card card-pad">
          <EmptyState
            legend={ar ? 'صلاحية مطلوبة' : 'Permission required'}
            line={ar
              ? 'هذه الشاشة تتطلب حساباً بصلاحية إدارية.'
              : 'This screen requires an admin account.'}
          >
            <button type="button" className="btn-q btn-q--sm" onClick={() => navigate('/dashboard')}>
              {ar ? 'العودة إلى اللوحة' : 'Back to the dashboard'}
            </button>
          </EmptyState>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      {/* ── THE HEAD. The window control lives here because `days` is refetched
             through loadAll and scopes every figure on the page — the stats,
             both charts, the model ledger, the balances AND the runs. A
             control belongs beside the thing it controls, and the thing it
             controls is the whole page. */}
      <div className="pagehead">
        <div style={{ minInlineSize: 0 }}>
          <h1 className="page-title">{ar ? 'لوحة الإدارة' : 'Admin console'}</h1>
          <p className="page-sub">
            {ar
              ? <>كل تشغيل وكل تكلفة خلال آخر <span className="mono">{days}</span> يوماً</>
              : <>Every run and every cost across the last <span className="mono">{days}</span> days</>}
          </p>
        </div>
        <div
          style={{
            marginInlineStart: 'auto', display: 'flex', alignItems: 'center',
            gap: 10, flexWrap: 'wrap', flex: 'none',
          }}
        >
          <Rocker
            value={days}
            onChange={setDays}
            ariaLabel={ar ? 'نطاق الأيام' : 'Day range'}
            options={RANGES.map((d) => ({ value: d, label: `${d}d` }))}
          />
          <button type="button" className="btn-q" onClick={loadAll} disabled={loading}>
            <Revise size={15} />
            {ar ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card card-pad" style={{ borderColor: 'var(--bad)', marginBlockEnd: 20 }}>
          <div className="st st--bad" style={{ marginBlockEnd: 6 }}>{ar ? 'خطأ' : 'Error'}</div>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{error}</p>
          <button type="button" className="btn-q btn-q--sm" style={{ marginBlockStart: 12 }} onClick={loadAll}>
            <Revise size={14} />
            {ar ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* ── THE FIGURES. Generous, because this is where you judge. ───────── */}
      <div className="sechead" style={{ marginBlockStart: 0 }}>
        <h2 className="sec-title">{ar ? 'المؤشرات' : 'Readout'}</h2>
        <span className="caption">
          {ar
            ? <>نافذة <span className="mono">{days}</span> يوماً</>
            : <><span className="mono">{days}</span>-day window</>}
        </span>
      </div>
      {loading
        ? <AdminStatsSkeleton count={8} />
        : <AdminStatsCards stats={stats} costSeries={costSeries} runSeries={runSeries} />}

      {/* ── DAILY ────────────────────────────────────────────────────────── */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'يوميًا' : 'Daily'}</h2>
        <span className="caption">
          {ar ? 'الإنفاق والتشغيلات عبر النافذة' : 'Spend and runs across the window'}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        <div className="card card-pad">
          {loading
            ? <div className="skel" style={{ blockSize: 220 }} />
            : <DailyMetricsChart data={dailyMetrics} metric="cost" />}
        </div>
        <div className="card card-pad">
          {loading
            ? <div className="skel" style={{ blockSize: 220 }} />
            : <DailyMetricsChart data={dailyMetrics} metric="runs" />}
        </div>
      </div>

      {/* ── MODEL COST ───────────────────────────────────────────────────── */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'تكلفة النماذج' : 'Model cost'}</h2>
        <span className="caption">{ar ? 'مرتّبة حسب الإنفاق' : 'Ranked by spend'}</span>
      </div>
      <div className="card" style={{ padding: '14px 16px' }}>
        {loading
          ? <div className="skel" style={{ blockSize: 9 * 40 }} />
          : <ModelCostBreakdown data={modelCosts} totalCost={stats.total_cost_usd || 0} />}
      </div>

      {/* ── PROVIDER BALANCES ────────────────────────────────────────────────
          Loaded separately from the overview — it calls five vendors
          server-side, so it must not hold the rest of the page hostage, and it
          carries its own skeleton for the same reason. */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'أرصدة المزودين' : 'Provider balances'}</h2>
        <span className="caption">{ar ? 'الرصيد المتبقي والإنفاق' : 'Remaining credit and spend'}</span>
      </div>
      <div className="card" style={{ padding: '14px 16px' }}>
        {balancesLoading
          ? <div className="skel" style={{ blockSize: 6 * 40 }} />
          : (
            <ProviderBalances
              data={providerBalances}
              days={days}
              loading={balancesLoading}
              onRefresh={() => loadBalances(true)}
            />
          )}
      </div>

      {/* ── MODEL DEFAULTS ───────────────────────────────────────────────────
          Placed directly under the cost ledger and the balances ON PURPOSE:
          this is the control you reach for having just read what each model
          cost and what is left upstream. The evidence and the lever that acts
          on it belong on the same screen, in that order.

          Unlike everything above it, this region does NOT depend on `days` —
          the window scopes the figures, not the configuration — so it carries
          no day count in its caption and reloads on its own. */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'النماذج الافتراضية' : 'Model defaults'}</h2>
        <span className="caption">
          {ar
            ? 'المزود والنموذج لكل مرحلة من مراحل التوليد'
            : 'The provider and model behind each stage of a generation'}
        </span>
      </div>
      <div className="card card-pad">
        {configLoading
          ? <ModelDefaultsSkeleton />
          : (
            <ModelDefaults
              slots={configSlots}
              saving={configSaving}
              onApply={handleApplyConfig}
            />
          )}
      </div>

      {/* ── ALL RUNS. Dense, because this is where you scan. ──────────────── */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'كل التشغيلات' : 'All runs'}</h2>
        <span className="caption">
          {ar ? 'اختر تشغيلاً لعرض كل خطوة وتكلفتها' : 'Select a run to see every step and what it cost'}
        </span>
      </div>

      {/* THE RELOCATED CONTROLS: search, status and Export CSV, directly above
          the table they act on. They were in the rail; nothing else on this
          page can reach them. */}
      <RunsToolbar
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        total={runs.length}
        matched={filteredRuns.length}
        disabled={loading}
      />

      <div className="card" style={{ padding: '12px 14px' }}>
        <AdminRunsTable
          runs={pageRuns}
          total={filteredRuns.length}
          page={safePage}
          limit={PAGE_LIMIT}
          loading={loading}
          filtered={isFiltered}
          onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          onRunClick={handleRunClick}
          onDelete={(run) => setRunToDelete(run)}
          onClearFilters={() => setFilters({})}
        />
      </div>

      {/* ── ACCOUNTS. Self-contained on purpose, unlike the regions above:
             its pagination, search and role filter are SERVER-SIDE requests,
             not views over data the page already holds, and none of it is
             scoped by `days` — so the component owns its own loading the way
             loadBalances and loadConfig own theirs, without adding a fourth
             loader to this file. */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'الحسابات' : 'Accounts'}</h2>
        <span className="caption">
          {ar
            ? 'اختر حساباً لعرض ملفه وسجل رصيده وتشغيلاته'
            : 'Select an account to see its profile, credit ledger and runs'}
        </span>
      </div>
      <div className="card" style={{ padding: '12px 14px' }}>
        <AdminUsersTable />
      </div>

      {/* ── ACTIVITY. The one live region on this page: it polls on a 5s
             cursor and stops itself while paused or unmounted, so its state
             stays inside the component — the page has nothing to schedule. */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'النشاط' : 'Activity'}</h2>
        <span className="caption">
          {ar
            ? 'كل طلب وتسجيل دخول وإجراء إداري، لحظة وقوعه'
            : 'Every request, sign-in and admin act, as it happens'}
        </span>
      </div>
      <div className="card" style={{ padding: '12px 14px' }}>
        <AdminActivityLog />
      </div>

      <ConfirmDialog
        isOpen={!!runToDelete}
        title={ar ? 'حذف التشغيل' : 'Delete run'}
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
