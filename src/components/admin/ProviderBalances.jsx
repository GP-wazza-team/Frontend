/* PROVIDER BALANCES — the upstream ledger.

   Arrived from main styled against the old token set: a `surface` card with
   its own <h3> and paragraph, lucide glyphs, and `--text-primary` /
   `--border` / `--badge-*-text` colours that no longer exist. Rebuilt here on
   the same ranked-ledger geometry as the model breakdown next to it, so the
   two panels on this route read as one object.

   THE HEADER IS GONE. The Band above supplies the legend and the note, so the
   card's own title and description were saying it a second time. What the
   paragraph carried that the Band cannot — how many vendors actually report,
   and the total — moved to the footer row, where the model ledger also puts
   its total.

   NO COLOUR-ONLY STATUS. The old version leaned on green/red text. Depletion
   is the one state worth interrupting someone for, so it is stated in words
   on its own line and carries the signal tone; every other state is a word in
   ink. Read without colour, the panel still says the same thing. */

import React from 'react'
import { Money } from '../ui/Money'
import EmptyState from '../ui/EmptyState'
import { Check, Strike, Help, Void, Retry } from '../Icon'
import { useUIStore } from '../../store/uiStore'

// USD gets cents, vendor credits are whole units — showing "460.0000 credits"
// reads like a precision we do not have.
function formatBalance(row) {
  if (row.balance === null || row.balance === undefined) return '—'
  if (row.unit === 'USD') return `$${Number(row.balance).toFixed(2)}`
  return `${Number(row.balance).toLocaleString('en-US')} ${row.unit || ''}`.trim()
}

const STATUS_META = {
  ok: { icon: Check, en: 'Live', ar: 'حي' },
  unsupported: { icon: Help, en: 'No API', ar: 'لا واجهة' },
  not_configured: { icon: Void, en: 'Not set up', ar: 'غير مهيأ' },
  error: { icon: Strike, en: 'Failed', ar: 'فشل' },
}

const COLUMNS = 'minmax(0, 1fr) 108px 116px 92px 64px'

export default function ProviderBalances({ data = [], days = 30, loading = false, onRefresh }) {
  const { language } = useUIStore()
  const ar = language === 'ar'

  if (data.length === 0) {
    return (
      <EmptyState
        legend={ar ? 'لا توجد أرصدة' : 'No balances'}
        line={ar
          ? 'لم يُبلِّغ أي مزود عن رصيد في هذه النافذة.'
          : 'No provider reported a balance in this window.'}
      >
        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={loading} className="text-action">
            <Retry size={16} />
            {ar ? 'إعادة القراءة' : 'Re-read'}
          </button>
        )}
      </EmptyState>
    )
  }

  const totalSpend = data.reduce((sum, r) => sum + (parseFloat(r.spend_usd) || 0), 0)
  const reporting = data.filter((r) => r.status === 'ok').length

  return (
    <div>
      {onRefresh && (
        <div className="flex justify-end" style={{ paddingBlockEnd: 8 }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="text-action"
            title={ar ? 'إعادة قراءة الأرصدة من المزودين' : 'Re-read balances from the providers'}
          >
            <Retry size={16} />
            {ar ? 'إعادة القراءة' : 'Re-read'}
          </button>
        </div>
      )}

      <div style={{ borderBlockStart: '1px solid var(--etch-strong)' }}>
        <div
          className="legend"
          style={{ display: 'grid', gridTemplateColumns: COLUMNS, gap: 16, blockSize: 28, alignItems: 'center', marginBlock: 0 }}
        >
          <span>{ar ? 'المزود' : 'Provider'}</span>
          <span>{ar ? 'الحالة' : 'Status'}</span>
          <span style={{ textAlign: 'end' }}>{ar ? 'المتبقي' : 'Remaining'}</span>
          <span style={{ textAlign: 'end' }}>{ar ? `الإنفاق ${days}ي` : `Spent ${days}d`}</span>
          <span style={{ textAlign: 'end' }}>{ar ? 'الطلبات' : 'Calls'}</span>
        </div>

        {data.map((row) => {
          // A vendor that reports a real zero is out of credit, which is the
          // one number on this panel worth interrupting someone for.
          const depleted = row.status === 'ok' && Number(row.balance) === 0
          const meta = STATUS_META[row.status] || STATUS_META.error
          const StatusIcon = meta.icon

          return (
            <div
              key={row.provider}
              style={{
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                gap: 16,
                alignItems: 'baseline',
                minBlockSize: 40,
                paddingBlock: 8,
                borderBlockEnd: '1px solid var(--etch)',
              }}
            >
              <span className="min-w-0">
                <span className="truncate" style={{ fontSize: 12, color: 'var(--ink)', display: 'block' }}>
                  {row.display_name}
                </span>
                {row.detail && (
                  <span
                    className="truncate"
                    style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', marginBlockStart: 2 }}
                    title={row.detail}
                  >
                    {row.detail}
                  </span>
                )}
              </span>

              <span className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                <StatusIcon size={14} />
                {ar ? meta.ar : meta.en}
              </span>

              <span style={{ textAlign: 'end' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink)' }}>
                  {formatBalance(row)}
                </span>
                {depleted && (
                  <span style={{ fontSize: 10, color: 'var(--signal)', display: 'block', marginBlockStart: 2 }}>
                    {ar ? 'نفد الرصيد' : 'out of credit'}
                  </span>
                )}
              </span>

              <span style={{ textAlign: 'end' }}>
                <Money usd={parseFloat(row.spend_usd) || 0} />
              </span>

              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'end', display: 'block' }}>
                {(row.call_count || 0).toLocaleString('en-US')}
              </span>
            </div>
          )
        })}

        <div
          className="flex items-baseline justify-between"
          style={{ blockSize: 36, borderBlockEnd: '1px solid var(--etch-strong)' }}
        >
          <span className="legend" style={{ marginBlock: 0 }}>
            {ar
              ? `${reporting} من ${data.length} تُبلّغ عن رصيد`
              : `${reporting} of ${data.length} report a balance`}
          </span>
          <Money usd={totalSpend} style={{ fontSize: 13 }} />
        </div>
      </div>
    </div>
  )
}
