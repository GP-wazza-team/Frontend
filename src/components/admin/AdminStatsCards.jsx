import React from 'react'
import { Zap, Wallet, Image, Clock, TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function StatCard({ label, value, icon: Icon, subtext, trend }) {
  return (
    <div className="surface p-4 rounded-lg transition-all duration-200 hover:border-[var(--border-hover)]">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color: 'var(--accent)' }} />
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {subtext && <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{subtext}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          {trend >= 0 ? (
            <TrendingUp size={12} style={{ color: 'var(--badge-green-text)' }} />
          ) : (
            <TrendingDown size={12} style={{ color: 'var(--badge-red-text)' }} />
          )}
          <span className="text-[11px] font-medium" style={{ color: trend >= 0 ? 'var(--badge-green-text)' : 'var(--badge-red-text)' }}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default function AdminStatsCards({ stats = {} }) {
  const successRate = stats.total_runs > 0
    ? ((stats.successful_runs || 0) / stats.total_runs * 100).toFixed(1)
    : 0

  const avgDuration = stats.avg_duration_seconds ?? 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Runs"
        value={stats.total_runs?.toLocaleString() || 0}
        icon={Zap}
        subtext={`${stats.successful_runs || 0} succeeded, ${stats.failed_runs || 0} failed`}
        trend={stats.runs_trend}
      />
      <StatCard
        label="Total Cost"
        value={formatCost(stats.total_cost_usd)}
        icon={Wallet}
        subtext={`Avg ${formatCost(stats.avg_cost_per_run)} / run`}
        trend={stats.cost_trend}
      />
      <StatCard
        label="Success Rate"
        value={`${successRate}%`}
        icon={CheckCircle2}
        subtext={`${stats.failed_runs || 0} failures`}
      />
      <StatCard
        label="Avg Duration"
        value={avgDuration < 60 ? `${avgDuration.toFixed(1)}s` : `${(avgDuration / 60).toFixed(1)}m`}
        icon={Clock}
        subtext="Per run average"
      />
      <StatCard
        label="Total Assets"
        value={stats.total_assets?.toLocaleString() || 0}
        icon={Image}
        subtext={`${stats.assets_today || 0} generated today`}
      />
      <StatCard
        label="Active Users"
        value={stats.active_users?.toLocaleString() || 0}
        icon={Users}
        subtext={`${stats.new_users_today || 0} new today`}
      />
      <StatCard
        label="Error Rate"
        value={`${stats.total_runs > 0 ? (((stats.failed_runs || 0) / stats.total_runs) * 100).toFixed(1) : 0}%`}
        icon={AlertTriangle}
        subtext={`${stats.failed_runs || 0} total failures`}
      />
      <StatCard
        label="Models Used"
        value={stats.models_used?.toLocaleString() || 0}
        icon={Zap}
        subtext="Unique model calls"
      />
    </div>
  )
}
