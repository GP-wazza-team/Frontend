/* MODEL COST BREAKDOWN — a ranked ledger, not a donut and a bar chart.

   THE RECOMPOSITION, and it is the biggest one on this route.

   This was a horizontal bar chart AND a 3px-padded donut AND a dot legend —
   three encodings of one eight-row dataset, side by side, in a component
   under 110 lines. A donut asks you to compare arc lengths you cannot
   compare; the legend then re-states every value the donut just failed to
   communicate; and the coloured dot beside each row is the icon-in-a-tinted-
   context tell.

   Replaced by the thing the data actually is: a RANKED LEDGER. One row per
   model, sorted by spend, with a rank ordinal on the gutter axis, a 24-cell
   magnitude Meter scaled to the top spender, the cost on the ledger line and
   the share of total. You can read the ordering, the magnitude, the exact
   figure and the proportion in one pass, and it stays readable without colour
   — which the donut never was.

   The Meter is the app's own object, so this row is built from the same
   vocabulary as the run strip and the plan card. Props are unchanged:
   { data, totalCost }. */

import React from 'react'
import Meter from '../ui/Meter'
import { Money } from '../ui/Money'
import EmptyState from '../ui/EmptyState'

export default function ModelCostBreakdown({ data = [], totalCost = 0 }) {
  if (data.length === 0) {
    return (
      <EmptyState
        legend="No model calls"
        line="Nothing has been billed in this window."
      />
    )
  }

  const sorted = [...data].sort((a, b) => (b.cost_usd || 0) - (a.cost_usd || 0))
  const topModels = sorted.slice(0, 8)
  const max = Math.max(...topModels.map((m) => Number(m.cost_usd) || 0), 0)

  return (
    <div style={{ borderBlockStart: '1px solid var(--etch-strong)' }}>
      {topModels.map((m, idx) => {
        const cost = Number(m.cost_usd) || 0
        const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0
        return (
          <div
            key={m.model ?? idx}
            // .ledger-4 carries the track sizes and the handheld reflow — one
            // line with four measure columns on a desktop, label-over-measures
            // below 640px, where 284px of fixed track plus gaps does not fit.
            className="ledger-4"
            style={{ borderBlockEnd: '1px solid var(--etch)' }}
          >
            <span className="flex items-baseline gap-3 min-w-0">
              <span className="mono flex-none" style={{ fontSize: 10, color: 'var(--ink-3)', inlineSize: 18, textAlign: 'start' }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="truncate" style={{ fontSize: 12, color: 'var(--ink)' }} title={m.model}>
                {m.model || '—'}
              </span>
            </span>

            {/* Natural width, deliberately: the Meter's fill layer is an
                absolute overlay sized to the track, so stretching the host
                box would decouple the clip from the cells it clips. */}
            {/* L3: ink, not signal. This bar repeats on every row of the
                ledger, so in signal a ten-model breakdown put ten accents on
                one screen against a budget of two. A magnitude bar is not a
                live run and it is not a spend control — it is a figure, and
                figures are set in ink. */}
            <Meter
              cells={24}
              value={max > 0 ? cost / max : 0}
              label={`${m.model}: ${pct.toFixed(1)}% of spend`}
            />

            <span style={{ textAlign: 'end' }}><Money usd={cost} /></span>

            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', textAlign: 'end', display: 'block' }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        )
      })}

      <div
        className="flex items-baseline justify-between"
        style={{ blockSize: 36, borderBlockEnd: '1px solid var(--etch-strong)' }}
      >
        <span className="legend" style={{ marginBlock: 0 }}>Total</span>
        <Money usd={totalCost} style={{ fontSize: 13 }} />
      </div>
    </div>
  )
}
