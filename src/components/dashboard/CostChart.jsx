/* SPEND OVER TIME.

   Restyled to the instrument grammar: no gridlines (the X axis draws the one
   baseline the chart needs), Commit Mono axis type at 10px, no dots on the
   line — a dot per day on a 30-day series is 30 pieces of noise — and a
   tooltip that is a chamfered plate of ledger lines rather than a floating
   card with a radius.

   RTL: the axes are flipped explicitly. recharts has no direction awareness,
   and a time series running against the text is a bug, not a detail. */

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { Money } from '../ui/Money'
import { ChartFrame, ChartTooltip, useChartAxes } from './Instruments'
import EmptyState from '../ui/EmptyState'

function CostChart({ data = [] }) {
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const { xAxis, yAxis } = useChartAxes()

  if (data.length === 0) {
    return (
      <ChartFrame
        height={220}
        empty={(
          <EmptyState
            legend={t('noRuns')}
            line={ar
              ? 'لا يوجد إنفاق مسجّل في هذه النافذة. سيظهر أول تشغيل هنا فور تأكيده.'
              : 'No spend recorded in this window. The first confirmed run lands here.'}
          />
        )}
      />
    )
  }

  /* ONE POINT IS NOT A TREND, so it is not drawn as one.
     With a single day of history the line chart rendered a lone dot floating
     in 220px of empty grid with a full y-axis beside it — a chart shaped like
     an error. A single value's job is to be READ, so it is stated as a figure
     and the chart returns once there is a second day to compare it against. */
  if (data.length === 1) {
    const only = data[0]
    return (
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1" style={{ paddingBlock: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)' }}>
          <Money usd={Number(only?.total_cost_usd) || 0} />
        </span>
        <span className="mono caption">{only?.date}</span>
        <span className="caption" style={{ marginInlineStart: 'auto' }}>
          {ar
            ? 'يوم واحد من السجل — سيُرسم المنحنى عند توفّر يوم ثانٍ.'
            : 'One day of history — the trend line appears once there is a second.'}
        </span>
      </div>
    )
  }

  return (
    <ChartFrame height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="date" {...xAxis} />
          <YAxis {...yAxis} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} />
          <Tooltip
            cursor={{ stroke: 'var(--edge)', strokeWidth: 1 }}
            content={<ChartTooltip rows={(p) => <Money usd={p.value} />} />}
          />
          <Line
            type="linear"
            dataKey="total_cost_usd"
            name={t('cost')}
            stroke="var(--chart-1)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 2.5, fill: 'var(--chart-1)', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export default CostChart
