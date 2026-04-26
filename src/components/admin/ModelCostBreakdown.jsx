import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Cpu } from 'lucide-react'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

const COLORS = [
  'var(--accent)',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
]

export default function ModelCostBreakdown({ data = [], totalCost = 0 }) {
  if (data.length === 0) {
    return (
      <div className="surface p-5 rounded-lg">
        <div className="mb-4">
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Model Cost Breakdown</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Cost by model / provider</p>
        </div>
        <div className="h-56 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No data</div>
      </div>
    )
  }

  // Sort by cost desc
  const sorted = [...data].sort((a, b) => (b.cost_usd || 0) - (a.cost_usd || 0))
  const topModels = sorted.slice(0, 8)

  return (
    <div className="surface p-5 rounded-lg">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Model Cost Breakdown</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Cost by model / provider — Total: {formatCost(totalCost)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={topModels} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
            <YAxis dataKey="model" type="category" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              formatter={(value) => [formatCost(value), 'Cost']}
            />
            <Bar dataKey="cost_usd" name="Cost" fill="var(--accent)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Pie Chart + Legend */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={topModels}
                dataKey="cost_usd"
                nameKey="model"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {topModels.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => formatCost(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full mt-2 space-y-1">
            {topModels.map((m, idx) => {
              const pct = totalCost > 0 ? ((m.cost_usd / totalCost) * 100).toFixed(1) : 0
              return (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate max-w-[120px]" style={{ color: 'var(--text-secondary)' }}>{m.model}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-tertiary)' }}>{formatCost(m.cost_usd)}</span>
                    <span className="w-10 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
