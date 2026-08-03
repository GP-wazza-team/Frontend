/* ── PROVIDER BALANCES — the upstream ledger ──────────────────────────────
   The same table geometry as the model breakdown beside it, so the two panels
   on this route read as one instrument rather than two widgets.

   STATUS IS A FIELD (principle 5). Live / No API / Not set up / Failed are
   words in the status column with the .st dot in their tone — the same object
   the runs table uses for a run. The old version leaned on green and red text
   plus four glyphs; read without colour it said nothing.

   DEPLETION IS THE ONE STATE WORTH INTERRUPTING SOMEONE FOR. A vendor that
   reports a real zero cannot serve the next job, so it takes the --bad tone
   in the status column outright instead of quietly reading "Live · 0".

   Props are unchanged: { data, days, loading, onRefresh }. */

import React from 'react'
import { Money } from '../ui/Money'
import EmptyState from '../ui/EmptyState'
import { Retry } from '../Icon'
import { useUIStore } from '../../store/uiStore'

/* USD gets cents; vendor credits are whole units — "460.0000 credits" claims
   a precision nobody has. */
function Balance({ row }) {
  if (row.balance === null || row.balance === undefined) return <span className="mono">—</span>
  if (row.unit === 'USD') return <Money usd={row.balance} digits={2} />
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
      <span className="mono">{Number(row.balance).toLocaleString('en-US')}</span>
      {row.unit ? <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{row.unit}</span> : null}
    </span>
  )
}

const STATUS = {
  ok: { tone: 'ok', ar: 'حي', en: 'Live' },
  unsupported: { tone: 'idle', ar: 'لا واجهة', en: 'No API' },
  not_configured: { tone: 'idle', ar: 'غير مهيأ', en: 'Not set up' },
  error: { tone: 'bad', ar: 'فشل', en: 'Failed' },
}

const FOOT = {
  blockSize: 40,
  padding: '8px 12px',
  borderBlockStart: '1px solid var(--line-2)',
  color: 'var(--ink)',
  verticalAlign: 'middle',
}

export default function ProviderBalances({ data = [], days = 30, loading = false, onRefresh }) {
  const ar = useUIStore((s) => s.language) === 'ar'

  const reread = onRefresh && (
    <button
      type="button"
      className="btn-t"
      onClick={onRefresh}
      disabled={loading}
      title={ar ? 'إعادة قراءة الأرصدة من المزودين' : 'Re-read balances from the providers'}
    >
      <Retry size={15} />
      {ar ? 'إعادة القراءة' : 'Re-read'}
    </button>
  )

  if (data.length === 0) {
    return (
      <EmptyState
        legend={ar ? 'لا توجد أرصدة' : 'No balances'}
        line={ar
          ? 'لم يُبلِّغ أي مزود عن رصيد في هذه النافذة.'
          : 'No provider reported a balance in this window.'}
      >
        {reread}
      </EmptyState>
    )
  }

  const totalSpend = data.reduce((sum, r) => sum + (parseFloat(r.spend_usd) || 0), 0)
  const reporting = data.filter((r) => r.status === 'ok').length

  return (
    <>
      {reread && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBlockEnd: 4 }}>{reread}</div>
      )}

      <div className="scroll-x">
        <table className="dtable">
          <thead>
            <tr>
              <th>{ar ? 'المزود' : 'Provider'}</th>
              <th>{ar ? 'الحالة' : 'Status'}</th>
              <th className="num">{ar ? 'المتبقي' : 'Remaining'}</th>
              <th className="num">
                {ar ? <>الإنفاق · <span className="mono">{days}</span>ي</> : <>Spent · <span className="mono">{days}</span>d</>}
              </th>
              <th className="num">{ar ? 'الطلبات' : 'Calls'}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const depleted = row.status === 'ok' && Number(row.balance) === 0
              const meta = STATUS[row.status] || STATUS.error
              return (
                <tr key={row.provider}>
                  <td style={{ color: 'var(--ink)' }}>
                    <span className="truncate" style={{ display: 'block', maxInlineSize: 220 }}>
                      {row.display_name || row.provider}
                    </span>
                    {row.detail && (
                      <span
                        className="caption truncate"
                        style={{ display: 'block', maxInlineSize: 220 }}
                        title={row.detail}
                      >
                        {row.detail}
                      </span>
                    )}
                  </td>
                  <td>
                    {depleted ? (
                      <span className="st st--bad">{ar ? 'نفد الرصيد' : 'Out of credit'}</span>
                    ) : (
                      <span className={`st st--${meta.tone}`}>{ar ? meta.ar : meta.en}</span>
                    )}
                  </td>
                  <td className="num" style={{ color: 'var(--ink)' }}><Balance row={row} /></td>
                  <td className="num"><Money usd={parseFloat(row.spend_usd) || 0} /></td>
                  {/* .mono is display:inline-block — on a <td> it would pull
                      the cell out of the table box, so it wraps the value. */}
                  <td className="num">
                    <span className="mono">{(Number(row.call_count) || 0).toLocaleString('en-US')}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ ...FOOT, color: 'var(--ink-2)' }}>
                {ar
                  ? <><span className="mono">{reporting}</span> من <span className="mono">{data.length}</span> تُبلّغ عن رصيد</>
                  : <><span className="mono">{reporting}</span> of <span className="mono">{data.length}</span> report a balance</>}
              </td>
              <td className="num" style={FOOT}><Money usd={totalSpend} /></td>
              <td style={FOOT} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
