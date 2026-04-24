import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { Layers } from 'lucide-react'

function ProviderChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="glass p-6 hover:bg-white/[0.06] transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <Layers size={18} className="text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('providerUsage')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/20 text-sm">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="provider" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} />
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
            <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }} />
            <Bar dataKey="call_count" name="Calls" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            <Bar dataKey="total_cost_usd" name="Cost (USD)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default ProviderChart
