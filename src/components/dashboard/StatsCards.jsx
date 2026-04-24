import React from 'react'
import { Zap, Wallet, Image, Clock } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function StatsCards({ stats }) {
  const { t } = useUIStore()

  const cards = [
    { label: t('totalRuns'), value: stats?.total_runs ?? 0, icon: Zap },
    { label: t('cost'), value: formatCost(stats?.total_cost_usd), icon: Wallet },
    { label: t('totalAssets'), value: stats?.total_assets ?? 0, icon: Image },
    { label: 'Avg Duration', value: `${stats?.avg_duration_seconds ?? 0}s`, icon: Clock },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="surface p-4 transition-all duration-200 hover:border-[var(--border-hover)]">
            <div className="flex items-center gap-2 mb-3">
              <Icon size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{card.label}</span>
            </div>
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}

export default StatsCards
