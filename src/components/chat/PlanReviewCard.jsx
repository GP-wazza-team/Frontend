/* ═══════════════════════════════════════════════════════════════════════════
   THE COMMIT GATE — the signature moment of the product

   Everything before this card is instrumentation for one decision, and
   everything after it costs money. So it is composed as a DOCUMENT YOU
   APPROVE, not a panel you arm:

     NUMBERED CLAUSES   01 summary · 02 characters · 03 environment ·
                        04 scenario · 05 script · 06 output. Each clause is
                        amendable in place, and the amend control is a .stow —
                        stowed on a fine pointer, always present on a coarse
                        one, and reachable by keyboard through :focus-within.
     THE TOTAL          stated in full, in the document, BEFORE the press.
     THE PRESS          is directly under it. It spent a while mounted into
                        the top bar instead, on the argument that a bar cannot
                        be scrolled past the way the foot of a long work order
                        can. That bar no longer exists — and the trade was bad
                        anyway, because it separated the figure being agreed
                        to from the control that agreed to it. It is still the
                        ONLY filled button on this screen; the free actions
                        beside it are bordered or bare.

   WHAT WAS REMOVED. The arming vocabulary: the cut-corner "seal", the filled
   slab whose label was the price, the amber meters, the instrument-panel spec
   column. None of them said anything the words and the number do not, and all
   of them read as a game rather than as a company's paperwork.

   `resolved` freezes the card into a record. `outcome` is how it was resolved
   ('cancelled' | 'confirmed'). Every handler, prop name, guard and network
   call is exactly as it was. `onConfirm` is back on this card after a spell in
   the top bar; the press that spends money belongs with the total it commits.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Amend, Environment, Character, Revise, Caret, Check, Void, Commit } from '../Icon'
import { Money } from '../ui/Money'
import { useLightbox } from '../MediaLightbox'
import { useChatText, MediaWell } from './chatKit'

// Fields the backend accepts for the free, no-LLM /edit call.
const EDITABLE_FIELDS = [
  { key: 'brief_summary', label: 'summary' },
  { key: 'characters', label: 'characters' },
  { key: 'environment', label: 'environment' },
  { key: 'scenario', label: 'scenario' },
  // Style decides how the result LOOKS and was the one field the card could
  // neither show nor change: a run that came back flat cartoon had to be
  // thrown away and re-prompted, because there was nowhere to say otherwise.
  { key: 'style', label: 'style' },
]

// Fallbacks for the very first render, before /generate/models has answered.
// The real lists come from the backend, which only offers models this
// deployment has keys for.
const FALLBACK_RESOLUTIONS = ['480p', '720p', '1080p']
const FALLBACK_ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9']
const FALLBACK_DURATIONS = [5, 10, 15, 20]

/* ── A CLAUSE ─────────────────────────────────────────────────────────────
   The number is a step in a sequence, so it sits in the leading column and
   mirrors with the document (A4). It is .mono because it is a Latin numeral
   inside what may be an Arabic run (A3). */

function Clause({ n, title, action, children }) {
  return (
    <li
      className="group grid items-start"
      style={{
        gridTemplateColumns: '32px minmax(0, 1fr) auto',
        columnGap: 12,
        paddingBlock: 14,
        // The header already draws the rule above clause 01.
        borderBlockStart: n === 1 ? 'none' : '1px solid var(--line)',
      }}
    >
      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)', paddingBlockStart: 2 }}>
        {String(n).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="label" style={{ marginBlockEnd: 4 }}>{title}</div>
        {children}
      </div>
      <span className="stow">{action}</span>
    </li>
  )
}

/* ── THE OUTPUT CLAUSE ────────────────────────────────────────────────────── */

function SpecRow({ label, children, title }) {
  return (
    <div
      className="grid items-center"
      style={{ gridTemplateColumns: 'minmax(88px, auto) minmax(0, 1fr)', columnGap: 12, paddingBlock: 3 }}
      title={title}
    >
      <span className="caption">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/**
 * A dropdown in the output clause. Changes commit immediately — each is a free
 * server-side field update, and making the user press an extra Save button to
 * change a dropdown they can see the result of is friction for nothing.
 */
function SpecSelect({ value, options, disabled, onChange, label }) {
  const current = options.find((o) => String(o.value) === String(value ?? ''))
  return (
    /* dir="ltr" ON THE WRAPPER, not just on the select.
       The select forces `direction: ltr` because a model id is a Latin token,
       so its `padding-inline-end` resolves to the PHYSICAL RIGHT. The caret
       was positioned by this wrapper, which inherited RTL from the page, so
       `inset-inline-end` put it on the PHYSICAL LEFT — the caret landed on top
       of the first characters of the model name while the reserved space sat
       unused at the other edge. Both now resolve against the same direction.

       Widened from 280px too: "Runway Gen 4.5 (max 720p, max 5s)" was being
       cut mid-word, and a control that hides the limits it exists to state is
       worse than no control. `title` carries the full string regardless. */
    <span dir="ltr" className="relative block min-w-0" style={{ maxInlineSize: 360 }}>
      <select
        value={value ?? ''}
        disabled={disabled}
        aria-label={label}
        title={current?.label || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="field field--sm select mono disabled:opacity-50"
        style={{ textAlign: 'start', textOverflow: 'ellipsis' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ insetInlineEnd: 10, insetBlockStart: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}
      >
        <Caret size={12} direction="down" />
      </span>
    </span>
  )
}

function SpecValue({ children }) {
  return <span className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>{children}</span>
}

/**
 * Quality, aspect ratio, model and duration — settable here, before anything is
 * paid for.
 *
 * `render_notes` carries the consequences of the current combination (for
 * example that a model has no 1080p tier, so 1080p would come back as 720p).
 * Showing it here is the point: the user can switch model and watch the note
 * clear, instead of discovering it in the finished video.
 */
function OutputClause({ plan, catalog, disabled, onChange, tx }) {
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
    <div className="flex flex-col" style={{ maxInlineSize: 520 }}>
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
          title="Length of each scene. Longer than a model supports is capped — the note below says by how much."
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

      {notes.length > 0 && (
        <div className="flex flex-col gap-1" style={{ marginBlockStart: 10 }}>
          {notes.map((note) => (
            <span key={note} style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--warn)' }}>
              {note}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── AMENDABLE PROSE ──────────────────────────────────────────────────────── */

/** Exposes its own editing state to the clause so the amend control can sit in
 *  the clause's trailing .stow slot rather than inside the prose. */
function useAmend() {
  const [editing, setEditing] = useState(false)
  return { editing, setEditing }
}

/**
 * The scene list. Scene numbers are the run's own identity for a shot and they
 * carry all the way through to the player in the transcript.
 */
function SceneLines({ scenes, editing, setEditing, disabled, onSave, tx }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  // Seeded when editing OPENS, never re-seeded while it is open: the plan can
  // be replaced underneath this component by a free settings change, and
  // depending on `scenes` here would wipe out whatever the user had typed.
  const scenesRef = React.useRef(scenes)
  scenesRef.current = scenes
  React.useEffect(() => {
    if (editing) setDraft((scenesRef.current || []).map((s) => s.scene_prompt).join('\n'))
  }, [editing])

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

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {/* Mono is honest here — the user is looking at one prompt per line,
            not at prose. */}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.max(4, (scenes?.length || 0) + 1)}
          autoFocus
          className="field mono"
          style={{ direction: 'ltr', textAlign: 'start', lineHeight: 1.6 }}
          aria-label={tx('script')}
        />
        <span className="caption">{tx('onePerLine')}</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={commit} disabled={saving} className="btn-q btn-q--sm">
            <Check size={15} />
            {saving ? tx('saving') : tx('saveScript')}
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={saving} className="btn-t">
            {tx('cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <ol>
      {(scenes || []).map((scene) => (
        <li
          key={scene.scene_number}
          className="grid items-baseline"
          style={{ gridTemplateColumns: '34px minmax(0, 1fr)', paddingBlock: 5 }}
        >
          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            {String(scene.scene_number).padStart(2, '0')}
          </span>
          <span className="break-anywhere" style={{ fontSize: 14, lineHeight: 'var(--lh)', color: 'var(--ink)' }}>
            {scene.summary || scene.scene_prompt}
          </span>
        </li>
      ))}
    </ol>
  )
}

const AmendMark = ({ onClick, label }) => (
  <button type="button" onClick={onClick} className="btn-i" title={label} aria-label={label}>
    <Amend size={15} />
  </button>
)

/* ── THE DOCUMENT ─────────────────────────────────────────────────────────── */

function PlanReviewCard({ plan, resolved, outcome, busy, previews, catalog, onEdit, onEditScript, onPreview, onRevise, onConfirm, onCancel, onSettings }) {
  const openMedia = useLightbox()
  const { tx } = useChatText()
  const [feedback, setFeedback] = useState('')
  const [showRevise, setShowRevise] = useState(false)
  const characterNames = plan.character_names || []
  const [selectedCharacter, setSelectedCharacter] = useState(characterNames[0] || '')
  const script = useAmend()
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

  // Reference sheets Confirm still has to draw. Falls to 0 as the user
  // previews characters by hand, since an approved preview is reused rather
  // than redrawn — so this line is both a price and a progress indicator.
  const pendingPreviews = Number(plan.pending_preview_count) || 0

  /* STATUS IS A FIELD. A word and a dot in a row, never an arming indicator. */
  const state = resolved
    ? (outcome === 'cancelled'
        ? { cls: 'st--idle', word: tx('cancelled') }
        : { cls: 'st--ok', word: tx('approved') })
    : busy
      ? { cls: 'st--run', word: tx('saving') }
      : { cls: 'st--run', word: tx('reviewBefore') }

  let n = 0

  return (
    <section className="card" aria-label={tx('workOrder')}>
      <header
        className="card-pad flex flex-wrap items-center gap-x-4 gap-y-2"
        style={{ borderBlockEnd: '1px solid var(--line)' }}
      >
        <h2 className="sec-title">{tx('workOrder')}</h2>
        <span className={`st ${state.cls}`}>{state.word}</span>
      </header>

      <ol className="card-pad" style={{ paddingBlock: 0 }}>
        {EDITABLE_FIELDS.map(({ key, label }) => (
          <ProseClause
            key={key}
            n={(n += 1)}
            title={tx(label)}
            value={plan[key]}
            disabled={disabled}
            onSave={(text) => onEdit(key, text)}
            tx={tx}
          />
        ))}

        {plan.scenes?.length > 0 && (
          <Clause
            n={(n += 1)}
            title={`${tx('script')} — ${plan.scenes.length} ${tx('scenes')}`}
            action={!disabled && !script.editing && (
              <AmendMark onClick={() => script.setEditing(true)} label={`${tx('edit')} — ${tx('script')}`} />
            )}
          >
            <SceneLines
              scenes={plan.scenes}
              editing={script.editing}
              setEditing={script.setEditing}
              disabled={disabled}
              onSave={onEditScript}
              tx={tx}
            />
          </Clause>
        )}

        <Clause n={(n += 1)} title={tx('output')}>
          <OutputClause plan={plan} catalog={catalog} disabled={disabled} onChange={onSettings} tx={tx} />
        </Clause>
      </ol>

      {/* Reference images the user has already paid for. They are media, so
          they sit in the same dark well every other frame in the app uses. */}
      {previews && previews.length > 0 && (
        <div className="card-pad" style={{ borderBlockStart: '1px solid var(--line)' }}>
          <div className="label" style={{ marginBlockEnd: 10 }}>{tx('previews')}</div>
          <div className="grid-media">
            {/* Keyed by type AND character: a plan with three characters holds
                three 'character' previews at once, and keying on type alone
                would collapse them into one React child. */}
            {previews.map((p) => (
              <MediaWell
                key={`${p.preview_type}:${p.character_name || ''}`}
                type="image"
                url={p.image_url}
                maxHeight={280}
                caption={[p.character_name || p.preview_type, plan.aspect_ratio]}
                onOpen={() => openMedia(p.image_url, 'image')}
                openLabel={tx('openOriginal')}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── THE TOTAL, THE AUTHORISATION, AND THE FREE ACTIONS ──────────────
          THE PRESS SITS WITH THE FIGURE IT COMMITS. It used to be mounted into
          the top bar, which meant the number you were agreeing to and the
          control you agreed with were never in the eye at the same time. There
          is no top bar now, and this is the better place regardless: total,
          then what that total buys you, then the button, in that order.

          It stays the ONLY filled control on the screen. The free actions
          under it — revise, the two previews, cancel — are bordered or bare on
          purpose, because none of them is the decision. */}
      {!resolved && (
        <footer className="card-pad card-2" style={{ borderBlockStart: '1px solid var(--line)' }}>
          {showRevise ? (
            <div className="flex flex-col gap-3" style={{ maxInlineSize: '68ch' }}>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                autoFocus
                placeholder={tx('whatShouldChange')}
                className="field"
                aria-label={tx('whatShouldChange')}
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={submitRevise}
                  disabled={busy || !feedback.trim()}
                  className="btn-q btn-q--sm"
                >
                  <Revise size={15} />
                  {tx('sendFeedback')}
                </button>
                <button type="button" onClick={() => setShowRevise(false)} className="btn-t">
                  <Caret size={15} direction="start" />
                  {tx('back')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1" style={{ marginBlockEnd: 4 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{tx('total')}</span>
                <span style={{ fontSize: 22, fontWeight: 600 }}>
                  {hasCost ? <Money usd={cost} /> : <span className="mono">{tx('empty')}</span>}
                </span>
              </div>
              <p className="caption" style={{ marginBlockEnd: pendingPreviews > 0 ? 6 : 14 }}>
                {tx('authoriseHint')}
              </p>

              {/* The one charge on this card that isn't in the total above,
                  because it hasn't happened yet. It sits between the total and
                  the button so it is read on the way to the press, and it
                  disappears on its own as previews get approved. */}
              {pendingPreviews > 0 && (
                <p className="caption" style={{ marginBlockEnd: 14 }} title={tx('pendingPreviewsWhy')}>
                  {tx(pendingPreviews === 1 ? 'pendingPreview' : 'pendingPreviews')
                    .replace('{n}', pendingPreviews)}
                  {' '}
                  <Money usd={plan.pending_preview_cost_usd || 0} />
                </p>
              )}

              <button
                type="button"
                className="btn"
                onClick={onConfirm}
                disabled={disabled}
                title={tx('commitCosts')}
                style={{ marginBlockEnd: 16 }}
              >
                <Commit size={16} />
                <span>{tx('authorise')}</span>
                {hasCost && <Money usd={cost} onFill style={{ fontSize: 13 }} />}
              </button>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <button type="button" onClick={() => setShowRevise(true)} disabled={disabled} className="btn-q btn-q--sm">
                  <Revise size={15} />
                  {tx('revise')}
                </button>

                {/* Both previews spend credits, so both say so in their title
                    and neither is filled — the authorisation above is the
                    decision, these are rehearsals for it. */}
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
                  className="btn-q btn-q--sm"
                  title={characterNames.length === 0 ? tx('noCharacters') : tx('previewCosts')}
                >
                  <Character size={15} />
                  {tx('previewCharacter')}
                </button>

                <button
                  type="button"
                  onClick={() => onPreview('environment')}
                  disabled={disabled}
                  className="btn-q btn-q--sm"
                  title={tx('previewCosts')}
                >
                  <Environment size={15} />
                  {tx('previewEnvironment')}
                </button>

                <button
                  type="button"
                  onClick={onCancel}
                  disabled={disabled}
                  className="btn-t btn-t--danger"
                  style={{ marginInlineStart: 'auto' }}
                >
                  <Void size={15} />
                  {tx('cancel')}
                </button>
              </div>
            </>
          )}
        </footer>
      )}

      {/* A resolved document keeps its total on the record. */}
      {resolved && hasCost && (
        <footer
          className="card-pad card-2 flex flex-wrap items-baseline gap-x-4 gap-y-1"
          style={{ borderBlockStart: '1px solid var(--line)' }}
        >
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{tx('total')}</span>
          <Money usd={cost} style={{ fontSize: 15, color: 'var(--ink)' }} />
        </footer>
      )}
    </section>
  )
}

/** A prose clause owns its own editing flag so the amend mark can live in the
 *  clause's trailing .stow slot while the textarea lives in the body. */
function ProseClause({ n, title, value, disabled, onSave, tx }) {
  const amend = useAmend()
  return (
    <Clause
      n={n}
      title={title}
      action={!disabled && !amend.editing && (
        <AmendMark onClick={() => amend.setEditing(true)} label={`${tx('edit')} — ${title}`} />
      )}
    >
      <EditableFieldBody
        editing={amend.editing}
        setEditing={amend.setEditing}
        value={value}
        onSave={onSave}
        tx={tx}
        label={title}
      />
    </Clause>
  )
}

/** The prose body of a clause, driven by the clause's editing flag. */
function EditableFieldBody({ editing, setEditing, value, onSave, tx, label }) {
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

  if (!editing) {
    return (
      <p className="prose break-anywhere" style={{ whiteSpace: 'pre-wrap' }}>
        {value || <span style={{ color: 'var(--ink-3)' }}>{tx('empty')}</span>}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        autoFocus
        className="field"
        aria-label={label}
      />
      <div className="flex items-center gap-4">
        <button type="button" onClick={commit} disabled={saving} className="btn-q btn-q--sm">
          <Check size={15} />
          {saving ? tx('saving') : tx('save')}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setDraft(value || '') }}
          disabled={saving}
          className="btn-t"
        >
          {tx('cancel')}
        </button>
      </div>
    </div>
  )
}

export default PlanReviewCard
