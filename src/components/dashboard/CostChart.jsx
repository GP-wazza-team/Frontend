import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { TrendingUp } from 'lucide-react'

function CostChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="card-light p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-orange-50">
          <TrendingUp size={18} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{t('costHistory')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-300 text-sm font-medium">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 20px -4px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ color: '#64748b', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="total_cost_usd"
              name="Cost (USD)"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: '#f97316', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#fb923c', stroke: '#f97316', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default CostChart
