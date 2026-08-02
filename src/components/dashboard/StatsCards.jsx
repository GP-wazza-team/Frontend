/* THE RUBRIC STRIP — what used to be four generic cards.

   Four bordered boxes, each led by the same amber glyph, each with its label
   in tracked caps, is the icon-plus-label-plus-number pattern every dashboard
   template ships with. It also spent the accent on decoration, which this
   system forbids: amber means RUNNING or COSTS MONEY, nothing else.

   Now it is ONE instrument, ruled into cells on a shared baseline grid,
   sitting directly on --paper. No card edge, no hover, no icons. Every value
   goes through the ledger line, so the magnitude lands before the precision,
   and the two cells that have a series behind them carry a 14-day sparkmeter
   so the number has a shape as well as a size. */

import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { Money, Duration } from '../ui/Money'
import { Rubric, Figure } from './Instruments'

function StatsCards({ stats, costSeries = [], runSeries = [] }) {
  const { t, language } = useUIStore()
  const ar = language === 'ar'

  const hasCost = costSeries.some((v) => Number(v) > 0)
  const hasRuns = runSeries.some((v) => Number(v) > 0)
  const window = ar ? 'آخر ١٤ يومًا' : 'last 14 days'

  const cells = [
    {
      key: 'runs',
      legend: t('totalRuns'),
      value: <Figure value={(stats?.total_runs ?? 0).toLocaleString('en-US')} />,
      series: hasRuns ? runSeries : undefined,
      seriesLabel: `${t('totalRuns')} — ${window}`,
      note: hasRuns ? undefined : (ar ? 'كل الوقت' : 'all time'),
    },
    {
      key: 'cost',
      legend: t('cost'),
      value: <Money usd={stats?.total_cost_usd} style={{ fontSize: 20, lineHeight: 1.15 }} />,
      series: hasCost ? costSeries : undefined,
      seriesLabel: `${t('cost')} — ${window}`,
      note: hasCost ? undefined : (ar ? 'كل الوقت' : 'all time'),
    },
    {
      key: 'assets',
      legend: t('totalAssets'),
      value: <Figure value={(stats?.total_assets ?? 0).toLocaleString('en-US')} />,
      note: ar ? 'صور وفيديو وصوت' : 'images, video, audio',
    },
    {
      key: 'duration',
      legend: ar ? 'متوسط المدة' : 'Avg duration',
      value: <Duration seconds={stats?.avg_duration_seconds ?? 0} style={{ fontSize: 20, lineHeight: 1.15 }} />,
      note: ar ? 'لكل تشغيل' : 'per run',
    },
  ]

  return <Rubric cells={cells} columns={4} />
}

export default StatsCards
