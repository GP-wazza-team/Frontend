import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'

// Backend returns: [{ provider, model_name, call_count, total_cost_usd, avg_latency_ms }]

function ProviderChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{t('providerUsage')}</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis dataKey="provider" stroke="#555" tick={{ fontSize: 11 }} />
            <YAxis stroke="#555" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            <Bar dataKey="call_count" name="Calls" fill="#00d9ff" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total_cost_usd" name="Cost (USD)" fill="#6c63ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default ProviderChart
