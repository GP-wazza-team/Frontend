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
    <div className="glass p-6 hover:bg-white/[0.06] transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Clock size={18} className="text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">{t('recentRuns')}</h3>
      </div>

      {runs.length === 0 ? (
        <div className="py-8 text-center text-white/20 text-sm">{t('noRuns')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30">
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('date')}</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('prompt')}</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">Path</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('cost')}</th>
                <th className="text-left py-3 px-4 font-medium text-xs uppercase tracking-wider">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, index) => (
                <tr
                  key={run.id ?? index}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-4 text-white/30 whitespace-nowrap text-xs">
                    {formatTime(run.started_at)}
                  </td>
                  <td className="py-3.5 px-4 text-white/60 max-w-xs">
                    <span className="line-clamp-1">
                      {run.user_prompt || '—'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-white/20 text-xs font-mono">
                    {run.selected_path || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 whitespace-nowrap text-xs font-medium">
                    {formatCost(run.total_cost_usd)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        (run.status === 'completed' || run.status === 'succeeded')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : run.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
