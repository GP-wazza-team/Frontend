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
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
    },
    {
      label: t('cost'),
      value: formatCost(stats?.total_cost_usd),
      icon: BarChart3,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: t('totalAssets'),
      value: stats?.total_assets ?? 0,
      icon: Image,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
    {
      label: 'Avg Duration',
      value: `${stats?.avg_duration_seconds ?? 0}s`,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="glass p-5 hover:bg-white/[0.06] transition-all duration-300 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/30 text-sm mb-2 font-medium">{card.label}</p>
                <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bgColor} border ${card.borderColor}`}>
                <Icon className={card.color} size={20} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
