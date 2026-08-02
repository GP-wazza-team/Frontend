/* ── THE ROCKER ────────────────────────────────────────────────────────────
   The segmented control, and the ONE implementation of it. It replaces every
   filled-pill row in the application: the library type filters, the admin
   7/30/90 range, the dashboard range, the theme control and the language
   control. Six call sites, one component, so they cannot drift apart.

   The active cell is RAISED plus ink — never an accent fill, because in this
   system fill means money (L1) and switching a theme costs nothing. Labels are
   always words: "Light" / "Dark", "English" / "العربية". Never a sun and a
   moon. The housing, the divider and the raised cell all live in the .rocker
   classes in index.css, so the geometry is defined once. */

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
