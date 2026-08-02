/* THE RUN DRAWER — inspect one run, end to end.

   THE RECOMPOSITION
     · It docks to the inline-end edge with a real chamfer, casts the app's
       ONE shadow through .overlay-cast, and pairs it with an inset edge —
       a dark shadow on a dark ground carries no separation, the edge does.
     · Six nested `.surface` cards became ruled groups on the 56px gutter
       grid. A drawer 480px wide cannot afford six sets of padding, and the
       cards were carrying no information the rules do not.
     · The top three stat boxes became the rubric strip the rest of the app
       uses.
     · The step list lost its circle-icon-and-vertical-line timeline. Steps
       are ruled entries with a shape marker; the spinning Loader2 on a
       running step is a static ShapeRun — nothing in this system spins.
     · Model calls became ledger rows: the cost sits on the ledger line at the
       trailing edge and the row rules do the grouping.
     · Assets render as Frames at their true aspect ratio. aspect-video +
       object-cover cropped every 9:16 asset in the drawer.
     · Escape now closes it, focus is trapped and returned. None of that
       existed; the drawer was mouse-only.

   Props are unchanged: { run, onClose }. */

import React, { useEffect, useRef } from 'react'
import { Close, Caret } from '../Icon'
import { Money, Duration, RunId } from '../ui/Money'
import { Rubric, RunMarker, En } from '../dashboard/Instruments'
import Frame, { mediaStyle } from '../ui/Frame'
import EmptyState from '../ui/EmptyState'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return '—'
  }
}

/* A ruled label/value pair. Replaces the label-above-value stack that used to
   sit inside a bordered box inside another bordered box. */
function Entry({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 96px) minmax(0, 1fr)',
        gap: 12,
        paddingBlock: 8,
        borderBlockStart: '1px solid var(--etch)',
      }}
    >
      <span className="legend" style={{ marginBlock: 0 }}>{label}</span>
      {/* justify-self, not text-align: .mono forces direction:ltr, so a
          text-align inside it resolves against the ISOLATE, not the page —
          which parks a mono value at the far physical edge of the column in
          RTL. Letting the box hug its content puts it at the reading start
          in both directions. */}
      <span
        className={mono ? 'mono' : undefined}
        style={{ fontSize: 12, color: 'var(--ink)', justifySelf: 'start', minInlineSize: 0, wordBreak: 'break-word' }}
      >
        {value || '—'}
      </span>
    </div>
  )
}

function Group({ index, legend, children }) {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'var(--rail-spine) minmax(0, 1fr)', marginBlockStart: 24 }}>
      <div className="wz-gutter">
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start', display: 'block' }}>
          {String(index).padStart(2, '0')}
        </span>
      </div>
      <div className="min-w-0">
        <span className="legend" style={{ marginBlockStart: 0 }}>{legend}</span>
        {children}
      </div>
    </section>
  )
}

export default function RunDetailDrawer({ run, onClose }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreRef = useRef(null)

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
  let group = 0

  return (
    <div className="fixed inset-0 z-overlay flex justify-end">
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--scrim)' }} onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Run ${run.id}`}
        className="relative h-full overflow-y-auto plate plate--flush overlay-cast settle-inline"
        style={{
          inlineSize: 520,
          maxInlineSize: '100%',
          boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
        }}
      >
        {/* HEADER — sticky, on --panel, so the run identity never scrolls away */}
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-4"
          style={{
            backgroundColor: 'var(--panel)',
            paddingBlock: 14,
            paddingInlineStart: 20,
            paddingInlineEnd: 24,
            borderBlockEnd: '1px solid var(--etch-strong)',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <RunId id={run.id} style={{ fontSize: 13, color: 'var(--ink)' }} />
              <RunMarker status={run.status} />
            </div>
            <p className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'start', marginBlockStart: 2 }}>
              {formatTime(run.started_at)}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="text-action flex-none" aria-label="Close">
            <Close size={16} />
          </button>
        </div>

        <div style={{ paddingBlock: 16, paddingInlineStart: 16, paddingInlineEnd: 24 }}>
          <Rubric
            columns={3}
            cells={[
              {
                key: 'cost',
                legend: 'Total cost',
                value: <Money usd={run.total_cost_usd} digits={6} style={{ fontSize: 17, lineHeight: 1.15 }} />,
                note: <En>{`${modelCalls.length} calls`}</En>,
              },
              {
                key: 'duration',
                legend: 'Duration',
                value: (run.duration_ms != null
                  ? <Duration ms={run.duration_ms} style={{ fontSize: 17, lineHeight: 1.15 }} />
                  : <span className="mono" style={{ fontSize: 17 }}>—</span>),
                note: <En>{`${steps.length} steps`}</En>,
              },
              {
                key: 'assets',
                legend: 'Assets',
                value: <span className="mono" style={{ fontSize: 17, color: 'var(--ink)' }}>{assets.length}</span>,
                note: run.provider || undefined,
              },
            ]}
          />

          <Group index={++group} legend="User prompt">
            <p
              className="plate--sunken cut cut-md"
              style={{
                fontSize: 13,
                color: 'var(--ink)',
                lineHeight: 'var(--lh-body)',
                paddingBlock: 10,
                paddingInlineStart: 12,
                paddingInlineEnd: 16,
                boxShadow: 'inset 0 0 0 1px var(--etch)',
              }}
            >
              {run.user_prompt || 'No prompt recorded'}
            </p>
            {run.system_prompt && (
              <details style={{ marginBlockStart: 10 }}>
                <summary className="text-action" style={{ fontSize: 12 }}>
                  <Caret direction="down" size={14} />
                  System prompt
                </summary>
                <pre
                  className="mono plate--sunken cut cut-md"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-2)',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'start',
                    paddingBlock: 10,
                    paddingInlineStart: 12,
                    paddingInlineEnd: 16,
                    marginBlockStart: 8,
                    overflowX: 'auto',
                  }}
                >
                  {run.system_prompt}
                </pre>
              </details>
            )}
          </Group>

          <Group index={++group} legend="Execution context">
            <div>
              <Entry label="Path" value={run.selected_path} mono />
              <Entry label="Chat" value={run.chat_id} mono />
              <Entry label="User" value={run.user_email || run.user_id} />
              <Entry label="Provider" value={run.provider} />
            </div>
          </Group>

          {modelCalls.length > 0 && (
            <Group index={++group} legend={`Model calls — ${modelCalls.length}`}>
              <div>
                {modelCalls.map((call, idx) => (
                  <div key={idx} style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--etch)' }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="mono truncate" style={{ fontSize: 12, color: 'var(--ink)', textAlign: 'start' }}>
                        {call.model || call.provider || 'Unknown'}
                      </span>
                      <Money usd={call.cost_usd} digits={6} />
                    </div>
                    <div
                      className="flex flex-wrap items-baseline gap-x-4 gap-y-1"
                      style={{ fontSize: 11, color: 'var(--ink-3)', marginBlockStart: 3 }}
                    >
                      <span>{call.operation || 'call'}</span>
                      {call.duration_ms != null && (
                        <span className="flex items-baseline gap-1">
                          <Duration ms={call.duration_ms} />
                        </span>
                      )}
                      {call.tokens_input !== undefined && <span className="mono">in {call.tokens_input}</span>}
                      {call.tokens_output !== undefined && <span className="mono">out {call.tokens_output}</span>}
                      {call.tokens_total !== undefined && <span className="mono">tot {call.tokens_total}</span>}
                    </div>
                    {call.purpose && (
                      <p style={{ fontSize: 11, color: 'var(--ink-2)', marginBlockStart: 4 }}>{call.purpose}</p>
                    )}
                  </div>
                ))}
              </div>
            </Group>
          )}

          {steps.length > 0 && (
            <Group index={++group} legend={`Execution steps — ${steps.length}`}>
              <div>
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '16px minmax(0, 1fr)',
                      gap: 10,
                      paddingBlock: 9,
                      borderBlockStart: '1px solid var(--etch)',
                    }}
                  >
                    <span style={{ paddingBlockStart: 3 }}>
                      <RunMarker status={step.status} word={false} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span style={{ fontSize: 12, color: 'var(--ink)' }}>{step.name || `Step ${idx + 1}`}</span>
                        {step.duration_ms != null && <Duration ms={step.duration_ms} />}
                      </div>
                      {step.description && (
                        <p style={{ fontSize: 11, color: 'var(--ink-2)', marginBlockStart: 2 }}>{step.description}</p>
                      )}
                      {step.error && (
                        <pre
                          className="mono"
                          style={{
                            fontSize: 11,
                            color: 'var(--state-fail)',
                            whiteSpace: 'pre-wrap',
                            textAlign: 'start',
                            marginBlockStart: 6,
                            paddingInlineStart: 10,
                            borderInlineStart: '2px solid var(--state-fail)',
                          }}
                        >
                          {step.error}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Group>
          )}

          {assets.length > 0 && (
            <Group index={++group} legend={`Generated assets — ${assets.length}`}>
              <div className="grid grid-cols-2" style={{ gap: 12, marginBlockStart: 4 }}>
                {assets.map((asset, idx) => {
                  const url = asset.url || asset.public_url || asset.storage_url || ''
                  const type = (asset.asset_type || '').toLowerCase()
                  return (
                    <Frame key={idx} caption={asset.filename || asset.id || type || 'file'}>
                      {type === 'image' && url ? (
                        <img src={url} alt="" style={mediaStyle} />
                      ) : type === 'video' && url ? (
                        <video src={url} controls style={mediaStyle} />
                      ) : (
                        <span
                          className="mono flex items-center"
                          style={{ blockSize: 72, fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}
                        >
                          {type || 'file'}
                        </span>
                      )}
                    </Frame>
                  )
                })}
              </div>
            </Group>
          )}

          {steps.length === 0 && modelCalls.length === 0 && assets.length === 0 && (
            <Group index={++group} legend="Trace">
              <EmptyState
                line="No steps, calls or assets were recorded for this run."
                compact
              />
            </Group>
          )}

          <Group index={++group} legend="Raw">
            <details>
              <summary className="text-action" style={{ fontSize: 12 }}>
                <Caret direction="down" size={14} />
                Raw run data
              </summary>
              <pre
                className="mono plate--sunken cut cut-md"
                style={{
                  fontSize: 10,
                  color: 'var(--ink-2)',
                  textAlign: 'start',
                  overflowX: 'auto',
                  paddingBlock: 10,
                  paddingInlineStart: 12,
                  paddingInlineEnd: 16,
                  marginBlockStart: 8,
                }}
              >
                {JSON.stringify(run, null, 2)}
              </pre>
            </details>
          </Group>
        </div>
      </div>
    </div>
  )
}
