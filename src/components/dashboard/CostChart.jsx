import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { TrendingUp } from 'lucide-react'

function CostChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="glass p-6 hover:bg-white/[0.06] transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <TrendingUp size={18} className="text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('costHistory')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/20 text-sm">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
            <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '12px',
                backdropFilter: 'blur(10px)',
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
            />
            <Line
              type="monotone"
              dataKey="total_cost_usd"
              name="Cost (USD)"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#a78bfa', stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default CostChart
