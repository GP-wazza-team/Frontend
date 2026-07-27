import React, { useEffect, useState } from 'react'
import { X, AlertCircle, Film } from 'lucide-react'
import { dashboardService } from '../../services/dashboardService'

function formatCost(val, digits = 4) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(digits)}`
}

function formatTokens(input, output) {
  if (!input && !output) return '—'
  return `${(input || 0).toLocaleString()} in / ${(output || 0).toLocaleString()} out`
}

function formatLatency(ms) {
  if (!ms) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{value}</span>
    </div>
  )
}

/**
 * Drill-down for a single run. The step table is the point: each model call with
 * its own cost and a running total, so the spend is attributable rather than a
 * single opaque number on the runs list.
 */
function RunTimeline({ runId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    dashboardService.getRunTimeline(runId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err?.response?.data?.detail || 'Could not load this run') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [runId])

  // Escape closes, matching the rest of the app's overlay behaviour.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const previews = (data?.assets || []).filter((a) => a.is_preview)
  const outputs = (data?.assets || []).filter((a) => !a.is_preview)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-3xl my-auto animate-slideUp"
        style={{ backgroundColor: 'var(--bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Run details</h3>
            <p className="text-xs mt-0.5 break-words" style={{ color: 'var(--text-tertiary)' }}>
              {data?.user_prompt || runId}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--bg-hover)]">
            <X size={16} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {loading && (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {error && (
          <div className="p-6 flex items-center gap-2 text-sm" style={{ color: 'var(--badge-red-text)' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {data && !loading && (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Total cost', formatCost(data.total_cost_usd)],
                ['Credits charged', String(data.credits_charged ?? 0)],
                ['Duration', data.duration_seconds ? `${data.duration_seconds.toFixed(1)}s` : '—'],
                ['Status', data.status],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg px-3 py-2" style={{ border: '1px solid var(--border)' }}>
                  <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
                  <div className="text-[14px] font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>

            {data.plan && (data.plan.brief_summary || data.plan.characters) && (
              <div className="rounded-lg p-3.5 space-y-2.5" style={{ border: '1px solid var(--border)' }}>
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  What was approved
                </span>
                <Row label="Summary" value={data.plan.brief_summary} />
                <Row label="Characters" value={data.plan.characters} />
                <Row label="Environment" value={data.plan.environment} />
                <Row label="Scenario" value={data.plan.scenario} />
              </div>
            )}

            {data.scenes?.length > 1 && (
              <div className="rounded-lg p-3.5" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Film size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    Script — {data.scenes.length} scenes
                  </span>
                </div>
                <ol className="space-y-1">
                  {data.scenes.map((s) => (
                    <li key={s.scene_number} className="flex gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      <span className="tabular-nums flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{s.scene_number}.</span>
                      <span>{s.summary || s.scene_prompt}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div>
              <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
                Every step, beginning to end
              </span>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Time', 'Step', 'Model', 'Tokens', 'Took', 'Cost', 'Running total'].map((h) => (
                        <th key={h} className="text-left py-2 px-2 font-medium text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.steps.length === 0 && (
                      <tr><td colSpan={7} className="py-5 text-center text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                        No model calls recorded for this run.
                      </td></tr>
                    )}
                    {data.steps.map((step, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2 px-2 text-[11px] whitespace-nowrap tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                          {formatTime(step.created_at)}
                        </td>
                        <td className="py-2 px-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                          {step.scene_number && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded mr-1.5 whitespace-nowrap" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                              Scene {step.scene_number}
                            </span>
                          )}
                          {step.label}
                          {!step.success && (
                            <span className="ml-1.5 text-[10px]" style={{ color: 'var(--badge-red-text)' }} title={step.error_message || 'Failed'}>
                              failed
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] font-mono whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                          {step.model_name || '—'}
                        </td>
                        <td className="py-2 px-2 text-[11px] whitespace-nowrap tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                          {formatTokens(step.input_tokens, step.output_tokens)}
                        </td>
                        <td className="py-2 px-2 text-[11px] whitespace-nowrap tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                          {formatLatency(step.latency_ms)}
                        </td>
                        <td className="py-2 px-2 text-[12px] whitespace-nowrap tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {formatCost(step.cost_usd, 5)}
                        </td>
                        <td className="py-2 px-2 text-[12px] whitespace-nowrap tabular-nums font-semibold" style={{ color: 'var(--badge-green-text)' }}>
                          {formatCost(step.cumulative_cost_usd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {previews.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Previews you asked for
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {previews.map((a) => (
                    <img key={a.id} src={a.url} alt={a.preview_type || 'preview'} className="w-full rounded-lg object-cover max-h-32" />
                  ))}
                </div>
              </div>
            )}

            {outputs.length > 0 && (
              <div>
                <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  Final output
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {outputs.map((a) => (
                    <div key={a.id} className="rounded-lg overflow-hidden">
                      {a.asset_type === 'VIDEO'
                        ? <video controls className="w-full rounded-lg" src={a.url} />
                        : <img src={a.url} alt="output" className="w-full rounded-lg object-cover max-h-40" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RunTimeline
