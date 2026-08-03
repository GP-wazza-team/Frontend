/* ═══════════════════════════════════════════════════════════════════════════
   INSTRUMENTS — the shared vocabulary of the data surfaces.

   OWNED BY THE DATA-SURFACES ENGINEER. Consumed by /dashboard, /admin,
   /assets and /settings. It lives under components/dashboard/ because the
   ledger is its primary consumer and that is the directory this engineer owns;
   nothing here duplicates a foundation primitive. It is built ENTIRELY on the
   foundation's tokens, classes and marks — <Meter>, <Money>, <Duration>,
   .plate, .cut, .legend, .marker, .dtable, .skel, Shape* — and adds only the
   compositions the foundation deliberately left to the screens.

   THE COMPOSITIONAL IDEA: THE DOCKET.

   Every data route is a numbered docket. The 56px leading gutter that runs
   down every screen carries a two-digit band ordinal in Commit Mono, exactly
   where chat carries its turn index and the plan card carries its scene
   number. Read the four routes side by side and the same numeral spine runs
   through all of them. That is what makes /dashboard and /admin read as the
   same instrument rather than two dashboards that happen to share a palette.

   WHAT IS IN HERE
     Band          one docket entry: ordinal in the gutter, legend + content
                   in the column. The unit every screen is assembled from.
     Rubric        the instrument strip. Replaces the four (and eight) generic
                   icon-plus-label-plus-number cards. One strip, ruled into
                   cells, on a shared baseline grid, sitting directly on the
                   page — no card borders, no hover, no icons.
     Sparkmeter    a 14-day micro bar series in the ramp. Real data, discrete
                   square-capped cells, mirrored in RTL so it reads with the
                   text. Not a progress bar — the Meter is still the ONLY
                   progress indicator.
     ChartFrame    the plate a recharts chart mounts into, plus the axis and
                   tooltip specs so every chart in the app is styled once.
     ChartTooltip  a .cut-md plate of ledger lines. Never a floating card.
     RunMarker     shape first, hue second (L4). Replaces every tinted pill.
     SectionIndex  the rail-panel scroll index.
     Figure        a bare numeral on the ledger line.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useMemo } from 'react'
import { useRtl } from '../Icon'
import {
  ShapeDone, ShapeFail, ShapeRun, ShapeQueued, ShapeCancelled,
} from '../Icon'

/* ── THE DOCKET BAND ───────────────────────────────────────────────────────
   Emits the two cells of one row of the .wz-page grid. The ordinal sits on
   the same axis as a chat turn index and a scene number. */
function Ordinal({ index }) {
  if (index === undefined) return null
  return (
    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', textAlign: 'start' }}>
      {String(index).padStart(2, '0')}
    </span>
  )
}

function Head({ legend, note, action }) {
  if (!legend && !action) return null
  return (
    <div className="flex items-baseline justify-between gap-4" style={{ marginBlockEnd: 10 }}>
      <div className="min-w-0">
        {legend && <span className="legend" style={{ marginBlockStart: 0, marginBlockEnd: 0 }}>{legend}</span>}
        {note && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginBlockStart: 3 }}>
            {note}
          </span>
        )}
      </div>
      {action && <div className="flex items-center gap-4 flex-none">{action}</div>}
    </div>
  )
}

export function Band({ index, marker, legend, note, action, id, children, gutterExtra, span = false }) {
  /* `span` is for the dense tables. The band runs the full grid width so a
     nine-column admin table fits a 1280 laptop without horizontal scroll, and
     the table's own 56px leading column lands exactly on the page gutter axis
     — the row markers sit on the same line as every other index in the app. */
  if (span) {
    return (
      <div className="wz-col--span" id={id} style={{ scrollMarginBlockStart: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'var(--rail-spine) minmax(0, 1fr)' }}>
          <div className="wz-gutter"><Ordinal index={index} />{marker}{gutterExtra}</div>
          <div className="min-w-0"><Head legend={legend} note={note} action={action} /></div>
        </div>
        {children}
      </div>
    )
  }

  return (
    <>
      <div className="wz-gutter" style={{ paddingBlockStart: legend ? 1 : 0 }}>
        <Ordinal index={index} />
        {marker}
        {gutterExtra}
      </div>
      <div className="wz-col" id={id} style={{ scrollMarginBlockStart: 24 }}>
        <Head legend={legend} note={note} action={action} />
        {children}
      </div>
    </>
  )
}

/* ── BIDI ISOLATION FOR ENGLISH TECHNICAL STRINGS ──────────────────────────
   The app runs dir="rtl" by default, and the admin / run-docket surfaces
   carry untranslated English source strings. A phrase that STARTS with a
   Latin numeral — "9 model calls", "214 today" — is split by the bidi
   algorithm into two runs and reordered to "model calls 9" inside an RTL
   paragraph. Observed in the browser, not theorised.

   dir="ltr" makes the whole phrase one isolated LTR run, so it reads
   correctly, while the span itself still sits at the reading start of its
   cell. Use it for English strings only; Arabic copy must never be wrapped. */
export function En({ children, className, style }) {
  return <span dir="ltr" className={className} style={style}>{children}</span>
}

/* ── THE LEDGER FIGURE ─────────────────────────────────────────────────────
   A bare count on the same line grammar as <Money>: tabular, LTR-isolated so
   it never reflows inside an Arabic run (A3). */
export function Figure({ value, size = 20, tone = 'var(--ink)', suffix }) {
  return (
    <span
      className="mono"
      style={{ fontSize: size, color: tone, textAlign: 'start', lineHeight: 1.15 }}
    >
      {value}
      {suffix && <span style={{ color: 'var(--ink-2)' }}>{suffix}</span>}
    </span>
  )
}

/* ── THE SPARKMETER ────────────────────────────────────────────────────────
   Fourteen days of a series as discrete square-capped bars, sitting on a 1px
   baseline. The most recent day is the accent step, so the eye lands on "now"
   first. Mirrored in RTL: the series must run in the reading direction or the
   trend reads backwards. */
export function Sparkmeter({ series = [], cells = 14, height = 16, label }) {
  const rtl = useRtl()
  const bars = useMemo(() => {
    const nums = series.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0))
    const tail = nums.slice(-cells)
    while (tail.length < cells) tail.unshift(0)
    return rtl ? [...tail].reverse() : tail
  }, [series, cells, rtl])

  const max = Math.max(...bars, 0)
  const w = 3
  const gap = 2
  const width = cells * w + (cells - 1) * gap

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5} stroke="var(--etch-strong)" strokeWidth="1" />
      {bars.map((v, i) => {
        const h = max > 0 ? Math.max(1, Math.round((v / max) * (height - 2))) : 1
        const newest = rtl ? i === 0 : i === cells - 1
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={height - 1 - h}
            width={w}
            height={h}
            fill={newest ? 'var(--chart-1)' : 'var(--chart-3)'}
          />
        )
      })}
    </svg>
  )
}

/* ── THE RUBRIC STRIP ──────────────────────────────────────────────────────
   ONE instrument divided by rules, not N cards. Cells share a baseline grid
   so every value in the strip sits on one line however long its label is.
   No icons, no card edge, no hover — it is a readout, not a control. */
export function Rubric({ cells = [], columns = 4 }) {
  return (
    <div
      className="rubric-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        borderBlockStart: '1px solid var(--etch-strong)',
        borderBlockEnd: '1px solid var(--etch-strong)',
      }}
    >
      {cells.map((c, i) => (
        <div
          key={c.key ?? i}
          style={{
            display: 'grid',
            gridTemplateRows: 'auto 26px 18px',
            rowGap: 6,
            alignContent: 'start',
            paddingBlock: 12,
            paddingInline: 16,
            borderInlineStart: i % columns === 0 ? 'none' : '1px solid var(--etch)',
            borderBlockStart: i >= columns ? '1px solid var(--etch)' : 'none',
            minInlineSize: 0,
          }}
        >
          <span className="legend" style={{ marginBlock: 0 }}>{c.legend}</span>
          <span className="flex items-end" style={{ minInlineSize: 0 }}>{c.value}</span>
          {/* The third row is the CONTEXT row: the 14-day shape and the one
              line of context sit together, so a value never reads alone. */}
          <span className="flex items-end gap-3" style={{ minInlineSize: 0 }}>
            {c.series && <Sparkmeter series={c.series} label={c.seriesLabel || c.legend} />}
            {c.note && (
              <span style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.3, minInlineSize: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {c.note}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

export function RubricSkeleton({ columns = 4, count = 4 }) {
  return (
    <div
      aria-busy="true"
      className="rubric-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        borderBlockStart: '1px solid var(--etch-strong)',
        borderBlockEnd: '1px solid var(--etch-strong)',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateRows: 'auto 26px 18px',
            rowGap: 6,
            paddingBlock: 12,
            paddingInline: 16,
            borderInlineStart: i % columns === 0 ? 'none' : '1px solid var(--etch)',
            borderBlockStart: i >= columns ? '1px solid var(--etch)' : 'none',
          }}
        >
          <span className="skel" style={{ blockSize: 9, inlineSize: 54 }} />
          <span className="skel" style={{ blockSize: 20, inlineSize: 88, alignSelf: 'end' }} />
          <span className="skel" style={{ blockSize: 12, inlineSize: 68, alignSelf: 'end' }} />
        </div>
      ))}
    </div>
  )
}

/* ── CHART SPECS ───────────────────────────────────────────────────────────
   Every recharts surface in the application reads these, so the charts are
   styled once and follow the theme through the tokens. Axis type is Commit
   Mono at 10px; there is no gridline except the single baseline the X axis
   draws; series colours come from the five-step ramp and every one of them
   clears 3:1 against --panel in both themes. */
export const CHART_TICK = {
  fontSize: 10,
  fill: 'var(--ink-3)',
  fontFamily: "'Commit Mono', ui-monospace, SFMono-Regular, monospace",
}

export const CHART_RAMP = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)',
]

/* RTL: recharts lays out in physical space and has no direction awareness, so
   the axes are flipped explicitly. Without this an Arabic reader gets a time
   series running against the text. */
export function useChartAxes() {
  const rtl = useRtl()
  return {
    rtl,
    xAxis: {
      tick: CHART_TICK,
      tickLine: false,
      axisLine: { stroke: 'var(--etch-strong)' },
      reversed: rtl,
      minTickGap: 16,
    },
    yAxis: {
      tick: CHART_TICK,
      tickLine: false,
      axisLine: false,
      width: 52,
      orientation: rtl ? 'right' : 'left',
    },
  }
}

/* A .cut-md plate of ledger lines. The default recharts tooltip is a floating
   white card with a radius — the two things this system does not have. */
export function ChartTooltip({ active, payload, label, rows }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="cut cut-md instrument-tile"
      style={{
        backgroundColor: 'var(--panel)',
        boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
        paddingBlock: 8,
        paddingInlineStart: 12,
        paddingInlineEnd: 16,
        minInlineSize: 132,
      }}
    >
      {label !== undefined && label !== null && (
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'start', marginBlockEnd: 6 }}>
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4">
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.name}</span>
          <span style={{ fontSize: 12, color: 'var(--ink)' }}>
            {rows ? rows(p) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── THE CHART PLATE ───────────────────────────────────────────────────────
   The chart's surface is --panel because a chart series is a non-text UI
   element and the ramp's contrast is computed against --panel. */
export function ChartFrame({ height = 220, empty, children }) {
  return (
    <div className="plate" style={{ paddingBlock: 16 }}>
      {empty ? (
        <div className="flex items-center" style={{ blockSize: height }}>{empty}</div>
      ) : (
        <div style={{ blockSize: height }}>{children}</div>
      )}
    </div>
  )
}

/* ── THE STATUS MARKER ─────────────────────────────────────────────────────
   L4: a colourblind reader gets the run state from the SHAPE. The word is the
   raw status string — it is data, not a label we get to rewrite. */
const SHAPE = {
  completed: [ShapeDone, 'done'],
  succeeded: [ShapeDone, 'done'],
  success: [ShapeDone, 'done'],
  failed: [ShapeFail, 'fail'],
  error: [ShapeFail, 'fail'],
  running: [ShapeRun, 'run'],
  in_progress: [ShapeRun, 'run'],
  pending: [ShapeQueued, 'queued'],
  queued: [ShapeQueued, 'queued'],
  cancelled: [ShapeCancelled, 'cancelled'],
  canceled: [ShapeCancelled, 'cancelled'],
}

/* `label` lets a caller keep the shape/tone mapping while showing a
   translated word — the API link state in Settings reads "متصل", not
   "completed", but it is the same shape and the same green. */
export function RunMarker({ status, label, word = true, shape = true, size = 10 }) {
  const key = String(status || '').toLowerCase()
  const [Shape, tone] = SHAPE[key] || [ShapeQueued, 'queued']
  const text = label ?? status ?? '—'
  return (
    <span className={`marker marker--${tone}`} title={shape && !word ? text : undefined}>
      {shape && <Shape size={size} />}
      {word && <span>{text}</span>}
    </span>
  )
}

/* THE FRAME lives in ../ui/Frame — it is the app-wide media object, consumed
   by the transcript and the plan docket as well as by these screens, so it
   cannot live under dashboard/. THE EMPTY STATE lives in ../ui/EmptyState and
   THE ROCKER in ../ui/Rocker for the same reason. There is exactly one
   implementation of each in the codebase; nothing here re-declares them. */

/* ── THE RAIL-PANEL SECTION INDEX ──────────────────────────────────────────
   <main> is the scroll container, so scrollIntoView is enough — no scroll
   maths, no offsets, no magic numbers. */
export function SectionIndex({ items = [] }) {
  return (
    <nav className="flex flex-col" style={{ marginBlockStart: 4 }}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          className="text-action"
          style={{ fontSize: 12 }}
          onClick={() => {
            document.getElementById(it.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>{it.ord}</span>
          {it.label}
        </button>
      ))}
    </nav>
  )
}

/* A rail-panel group: a legend and its controls, ruled off from the next. */
export function PanelGroup({ legend, children, first = false }) {
  return (
    <div style={{ paddingBlockStart: first ? 0 : 12, marginBlockStart: first ? 0 : 12, borderBlockStart: first ? 'none' : '1px solid var(--etch)' }}>
      <span className="legend" style={{ marginBlockStart: 0, marginBlockEnd: 8 }}>{legend}</span>
      {children}
    </div>
  )
}

/* Rows of a table at their TRUE final height, so nothing reflows when the
   data lands. No pulse — a pulsing skeleton is decorative motion. */
export function TableSkeleton({ columns = 6, rows = 6 }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} style={{ blockSize: 36, padding: '0 12px', borderBlockEnd: '1px solid var(--etch)' }}>
              <span className="skel" style={{ display: 'block', blockSize: 10, inlineSize: c === 0 ? 24 : `${45 + ((r * 7 + c * 13) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}
