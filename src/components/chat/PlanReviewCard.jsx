import React, { useState } from 'react'
import { Check, X, Pencil, Image as ImageIcon, User, RefreshCw, Film, Loader2, AlertTriangle, Monitor } from 'lucide-react'
import { useLightbox } from '../MediaLightbox'

// Fields the backend accepts for the free, no-LLM /edit call.
const EDITABLE_FIELDS = [
  { key: 'brief_summary', label: 'Summary' },
  { key: 'characters', label: 'Characters' },
  { key: 'environment', label: 'Environment' },
  { key: 'scenario', label: 'Scenario' },
]

// Fallbacks for the very first render, before /generate/models has answered.
// The real lists come from the backend, which only offers models this
// deployment has keys for.
const FALLBACK_RESOLUTIONS = ['480p', '720p', '1080p']
const FALLBACK_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9']

/**
 * One labelled dropdown in the output-settings row.
 *
 * Changes commit immediately — each is a free server-side field update, and
 * making the user press an extra Save button to change a dropdown they can see
 * the result of is friction for nothing.
 */
function SettingSelect({ label, value, options, disabled, onChange, title }) {
  return (
    <label className="flex flex-col gap-1 min-w-0" title={title}>
      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="text-[12px] rounded-md px-2 py-1.5 outline-none disabled:opacity-50 max-w-full truncate"
        style={{
          backgroundColor: 'var(--bg)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  )
}

/**
 * Quality, aspect ratio and model — settable here, before anything is paid for.
 *
 * The model list is whatever the backend says is usable, and `notes` carries
 * the consequences of the current combination (for example that Runway has no
 * 1080p tier, so 1080p would come back as 720p). Showing that here is the
 * point: the user can switch model and watch the warning clear, instead of
 * discovering it in the finished video.
 */
function OutputSettings({ plan, catalog, disabled, onChange }) {
  const resolutions = catalog?.resolutions?.length ? catalog.resolutions : FALLBACK_RESOLUTIONS
  const aspectRatios = catalog?.aspect_ratios?.length ? catalog.aspect_ratios : FALLBACK_ASPECT_RATIOS

  // Video runs pick a video model; image-only runs pick an image model. Showing
  // both would offer a choice that does not apply to what is being made.
  const isVideo = plan.needs_video
  const models = (isVideo ? catalog?.video : catalog?.image) || []
  const currentModel = isVideo ? plan.video_model : plan.image_model
  const notes = plan.render_notes || []

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: m.max_resolution && m.max_resolution !== '1080p'
      ? `${m.display_name} (max ${m.max_resolution})`
      : m.display_name,
  }))
  // Keep the current model visible even if the catalog hasn't loaded yet or the
  // run is pinned to something no longer offered — otherwise the dropdown would
  // silently appear to show a different model than the one that will run.
  if (currentModel && !modelOptions.some((o) => o.value === currentModel)) {
    modelOptions.unshift({ value: currentModel, label: currentModel })
  }

  return (
    <div className="flex flex-col gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-1.5 pt-2">
        <Monitor size={12} style={{ color: 'var(--text-tertiary)' }} />
        <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Output
        </span>
        {plan.reference_role === 'character' && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(128,128,128,0.12)', color: 'var(--text-secondary)' }}
            title="Your photo is being used as the character's likeness, not as the shot itself"
          >
            character from your photo
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <SettingSelect
          label="Quality"
          value={plan.resolution}
          options={resolutions.map((r) => ({ value: r, label: r }))}
          disabled={disabled}
          onChange={(value) => onChange({ resolution: value })}
        />
        <SettingSelect
          label="Aspect"
          value={plan.aspect_ratio}
          options={aspectRatios.map((r) => ({ value: r, label: r }))}
          disabled={disabled}
          onChange={(value) => onChange({ aspect_ratio: value })}
        />
        {modelOptions.length > 0 && (
          <SettingSelect
            label={isVideo ? 'Video model' : 'Image model'}
            value={currentModel}
            options={modelOptions}
            disabled={disabled}
            onChange={(value) => onChange(isVideo ? { video_model: value } : { image_model: value })}
            title="Runs on this model. If its account is out of credit, another provider takes over automatically."
          />
        )}
      </div>

      {notes.length > 0 && (
        <div className="flex flex-col gap-1">
          {notes.map((note) => (
            <div key={note} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

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
 *
 * `outcome` is how the card was resolved ('cancelled' | 'confirmed'). It used to
 * be called `resolution`, which now belongs to the video's output quality —
 * two different meanings for one word on the same component.
 */
function PlanReviewCard({ plan, resolved, outcome, busy, previews, catalog, onEdit, onEditScript, onPreview, onRevise, onConfirm, onCancel, onSettings }) {
  const openMedia = useLightbox()
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
          {plan.resolution && ` · ${plan.resolution} ${plan.aspect_ratio}`}
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

        {onSettings && (
          <OutputSettings
            plan={plan}
            catalog={catalog}
            disabled={disabled}
            onChange={onSettings}
          />
        )}

        {previews && previews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {previews.map((p) => (
              <div key={p.preview_type} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {p.preview_type}
                </span>
                <img
                  src={p.image_url}
                  alt={`${p.preview_type} preview`}
                  className="w-full rounded-lg object-cover max-h-40 cursor-zoom-in"
                  onClick={() => openMedia(p.image_url, 'image')}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {resolved ? (
        <div className="px-3.5 py-2.5 text-[12px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
          {outcome === 'cancelled' ? 'Cancelled.' : 'Confirmed — generating.'}
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
