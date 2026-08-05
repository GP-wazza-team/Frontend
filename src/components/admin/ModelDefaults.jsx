/* ═══════════════════════════════════════════════════════════════════════════
   MODEL DEFAULTS — which model each stage of the pipeline runs on.

   WHAT THIS REPLACES: ssh to the box, sed the .env, recreate the container.
   That was the only way to change the default LLM, and it meant the person who
   pays for the tokens could not see, let alone change, what they were paying
   for. Now it is three selects on the page they already read.

   ONE CONTROL PER STAGE, AND IT IS THE MODEL. There is deliberately no
   provider dropdown beside it. Provider and model are not independent — a
   saved pair of `deepseek` + `gpt-4o` is a 404 on the next run that reads like
   a broken model name — so the server derives the provider from the registry
   entry for whichever model is picked. Two controls here would only be able to
   express states the system cannot honour.

   EVERY MODEL IS LISTED, INCLUDING THE ONES THAT CANNOT BE PICKED. A model the
   registry has disabled, or whose provider has no API key, still appears —
   disabled, with the reason on the option itself. Hiding them is what sends
   somebody to the server to find out what exists. The reason is the useful
   part: "no API key" is a thing an admin can go and fix.

   NOTHING SAVES ON CHANGE. Picking from a select stages the change; APPLY
   writes it. These defaults steer live generation for every user on the
   platform and the price delta between two entries in the same list is 20x —
   that is a deliberate act, not an onChange side effect. The pending change is
   spelled out in words, old → new, before the button is pressed.

   The section renders in full on first paint. The selects hold the server's
   current values; nothing here starts hidden or at opacity 0.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useMemo, useState } from 'react'
import { useUIStore } from '../../store/uiStore'
import { Caret, Commit, Revise } from '../Icon'

/* Money and credits, in the unit the model is actually billed in. Reading
   "$5.00 / $15.00 per 1M" next to "$0.27 / $1.10 per 1M" is the whole reason
   this column exists — the cost consequence has to be visible BEFORE apply,
   not discovered on next month's invoice. */
function costLine(model, ar) {
  if (!model) return null
  if (model.cost_type === 'tokens') {
    const i = Number(model.input_price_per_1m || 0).toFixed(2)
    const o = Number(model.output_price_per_1m || 0).toFixed(2)
    return (
      <>
        <span className="mono">${i}</span> / <span className="mono">${o}</span>
        {' '}{ar ? 'لكل مليون رمز' : 'per 1M tokens'}
      </>
    )
  }
  if (model.cost_type === 'per_image') {
    return (
      <>
        <span className="mono">${Number(model.cost_per_image || 0).toFixed(3)}</span>
        {' '}{ar ? 'لكل صورة' : 'per image'}
      </>
    )
  }
  if (model.cost_type === 'credits') {
    return (
      <>
        <span className="mono">{model.credits_per_second}</span>
        {' '}{ar ? 'رصيد/ثانية' : 'credits/sec'}
      </>
    )
  }
  return null
}

function unavailableLabel(reason, ar) {
  if (reason === 'no_api_key') return ar ? 'لا يوجد مفتاح' : 'no API key'
  if (reason === 'disabled_in_registry') return ar ? 'معطّل في السجل' : 'disabled in registry'
  return ar ? 'غير متاح' : 'unavailable'
}

export default function ModelDefaults({ slots = [], onApply, saving = false }) {
  const { language } = useUIStore()
  const ar = language === 'ar'

  /* Staged picks, keyed by slot. Absent key = untouched, so the select falls
     back to the server's value and a reload of `slots` is picked up for free. */
  const [draft, setDraft] = useState({})

  const valueFor = (slot) => draft[slot.key] ?? slot.current_model

  const pending = useMemo(
    () => slots.filter((s) => draft[s.key] && draft[s.key] !== s.current_model),
    [slots, draft],
  )

  const modelIn = (slot, id) => slot.models.find((m) => m.id === id) || null

  const handleApply = async () => {
    const ok = await onApply(pending.map((s) => ({ key: s.key, model: draft[s.key] })))
    /* Only clear what actually landed. A rejected change stays staged and
       visible, next to the reason the server gave for refusing it. */
    if (ok) setDraft({})
  }

  if (!slots.length) return null

  return (
    <>
      <div className="cfg">
        {slots.map((slot) => {
          const selectedId = valueFor(slot)
          const selected = modelIn(slot, selectedId)
          const changed = draft[slot.key] && draft[slot.key] !== slot.current_model
          const available = slot.models.filter((m) => m.selectable)
          const blocked = slot.models.filter((m) => !m.selectable)

          return (
            <div className="cfg-row" key={slot.key}>
              <div className="cfg-row__stage">
                <span className="cfg-row__name">{ar ? slot.label_ar : slot.label_en}</span>
                {/* THE PROVIDER, ON ITS OWN LINE. It used to appear only
                    inside the option text, which put the one fact an admin
                    comes here to check — who are we buying this from — behind
                    opening the dropdown. It is derived, never picked, so it is
                    stated rather than offered as a second control. */}
                <span className="cfg-row__note">
                  <bdi>{selected ? selected.provider : slot.current_provider}</bdi>
                </span>
              </div>

              <div style={{ position: 'relative', minInlineSize: 0 }}>
                <select
                  className="field select"
                  value={selectedId}
                  disabled={saving}
                  aria-label={ar
                    ? `النموذج الافتراضي لمرحلة ${slot.label_ar}`
                    : `Default model for the ${slot.label_en} stage`}
                  onChange={(e) => setDraft((d) => ({ ...d, [slot.key]: e.target.value }))}
                  style={{ inlineSize: '100%' }}
                >
                  <optgroup label={ar ? 'متاح' : 'Available'}>
                    {available.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name} · {m.provider}
                      </option>
                    ))}
                  </optgroup>
                  {blocked.length > 0 && (
                    <optgroup label={ar ? 'يحتاج إعداداً' : 'Needs setup'}>
                      {blocked.map((m) => (
                        <option key={m.id} value={m.id} disabled>
                          {m.display_name} · {m.provider} · {unavailableLabel(m.unavailable_reason, ar)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* A current value that has since left the registry would
                      otherwise render as a blank select showing nothing. */}
                  {!selected && (
                    <option value={selectedId} disabled>
                      {selectedId} · {ar ? 'غير معروف في السجل' : 'not in the registry'}
                    </option>
                  )}
                </select>
                <Caret
                  direction="down"
                  size={14}
                  style={{
                    position: 'absolute', insetBlockStart: '50%', insetInlineEnd: 12,
                    transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none',
                  }}
                />
              </div>

              <div className="cfg-row__cost">
                {changed
                  ? <span style={{ color: 'var(--warn)' }}>{ar ? 'قيد التغيير' : 'Staged'}</span>
                  : costLine(selected, ar)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="cfg-foot">
        <button
          type="button"
          className="btn"
          onClick={handleApply}
          disabled={saving || pending.length === 0}
        >
          {saving ? <Revise size={15} /> : <Commit size={15} />}
          {saving ? (ar ? 'جارٍ الحفظ…' : 'Applying…') : (ar ? 'تطبيق' : 'Apply')}
        </button>

        {pending.length > 0 && !saving && (
          <button type="button" className="btn-t" onClick={() => setDraft({})}>
            {ar ? 'تجاهل' : 'Discard'}
          </button>
        )}

        {/* The change, in words, before it is made. Old → new, per stage. */}
        <p className="caption" style={{ margin: 0, minInlineSize: 0 }}>
          {pending.length === 0
            ? (ar
              ? 'كل مرحلة تعمل على النموذج المعروض. يسري أي تغيير على التوليد التالي دون إعادة تشغيل.'
              : 'Each stage runs the model shown. A change takes effect on the next generation, with no restart.')
            : pending.map((s) => {
              const from = s.current_display_name || s.current_model
              const to = (s.models.find((m) => m.id === draft[s.key]) || {}).display_name || draft[s.key]
              return (
                <span key={s.key} style={{ display: 'block' }}>
                  <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
                    {ar ? s.label_ar : s.label_en}
                  </span>
                  {': '}
                  <bdi>{from}</bdi>
                  {' → '}
                  <bdi style={{ color: 'var(--ink)', fontWeight: 500 }}>{to}</bdi>
                </span>
              )
            })}
        </p>
      </div>
    </>
  )
}

export function ModelDefaultsSkeleton() {
  return (
    <div className="cfg">
      {[0, 1, 2].map((i) => (
        <div className="cfg-row" key={i}>
          <div className="skel" style={{ blockSize: 15, inlineSize: 74 }} />
          <div className="skel" style={{ blockSize: 38 }} />
          <div className="skel" style={{ blockSize: 13 }} />
        </div>
      ))}
    </div>
  )
}
