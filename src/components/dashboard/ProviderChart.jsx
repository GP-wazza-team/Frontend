/* CALLS BY PROVIDER.

   A categorical series: the providers are different things and the chart says
   so by giving each its own step off the validated five-slot ramp.

   TWO RULES THIS FILE NOW OBEYS, and used to break.

   1. HUES ARE ASSIGNED IN FIXED ORDER AND NEVER CYCLED. The previous version
      filled with `CHART_RAMP[i % CHART_RAMP.length]`, so a sixth provider was
      painted the same colour as the first — two different entities wearing one
      colour, which is the encoding lying about the data. There are five slots,
      so the sixth and beyond fold into a single "Other" bar in a neutral ink.
      That is the honest move: a reader can see there is a tail without being
      told a false identity for it.

   2. COLOUR FOLLOWS THE ENTITY, NEVER ITS RANK. Rows arrive sorted by call
      count, so a provider that overtakes another would swap colours under the
      old code and the chart would appear to repaint itself between refreshes.
      Slots are assigned from a stable alphabetical key instead, so a provider
      keeps its colour as the numbers move.

   The bars carry their provider name on the axis, so identity never rests on
   colour alone. Square caps, no radius, no gradient.
*/

import React, { useMemo } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { ChartFrame, ChartTooltip, useChartAxes, CHART_RAMP } from './Instruments'
import EmptyState from '../ui/EmptyState'

const SLOTS = CHART_RAMP.length   // five

function ProviderChart({ data = [] }) {
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const { xAxis, yAxis } = useChartAxes()

  /* AGGREGATE BY PROVIDER FIRST. /dashboard/provider-usage returns one row per
     provider AND model, so an account using two DeepSeek models got two bars
     both labelled "deepseek" — the same name twice on one axis, which reads as
     a rendering fault. This chart is titled "calls per provider", so provider
     is the unit and the models are summed into it. The per-model detail is not
     lost; it belongs in the admin model breakdown, which is where it lives.

     Then fold the tail, then assign a stable slot per provider name. */
  const { rows, colourOf } = useMemo(() => {
    const byProvider = new Map()
    for (const r of data) {
      const key = String(r?.provider ?? '—')
      const prev = byProvider.get(key) || { provider: key, call_count: 0, models: 0 }
      prev.call_count += Number(r?.call_count) || 0
      prev.models += 1
      byProvider.set(key, prev)
    }
    const sorted = [...byProvider.values()].sort((a, b) => (Number(b.call_count) || 0) - (Number(a.call_count) || 0))
    const head = sorted.slice(0, SLOTS)
    const tail = sorted.slice(SLOTS)

    const out = [...head]
    if (tail.length > 0) {
      out.push({
        provider: ar ? `أخرى (${tail.length})` : `Other (${tail.length})`,
        call_count: tail.reduce((n, r) => n + (Number(r.call_count) || 0), 0),
        __other: true,
      })
    }

    /* Stable slot assignment: sort the NAMES, not the counts, so a provider
       keeps its colour when the ranking changes. */
    const names = head.map((r) => String(r.provider ?? '')).sort()
    const map = new Map(names.map((n, i) => [n, CHART_RAMP[i]]))

    return {
      rows: out,
      colourOf: (r) => (r.__other ? 'var(--ink-3)' : map.get(String(r.provider ?? '')) || 'var(--ink-3)'),
    }
  }, [data, ar])

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
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="provider" {...xAxis} />
          <YAxis {...yAxis} width={40} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--card-2)' }}
            content={<ChartTooltip rows={(p) => <span className="mono">{p.value}</span>} />}
          />
          <Bar dataKey="call_count" name={t('providerUsage')} isAnimationActive={false} maxBarSize={34}>
            {rows.map((entry, i) => (
              <Cell key={entry.provider ?? i} fill={colourOf(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

export default ProviderChart
