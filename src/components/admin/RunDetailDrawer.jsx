/* ── THE RUN DRAWER — inspect one run, end to end ─────────────────────────
   Principle 11: the right-hand panel is WHAT IS SELECTED. This is that panel,
   docked to the inline-end edge, carrying the app's one shadow.

   WHAT CHANGED
     · Six nested plates and a numbered gutter became a .card with ruled
       sections. A 560px panel cannot afford six sets of padding, and the
       ordinals were an index into nothing.
     · The three figures at the top are the judging surface of this panel, so
       they get room; the calls and steps below are scanning surfaces and stay
       dense.
     · State is a field: the .st word, the same object the runs table uses.
     · Assets sit in the dark media well at their true aspect (object-fit is
       `contain` in .thumb), because a tool that sells 9:16 must never crop
       the thing the customer paid for.
     · The two disclosures are real buttons, not <summary> — the native marker
       cannot be suppressed in every engine from here, and a stray triangle is
       decoration this system has no slot for.
     · It is bilingual. It was the last English-only surface in the app.

   Escape closes it, focus is trapped and returned. That logic is UNCHANGED —
   see the comment on the ref dance below, it is load-bearing.

   Props are unchanged: { run, onClose }. */

import React, { useEffect, useRef, useState } from 'react'
import { Close, Caret } from '../Icon'
import { Money, Duration, RunId } from '../ui/Money'
import RunStatusField from './RunStatusField'
import EmptyState from '../ui/EmptyState'
import { useUIStore } from '../../store/uiStore'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return '—'
  }
}

/* A ruled label/value pair. */
function Entry({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 104px) minmax(0, 1fr)',
        gap: 12,
        paddingBlock: 9,
        borderBlockStart: '1px solid var(--line)',
      }}
    >
      <span className="label">{label}</span>
      {/* TWO BUGS LIVED IN THIS ONE SPAN.

          1. THE COLLAPSING COLUMN. `justify-self: start` sizes a grid item to
             FIT-CONTENT, and `overflow-wrap: anywhere` — unlike `break-word` —
             PARTICIPATES IN INTRINSIC SIZING: it drops the min-content width
             to roughly one word. Together they shrank a prose value to a
             ~150px ribbon that wrapped one or two words per line and ran down
             the drawer, with the rest of the column left empty. A summary
             paragraph rendered as a vertical strip.

             Prose now stretches across the track and wraps with `break-word`,
             which breaks long words WITHOUT poisoning the intrinsic size.
             `.mono` values (run ids, model names) keep the old treatment: they
             are short, unbreakable tokens where `anywhere` is exactly right
             and fit-content sizing is what keeps them beside their label.

          2. THE TRAVELLING FULL STOP. The plan is written in the language of
             the prompt, so English prose lands in this Arabic drawer and the
             trailing "." resolved against the RTL paragraph — ".workday"
             instead of "workday.". <bdi> scopes each value to its own
             direction.

          The original note still holds and is why mono is handled separately:
          .mono forces direction:ltr, so a text-align inside it resolves
          against the ISOLATE rather than the page. */}
      <bdi
        className={mono ? 'mono' : undefined}
        style={mono
          ? { fontSize: 13, color: 'var(--ink)', justifySelf: 'start', minInlineSize: 0, overflowWrap: 'anywhere' }
          : { fontSize: 13, color: 'var(--ink)', justifySelf: 'stretch', minInlineSize: 0, overflowWrap: 'break-word', textAlign: 'start', lineHeight: 1.6 }}
      >
        {value || '—'}
      </bdi>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBlockStart: 24 }}>
      <h3 className="sec-title" style={{ fontSize: 14, marginBlockEnd: 8 }}>{title}</h3>
      {children}
    </section>
  )
}

function Disclosure({ label, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button" className="btn-t" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Caret direction={open ? 'down' : 'end'} size={14} />
        {label}
      </button>
      {open && children}
    </div>
  )
}

function Figure({ legend, children, note }) {
  return (
    <div style={{ minInlineSize: 0 }}>
      <div className="label">{legend}</div>
      <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2, marginBlockStart: 3, color: 'var(--ink)' }}>
        {children}
      </div>
      {note && <div className="caption" style={{ marginBlockStart: 3 }}>{note}</div>}
    </div>
  )
}

/* display:block is explicit because .mono sets inline-block, and an
   inline-block <pre> shrink-wraps instead of filling the panel. */
const PRE = {
  display: 'block',
  fontSize: 11,
  color: 'var(--ink-2)',
  whiteSpace: 'pre-wrap',
  textAlign: 'start',
  overflowX: 'auto',
  background: 'var(--card-2)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-sm)',
  padding: '10px 12px',
  marginBlockStart: 8,
}

export default function RunDetailDrawer({ run, onClose }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreRef = useRef(null)
  const { language } = useUIStore()
  const ar = language === 'ar'

  /* Every caller passes an inline arrow for onClose, so its identity changes on
     every parent render — and the route DOES re-render while the drawer is open
     (it awaits the run detail and sets it). With onClose in the dep list the
     trap tore down and rebuilt mid-open: the cleanup handed focus back to the
     trigger, and the re-run then captured the drawer's own Close button as the
     thing to restore to. On close, focus landed on an unmounting node — i.e.
     on <body>. The callback lives in a ref so the effect depends on `run`
     alone, and the capture happens ONCE per open. */
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!run) return undefined
    if (!restoreRef.current) restoreRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (restoreRef.current && typeof restoreRef.current.focus === 'function') restoreRef.current.focus()
      restoreRef.current = null
    }
  }, [run])

  if (!run) return null

  const steps = Array.isArray(run.steps) ? run.steps : []
  const assets = Array.isArray(run.assets) ? run.assets : []
  const modelCalls = Array.isArray(run.model_calls) ? run.model_calls : []

  return (
    <div className="fixed inset-0 z-overlay" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        aria-label={ar ? 'إغلاق' : 'Close'}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'var(--scrim)' }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ar ? `التشغيل ${run.id}` : `Run ${run.id}`}
        className="card overlay-cast settle-inline"
        style={{
          position: 'relative',
          inlineSize: 560,
          maxInlineSize: '100%',
          blockSize: '100%',
          overflowY: 'auto',
          borderRadius: 0,
          borderBlock: 0,
          borderInlineEnd: 0,
        }}
      >
        {/* The run's identity never scrolls away. */}
        <div
          style={{
            position: 'sticky', insetBlockStart: 0, zIndex: 1,
            background: 'var(--card)',
            borderBlockEnd: '1px solid var(--line)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          }}
        >
          <div style={{ minInlineSize: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <RunId id={run.id} style={{ fontSize: 15, color: 'var(--ink)' }} />
              <RunStatusField status={run.status} />
            </div>
            <p className="caption" style={{ marginBlockStart: 2 }}>
              <span className="mono">{formatTime(run.started_at)}</span>
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-i"
            style={{ flex: 'none' }}
            aria-label={ar ? 'إغلاق' : 'Close'}
          >
            <Close size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 32px' }}>
          {/* THE THREE FIGURES — the judging surface of this panel. */}
          <div
            className="card card-pad"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
          >
            <Figure
              legend={ar ? 'التكلفة' : 'Total cost'}
              note={ar
                ? <><span className="mono">{modelCalls.length}</span> استدعاء</>
                : <><span className="mono">{modelCalls.length}</span> calls</>}
            >
              <Money usd={run.total_cost_usd} digits={6} />
            </Figure>
            <Figure
              legend={ar ? 'المدة' : 'Duration'}
              note={ar
                ? <><span className="mono">{steps.length}</span> خطوة</>
                : <><span className="mono">{steps.length}</span> steps</>}
            >
              {run.duration_ms != null ? <Duration ms={run.duration_ms} /> : <span className="mono">—</span>}
            </Figure>
            <Figure legend={ar ? 'الأصول' : 'Assets'} note={run.provider || undefined}>
              <span className="mono">{assets.length}</span>
            </Figure>
          </div>

          <Section title={ar ? 'طلب المستخدم' : 'User prompt'}>
            <p
              style={{
                fontSize: 13, color: 'var(--ink)', lineHeight: 'var(--lh)',
                background: 'var(--card-2)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)', padding: '10px 12px',
              }}
            >
              {run.user_prompt || (ar ? 'لم يُسجَّل أي طلب' : 'No prompt recorded')}
            </p>
            {run.system_prompt && (
              <div style={{ marginBlockStart: 10 }}>
                <Disclosure label={ar ? 'طلب النظام' : 'System prompt'}>
                  <pre className="mono" style={PRE}>{run.system_prompt}</pre>
                </Disclosure>
              </div>
            )}
          </Section>

          <Section title={ar ? 'سياق التنفيذ' : 'Execution context'}>
            <div>
              <Entry label={ar ? 'المسار' : 'Path'} value={run.selected_path} mono />
              <Entry label={ar ? 'الدردشة' : 'Chat'} value={run.chat_id} mono />
              <Entry label={ar ? 'المستخدم' : 'User'} value={run.user_email || run.user_id} />
              <Entry label={ar ? 'المزود' : 'Provider'} value={run.provider} />
            </div>
          </Section>

          {modelCalls.length > 0 && (
            <Section
              title={ar
                ? <>استدعاءات النماذج · <span className="mono">{modelCalls.length}</span></>
                : <>Model calls · <span className="mono">{modelCalls.length}</span></>}
            >
              <div>
                {modelCalls.map((call, idx) => (
                  <div key={idx} style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span className="mono truncate" style={{ fontSize: 12, color: 'var(--ink)' }}>
                        {call.model || call.provider || (ar ? 'غير معروف' : 'Unknown')}
                      </span>
                      <Money usd={call.cost_usd} digits={6} />
                    </div>
                    <div
                      className="caption"
                      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 14px', marginBlockStart: 3 }}
                    >
                      <span>{call.operation || (ar ? 'استدعاء' : 'call')}</span>
                      {call.duration_ms != null && <Duration ms={call.duration_ms} />}
                      {call.tokens_input !== undefined && (
                        <span>{ar ? 'دخل' : 'in'} <span className="mono">{call.tokens_input}</span></span>
                      )}
                      {call.tokens_output !== undefined && (
                        <span>{ar ? 'خرج' : 'out'} <span className="mono">{call.tokens_output}</span></span>
                      )}
                      {call.tokens_total !== undefined && (
                        <span>{ar ? 'الإجمالي' : 'total'} <span className="mono">{call.tokens_total}</span></span>
                      )}
                    </div>
                    {call.purpose && (
                      <p style={{ fontSize: 12, color: 'var(--ink-2)', marginBlockStart: 4 }}>{call.purpose}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {steps.length > 0 && (
            <Section
              title={ar
                ? <>خطوات التنفيذ · <span className="mono">{steps.length}</span></>
                : <>Execution steps · <span className="mono">{steps.length}</span></>}
            >
              <div>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink)', minInlineSize: 0 }}>
                        {step.name || (ar ? `الخطوة ${idx + 1}` : `Step ${idx + 1}`)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 'none' }}>
                        {step.duration_ms != null && <Duration ms={step.duration_ms} />}
                        <RunStatusField status={step.status} />
                      </span>
                    </div>
                    {step.description && (
                      <p className="caption" style={{ marginBlockStart: 2 }}>{step.description}</p>
                    )}
                    {step.error && (
                      <pre
                        className="mono"
                        style={{
                          display: 'block',
                          fontSize: 11, color: 'var(--bad)', whiteSpace: 'pre-wrap', textAlign: 'start',
                          marginBlockStart: 6, paddingInlineStart: 10,
                          borderInlineStart: '2px solid var(--bad)',
                        }}
                      >
                        {step.error}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {assets.length > 0 && (
            <Section
              title={ar
                ? <>الأصول المُنتَجة · <span className="mono">{assets.length}</span></>
                : <>Generated assets · <span className="mono">{assets.length}</span></>}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {assets.map((asset, idx) => {
                  const url = asset.url || asset.public_url || asset.storage_url || ''
                  const type = String(asset.asset_type || '').toLowerCase()
                  const name = asset.filename || asset.id || type || 'file'
                  return (
                    <div key={idx} className="card" style={{ overflow: 'hidden' }}>
                      <div className="thumb thumb--wide">
                        {type === 'image' && url ? (
                          <img src={url} alt="" loading="lazy" />
                        ) : type === 'video' && url ? (
                          <video src={url} controls preload="metadata" />
                        ) : (
                          <span className="mono" style={{ fontSize: 11, color: 'var(--on-well-2)' }}>
                            {type || 'file'}
                          </span>
                        )}
                      </div>
                      <div className="caption truncate" style={{ padding: '7px 10px' }} title={String(name)}>
                        {name}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {steps.length === 0 && modelCalls.length === 0 && assets.length === 0 && (
            <Section title={ar ? 'الأثر' : 'Trace'}>
              <EmptyState
                line={ar
                  ? 'لم تُسجَّل أي خطوات أو استدعاءات أو أصول لهذا التشغيل.'
                  : 'No steps, calls or assets were recorded for this run.'}
                compact
              />
            </Section>
          )}

          <Section title={ar ? 'البيانات الخام' : 'Raw'}>
            <Disclosure label={ar ? 'بيانات التشغيل الخام' : 'Raw run data'}>
              <pre className="mono" style={{ ...PRE, fontSize: 10 }}>{JSON.stringify(run, null, 2)}</pre>
            </Disclosure>
          </Section>
        </div>
      </div>
    </div>
  )
}
