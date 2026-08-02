/* THE LEDGER — /dashboard

   WHAT CHANGED, COMPOSITIONALLY
     · The greeting is gone. "Hello, {firstname} — here's what's happening
       with your AI generation activity" is marketing copy inside a working
       tool, and the status bar already names the page, so there is no h1 here
       at all.
     · The page is a NUMBERED DOCKET on the app's 56px gutter grid: each band
       carries a two-digit ordinal in Commit Mono on the same axis as a chat
       turn index. Four bands, in the order a person actually reads them —
       the readout, then where the money went, then who spent it, then the
       individual runs.
     · The four stat cards became one rubric strip (see StatsCards).
     · The range control and the section index moved to the rail panel, where
       route controls belong. The range filters the ALREADY-FETCHED 30-day
       series client-side — the API call is byte-identical, and the control is
       live rather than decorative.
     · The spinner is gone. Loading renders the real page structure in
       skeletons at their true final heights, so nothing reflows on arrival.
     · The load error used to vanish into console.error with a blank page
       behind it. It now surfaces with a retry that calls the same loader. */

import React, { useEffect, useMemo, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import StatsCards from '../components/dashboard/StatsCards'
import CostChart from '../components/dashboard/CostChart'
import ProviderChart from '../components/dashboard/ProviderChart'
import RecentRuns from '../components/dashboard/RecentRuns'
import {
  Band, RubricSkeleton, SectionIndex, PanelGroup, TableSkeleton,
} from '../components/dashboard/Instruments'
import Rocker from '../components/ui/Rocker'
import EmptyState from '../components/ui/EmptyState'
import { RailPanelPortal } from '../components/Sidebar'
import Meter from '../components/ui/Meter'
import { Revise, Note } from '../components/Icon'
import { useUIStore } from '../store/uiStore'

const RANGES = [7, 30, 90]

function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [costHistory, setCostHistory] = useState([])
  const [providerUsage, setProviderUsage] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState(30)
  const { t, language } = useUIStore()
  const ar = language === 'ar'

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
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
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError(err?.response?.data?.detail || (ar ? 'تعذّر تحميل اللوحة.' : 'Could not load the dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  /* Presentation-only window over the series already in memory. No refetch. */
  const windowed = useMemo(() => costHistory.slice(-range), [costHistory, range])
  const costSeries = useMemo(() => costHistory.map((d) => Number(d?.total_cost_usd) || 0), [costHistory])
  const runSeries = useMemo(() => costHistory.map((d) => Number(d?.run_count) || 0), [costHistory])

  const sections = [
    { id: 'wz-ledger-rubric', ord: '01', label: ar ? 'المؤشرات' : 'Readout' },
    { id: 'wz-ledger-spend', ord: '02', label: ar ? 'الإنفاق' : 'Spend' },
    { id: 'wz-ledger-providers', ord: '03', label: t('providerUsage') },
    { id: 'wz-ledger-runs', ord: '04', label: t('recentRuns') },
  ]

  const rail = (
    <RailPanelPortal>
      <PanelGroup legend={ar ? 'النطاق' : 'Range'} first>
        <Rocker
          value={range}
          onChange={setRange}
          ariaLabel={ar ? 'نطاق الأيام' : 'Day range'}
          options={RANGES.map((d) => ({ value: d, label: `${d}d` }))}
        />
      </PanelGroup>
      <PanelGroup legend={ar ? 'الأقسام' : 'Sections'}>
        <SectionIndex items={sections} />
      </PanelGroup>
      <PanelGroup legend={ar ? 'البيانات' : 'Data'}>
        <button type="button" className="text-action" onClick={loadDashboard} disabled={loading}>
          <Revise size={16} />
          {ar ? 'تحديث' : 'Refresh'}
        </button>
      </PanelGroup>
    </RailPanelPortal>
  )

  if (loading) {
    return (
      <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
        {rail}
        <Band
          index={1}
          id="wz-ledger-rubric"
          legend={ar ? 'المؤشرات' : 'Readout'}
          gutterExtra={<Meter cells={5} mode="indeterminate" tone="ink" label={t('loading')} style={{ marginBlockStart: 8 }} />}
        >
          <RubricSkeleton columns={4} count={4} />
        </Band>
        <Band index={2} legend={ar ? 'الإنفاق' : 'Spend'}>
          <div className="plate"><div className="skel" style={{ blockSize: 220 }} /></div>
        </Band>
        <Band index={3} legend={t('providerUsage')}>
          <div className="plate"><div className="skel" style={{ blockSize: 220 }} /></div>
        </Band>
        <Band index={4} legend={t('recentRuns')} span>
          <table className="dtable"><TableSkeleton columns={7} rows={6} /></table>
        </Band>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
        {rail}
        <Band index={1} marker={<Note size={16} style={{ color: 'var(--state-fail)', marginBlockStart: 6 }} />}>
          <EmptyState
            legend={t('error')}
            line={error}
            tone="var(--state-fail)"
          >
            <button type="button" className="text-action" onClick={loadDashboard}>
              <Revise size={16} />
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </EmptyState>
        </Band>
      </div>
    )
  }

  return (
    <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
      {rail}

      <Band index={1} id="wz-ledger-rubric" legend={ar ? 'المؤشرات' : 'Readout'}>
        <StatsCards stats={stats} costSeries={costSeries} runSeries={runSeries} />
      </Band>

      <Band
        index={2}
        id="wz-ledger-spend"
        legend={t('costHistory')}
        note={ar ? `آخر ${windowed.length} يومًا` : `Last ${windowed.length} days`}
      >
        <CostChart data={windowed} />
      </Band>

      <Band
        index={3}
        id="wz-ledger-providers"
        legend={t('providerUsage')}
        note={ar ? 'عدد الاستدعاءات لكل مزوّد' : 'Calls by provider'}
      >
        <ProviderChart data={providerUsage} />
      </Band>

      <Band
        index={4}
        id="wz-ledger-runs"
        legend={t('recentRuns')}
        note={ar
          ? 'اختر تشغيلاً لعرض كل خطوة وتكلفتها'
          : 'Select a run to see every step and what it cost'}
        span
      >
        <RecentRuns runs={recentRuns} />
      </Band>
    </div>
  )
}

export default DashboardPage
