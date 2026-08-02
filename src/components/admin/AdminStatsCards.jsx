/* THE ADMIN RUBRIC — eight readings on one instrument.

   This was eight bordered cards in a 4×2 grid, each led by the same amber
   glyph, four of them using a DIFFERENT glyph to mean "a thing happened".
   Amber on a heading icon is decoration, and in this system the accent means
   exactly two things: THIS IS RUNNING, or THIS COSTS MONEY.

   So: one strip, ruled into eight cells, on a shared baseline grid, sitting
   directly on the page. No icons at all. The trend is a signed figure on the
   ledger line in its state tone — a number, not an arrow, because the number
   is the information and it reads at a glance in a dense row.

   The two cells with a daily series behind them carry a 14-day sparkmeter, so
   RUNS and SPEND have a shape as well as a magnitude. */

import React from 'react'
import { Money, Duration } from '../ui/Money'
import { Rubric, Figure, En } from '../dashboard/Instruments'

function Trend({ value }) {
  if (value === undefined || value === null || !Number.isFinite(Number(value))) return null
  const n = Number(value)
  const tone = n >= 0 ? 'var(--state-done)' : 'var(--state-fail)'
  return (
    <span className="mono" style={{ fontSize: 11, color: tone, textAlign: 'start' }}>
      {n >= 0 ? '+' : '−'}{Math.abs(n).toFixed(1)}%
    </span>
  )
}

export default function AdminStatsCards({ stats = {}, costSeries = [], runSeries = [] }) {
  const successRate = stats.total_runs > 0
    ? ((stats.successful_runs || 0) / stats.total_runs * 100).toFixed(1)
    : 0

  const errorRate = stats.total_runs > 0
    ? (((stats.failed_runs || 0) / stats.total_runs) * 100).toFixed(1)
    : 0

  const avgDuration = stats.avg_duration_seconds ?? 0
  const num = (v) => (v ?? 0).toLocaleString('en-US')

  const cells = [
    {
      key: 'runs',
      legend: 'Total runs',
      value: <Figure value={num(stats.total_runs)} />,
      series: runSeries.some((v) => v > 0) ? runSeries : undefined,
      seriesLabel: 'Runs, last 14 days',
      note: <En>{`${stats.successful_runs || 0} ok · ${stats.failed_runs || 0} failed`}</En>,
    },
    {
      key: 'cost',
      legend: 'Total cost',
      value: <Money usd={stats.total_cost_usd} style={{ fontSize: 20, lineHeight: 1.15 }} />,
      series: costSeries.some((v) => v > 0) ? costSeries : undefined,
      seriesLabel: 'Spend, last 14 days',
      note: <span className="flex items-baseline gap-2"><span>avg</span><Money usd={stats.avg_cost_per_run} /></span>,
    },
    {
      key: 'success',
      legend: 'Success rate',
      value: <Figure value={successRate} suffix="%" />,
      note: <En>{`${stats.failed_runs || 0} failures`}</En>,
    },
    {
      key: 'duration',
      legend: 'Avg duration',
      value: <Duration seconds={avgDuration} style={{ fontSize: 20, lineHeight: 1.15 }} />,
      note: 'per run',
    },
    {
      key: 'assets',
      legend: 'Total assets',
      value: <Figure value={num(stats.total_assets)} />,
      note: <En>{`${stats.assets_today || 0} today`}</En>,
    },
    {
      key: 'users',
      legend: 'Active users',
      value: <Figure value={num(stats.active_users)} />,
      note: <En>{`${stats.new_users_today || 0} new today`}</En>,
    },
    {
      key: 'errors',
      legend: 'Error rate',
      value: <Figure value={errorRate} suffix="%" tone={Number(errorRate) > 0 ? 'var(--state-fail)' : 'var(--ink)'} />,
      note: <En>{`${stats.failed_runs || 0} total failures`}</En>,
    },
    {
      key: 'models',
      legend: 'Models used',
      value: <Figure value={num(stats.models_used)} />,
      note: 'unique model calls',
    },
  ]

  /* The two trend readings ride on their own cells rather than becoming two
     more boxes: the delta belongs next to the value it is a delta of. */
  if (Number.isFinite(Number(stats.runs_trend))) {
    cells[0].note = (
      <span className="flex items-baseline gap-2">
        <Trend value={stats.runs_trend} />
        <En>{`${stats.successful_runs || 0} ok · ${stats.failed_runs || 0} failed`}</En>
      </span>
    )
  }
  if (Number.isFinite(Number(stats.cost_trend))) {
    cells[1].note = (
      <span className="flex items-baseline gap-2">
        <Trend value={stats.cost_trend} />
        <span className="flex items-baseline gap-1"><span>avg</span><Money usd={stats.avg_cost_per_run} /></span>
      </span>
    )
  }

  return <Rubric cells={cells} columns={4} />
}
