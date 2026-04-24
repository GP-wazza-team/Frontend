import React from 'react'
import { useUIStore } from '../../store/uiStore'
import { Clock } from 'lucide-react'

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
    <div className="card-light p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-violet-50">
          <Clock size={18} className="text-violet-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{t('recentRuns')}</h3>
      </div>

      {runs.length === 0 ? (
        <div className="py-8 text-center text-gray-300 text-sm font-medium">{t('noRuns')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">{t('date')}</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">{t('prompt')}</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">Path</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">{t('cost')}</th>
                <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, index) => (
                <tr
                  key={run.id ?? index}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3.5 px-4 text-gray-400 whitespace-nowrap text-xs">
                    {formatTime(run.started_at)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                    <span className="line-clamp-1 font-medium">
                      {run.user_prompt || '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 text-xs font-mono">
                    {run.selected_path || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 whitespace-nowrap text-xs font-bold">
                    {formatCost(run.total_cost_usd)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        (run.status === 'completed' || run.status === 'succeeded')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : run.status === 'failed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
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
