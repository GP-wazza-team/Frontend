/* ── THE SUMMARY FIGURES ───────────────────────────────────────────────────
   Principle 2, the half of it this page keeps getting wrong: dense where you
   SCAN, generous where you JUDGE. The runs table below is a scanning surface
   and stays at 13px / 40px rows. THIS is a judging surface — eight figures a
   finance reader stops on — so it gets real cards, real padding and a 26px
   value. It used to be an eight-cell hairline strip at rubric density, which
   made the platform's total spend the same visual weight as a table cell.

   No icons, no accent on a heading, no card that is also a button. A value, a
   name, and one line of context under it. The two series that have fourteen
   days behind them carry a sparkmeter, because a spend figure with a shape is
   worth more to an auditor than one without — and it is data, not decoration.

   NAMING TRAP, on purpose: the admin stats block calls the platform total
   `total_cost_usd` while the admin DAILY series calls the same quantity
   `total_cost`. Both are correct against Backend/app/api/routes_admin.py. Do
   not "fix" either one into the other.

   Props are unchanged: { stats, costSeries, runSeries }. */

import React from 'react'
import { Money, Duration } from '../ui/Money'
import { Sparkmeter } from '../dashboard/Instruments'
import { useUIStore } from '../../store/uiStore'

const N = (v) => Number(v ?? 0).toLocaleString('en-US')

/* Four columns at most, however wide the window is. auto-fit alone packed
   seven of the eight figures onto one line and orphaned the eighth; the max()
   floor is a quarter of the row minus its share of the gaps, so the track can
   never subdivide past four, while the 196px floor still collapses it to
   three, two and one as the window narrows. */
const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(max(196px, calc(25% - 11px)), 1fr))',
  gap: 14,
}

/* Every repeating figure is tabular (principle 8), including the ones sitting
   inside a sentence of context. */
const Num = ({ children }) => <span className="mono">{children}</span>

/* The backend currently hardcodes both trends to 0.0. "+0.0%" on every card
   on every load is not a reading, it is furniture — so a zero delta says
   nothing and the context line closes up around it. */
function Trend({ value }) {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return null
  return (
    <span className="mono" style={{ color: n >= 0 ? 'var(--ok)' : 'var(--bad)' }}>
      {n >= 0 ? '+' : '−'}{Math.abs(n).toFixed(1)}%
    </span>
  )
}

function Cell({ legend, value, series, seriesLabel, note }) {
  return (
    <div className="card card-pad" style={{ minInlineSize: 0 }}>
      <div className="label">{legend}</div>
      <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.2, marginBlockStart: 4, color: 'var(--ink)' }}>
        {value}
      </div>
      <div
        className="caption"
        style={{ display: 'flex', alignItems: 'center', gap: 9, marginBlockStart: 6, minBlockSize: 17 }}
      >
        {series && <Sparkmeter series={series} label={seriesLabel} />}
        {note && <span style={{ minInlineSize: 0 }}>{note}</span>}
      </div>
    </div>
  )
}

/* Same geometry as the loaded strip, so nothing moves when the data lands. */
export function AdminStatsSkeleton({ count = 8 }) {
  return (
    <div aria-busy="true" style={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card-pad">
          <div className="skel" style={{ blockSize: 10, inlineSize: 72 }} />
          <div className="skel" style={{ blockSize: 26, inlineSize: 104, marginBlockStart: 8 }} />
          <div className="skel" style={{ blockSize: 11, inlineSize: 88, marginBlockStart: 9 }} />
        </div>
      ))}
    </div>
  )
}

export default function AdminStatsCards({ stats = {}, costSeries = [], runSeries = [] }) {
  const ar = useUIStore((s) => s.language) === 'ar'

  const totalRuns = Number(stats.total_runs) || 0
  const ok = Number(stats.successful_runs) || 0
  const bad = Number(stats.failed_runs) || 0
  const successRate = totalRuns > 0 ? ((ok / totalRuns) * 100).toFixed(1) : '0.0'
  const errorRate = totalRuns > 0 ? ((bad / totalRuns) * 100).toFixed(1) : '0.0'

  const hasRuns = runSeries.some((v) => Number(v) > 0)
  const hasCost = costSeries.some((v) => Number(v) > 0)
  const window14 = ar ? 'آخر ١٤ يوماً' : 'last 14 days'

  return (
    <div style={GRID}>
      {/* The names are inlined rather than taken from t(): the store holds
          'Total Runs' and 'Total Assets' in title case and everything else on
          this strip is sentence case, so eight labels drawn from two sources
          did not agree with each other. */}
      <Cell
        legend={ar ? 'إجمالي التشغيلات' : 'Total runs'}
        value={<span className="mono">{N(stats.total_runs)}</span>}
        series={hasRuns ? runSeries : undefined}
        seriesLabel={`${ar ? 'التشغيلات' : 'Runs'} — ${window14}`}
        note={
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <Trend value={stats.runs_trend} />
            <span>
              <Num>{N(ok)}</Num> {ar ? 'ناجح' : 'ok'} · <Num>{N(bad)}</Num> {ar ? 'فاشل' : 'failed'}
            </span>
          </span>
        }
      />

      <Cell
        legend={ar ? 'إجمالي التكلفة' : 'Total cost'}
        value={<Money usd={stats.total_cost_usd} />}
        series={hasCost ? costSeries : undefined}
        seriesLabel={`${ar ? 'التكلفة' : 'Cost'} — ${window14}`}
        note={
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
            <Trend value={stats.cost_trend} />
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
              {ar ? 'متوسط' : 'avg'}
              <Money usd={stats.avg_cost_per_run} />
            </span>
          </span>
        }
      />

      <Cell
        legend={ar ? 'نسبة النجاح' : 'Success rate'}
        value={<span className="mono">{successRate}%</span>}
        note={<><Num>{N(ok)}</Num> {ar ? 'من' : 'of'} <Num>{N(totalRuns)}</Num></>}
      />

      <Cell
        legend={ar ? 'متوسط المدة' : 'Avg duration'}
        value={<Duration seconds={Number(stats.avg_duration_seconds) || 0} />}
        note={ar ? 'لكل تشغيل ناجح' : 'per successful run'}
      />

      <Cell
        legend={ar ? 'إجمالي الأصول' : 'Total assets'}
        value={<span className="mono">{N(stats.total_assets)}</span>}
        note={<><Num>{N(stats.assets_today)}</Num> {ar ? 'اليوم' : 'today'}</>}
      />

      <Cell
        legend={ar ? 'المستخدمون النشطون' : 'Active users'}
        value={<span className="mono">{N(stats.active_users)}</span>}
        note={<><Num>{N(stats.new_users_today)}</Num> {ar ? 'جديد اليوم' : 'new today'}</>}
      />

      <Cell
        legend={ar ? 'نسبة الأخطاء' : 'Error rate'}
        value={
          <span className="mono" style={{ color: Number(errorRate) > 0 ? 'var(--bad)' : 'var(--ink)' }}>
            {errorRate}%
          </span>
        }
        note={<><Num>{N(bad)}</Num> {ar ? 'حالة فشل' : 'failures'}</>}
      />

      <Cell
        legend={ar ? 'النماذج المستخدمة' : 'Models used'}
        value={<span className="mono">{N(stats.models_used)}</span>}
        note={ar ? 'نماذج مميّزة في النافذة' : 'distinct models in window'}
      />
    </div>
  )
}
