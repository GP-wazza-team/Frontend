import React from 'react'
import { useUIStore } from '../../store/uiStore'

// Backend returns: [{ id, chat_id, status, user_prompt, total_cost_usd, selected_path, started_at, finished_at, duration_seconds }]

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function RecentRuns({ runs = [] }) {
  const { t } = useUIStore()

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{t('recentRuns')}</h3>
      {runs.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">{t('noRuns')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a3e] text-gray-400">
                <th className="text-left py-3 px-4 font-medium">{t('date')}</th>
                <th className="text-left py-3 px-4 font-medium">{t('prompt')}</th>
                <th className="text-left py-3 px-4 font-medium">Path</th>
                <th className="text-left py-3 px-4 font-medium">{t('cost')}</th>
                <th className="text-left py-3 px-4 font-medium">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, index) => (
                <tr
                  key={run.id ?? index}
                  className="border-b border-[#2a2a3e]/50 hover:bg-[#1a1a2e]/50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {formatTime(run.started_at)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 max-w-xs">
                    <span className="line-clamp-1">
                      {run.user_prompt || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">
                    {run.selected_path || '—'}
                  </td>
                  <td className="py-3 px-4 text-green-400 whitespace-nowrap">
                    {formatCost(run.total_cost_usd)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        (run.status === 'completed' || run.status === 'succeeded')
                          ? 'bg-green-500/20 text-green-400'
                          : run.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {run.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RecentRuns
