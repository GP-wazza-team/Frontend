import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useUIStore } from '../../store/uiStore'

// Backend returns: [{ date, run_count, total_cost_usd }]

function CostChart({ data = [] }) {
  const { t } = useUIStore()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{t('costHistory')}</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          {t('noRuns')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 11 }} />
            <YAxis stroke="#555" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a3e',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="total_cost_usd"
              name="Cost (USD)"
              stroke="#6c63ff"
              strokeWidth={2}
              dot={{ fill: '#6c63ff', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default CostChart
