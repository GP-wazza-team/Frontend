/* ═══════════════════════════════════════════════════════════════════════════
   THE HOME SCREEN

   What this used to be: four numbered "bands" hanging off a 56px gutter that
   ran zero-padded ordinals down the leading edge. It opened with `01` in
   monospace and four figures. No heading, no name, no sense of whose account
   it was, and — on a video product — not one frame of video.

   What it is now: THE NUMBERS, and only the numbers.
     1  Where do I stand.   The balance, and what it buys.
     2  What did it cost.   The figures and the charts, kept whole.

   The work itself is NOT here. Projects live on the Workspace screen, where
   picking one opens its chat and you carry on — which is where a person
   actually goes to resume something. A dashboard that mixed the ledger with
   the library made you scroll past your own charts to reach your work.

   THE RANGE CONTROL AND REFRESH MOVED OUT OF THE RAIL, back onto the page.
   They used to be portalled into a collapsible panel that had to force itself
   open on arrival so its own controls would be discoverable — which is the
   shape of the problem, not a solution. A control belongs beside the thing it
   controls.

   NOTHING IS GATED ON A LOADING FLAG THAT REPLACES THE PAGE. The old version
   returned an entirely different tree while loading, so the heading, the
   actions and the layout all appeared late. Now the page renders immediately
   and only the data regions carry skeletons.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../services/dashboardService'
import CostChart from '../components/dashboard/CostChart'
import ProviderChart from '../components/dashboard/ProviderChart'
import RecentRuns from '../components/dashboard/RecentRuns'
import Rocker from '../components/ui/Rocker'
import { Money } from '../components/ui/Money'
import { Revise } from '../components/Icon'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { useRunStatus } from '../components/RunStatusContext'
import { useCredits } from '../hooks/useCredits'
import { CREDITS_ENABLED, usdToCredits } from '../config/features'
import describeError from '../services/errorText'

const RANGES = [7, 30, 90]

/* ── A STAT TILE ───────────────────────────────────────────────────────────
   Not a chart. A single number's job is to be READ, and a chart of one value
   is decoration — so this is a figure with a label and, where it is honest,
   one line of context beneath it.

   The value wears an INK token, never a series colour: colour on a figure
   implies an encoding, and there is nothing here for it to encode. Tabular
   figures via .mono so a row of tiles aligns on the digit. */
function Stat({ label, value, note, loading, tone }) {
  return (
    <div className="card card-pad" style={{ minInlineSize: 0 }}>
      <div className="label">{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, marginBlockStart: 4, color: tone || 'var(--ink)' }}>
        {loading ? <span className="skel" style={{ display: 'inline-block', inlineSize: 72, blockSize: 22 }} /> : value}
      </div>
      {note && !loading && <div className="caption" style={{ marginBlockStart: 4 }}>{note}</div>}
    </div>
  )
}

/* Seconds as a human duration. avg_duration_seconds arrives as a float. */
function secs(n, ar) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return '—'
  if (v < 60) return <><span className="mono">{v.toFixed(0)}</span> {ar ? 'ث' : 's'}</>
  const m = Math.floor(v / 60)
  const s = Math.round(v % 60)
  return <><span className="mono">{m}</span> {ar ? 'د' : 'm'} <span className="mono">{s}</span> {ar ? 'ث' : 's'}</>
}

function DashboardPage() {
  const navigate = useNavigate()
  const { t, language } = useUIStore()
  const { user } = useAuthStore()
  const { status } = useRunStatus()
  const { credits, loading: creditsLoading } = useCredits()
  const ar = language === 'ar'

  const [stats, setStats] = useState(null)
  const [costHistory, setCostHistory] = useState([])
  const [providerUsage, setProviderUsage] = useState([])
  const [recentRuns, setRecentRuns] = useState([])
  const [topProjects, setTopProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [range, setRange] = useState(30)

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsData, costData, providerData, runsData, topData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getCostHistory(90),
        dashboardService.getProviderUsage(),
        dashboardService.getRecentRuns(10),
        /* Spend per project. Never fetched by any previous frontend, so a
           failure here must not take the rest of the page with it. */
        dashboardService.getTopConversations(5).catch(() => []),
      ])
      setStats(statsData)
      setCostHistory(Array.isArray(costData) ? costData : [])
      setProviderUsage(Array.isArray(providerData) ? providerData : [])
      setRecentRuns(Array.isArray(runsData) ? runsData : [])
      setTopProjects(Array.isArray(topData) ? topData : [])
    } catch (err) {
      setError(describeError(err, ar ? 'تعذّر تحميل اللوحة.' : 'Could not load the dashboard.'))
    } finally {
      setLoading(false)
    }
  }

  /* Presentation-only window over the series already in memory. No refetch. */
  const windowed = useMemo(() => costHistory.slice(-range), [costHistory, range])

  const totalRuns = Number(stats?.total_runs) || 0
  const succeeded = Number(stats?.successful_runs) || 0
  const failed = Number(stats?.failed_runs) || 0
  /* Success rate is undefined with no runs, and 0% would be a lie about an
     account that has simply not started yet. */
  const successRate = totalRuns > 0 ? (succeeded / totalRuns) * 100 : null

  const firstName = String(user?.name || user?.email || '').split(/[\s@]/)[0]
  const avgCost = Number(stats?.avg_cost_per_run ?? stats?.avg_cost ?? 0)
  /* "About N more runs" comes from THIS account's own average run cost, not a
     marketing number. With no history there is nothing honest to say, so it
     says nothing rather than inventing a figure. */
  const runsLeft = CREDITS_ENABLED && credits != null && avgCost > 0
    ? Math.floor(credits / Math.max(1, usdToCredits(avgCost)))
    : null

  return (
    <div className="main">
      <div className="pagehead">
        <div className="min-w-0">
          <h1 className="page-title">
            {firstName
              ? (ar ? `مرحباً، ${firstName}` : `Welcome back, ${firstName}`)
              : (ar ? 'مرحباً' : 'Welcome back')}
          </h1>
          <p className="page-sub">
            {status.activeRunId != null
              ? (ar ? 'لديك مشروع قيد التنفيذ الآن' : 'You have a run in progress')
              : (ar ? 'نظرة على حسابك وأعمالك' : 'Your account and your work')}
          </p>
        </div>
        <div className="shrink-0" style={{ marginInlineStart: 'auto' }}>
          <button type="button" className="btn" onClick={() => navigate('/')}>
            {ar ? 'مشروع جديد' : 'New project'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card card-pad" style={{ borderColor: 'var(--bad)', marginBlockEnd: 20 }}>
          <div className="st st--bad" style={{ marginBlockEnd: 6 }}>{t('error')}</div>
          <p style={{ color: 'var(--ink-2)', fontSize: 13 }}>{error}</p>
          <button type="button" className="btn-q btn-q--sm" style={{ marginBlockStart: 12 }} onClick={loadDashboard}>
            <Revise size={14} />
            {ar ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* ── THE BALANCE ────────────────────────────────────────────────────
          Gated on CREDITS_ENABLED (src/config/features.js) so an unfinished
          balance cannot interrupt a test run. It is wired to the real
          GET /users/me/credits — hidden, never faked. */}
      {CREDITS_ENABLED && (
        <div className="card card-pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', minInlineSize: 0 }}>
            <div className="caption" style={{ marginBlockEnd: 2 }}>{ar ? 'الرصيد المتاح' : 'Available balance'}</div>
            <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.15 }}>
              {creditsLoading || credits == null ? (
                <span className="skel" style={{ display: 'inline-block', inlineSize: 120, blockSize: 28 }} />
              ) : (
                <>
                  <span className="mono">{credits.toLocaleString('en-US')}</span>{' '}
                  <span style={{ fontSize: 17, color: 'var(--ink-2)', fontWeight: 500 }}>{ar ? 'رصيد' : 'credits'}</span>
                </>
              )}
            </div>
            {runsLeft != null && (
              <div className="caption" style={{ marginBlockStart: 6 }}>
                {ar
                  ? <>يكفي لحوالي <b style={{ color: 'var(--ink-2)' }}>{runsLeft}</b> تشغيل بمتوسط تكلفتك الحالي</>
                  : <>About <b style={{ color: 'var(--ink-2)' }}>{runsLeft}</b> more runs at your current average</>}
              </div>
            )}
          </div>
          <button type="button" className="btn-q shrink-0" onClick={() => navigate('/settings')}>
            {ar ? 'سجل العمليات' : 'History'}
          </button>
        </div>
      )}

      {/* ── THE FIGURES. Dense, because this is where you scan. ───────────── */}
      <div className="sechead">
        <h2 className="sec-title">{ar ? 'المؤشرات' : 'Readout'}</h2>
        <button type="button" className="btn-t" onClick={loadDashboard} disabled={loading}>
          <Revise size={14} />
          {ar ? 'تحديث' : 'Refresh'}
        </button>
      </div>
      {/* Six figures, and every one of them is already in GET /dashboard/stats
          — the previous dashboard displayed four of them and dropped
          total_assets and avg_duration_seconds on the floor. */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))' }}>
        <Stat
          label={ar ? 'إجمالي التشغيلات' : 'Total runs'}
          loading={loading}
          value={<span className="mono">{(Number(stats?.total_runs) || 0).toLocaleString('en-US')}</span>}
        />
        <Stat
          label={ar ? 'نسبة النجاح' : 'Success rate'}
          loading={loading}
          tone={successRate != null && successRate < 60 ? 'var(--bad)' : undefined}
          value={successRate == null ? '—' : <span className="mono">{successRate.toFixed(0)}%</span>}
          note={totalRuns > 0
            ? (ar
                ? <><span className="mono">{succeeded}</span> ناجح · <span className="mono">{failed}</span> فاشل</>
                : <><span className="mono">{succeeded}</span> succeeded · <span className="mono">{failed}</span> failed</>)
            : null}
        />
        <Stat
          label={ar ? 'إجمالي الإنفاق' : 'Total spend'}
          loading={loading}
          value={<Money usd={Number(stats?.total_cost_usd) || 0} />}
        />
        <Stat
          label={ar ? 'متوسط تكلفة التشغيل' : 'Avg cost per run'}
          loading={loading}
          value={<Money usd={avgCost} />}
          note={CREDITS_ENABLED && avgCost > 0
            ? (ar ? <><span className="mono">{usdToCredits(avgCost)}</span> رصيد</> : <>≈ <span className="mono">{usdToCredits(avgCost)}</span> credits</>)
            : null}
        />
        <Stat
          label={ar ? 'الملفات المنتجة' : 'Assets produced'}
          loading={loading}
          value={<span className="mono">{(Number(stats?.total_assets) || 0).toLocaleString('en-US')}</span>}
        />
        <Stat
          label={ar ? 'متوسط زمن التشغيل' : 'Avg run time'}
          loading={loading}
          value={secs(stats?.avg_duration_seconds, ar)}
          note={ar ? 'للتشغيلات الناجحة' : 'successful runs only'}
        />
      </div>



      <div className="sechead">
        <h2 className="sec-title">{t('costHistory')}</h2>
        <span className="caption">{ar ? `آخر ${windowed.length} يوماً` : `Last ${windowed.length} days`}</span>
        <div style={{ marginInlineStart: 'auto' }}>
          <Rocker
            value={range}
            onChange={setRange}
            ariaLabel={ar ? 'نطاق الأيام' : 'Day range'}
            options={RANGES.map((d) => ({ value: d, label: `${d}d` }))}
          />
        </div>
      </div>
      <div className="card card-pad">
        {loading ? <div className="skel" style={{ blockSize: 220 }} /> : <CostChart data={windowed} />}
      </div>

      <div className="sechead">
        <h2 className="sec-title">{t('providerUsage')}</h2>
        <span className="caption">{ar ? 'عدد الاستدعاءات لكل مزوّد' : 'Calls by provider'}</span>
      </div>
      <div className="card card-pad">
        {loading ? <div className="skel" style={{ blockSize: 220 }} /> : <ProviderChart data={providerUsage} />}
      </div>

      {/* ── SPEND BY PROJECT ──────────────────────────────────────────────
          GET /dashboard/top-conversations has existed all along and no
          frontend ever called it. "What did I spend in total" was answerable;
          "which project spent it" was not. */}
      {topProjects.length > 0 && (
        <>
          <div className="sechead">
            <h2 className="sec-title">{ar ? 'الإنفاق حسب المشروع' : 'Spend by project'}</h2>
          </div>
          <div className="card scroll-x" style={{ padding: '14px 8px 6px' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>{ar ? 'المشروع' : 'Project'}</th>
                  <th className="num">{ar ? 'التشغيلات' : 'Runs'}</th>
                  <th className="num">{ar ? 'التكلفة' : 'Cost'}</th>
                </tr>
              </thead>
              <tbody>
                {topProjects.map((c) => (
                  <tr key={c.chat_id}>
                    <td style={{ color: 'var(--ink)' }}>
                      <span className="truncate" style={{ display: 'inline-block', maxInlineSize: 420 }}>
                        {c.title || (ar ? 'بدون عنوان' : 'Untitled')}
                      </span>
                    </td>
                    <td className="num mono">{(Number(c.run_count) || 0).toLocaleString('en-US')}</td>
                    <td className="num"><Money usd={Number(c.total_cost_usd) || 0} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="sechead">
        <h2 className="sec-title">{t('recentRuns')}</h2>
        <span className="caption">
          {ar ? 'اختر تشغيلاً لعرض كل خطوة وتكلفتها' : 'Select a run to see every step and what it cost'}
        </span>
      </div>
      <div className="card scroll-x" style={{ padding: '14px 8px 6px' }}>
        {loading ? <div className="skel" style={{ blockSize: 200 }} /> : <RecentRuns runs={recentRuns} />}
      </div>
    </div>
  )
}

export default DashboardPage
