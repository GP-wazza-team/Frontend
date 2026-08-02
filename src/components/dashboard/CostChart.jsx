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
