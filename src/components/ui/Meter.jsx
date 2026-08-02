/* ═══════════════════════════════════════════════════════════════════════════
   METER — the application's ONLY progress indicator.

   FOUNDATION-OWNED. Do not write another spinner, another progress bar, or
   another set of bouncing dots. Every loading state in Wazza is this object:
   the status bar, the chat run strip, per-scene progress, the dashboard
   sparkmeter, the admin daily metric, and the auth plate at large scale.

   A track of N discrete cells that fill in sequence.

   props
     cells   number   how many cells. N is set by WHAT is being measured:
                        5  pipeline stages (plan · script · image · video · assemble)
                       14  a fortnight — the dashboard / admin sparkmeter
                       24  a magnitude bar — plan card, admin table inline
     value   0..1     determinate fill fraction
     mode    'determinate' | 'indeterminate'
     tone    'signal' | 'done' | 'fail' | 'ink'
     variant 'dense' (3px cells) | 'stage' (wide cells, the 5-stage pipeline)
     label   string   accessible name

   THE FILL is a clip-path inset over a PRE-DRAWN full tick row. Never scaleX,
   never width, never a rounded cap. The caps stay square through the whole
   transition and the fill always reaches its full intended length — which is
   the structural answer to a progress bar that visibly fails to fill.

   RTL: the inset is authored logically in index.css (.wz-meter__fill), so the
   fill runs in the reading direction with no per-call-site handling.

   REDUCED MOTION: a determinate meter still shows its TRUE value; an
   indeterminate one resolves to a static full track in --ink-3. It never
   resolves to half-lit — a static half meter is a lie about the run.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useState } from 'react'
import { useRtl } from '../Icon'
import { useReducedMotion } from './useReducedMotion'

const TONE = {
  signal: 'var(--state-run)',
  done: 'var(--state-done)',
  fail: 'var(--state-fail)',
  ink: 'var(--ink-2)',
}

const GEOM = {
  dense: { w: 3, gap: 2, h: 10 },
  stage: { w: 24, gap: 3, h: 6 },
}

export default function Meter({
  cells = 5,
  value = 0,
  mode = 'determinate',
  tone = 'signal',
  variant = 'dense',
  label,
  className = '',
  style,
  ...rest
}) {
  const g = GEOM[variant] || GEOM.dense
  const n = Math.max(1, Math.round(cells))
  const rtl = useRtl()
  /* The reactive hook, not a read during render: a preference change has to
     stop a sweeping meter that is already on screen. */
  const reduce = useReducedMotion()
  const sweeping = mode === 'indeterminate' && !reduce

  /* The sweep is stepped in state rather than animated in CSS so the lit cells
     land exactly on the grid, and so RTL needs no special case: it is only ever
     a question of WHICH cells are lit. One 1200ms cycle end to end. */
  const [head, setHead] = useState(0)
  useEffect(() => {
    if (!sweeping) return undefined
    const step = Math.max(40, Math.round(1200 / (n + 4)))
    const id = setInterval(() => setHead((h) => (h + 1) % (n + 4)), step)
    return () => clearInterval(id)
  }, [sweeping, n])

  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
  const hiddenPct = `${(1 - clamped) * 100}%`
  const staticIndeterminate = reduce && mode === 'indeterminate'

  const cellStyle = {
    inlineSize: variant === 'stage' ? 'auto' : g.w,
    blockSize: g.h,
    flex: variant === 'stage' ? '1 1 0' : 'none',
  }

  const track = []
  const fill = []
  for (let i = 0; i < n; i += 1) {
    /* The unlit track is context, not signal — it sits at --etch-strong so the
       LIT cells (which are what carry the meaning, and which clear 3:1 against
       --panel in every tone) separate from it clearly. An unlit track at
       --edge is bright enough to swallow the reading at 3px. */
    track.push(<span key={i} style={{ ...cellStyle, background: 'var(--etch-strong)' }} />)
    let lit
    if (staticIndeterminate) lit = 'var(--ink-3)'
    else if (sweeping) lit = i <= head && i > head - 4 ? TONE[tone] : 'transparent'
    else lit = TONE[tone]
    fill.push(<span key={i} style={{ ...cellStyle, background: lit }} />)
  }

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={mode === 'determinate' ? 0 : undefined}
      aria-valuemax={mode === 'determinate' ? 100 : undefined}
      aria-valuenow={mode === 'determinate' ? Math.round(clamped * 100) : undefined}
      className={`wz-meter${className ? ' ' + className : ''}`}
      style={style}
      {...rest}
    >
      <span className="wz-meter__track" style={{ gap: g.gap }}>{track}</span>
      <span
        className="wz-meter__fill"
        aria-hidden="true"
        style={{
          gap: g.gap,
          /* The inset is authored logically HERE rather than in a [dir] CSS
             rule: one source of truth for direction, and no cascade to get
             wrong. The fill always runs in the reading direction. */
          clipPath: sweeping || staticIndeterminate
            ? 'none'
            : rtl
              ? `inset(0 0 0 ${hiddenPct})`
              : `inset(0 ${hiddenPct} 0 0)`,
        }}
      >
        {fill}
      </span>
    </span>
  )
}
