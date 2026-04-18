import React from 'react'
import { BarChart3, Zap, Image, Clock } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function StatsCards({ stats }) {
  const { t } = useUIStore()

  // Backend fields: total_runs, successful_runs, failed_runs,
  // total_cost_usd, avg_cost_per_run, total_assets, avg_duration_seconds
  const cards = [
    {
      label: t('totalRuns'),
      value: stats?.total_runs ?? 0,
      icon: Zap,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: t('cost'),
      value: formatCost(stats?.total_cost_usd),
      icon: BarChart3,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: t('totalAssets'),
      value: stats?.total_assets ?? 0,
      icon: Image,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Avg Duration',
      value: `${stats?.avg_duration_seconds ?? 0}s`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={card.color} size={22} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
