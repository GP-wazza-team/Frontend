/* CALLS BY PROVIDER.

   A categorical series, so each bar takes its own step off the five-tone ramp
   rather than every bar sharing one accent fill — the providers are different
   things and the chart should say so. Every step in the ramp clears 3:1
   against --panel in both themes, so the bars are legible as UI objects, not
   just as shapes.

   Square caps. The old [4,4,0,0] radius is gone with every other curve in the
   application. */

import React from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { ChartFrame, ChartTooltip, useChartAxes, CHART_RAMP } from './Instruments'
import EmptyState from '../ui/EmptyState'

function ProviderChart({ data = [] }) {
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
              ? 'لم يُستدعَ أي مزوّد بعد.'
              : 'No provider has been called yet.'}
          />
        )}
      />
    )
  }

  return (
    <ChartFrame height={220}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="provider" {...xAxis} />
          <YAxis {...yAxis} width={40} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--sunk)' }}
            content={<ChartTooltip rows={(p) => <span className="mono">{p.value}</span>} />}
          />
          <Bar dataKey="call_count" name={t('providerUsage')} isAnimationActive={false} maxBarSize={34}>
            {data.map((entry, i) => (
              <Cell key={i} fill={CHART_RAMP[i % CHART_RAMP.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export default ProviderChart
