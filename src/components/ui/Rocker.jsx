/* ── THE ROCKER ────────────────────────────────────────────────────────────
   The segmented control, and the ONE implementation of it. It replaces every
   filled-pill row in the application: the library type filters, the admin
   7/30/90 range, the dashboard range, the theme control and the language
   control. Six call sites, one component, so they cannot drift apart.

   The active cell is RAISED, set in SIGNAL, and underscored by a 2px signal
   rule — never an accent FILL, because in this system fill means money (L1)
   and switching a theme costs nothing. Accent as text and as an edge carries
   the selection without claiming to be a spend.

   Raised-plus-ink alone was the original rule and it was too quiet: on the
   clarification card, five stacked rockers made "which one did I pick" genuinely
   hard to answer at a glance. Labels are always words: "Light" / "Dark",
   "English" / "العربية". Never a sun and a moon. The housing, the divider and
   the active cell all live in the .rocker classes in index.css, so the geometry
   is defined once. */

import React from 'react'

export function Rocker({ value, options = [], onChange, ariaLabel }) {
  return (
    <div className="rocker" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="rocker__cell"
          data-on={value === o.value ? 'true' : 'false'}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default Rocker
