import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useUIStore } from '../../store/uiStore'

function CostChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="surface p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('costHistory')}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</p>
      </div>
      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('noRuns')}</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--border)" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ color: 'var(--text-secondary)' }}
            />
            <Line type="monotone" dataKey="total_cost_usd" name="Cost" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 2, strokeWidth: 0 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default CostChart
