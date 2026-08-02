/* ── THE EMPTY STATE ───────────────────────────────────────────────────────
   One pattern, every call site: a group legend, one sentence, and — where an
   action makes sense — real controls that actually work. Never a 40px grey
   placeholder glyph, never a decorative headline.

   One implementation, in the shared location, so the transcript's empty state
   and the library's empty state are the same object. */

import React from 'react'

export function EmptyState({ legend, line, tone = 'var(--ink-2)', children, compact = false, measure = '56ch' }) {
  return (
    <div style={{ paddingBlock: compact ? 12 : 24, maxInlineSize: measure }}>
      {legend && <span className="legend" style={{ marginBlockStart: 0 }}>{legend}</span>}
      {line && <p style={{ fontSize: 13, color: tone, marginBlockEnd: children ? 12 : 0 }}>{line}</p>}
      {children}
    </div>
  )
}

export default EmptyState
