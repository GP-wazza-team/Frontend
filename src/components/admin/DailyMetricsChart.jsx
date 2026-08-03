/* ── DAILY METRICS ────────────────────────────────────────────────────────
   One reading per chart: a 1.5px line, no gridlines, no area wash, no dots,
   Commit Mono axis type, and a tooltip that is a real .card rather than a
   floating white box with a radius the system did not choose.

   The chart no longer supplies its own surface. The page wraps it in a .card,
   the same way it wraps every other panel, so a chart is not a special kind
   of object with its own plate.

   ⚠ FIELD NAME: the daily series carries `total_cost`, NOT `total_cost_usd`.
   /admin/overview builds it with .label("total_cost") while the same
   endpoint's stats block uses total_cost_usd, and the user dashboard's own
   daily series uses total_cost_usd. All three are correct where they are.
   Renaming this key silently zeroes the spend chart.

   Props are unchanged: { data, metric }. */

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Money, Duration } from '../ui/Money'
import { useRtl } from '../Icon'
import { useUIStore } from '../../store/uiStore'
import EmptyState from '../ui/EmptyState'

const TICK = {
  fontSize: 10,
  fill: 'var(--ink-3)',
  fontFamily: "'Commit Mono', ui-monospace, SFMono-Regular, monospace",
}

const HEIGHT = 220

function Tip({ active, payload, label, metric }) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0]
  return (
    <div className="card" style={{ paddingBlock: 8, paddingInline: 12, minInlineSize: 132 }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBlockEnd: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.name}</span>
        <span style={{ fontSize: 12, color: 'var(--ink)' }}>
          {metric === 'cost' ? <Money usd={p.value} digits={2} />
            : metric === 'duration' ? <Duration seconds={p.value} />
            : <span className="mono">{p.value}</span>}
        </span>
      </div>
    </div>
  )
}

export default function DailyMetricsChart({ data = [], metric = 'cost' }) {
  const rtl = useRtl()
  const ar = useUIStore((s) => s.language) === 'ar'

  /* Two tonal steps apart, so cost and runs are told apart side by side
     without reading a legend. `duration_avg` is carried by the same endpoint
     and kept wired even though the page does not currently mount it. */
  const spec = metric === 'runs'
    ? { key: 'run_count', name: ar ? 'التشغيلات' : 'Runs', color: 'var(--chart-5)' }
    : metric === 'duration'
      ? { key: 'duration_avg', name: ar ? 'متوسط المدة' : 'Avg duration', color: 'var(--chart-3)' }
      : { key: 'total_cost', name: ar ? 'التكلفة' : 'Cost', color: 'var(--chart-1)' }

  if (data.length === 0) {
    return (
      <div style={{ blockSize: HEIGHT, display: 'flex', alignItems: 'center' }}>
        <EmptyState
          legend={spec.name}
          line={ar ? 'لا توجد بيانات في هذه النافذة.' : 'No data in this window.'}
        />
      </div>
    )
  }

  return (
    <div style={{ blockSize: HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        {/* The end tick is centred on the last point, so half its label sits
            outside the plot unless the margin makes room for it. */}
        <LineChart data={data} margin={{ top: 4, right: 22, bottom: 0, left: 8 }}>
          {/* recharts lays out in physical space and knows nothing about
              direction, so the time axis is reversed by hand in Arabic. A
              daily series is a step sequence, not a media time axis (A4), so
              it does mirror. */}
          {/* MM-DD on the axis, the full date in the tooltip. A ten-character
              ISO date at the first tick is half a label wide and gets clipped
              by the plot edge in both directions. */}
          <XAxis
            dataKey="date"
            tick={TICK}
            tickLine={false}
            axisLine={{ stroke: 'var(--line-2)' }}
            reversed={rtl}
            minTickGap={16}
            tickFormatter={(v) => String(v).slice(5)}
          />
          <YAxis
            tick={TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            orientation={rtl ? 'right' : 'left'}
            allowDecimals={metric !== 'runs'}
            tickFormatter={metric === 'cost' ? (v) => `$${Number(v).toFixed(2)}` : (v) => `${v}`}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-2)', strokeWidth: 1 }}
            content={<Tip metric={metric} />}
          />
          <Line
            type="linear"
            dataKey={spec.key}
            name={spec.name}
            stroke={spec.color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, fill: spec.color, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
