/* ═══════════════════════════════════════════════════════════════════════════
   THE LEDGER LINE — <Money>, <Duration>, <RunId>

   FOUNDATION-OWNED. Every currency and every time value in the application
   goes through these. No component formats a cost inline again. (formatCost
   used to be duplicated in StatsCards, RunTimeline, AdminStatsCards and
   PlanReviewCard with three different digit counts.)

   Commit Mono, tabular lining numerals, text-align: end, and — law A3 —
   direction: ltr with unicode-bidi: isolate, so "$0.0842" keeps its currency
   mark on the correct side inside an Arabic sentence.

   THE INVENTED PART: the fractional digits render one step down the ink ramp.
   "$0." in --ink, "0842" in --ink-2. Scanning a column of run costs, magnitude
   lands first and precision second. <Duration> does the same across the
   decimal: "12" in --ink, ".4s" in --ink-2.

     <Money usd={0.0842} />                    $0.0842
     <Money usd={0.0842} onFill />             on a slab: label colour, the
                                               fraction at --fraction-op
     <Duration seconds={12.4} />               12.4s
     <Duration ms={74200} />                   1m 14s
     <RunId id={4821} />                       #4821
   ═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'

function Split({ head, tail, onFill, className = '', style, ...rest }) {
  return (
    <span
      className={`mono ledger${onFill ? ' ledger--on-fill' : ''}${className ? ' ' + className : ''}`}
      style={style}
      {...rest}
    >
      <span>{head}</span>
      <span className="ledger__fraction">{tail}</span>
    </span>
  )
}

/* PRECISION IS SCALED BY MAGNITUDE. A single model call costs $0.0842 and
   needs four digits; a lifetime total does not, and a hardcoded four rendered
   it "$1234.5000" — false precision plus an unreadable integer. Four digits
   under a dollar, three up to a hundred, two above it, and the integer part is
   grouped. Pass `digits` to pin it: the plan card and the commit slab quote a
   per-run price and still ask for 4. */
export function Money({ usd, currency = '$', digits, onFill = false, ...rest }) {
  const n = Number(usd)
  if (!Number.isFinite(n)) return <Split head={`${currency}—`} tail="" onFill={onFill} {...rest} />
  const abs = Math.abs(n)
  const d = digits ?? (abs >= 100 ? 2 : abs >= 1 ? 3 : 4)
  const sign = n < 0 ? '-' : ''
  const fixed = abs.toFixed(d)
  const [int, frac] = fixed.split('.')
  // Grouping only — the fraction keeps its own span so the split ink ramp holds.
  const grouped = Number(int).toLocaleString('en-US')
  return <Split head={`${sign}${currency}${grouped}${frac ? '.' : ''}`} tail={frac || ''} onFill={onFill} {...rest} />
}

export function Duration({ seconds, ms, onFill = false, ...rest }) {
  let s = Number.isFinite(Number(seconds)) ? Number(seconds) : Number(ms) / 1000
  if (!Number.isFinite(s) || s < 0) return <Split head="—" tail="" onFill={onFill} {...rest} />
  if (s < 60) {
    const [int, frac] = s.toFixed(1).split('.')
    return <Split head={int} tail={`.${frac}s`} onFill={onFill} {...rest} />
  }
  if (s < 3600) {
    const m = Math.floor(s / 60)
    const rem = Math.floor(s % 60)
    return <Split head={`${m}m`} tail={` ${String(rem).padStart(2, '0')}s`} onFill={onFill} {...rest} />
  }
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return <Split head={`${h}h`} tail={` ${String(m).padStart(2, '0')}m`} onFill={onFill} {...rest} />
}

export function RunId({ id, className = '', ...rest }) {
  return (
    <span className={`mono${className ? ' ' + className : ''}`} {...rest}>
      #{id ?? '—'}
    </span>
  )
}

export default Money
