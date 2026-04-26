import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { BarChart, Bar } from 'recharts'
import { Calendar } from 'lucide-react'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(2)}`
}

export default function DailyMetricsChart({ data = [], metric = 'cost' }) {
  if (data.length === 0) {
    return (
      <div className="surface p-5 rounded-lg">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Metrics</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Trends over time</p>
        </div>
        <div className="h-56 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No data</div>
      </div>
    )
  }

  const isCost = metric === 'cost'
  const isRuns = metric === 'runs'
  const color = isCost ? 'var(--accent)' : isRuns ? '#10b981' : '#f59e0b'
  const dataKey = isCost ? 'total_cost' : isRuns ? 'run_count' : 'duration_avg'
  const name = isCost ? 'Cost' : isRuns ? 'Runs' : 'Avg Duration (s)'
  const formatter = isCost ? (v) => formatCost(v) : (v) => `${v}`

  return (
    <div className="surface p-5 rounded-lg">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Daily Metrics</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Last {data.length} days</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={formatter} />
          <Tooltip
            contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value) => [formatter(value), name]}
          />
          <Area type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} fill={`url(#grad-${metric})`} dot={{ fill: color, r: 2, strokeWidth: 0 }} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
