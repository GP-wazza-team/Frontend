/* DAILY METRICS.

   The area gradient is deleted. There is exactly one gradient in this
   application and it is on the auth plate; a translucent wash under a line is
   atmosphere inside a working surface, and it made the two charts on this row
   read as one blurry mass rather than two separate readings.

   What is left is the reading itself: a 1.5px line, no dots, no gridlines,
   Commit Mono axis type, a chamfered tooltip of ledger lines, and the two
   metrics taking DIFFERENT steps off the ramp so cost and runs are
   distinguishable side by side without reading the legend.

   Props are unchanged: { data, metric }. */

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Money, Duration } from '../ui/Money'
import { ChartFrame, ChartTooltip, useChartAxes } from '../dashboard/Instruments'
import EmptyState from '../ui/EmptyState'

const SPEC = {
  cost: { key: 'total_cost', name: 'Cost', color: 'var(--chart-1)' },
  runs: { key: 'run_count', name: 'Runs', color: 'var(--chart-5)' },
  duration: { key: 'duration_avg', name: 'Avg duration (s)', color: 'var(--chart-3)' },
}

export default function DailyMetricsChart({ data = [], metric = 'cost' }) {
  const { xAxis, yAxis } = useChartAxes()
  const spec = SPEC[metric] || SPEC.duration

  if (data.length === 0) {
    return (
      <ChartFrame
        height={220}
        empty={<EmptyState legend={spec.name} line="No data in this window." />}
      />
    )
  }

  const tickFormat = metric === 'cost'
    ? (v) => `$${Number(v).toFixed(2)}`
    : (v) => `${v}`

  const tooltipValue = (p) => {
    if (metric === 'cost') return <Money usd={p.value} digits={2} />
    if (metric === 'duration') return <Duration seconds={p.value} />
    return <span className="mono">{p.value}</span>
  }

  return (
    <ChartFrame height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="date" {...xAxis} />
          <YAxis {...yAxis} tickFormatter={tickFormat} allowDecimals={metric !== 'runs'} />
          <Tooltip
            cursor={{ stroke: 'var(--edge)', strokeWidth: 1 }}
            content={<ChartTooltip rows={tooltipValue} />}
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
    </ChartFrame>
  )
}
