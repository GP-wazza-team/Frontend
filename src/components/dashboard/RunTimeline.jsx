/* THE RUN DOCKET — the drill-down for a single run.

   The step table is the point: every model call with its own cost and a
   running total, so the spend is attributable rather than one opaque number
   on the runs list. That idea survives; everything around it was four nested
   bordered boxes and a spinner.

   THE RECOMPOSITION
     · The four summary boxes lose their individual borders and become the
       same rubric strip the ledger page uses — one instrument on a shared
       baseline, not four cards.
     · The dialog is laid on the app's own 56px gutter grid, so scene numbers
       and step indices sit on the same axis as the chat turn indices.
     · THE SEAM AT STEP RESOLUTION: every step that actually charged credits
       carries a 2px --signal rule on its leading edge. Scroll the table and
       you can see exactly where the money went inside the run — the same
       grammar as the transcript's commit seam, one level down.
     · Assets render as Frames at their true aspect ratio. The old
       object-cover max-h-40 cropped the thing the user paid for.
     · The spinner is gone. Loading is the Meter plus a skeleton table at the
       true final row height, so nothing reflows when the data lands.

   Escape already closed this dialog; that is kept, and focus is now trapped
   and returned, which it was not. */

import React, { useEffect, useRef, useState } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { Close, Note, Scene } from '../Icon'
import Meter from '../ui/Meter'
import { Money, Duration, RunId } from '../ui/Money'
import { Rubric, Figure, RunMarker, TableSkeleton, En } from './Instruments'
import Frame, { mediaStyle } from '../ui/Frame'
import EmptyState from '../ui/EmptyState'

function formatTokens(input, output) {
  if (!input && !output) return '—'
  return `${(input || 0).toLocaleString('en-US')} / ${(output || 0).toLocaleString('en-US')}`
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return '—'
  }
}

/* A ruled entry: legend in the gutter, prose in the column. Replaces the
   label-above-value stack inside a bordered box. */
function Entry({ label, value }) {
  if (!value) return null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 132px) minmax(0, 1fr)',
        gap: 16,
        paddingBlock: 10,
        borderBlockStart: '1px solid var(--etch)',
      }}
    >
      <span className="legend" style={{ marginBlock: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 'var(--lh-body)' }}>{value}</span>
    </div>
  )
}

function Group({ legend, index, children }) {
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

function RunTimeline({ runId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const restoreRef = useRef(null)

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
  // Tab is trapped inside the dialog and focus is returned on close.
  useEffect(() => {
    restoreRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    }
  }, [onClose])

  const previews = (data?.assets || []).filter((a) => a.is_preview)
  const outputs = (data?.assets || []).filter((a) => !a.is_preview)
  const steps = data?.steps || []

  return (
    <div
      className="fixed inset-0 z-overlay flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'var(--scrim)', padding: 24 }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Run #${runId}`}
        className="plate plate--flush overlay-cast settle w-full"
        style={{
          maxInlineSize: 880,
          /* The docket is bounded by the overlay's own box: the viewport less
             the overlay's 24px block padding at each edge. Below that bound it
             still centres on its auto block margins; at the bound it stops
             growing and its BODY scrolls, which is what gives the step table's
             sticky header a real scrollport to stick to. */
          maxBlockSize: 'min(calc(100vh - 48px), calc(100dvh - 48px))',
          marginBlock: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          className="flex items-start justify-between gap-4 flex-none"
          style={{
            paddingBlock: 14,
            paddingInlineStart: 20,
            paddingInlineEnd: 20,
            borderBlockEnd: '1px solid var(--etch-strong)',
          }}
        >
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <RunId id={runId} style={{ fontSize: 13, color: 'var(--ink)' }} />
              {data?.status && <RunMarker status={data.status} />}
            </div>
            <p className="truncate" style={{ fontSize: 12, color: 'var(--ink-3)', marginBlockStart: 2 }}>
              {data?.user_prompt || '—'}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="text-action flex-none" aria-label="Close">
            <Close size={16} />
          </button>
        </div>

        {/* THE ONE SCROLLPORT. The header is pinned above it, so this is the
            box that scrolls — on both axes, which is why the step table below
            no longer carries its own `overflow-x: auto` wrapper. A wrapper
            like that computes overflow-y to auto as well, becomes the sticky
            thead's nearest scrollport, and then never scrolls vertically —
            which is exactly how the header used to scroll away with the rows. */}
        <div
          style={{
            flex: '1 1 auto',
            minBlockSize: 0,
            overflow: 'auto',
            paddingBlock: 16,
            paddingInlineStart: 20,
            paddingInlineEnd: 24,
          }}
        >
          {loading && (
            <div>
              <div className="flex items-center gap-3" style={{ marginBlockEnd: 16 }}>
                <Meter cells={5} mode="indeterminate" tone="ink" label="Loading" />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Loading run…</span>
              </div>
              <table className="dtable"><TableSkeleton columns={6} rows={6} /></table>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3" style={{ color: 'var(--state-fail)' }}>
              <Note size={16} />
              <span style={{ fontSize: 13 }}>{error}</span>
            </div>
          )}

          {data && !loading && (
            <>
              <Rubric
                columns={4}
                cells={[
                  {
                    key: 'cost',
                    legend: 'Total cost',
                    value: <Money usd={data.total_cost_usd} style={{ fontSize: 20, lineHeight: 1.15 }} />,
                    note: <En>{`${steps.length} model calls`}</En>,
                  },
                  {
                    key: 'credits',
                    legend: 'Credits charged',
                    value: <Figure value={String(data.credits_charged ?? 0)} />,
                  },
                  {
                    key: 'duration',
                    legend: 'Duration',
                    value: data.duration_seconds
                      ? <Duration seconds={data.duration_seconds} style={{ fontSize: 20, lineHeight: 1.15 }} />
                      : <Figure value="—" />,
                  },
                  {
                    key: 'status',
                    legend: 'Status',
                    value: <span style={{ fontSize: 13 }}><RunMarker status={data.status} /></span>,
                  },
                ]}
              />

              {data.plan && (data.plan.brief_summary || data.plan.characters) && (
                <Group legend="What was approved" index={1}>
                  <div>
                    <Entry label="Summary" value={data.plan.brief_summary} />
                    <Entry label="Characters" value={data.plan.characters} />
                    <Entry label="Environment" value={data.plan.environment} />
                    <Entry label="Scenario" value={data.plan.scenario} />
                  </div>
                </Group>
              )}

              {data.scenes?.length > 1 && (
                <Group legend={`Script — ${data.scenes.length} scenes`} index={2}>
                  <ol>
                    {data.scenes.map((s) => (
                      <li
                        key={s.scene_number}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '28px minmax(0, 1fr)',
                          gap: 12,
                          paddingBlock: 8,
                          borderBlockStart: '1px solid var(--etch)',
                        }}
                      >
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>
                          {String(s.scene_number).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--ink)' }}>{s.summary || s.scene_prompt}</span>
                      </li>
                    ))}
                  </ol>
                </Group>
              )}

              <Group legend="Every step, beginning to end" index={3}>
                {steps.length === 0 ? (
                  <EmptyState line="No model calls recorded for this run." compact />
                ) : (
                  /* Deliberately NOT a scroller. `overflow-x: auto` here would
                     compute overflow-y to auto too and capture the sticky
                     thead into a box that never scrolls vertically. The
                     dialog body above is the one scrollport, on both axes. */
                  <div className="min-w-0">
                    <table className="dtable">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th style={{ inlineSize: '30%' }}>Step</th>
                          <th>Model</th>
                          <th className="num">Tok in / out</th>
                          <th className="num">Took</th>
                          <th className="num">Cost</th>
                          <th className="num">Running</th>
                        </tr>
                      </thead>
                      <tbody>
                        {steps.map((step, i) => {
                          const charged = Number(step.cost_usd) > 0
                          return (
                            <tr key={i}>
                              <td
                                className="mono"
                                style={{ position: 'relative', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}
                              >
                                {/* THE SEAM, at step resolution: this call spent money. */}
                                {charged && (
                                  <span
                                    aria-hidden="true"
                                    style={{
                                      position: 'absolute',
                                      insetInlineStart: 0,
                                      insetBlockStart: 0,
                                      insetBlockEnd: 0,
                                      inlineSize: 2,
                                      backgroundColor: 'var(--signal)',
                                    }}
                                  />
                                )}
                                {formatTime(step.created_at)}
                              </td>
                              <td style={{ color: 'var(--ink)' }}>
                                <span className="flex items-center gap-2 min-w-0">
                                  {step.scene_number && (
                                    <span className="flex items-center gap-1 flex-none" style={{ color: 'var(--ink-3)' }}>
                                      <Scene size={12} />
                                      <span className="mono" style={{ fontSize: 10 }}>{step.scene_number}</span>
                                    </span>
                                  )}
                                  <span className="truncate">{step.label}</span>
                                  {!step.success && (
                                    <span
                                      className="flex-none"
                                      style={{ fontSize: 11, color: 'var(--state-fail)' }}
                                      title={step.error_message || 'Failed'}
                                    >
                                      failed
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11, textAlign: 'start' }}>
                                {step.model_name || '—'}
                              </td>
                              <td className="num mono" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
                                {formatTokens(step.input_tokens, step.output_tokens)}
                              </td>
                              <td className="num" style={{ whiteSpace: 'nowrap' }}>
                                {step.latency_ms
                                  ? <Duration ms={step.latency_ms} />
                                  : <span className="mono">—</span>}
                              </td>
                              <td className="num" style={{ whiteSpace: 'nowrap' }}>
                                <Money usd={step.cost_usd} digits={5} />
                              </td>
                              <td className="num" style={{ whiteSpace: 'nowrap' }}>
                                <Money usd={step.cumulative_cost_usd} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Group>

              {previews.length > 0 && (
                <Group legend="Previews you asked for" index={4}>
                  <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 12, marginBlockStart: 4 }}>
                    {previews.map((a) => (
                      <Frame key={a.id} caption={a.preview_type || 'preview'}>
                        <img src={a.url} alt={a.preview_type || 'preview'} style={mediaStyle} />
                      </Frame>
                    ))}
                  </div>
                </Group>
              )}

              {outputs.length > 0 && (
                <Group legend="Final output" index={5}>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12, marginBlockStart: 4 }}>
                    {outputs.map((a) => (
                      <Frame key={a.id} caption={(a.asset_type || 'asset').toLowerCase()}>
                        {a.asset_type === 'VIDEO'
                          ? <video controls src={a.url} style={mediaStyle} />
                          : <img src={a.url} alt="output" style={mediaStyle} />}
                      </Frame>
                    ))}
                  </div>
                </Group>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RunTimeline
