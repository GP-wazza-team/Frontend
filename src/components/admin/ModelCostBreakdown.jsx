/* ── MODEL COST — a ranked ledger ─────────────────────────────────────────
   What the data is: one row per model, ranked by spend. So it is a table.
   Rank, model, calls, cost, share of total, and a total line that ties out.
   That is what a person reconciling a bill reads, and a table is where you
   scan — 13px, 40px rows, tabular figures in every numeric column.

   No donut, no bar chart, no 24-cell meter. The meter that used to sit in
   each row repeated a magnitude the share column already states exactly, and
   ten of them put ten accent-adjacent bars on a screen whose whole budget is
   one accent.

   Props are unchanged: { data, totalCost }. `cost_usd` and `call_count` are
   the keys /admin/overview emits for model_costs. */

import React from 'react'
import { Money } from '../ui/Money'
import EmptyState from '../ui/EmptyState'
import { useUIStore } from '../../store/uiStore'

const TOP = 8

/* .dtable styles tbody cells only, so the tie-out line carries its own
   geometry: same 40px rhythm, ruled off above in the heavier hairline. */
const FOOT = {
  blockSize: 40,
  padding: '8px 12px',
  borderBlockStart: '1px solid var(--line-2)',
  color: 'var(--ink)',
  verticalAlign: 'middle',
}

export default function ModelCostBreakdown({ data = [], totalCost = 0 }) {
  const ar = useUIStore((s) => s.language) === 'ar'

  if (data.length === 0) {
    return (
      <EmptyState
        legend={ar ? 'لا توجد استدعاءات' : 'No model calls'}
        line={ar ? 'لم تُسجَّل أي تكلفة في هذه النافذة.' : 'Nothing has been billed in this window.'}
      />
    )
  }

  const sorted = [...data].sort((a, b) => (Number(b.cost_usd) || 0) - (Number(a.cost_usd) || 0))
  const shown = sorted.slice(0, TOP)

  return (
    <>
      <div className="scroll-x">
        <table className="dtable">
          <thead>
            <tr>
              <th style={{ inlineSize: 40 }} className="num">#</th>
              <th>{ar ? 'النموذج' : 'Model'}</th>
              <th className="num">{ar ? 'الاستدعاءات' : 'Calls'}</th>
              <th className="num">{ar ? 'التكلفة' : 'Cost'}</th>
              <th className="num" style={{ inlineSize: 88 }}>{ar ? 'الحصة' : 'Share'}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m, idx) => {
              const cost = Number(m.cost_usd) || 0
              const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0
              return (
                <tr key={m.model ?? idx}>
                  {/* .mono is display:inline-block — on a <td> it would pull
                      the cell out of the table box, so it wraps the value. */}
                  <td className="num" style={{ color: 'var(--ink-3)' }}>
                    <span className="mono">{idx + 1}</span>
                  </td>
                  <td style={{ color: 'var(--ink)' }}>
                    {/* A3 — a model name is a Latin token inside an Arabic
                        page, so it is isolated rather than left to the bidi
                        algorithm. */}
                    <span className="mono truncate" style={{ maxInlineSize: 320 }} title={m.model}>
                      {m.model || '—'}
                    </span>
                  </td>
                  <td className="num">
                    <span className="mono">{(Number(m.call_count) || 0).toLocaleString('en-US')}</span>
                  </td>
                  <td className="num"><Money usd={cost} /></td>
                  <td className="num"><span className="mono">{pct.toFixed(1)}%</span></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ ...FOOT, fontWeight: 500 }}>{ar ? 'الإجمالي' : 'Total'}</td>
              <td className="num" style={FOOT}><Money usd={totalCost} /></td>
              <td className="num" style={FOOT}><span className="mono">100.0%</span></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {sorted.length > TOP && (
        <p className="caption" style={{ marginBlockStart: 10 }}>
          {ar
            ? <>أعلى <span className="mono">{TOP}</span> من <span className="mono">{sorted.length}</span> نموذجاً؛ الإجمالي يشمل جميع النماذج.</>
            : <>Top <span className="mono">{TOP}</span> of <span className="mono">{sorted.length}</span> models; the total covers all of them.</>}
        </p>
      )}
    </>
  )
}
