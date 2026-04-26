import React from 'react'
import { X, Clock, DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle, Zap, Layers } from 'lucide-react'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return '—'
  }
}

function formatDuration(ms) {
  if (!ms && ms !== 0) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = ((ms % 60000) / 1000).toFixed(1)
  return `${mins}m ${secs}s`
}

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(6)}`
}

function StatusBadge({ status }) {
  const styles = {
    completed: { bg: 'var(--badge-green-bg)', text: 'var(--badge-green-text)' },
    succeeded: { bg: 'var(--badge-green-bg)', text: 'var(--badge-green-text)' },
    failed: { bg: 'var(--badge-red-bg)', text: 'var(--badge-red-text)' },
    running: { bg: 'var(--badge-amber-bg)', text: 'var(--badge-amber-text)' },
    pending: { bg: 'var(--badge-amber-bg)', text: 'var(--badge-amber-text)' },
  }
  const s = (status || '').toLowerCase()
  const style = styles[s] || styles.pending
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ backgroundColor: style.bg, color: style.text }}>
      {status || '—'}
    </span>
  )
}

function StepIcon({ status }) {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'succeeded') return <CheckCircle2 size={14} style={{ color: 'var(--badge-green-text)' }} />
  if (s === 'failed') return <XCircle size={14} style={{ color: 'var(--badge-red-text)' }} />
  if (s === 'running') return <Loader2 size={14} className="animate-spin" style={{ color: 'var(--badge-amber-text)' }} />
  return <AlertCircle size={14} style={{ color: 'var(--text-tertiary)' }} />
}

export default function RunDetailDrawer({ run, onClose }) {
  if (!run) return null

  const steps = Array.isArray(run.steps) ? run.steps : []
  const assets = Array.isArray(run.assets) ? run.assets : []
  const modelCalls = Array.isArray(run.model_calls) ? run.model_calls : []

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-2xl h-full overflow-y-auto animate-slideInRight"
        style={{ backgroundColor: 'var(--bg)', borderLeft: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <Zap size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Run #{run.id}</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatTime(run.started_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
            <X size={18} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="surface p-3 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Total Cost</span>
              </div>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCost(run.total_cost_usd)}</p>
            </div>
            <div className="surface p-3 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Duration</span>
              </div>
              <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDuration(run.duration_ms)}</p>
            </div>
            <div className="surface p-3 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Layers size={12} style={{ color: 'var(--accent)' }} />
                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Status</span>
              </div>
              <div className="pt-0.5"><StatusBadge status={run.status} /></div>
            </div>
          </div>

          {/* Prompt Section */}
          <div className="surface p-4 rounded-lg">
            <h3 className="text-[13px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>User Prompt</h3>
            <p className="text-[13px] leading-relaxed p-3 rounded-md" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              {run.user_prompt || 'No prompt recorded'}
            </p>
            {run.system_prompt && (
              <div className="mt-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>System Prompt</h4>
                <pre className="text-[11px] p-3 rounded-md overflow-x-auto whitespace-pre-wrap" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                  {run.system_prompt}
                </pre>
              </div>
            )}
          </div>

          {/* Path & Chat Info */}
          <div className="surface p-4 rounded-lg">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Execution Context</h3>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Selected Path</span>
                <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{run.selected_path || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Chat ID</span>
                <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{run.chat_id || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>User</span>
                <span style={{ color: 'var(--text-secondary)' }}>{run.user_email || run.user_id || '—'}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-tertiary)' }}>Provider</span>
                <span style={{ color: 'var(--text-secondary)' }}>{run.provider || '—'}</span>
              </div>
            </div>
          </div>

          {/* Model Calls Breakdown */}
          {modelCalls.length > 0 && (
            <div className="surface p-4 rounded-lg">
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Model Calls ({modelCalls.length})</h3>
              <div className="space-y-2">
                {modelCalls.map((call, idx) => (
                  <div key={idx} className="p-3 rounded-md" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold" style={{ color: 'var(--accent)' }}>{call.model || call.provider || 'Unknown'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>{call.operation || 'call'}</span>
                      </div>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--badge-green-text)' }}>{formatCost(call.cost_usd)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                      <span>Duration: {formatDuration(call.duration_ms)}</span>
                      {call.tokens_input !== undefined && <span>Tokens In: {call.tokens_input}</span>}
                      {call.tokens_output !== undefined && <span>Tokens Out: {call.tokens_output}</span>}
                      {call.tokens_total !== undefined && <span>Total Tokens: {call.tokens_total}</span>}
                    </div>
                    {call.purpose && (
                      <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>Purpose: </span>{call.purpose}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Timeline */}
          {steps.length > 0 && (
            <div className="surface p-4 rounded-lg">
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Execution Steps ({steps.length})</h3>
              <div className="space-y-0">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 pb-4 relative">
                    {/* Timeline line */}
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-px" style={{ backgroundColor: 'var(--border)' }} />
                    )}
                    <div className="mt-0.5 shrink-0"><StepIcon status={step.status} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{step.name || `Step ${idx + 1}`}</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatDuration(step.duration_ms)}</span>
                      </div>
                      {step.description && (
                        <p className="text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>{step.description}</p>
                      )}
                      {step.error && (
                        <pre className="text-[11px] p-2 rounded mt-1 overflow-x-auto" style={{ backgroundColor: 'rgba(251,113,133,0.08)', color: 'var(--badge-red-text)' }}>
                          {step.error}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Assets */}
          {assets.length > 0 && (
            <div className="surface p-4 rounded-lg">
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Generated Assets ({assets.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {assets.map((asset, idx) => {
                  const url = asset.url || asset.public_url || asset.storage_url || ''
                  const type = (asset.asset_type || '').toLowerCase()
                  return (
                    <div key={idx} className="p-2 rounded-md" style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                      {type === 'image' && url ? (
                        <img src={url} alt="" className="w-full aspect-video object-cover rounded mb-2" />
                      ) : type === 'video' && url ? (
                        <video src={url} className="w-full aspect-video object-cover rounded mb-2" />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center rounded mb-2" style={{ backgroundColor: 'var(--bg-surface)' }}>
                          <span className="text-[11px] uppercase font-semibold" style={{ color: 'var(--text-tertiary)' }}>{type || 'file'}</span>
                        </div>
                      )}
                      <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{asset.filename || asset.id}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Raw JSON (collapsible) */}
          <details className="surface rounded-lg overflow-hidden">
            <summary className="px-4 py-3 text-[12px] font-medium cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
              Raw Run Data
            </summary>
            <pre className="p-4 text-[11px] overflow-x-auto" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
              {JSON.stringify(run, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  )
}
