import React, { useState } from 'react'
import { Check, X, Pencil, Image as ImageIcon, User, RefreshCw, Film, Loader2 } from 'lucide-react'

// Fields the backend accepts for the free, no-LLM /edit call.
const EDITABLE_FIELDS = [
  { key: 'brief_summary', label: 'Summary' },
  { key: 'characters', label: 'Characters' },
  { key: 'environment', label: 'Environment' },
  { key: 'scenario', label: 'Scenario' },
]

function EditableField({ label, value, disabled, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const [saving, setSaving] = useState(false)

  // Re-sync when the plan is replaced underneath us (revise, clarify, ...).
  React.useEffect(() => {
    if (!editing) setDraft(value || '')
  }, [value, editing])

  const commit = async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === (value || '').trim()) {
      setEditing(false)
      setDraft(value || '')
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        {!disabled && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="opacity-60 hover:opacity-100 transition-opacity"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil size={11} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            className="w-full text-[13px] rounded-lg px-2.5 py-2 resize-y outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-hover)',
            }}
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={commit}
              disabled={saving}
              className="text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setDraft(value || '') }}
              disabled={saving}
              className="text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>
          {value || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
        </p>
      )}
    </div>
  )
}

function SceneList({ scenes, disabled, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  if (!scenes || scenes.length === 0) return null

  const startEditing = () => {
    setDraft(scenes.map((s) => s.scene_prompt).join('\n'))
    setEditing(true)
  }

  const commit = async () => {
    // One scene per non-empty line — scene numbers are reassigned server-side.
    const lines = draft.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    setSaving(true)
    try {
      await onSave(lines.map((line, i) => ({ scene_number: i + 1, scene_prompt: line, summary: '' })))
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <div className="flex items-center gap-1.5">
        <Film size={12} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Script — {scenes.length} scenes
        </span>
        {!disabled && !editing && (
          <button type="button" onClick={startEditing} className="opacity-60 hover:opacity-100 transition-opacity" title="Edit script">
            <Pencil size={11} style={{ color: 'var(--text-tertiary)' }} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(4, scenes.length + 1)}
            autoFocus
            className="w-full text-[13px] rounded-lg px-2.5 py-2 resize-y outline-none font-mono"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border-hover)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>One scene per line.</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={commit}
              disabled={saving}
              className="text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              {saving ? 'Saving…' : 'Save script'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-1">
          {scenes.map((scene) => (
            <li key={scene.scene_number} className="flex gap-2 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex-shrink-0 tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                {scene.scene_number}.
              </span>
              <span className="break-words">{scene.summary || scene.scene_prompt}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/**
 * The review step of the confirmation gate. Everything here is free except the
 * preview buttons (which generate a real image) and Confirm (which runs the
 * full generation). `resolved` freezes the card once the user has decided.
 */
function PlanReviewCard({ plan, resolved, resolution, busy, previews, onEdit, onEditScript, onPreview, onRevise, onConfirm, onCancel }) {
  const [feedback, setFeedback] = useState('')
  const [showRevise, setShowRevise] = useState(false)
  const disabled = resolved || busy

  const submitRevise = async () => {
    const trimmed = feedback.trim()
    if (!trimmed) return
    setShowRevise(false)
    setFeedback('')
    await onRevise(trimmed)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(128,128,128,0.04)' }}
    >
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
          Review before generating
        </span>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {plan.needs_video ? `${plan.duration_seconds}s video` : 'image'}
          {plan.total_cost_usd > 0 && ` · $${plan.total_cost_usd.toFixed(3)} so far`}
        </span>
      </div>

      <div className="px-3.5 py-3 flex flex-col gap-3">
        {EDITABLE_FIELDS.map(({ key, label }) => (
          <EditableField
            key={key}
            label={label}
            value={plan[key]}
            disabled={disabled}
            onSave={(text) => onEdit(key, text)}
          />
        ))}

        <SceneList scenes={plan.scenes} disabled={disabled} onSave={onEditScript} />

        {previews && previews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {previews.map((p) => (
              <div key={p.preview_type} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {p.preview_type}
                </span>
                <img src={p.image_url} alt={`${p.preview_type} preview`} className="w-full rounded-lg object-cover max-h-40" />
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved ? (
        <div className="px-3.5 py-2.5 text-[12px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
          {resolution === 'cancelled' ? 'Cancelled.' : 'Confirmed — generating.'}
        </div>
      ) : (
        <div className="px-3.5 py-2.5 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {showRevise ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                autoFocus
                placeholder="What should change?"
                className="w-full text-[13px] rounded-lg px-2.5 py-2 resize-y outline-none"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-primary)', border: '1px solid var(--border-hover)' }}
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={submitRevise}
                  disabled={busy || !feedback.trim()}
                  className="text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                  Send feedback
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevise(false)}
                  className="text-[11px] px-2 py-1 rounded-md"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onPreview('character')}
                  disabled={disabled}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  title="Generates a real image — this costs credits"
                >
                  <User size={11} /> Preview character
                </button>
                <button
                  type="button"
                  onClick={() => onPreview('environment')}
                  disabled={disabled}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  title="Generates a real image — this costs credits"
                >
                  <ImageIcon size={11} /> Preview environment
                </button>
                <button
                  type="button"
                  onClick={() => setShowRevise(true)}
                  disabled={disabled}
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  <RefreshCw size={11} /> Revise
                </button>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={disabled}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Generate
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={disabled}
                  className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default PlanReviewCard
