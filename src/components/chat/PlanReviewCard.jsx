/* ═══════════════════════════════════════════════════════════════════════════
   THE COMMIT GATE

   This card is the product. Everything before it is instrumentation for one
   decision, and everything after it costs money. So it is composed as a WORK
   ORDER, not a chat bubble:

     LEADING COLUMN   the editable prose as ruled entries — legend, prose, a 1px
                      rule between, and the amend mark parked at --ink-3 on the
                      trailing edge of each row. The spec asks for it on hover
                      only; it stays visible because a hover-only control is
                      unreachable on a touch device, and this is the one place
                      a user rewrites the brief.
     TRAILING COLUMN  the SPEC BLOCK, 236px, Commit Mono, on a shared baseline
                      grid so MODEL / QUALITY / ASPECT / SCENES / SECONDS / EST.
                      stack in a rigid aligned column. The three that are
                      changeable are selects sitting on that same grid — the
                      block is both the readout and the control surface, which
                      is what an instrument panel is.
     THE COMMIT STRIP free actions with HOLLOW marks (Revise, Cancel), costing
                      actions with FILLED marks (the two previews), and then the
                      single filled thing on the entire screen: a slab whose
                      LABEL IS THE PRICE. You press the number.

   `resolved` freezes the card and the footer is replaced by the seam.
   `outcome` is how it was resolved ('cancelled' | 'confirmed'). It used to be
   called `resolution`, which now belongs to the video's output quality — two
   different meanings for one word on the same component.

   Every handler, prop name, guard and network call is exactly as it was.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import {
  Commit, Void, Amend, Environment, Character, Revise, Script, Caret, Check,
} from '../Icon'
import Meter from '../ui/Meter'
import { Money } from '../ui/Money'
import { useLightbox } from '../MediaLightbox'
import { useChatText } from './chatKit'
import Frame from '../ui/Frame'

// Fields the backend accepts for the free, no-LLM /edit call.
const EDITABLE_FIELDS = [
  { key: 'brief_summary', label: 'summary' },
  { key: 'characters', label: 'characters' },
  { key: 'environment', label: 'environment' },
  { key: 'scenario', label: 'scenario' },
]

// Fallbacks for the very first render, before /generate/models has answered.
// The real lists come from the backend, which only offers models this
// deployment has keys for.
const FALLBACK_RESOLUTIONS = ['480p', '720p', '1080p']
const FALLBACK_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9']
const FALLBACK_DURATIONS = [5, 10, 15, 20]

/* ── THE SPEC BLOCK ───────────────────────────────────────────────────────── */

/** One row of the spec block: a label in the leading column, the value or the
 *  control in the trailing one, both on the same baseline grid. */
function SpecRow({ label, children, title }) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-2" title={title}>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', textAlign: 'start' }}>
        {label}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/**
 * A spec-block dropdown. Changes commit immediately — each is a free
 * server-side field update, and making the user press an extra Save button to
 * change a dropdown they can see the result of is friction for nothing.
 */
function SpecSelect({ value, options, disabled, onChange, label }) {
  return (
    <span className="relative block min-w-0">
      <select
        value={value ?? ''}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="field field--sm select mono disabled:opacity-50"
        style={{ fontSize: 11, textAlign: 'start', direction: 'ltr' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ insetInlineEnd: 12, insetBlockStart: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}
      >
        <Caret size={12} direction="down" />
      </span>
    </span>
  )
}

/** A static spec value — never editable, always a ledger line. */
function SpecValue({ children }) {
  return (
    <span className="mono block" style={{ fontSize: 12, color: 'var(--ink)', textAlign: 'end' }}>
      {children}
    </span>
  )
}

/**
 * Quality, aspect ratio and model — settable here, before anything is paid for.
 *
 * The model list is whatever the backend says is usable, and `notes` carries
 * the consequences of the current combination (for example that Runway has no
 * 1080p tier, so 1080p would come back as 720p). Showing that here is the
 * point: the user can switch model and watch the warning clear, instead of
 * discovering it in the finished video. The warning is amber TEXT — the colour
 * already carries it, so the alert triangle is gone.
 */
function SpecBlock({ plan, catalog, disabled, onChange, tx }) {
  const resolutions = catalog?.resolutions?.length ? catalog.resolutions : FALLBACK_RESOLUTIONS
  const aspectRatios = catalog?.aspect_ratios?.length ? catalog.aspect_ratios : FALLBACK_ASPECT_RATIOS
  const durations = catalog?.durations?.length ? catalog.durations : FALLBACK_DURATIONS

  const isVideo = plan.needs_video
  const notes = plan.render_notes || []
  const sceneCount = plan.scenes?.length || 0

  /**
   * Options for one model dropdown.
   *
   * The current model is always included even when the catalog hasn't loaded or
   * the run is pinned to something no longer offered — otherwise the dropdown
   * would show a different model than the one that will actually run.
   */
  const modelOptions = (models, current) => {
    const options = (models || []).map((m) => {
      const limits = []
      if (m.max_resolution && m.max_resolution !== '1080p') limits.push(`max ${m.max_resolution}`)
      if (m.max_duration_seconds) limits.push(`max ${m.max_duration_seconds}s`)
      return {
        value: m.id,
        label: limits.length ? `${m.display_name} (${limits.join(', ')})` : m.display_name,
      }
    })
    if (current && !options.some((o) => o.value === current)) {
      options.unshift({ value: current, label: current })
    }
    return options
  }

  const videoOptions = modelOptions(catalog?.video, plan.video_model)
  const imageOptions = modelOptions(catalog?.image, plan.image_model)

  return (
    <div className="flex flex-col gap-3">
      <span className="legend" style={{ margin: 0 }}>{tx('spec')}</span>

      <div className="flex flex-col gap-2">
        {/* Both pickers are shown on a video run: the reference image and the
            video are produced by different models, and the image model is what
            decides whether an uploaded photo's likeness can be kept. */}
        {isVideo && videoOptions.length > 0 && onChange && (
          <SpecRow
            label={tx('model')}
            title="Runs on this model. If its account is out of credit, another provider takes over automatically."
          >
            <SpecSelect
              label={tx('model')}
              value={plan.video_model}
              options={videoOptions}
              disabled={disabled}
              onChange={(value) => onChange({ video_model: value })}
            />
          </SpecRow>
        )}

        {plan.needs_images && imageOptions.length > 0 && onChange && (
          <SpecRow
            label={tx('imageModel')}
            title="Draws the reference image. Only GPT Image 2 can read an uploaded photo and keep the person's likeness."
          >
            <SpecSelect
              label={tx('imageModel')}
              value={plan.image_model}
              options={imageOptions}
              disabled={disabled}
              onChange={(value) => onChange({ image_model: value })}
            />
          </SpecRow>
        )}

        {onChange ? (
          <SpecRow label={tx('quality')}>
            <SpecSelect
              label={tx('quality')}
              value={plan.resolution}
              options={resolutions.map((r) => ({ value: r, label: r }))}
              disabled={disabled}
              onChange={(value) => onChange({ resolution: value })}
            />
          </SpecRow>
        ) : plan.resolution && (
          <SpecRow label={tx('quality')}><SpecValue>{plan.resolution}</SpecValue></SpecRow>
        )}

        {onChange ? (
          <SpecRow label={tx('aspect')}>
            <SpecSelect
              label={tx('aspect')}
              value={plan.aspect_ratio}
              options={aspectRatios.map((r) => ({ value: r, label: r }))}
              disabled={disabled}
              onChange={(value) => onChange({ aspect_ratio: value })}
            />
          </SpecRow>
        ) : plan.aspect_ratio && (
          <SpecRow label={tx('aspect')}><SpecValue>{plan.aspect_ratio}</SpecValue></SpecRow>
        )}

        {isVideo && (onChange ? (
          <SpecRow
            label={tx('seconds')}
            title="Length of each scene. Longer than a model supports is capped — the warning below says by how much."
          >
            <SpecSelect
              label={tx('seconds')}
              value={plan.duration_seconds}
              options={durations.map((d) => ({ value: d, label: `${d}s` }))}
              disabled={disabled}
              onChange={(value) => onChange({ duration_seconds: Number(value) })}
            />
          </SpecRow>
        ) : (
          <SpecRow label={tx('seconds')}><SpecValue>{plan.duration_seconds}s</SpecValue></SpecRow>
        ))}

        {sceneCount > 0 && (
          <SpecRow label={tx('sceneCount')}><SpecValue>{sceneCount}</SpecValue></SpecRow>
        )}

        {plan.total_cost_usd > 0 && (
          <SpecRow label={tx('estimate')}>
            <Money usd={plan.total_cost_usd} style={{ fontSize: 12, color: 'var(--ink)', display: 'block' }} />
          </SpecRow>
        )}
      </div>

      {notes.length > 0 && (
        <div className="flex flex-col gap-1" style={{ borderBlockStart: '1px solid var(--etch)', paddingBlockStart: 8 }}>
          {notes.map((note) => (
            <span key={note} style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--signal)' }}>
              {note}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── THE PROSE ENTRIES ────────────────────────────────────────────────────── */

function EditableField({ label, value, disabled, onSave, tx }) {
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
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3"
      style={{ paddingBlock: 12, borderBlockEnd: '1px solid var(--etch)' }}
    >
      <div className="min-w-0">
        <span className="legend" style={{ margin: 0, marginBlockEnd: 4 }}>{tx(label)}</span>

        {editing ? (
          <div className="flex flex-col gap-2" style={{ marginBlockStart: 4 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="field"
              style={{ fontSize: 13, lineHeight: 'var(--lh-body)' }}
            />
            <div className="flex items-center gap-6">
              <button type="button" onClick={commit} disabled={saving} className="text-action">
                {saving ? <Meter cells={3} mode="indeterminate" tone="signal" /> : <Check size={16} />}
                {saving ? tx('saving') : tx('save')}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setDraft(value || '') }}
                disabled={saving}
                className="text-action"
              >
                <Void size={16} />
                {tx('cancel')}
              </button>
            </div>
          </div>
        ) : (
          <p
            className="whitespace-pre-wrap break-words"
            style={{ fontSize: 15, lineHeight: 'var(--lh-body)', color: 'var(--ink)', maxInlineSize: '68ch' }}
          >
            {value || <span style={{ color: 'var(--ink-3)' }}>{tx('empty')}</span>}
          </p>
        )}
      </div>

      {/* The amend mark rests invisible and arrives on hover or keyboard focus.
          It is never hidden from the keyboard — focus-within brings it back. */}
      {!disabled && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={`${tx('edit')} — ${tx(label)}`}
          aria-label={`${tx('edit')} — ${tx(label)}`}
          className="text-action"
          style={{ padding: 2, color: 'var(--ink-3)' }}
        >
          <Amend size={16} />
        </button>
      )}
    </div>
  )
}

/**
 * The scene list. Scene indices sit in the SAME leading gutter the transcript's
 * turn indices use, so a scene number and a turn number land on one axis.
 */
function SceneList({ scenes, disabled, onSave, tx }) {
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
    <div style={{ paddingBlock: 12 }}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3">
        <span className="legend" style={{ margin: 0 }}>
          {tx('script')} — {scenes.length} {tx('scenes')}
        </span>
        {!disabled && !editing && (
          <button
            type="button"
            onClick={startEditing}
            title={`${tx('edit')} — ${tx('script')}`}
            aria-label={`${tx('edit')} — ${tx('script')}`}
            className="text-action"
            style={{ padding: 2, color: 'var(--ink-3)' }}
          >
            <Amend size={16} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2" style={{ marginBlockStart: 4 }}>
          {/* Raw editing field: mono is honest here — the user is looking at one
              prompt per line, not at prose. */}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.max(4, scenes.length + 1)}
            autoFocus
            className="field mono"
            style={{ fontSize: 12, lineHeight: 1.6, textAlign: 'start', direction: 'ltr' }}
          />
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{tx('onePerLine')}</span>
          <div className="flex items-center gap-6">
            <button type="button" onClick={commit} disabled={saving} className="text-action">
              {saving ? <Meter cells={3} mode="indeterminate" tone="signal" /> : <Check size={16} />}
              {saving ? tx('saving') : tx('saveScript')}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className="text-action">
              <Void size={16} />
              {tx('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <ol style={{ marginBlockStart: 4 }}>
          {scenes.map((scene) => (
            <li
              key={scene.scene_number}
              className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline"
              style={{ paddingBlock: 6, borderBlockStart: '1px solid var(--etch)' }}
            >
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>
                {String(scene.scene_number).padStart(2, '0')}
              </span>
              <span
                className="break-words"
                style={{ fontSize: 15, lineHeight: 'var(--lh-body)', color: 'var(--ink)', maxInlineSize: '68ch' }}
              >
                {scene.summary || scene.scene_prompt}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

/* ── THE CARD ─────────────────────────────────────────────────────────────── */

function PlanReviewCard({ plan, resolved, outcome, busy, previews, catalog, onEdit, onEditScript, onPreview, onRevise, onConfirm, onCancel, onSettings }) {
  const openMedia = useLightbox()
  const { tx } = useChatText()
  const [feedback, setFeedback] = useState('')
  const [showRevise, setShowRevise] = useState(false)
  const characterNames = plan.character_names || []
  const [selectedCharacter, setSelectedCharacter] = useState(characterNames[0] || '')
  const disabled = resolved || busy

  // The plan can be replaced entirely (revise, clarify, edit) — keep the
  // selection valid, and pick a default the first time names show up.
  React.useEffect(() => {
    if (characterNames.length === 0) return
    if (!characterNames.includes(selectedCharacter)) setSelectedCharacter(characterNames[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.character_names])

  const submitRevise = async () => {
    const trimmed = feedback.trim()
    if (!trimmed) return
    setShowRevise(false)
    setFeedback('')
    await onRevise(trimmed)
  }

  const cost = Number(plan.total_cost_usd)
  const hasCost = Number.isFinite(cost) && cost > 0

  return (
    <div
      /* L2 — THE SEAL, and this is where the whole system spends its one
         signature. Before authorisation this is a plain plate: a work order
         you are still reading. The moment it is authorised the corner is
         CUT, permanently, and stays cut a hundred turns later. In registry
         practice an issued instrument is clipped at one corner with shears —
         the mark that says this was recorded and cannot be issued again.

         That is why the class is conditional rather than constant. A cut on
         an unresolved plan would be a lie about what has happened, and it is
         the difference between a geometry that MEANS something and a bevel. */
      className={resolved ? 'cut cut-lg' : ''}
      style={{
        /* RESOLVED: the docket freezes into the draft surface — it is a
           record now, not a control. It is NOT dimmed: --ink at 60% over
           --sunk computes to 4.16:1 in the light theme and fails AA, and
           dimming the whole container drags --ink-3 down to 3.32:1. A
           settled work order still has to be readable a hundred turns
           later, so the surface changes and the ink does not. */
        backgroundColor: resolved ? 'var(--sunk)' : 'var(--panel)',
        boxShadow: 'inset 0 0 0 1px var(--etch)',
        paddingBlock: 16,
        paddingInlineStart: 16,
        /* Clear the cut: the trailing padding only has to budget the 8px
           chamfer + 10px once the seal is actually there. Unsealed, the plate
           takes the system's normal 16px and nothing is ever sliced. */
        paddingInlineEnd: resolved ? 24 : 16,
      }}
    >
      <div className="flex items-center gap-3" style={{ marginBlockEnd: 8 }}>
        <Script size={16} style={{ color: 'var(--ink-3)' }} />
        <span className="legend" style={{ margin: 0 }}>{tx('workOrder')}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{tx('reviewBefore')}</span>
        {/* The docket's own busy state. It lives here rather than inside the
            commit slab: an amber meter on an amber fill is unreadable in the
            light theme, and the header is where the eye already is. */}
        {busy && (
          <span className="ms-auto">
            <Meter cells={5} mode="indeterminate" tone="signal" label={tx('workOrder')} />
          </span>
        )}
      </div>

      {/* The asymmetry is the point: prose runs to the measure, the spec block
          is a fixed 236px column of numerals that never reflows. */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_236px] gap-x-6">
        <div className="min-w-0">
          {EDITABLE_FIELDS.map(({ key, label }) => (
            <EditableField
              key={key}
              label={label}
              value={plan[key]}
              disabled={disabled}
              onSave={(text) => onEdit(key, text)}
              tx={tx}
            />
          ))}

          <SceneList scenes={plan.scenes} disabled={disabled} onSave={onEditScript} tx={tx} />

          {previews && previews.length > 0 && (
            <div style={{ paddingBlockStart: 8 }}>
              <span className="legend">{tx('previews')}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Keyed by type AND character: a plan with three characters
                    holds three 'character' previews at once, and keying on
                    type alone would collapse them into one React child. */}
                {previews.map((p) => (
                  <Frame
                    key={`${p.preview_type}:${p.character_name || ''}`}
                    maxWidth={320}
                    caption={[p.character_name || p.preview_type, plan.aspect_ratio]}
                  >
                    <img
                      src={p.image_url}
                      alt={`${p.character_name || p.preview_type} preview`}
                      className="cursor-zoom-in"
                      style={{ display: 'block', inlineSize: '100%', blockSize: 'auto' }}
                      onClick={() => openMedia(p.image_url, 'image')}
                    />
                  </Frame>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="min-w-0"
          style={{ paddingBlockStart: 12 }}
        >
          <SpecBlock plan={plan} catalog={catalog} disabled={disabled} onChange={onSettings} tx={tx} />
        </div>
      </div>

      {/* ── THE COMMIT STRIP ────────────────────────────────────────────────
          Free above, costing below, and exactly one filled element. */}
      {!resolved && (
        <div style={{ borderBlockStart: '1px solid var(--etch)', marginBlockStart: 12, paddingBlockStart: 12 }}>
          {showRevise ? (
            <div className="flex flex-col gap-2" style={{ maxInlineSize: '68ch' }}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                autoFocus
                placeholder={tx('whatShouldChange')}
                className="field"
                style={{ fontSize: 13, lineHeight: 'var(--lh-body)' }}
              />
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={submitRevise}
                  disabled={busy || !feedback.trim()}
                  className="text-action"
                >
                  <Revise size={16} />
                  {tx('sendFeedback')}
                </button>
                <button type="button" onClick={() => setShowRevise(false)} className="text-action">
                  <Caret size={16} direction="start" />
                  {tx('back')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" onClick={() => setShowRevise(true)} disabled={disabled} className="text-action">
                <Revise size={16} />
                {tx('revise')}
              </button>

              <button type="button" onClick={onCancel} disabled={disabled} className="text-action">
                <Void size={16} />
                {tx('cancel')}
              </button>

              {/* FILLED MARKS: these two spend credits. Still text actions —
                  they are secondary spends, and the gate below is the decision.

                  The character preview needs to know WHICH character, so the
                  picker sits directly against its button — one control, read
                  as one phrase. It only appears when there is a choice to
                  make: a single-character plan has nothing to pick. */}
              <span className="flex items-center gap-2">
                {characterNames.length > 1 && (
                  <select
                    value={selectedCharacter}
                    disabled={disabled}
                    onChange={(e) => setSelectedCharacter(e.target.value)}
                    className="field field--sm"
                    style={{ inlineSize: 'auto', maxInlineSize: '18ch' }}
                    aria-label={tx('whichCharacter')}
                    title={tx('whichCharacter')}
                  >
                    {characterNames.map((name, i) => (
                      <option key={`${name}-${i}`} value={name}>{name}</option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => onPreview('character', selectedCharacter)}
                  disabled={disabled || characterNames.length === 0}
                  className="text-action"
                  title={characterNames.length === 0 ? tx('noCharacters') : tx('previewCosts')}
                >
                  <Character size={16} />
                  {tx('previewCharacter')}
                </button>
              </span>

              <button
                type="button"
                onClick={() => onPreview('environment')}
                disabled={disabled}
                className="text-action"
                title={tx('previewCosts')}
              >
                <Environment size={16} />
                {tx('previewEnvironment')}
              </button>

              {/* YOU PRESS THE NUMBER. */}
              <button
                type="button"
                onClick={onConfirm}
                disabled={disabled}
                className="slab slab--sm ms-auto"
                title={tx('commitCosts')}
              >
                <Commit size={16} />
                <span>{tx('commit')}</span>
                {hasCost && (
                  <>
                    <span aria-hidden="true" style={{ opacity: 'var(--fraction-op)' }}>·</span>
                    <Money usd={cost} onFill style={{ fontSize: 13 }} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {resolved && outcome === 'cancelled' && (
        <div
          className="flex items-center gap-2"
          style={{ borderBlockStart: '1px solid var(--etch)', marginBlockStart: 12, paddingBlockStart: 12, fontSize: 12, color: 'var(--ink-3)' }}
        >
          <Void size={14} />
          {tx('cancelled')}
        </div>
      )}
      {/* A confirmed card gets no footer caption at all: the SEAM below it in
          the transcript is the record of what was authorised, and repeating
          "Confirmed — generating." underneath it says nothing the seam and the
          status bar are not already saying. */}
    </div>
  )
}

export default PlanReviewCard
