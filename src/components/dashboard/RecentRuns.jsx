import React from 'react'
import { useUIStore } from '../../store/uiStore'

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
    <div className="surface p-5">
      <div className="mb-4">
        <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{t('recentRuns')}</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Latest generation runs</p>
      </div>
      {runs.length === 0 ? (
        <div className="py-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('noRuns')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('date')}</th>
                <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('prompt')}</th>
                <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Path</th>
                <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('cost')}</th>
                <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run, index) => (
                <tr key={run.id ?? index} className="transition-colors hover:bg-[var(--bg-hover)]" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 px-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-tertiary)' }}>{formatTime(run.started_at)}</td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <span className="line-clamp-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{run.user_prompt || '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{run.selected_path || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-xs font-semibold" style={{ color: 'var(--badge-green-text)' }}>{formatCost(run.total_cost_usd)}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{
                      backgroundColor: (run.status === 'completed' || run.status === 'succeeded') ? 'var(--badge-green-bg)' : run.status === 'failed' ? 'var(--badge-red-bg)' : 'var(--badge-amber-bg)',
                      color: (run.status === 'completed' || run.status === 'succeeded') ? 'var(--badge-green-text)' : run.status === 'failed' ? 'var(--badge-red-text)' : 'var(--badge-amber-text)'
                    }}>
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
