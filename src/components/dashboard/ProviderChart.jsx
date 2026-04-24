import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'
import { Layers } from 'lucide-react'

function ProviderChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="card-light p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-sky-50">
          <Layers size={18} className="text-sky-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{t('providerUsage')}</h3>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-300 text-sm font-medium">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="provider" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
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
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            <Bar dataKey="call_count" name="Calls" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            <Bar dataKey="total_cost_usd" name="Cost (USD)" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default ProviderChart
