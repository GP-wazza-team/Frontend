import React from 'react'
import { BarChart3, Zap, Image, Clock } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function StatsCards({ stats }) {
  const { t } = useUIStore()

  const cards = [
    {
      label: t('totalRuns'),
      value: stats?.total_runs ?? 0,
      icon: Zap,
      accent: 'border-t-orange-500',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: t('cost'),
      value: formatCost(stats?.total_cost_usd),
      icon: BarChart3,
      accent: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: t('totalAssets'),
      value: stats?.total_assets ?? 0,
      icon: Image,
      accent: 'border-t-sky-500',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-500',
    },
    {
      label: 'Avg Duration',
      value: `${stats?.avg_duration_seconds ?? 0}s`,
      icon: Clock,
      accent: 'border-t-violet-500',
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className={`card-light p-5 hover:shadow-md hover:shadow-gray-200/60 transition-all duration-300 ${card.accent}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-2 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <Icon className={card.iconColor} size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
