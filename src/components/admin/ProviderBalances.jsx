import React from 'react'
import { Wallet, RefreshCw, AlertTriangle, CheckCircle2, MinusCircle, HelpCircle } from 'lucide-react'

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

// USD gets cents, vendor credits are whole units — showing "460.0000 credits"
// reads like a precision we do not have.
function formatBalance(row) {
  if (row.balance === null || row.balance === undefined) return '—'
  if (row.unit === 'USD') return `$${Number(row.balance).toFixed(2)}`
  return `${Number(row.balance).toLocaleString()} ${row.unit || ''}`.trim()
}

const STATUS_META = {
  ok: { label: 'Live', icon: CheckCircle2, color: 'var(--badge-green-text)' },
  unsupported: { label: 'No API', icon: HelpCircle, color: 'var(--text-tertiary)' },
  not_configured: { label: 'Not set up', icon: MinusCircle, color: 'var(--text-tertiary)' },
  error: { label: 'Failed', icon: AlertTriangle, color: 'var(--badge-red-text)' },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.error
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} style={{ color: meta.color }} />
      <span className="text-[11px] font-medium" style={{ color: meta.color }}>{meta.label}</span>
    </div>
  )
}

export default function ProviderBalances({ data = [], days = 30, loading = false, onRefresh }) {
  const totalSpend = data.reduce((sum, r) => sum + (parseFloat(r.spend_usd) || 0), 0)
  const reporting = data.filter((r) => r.status === 'ok').length

  return (
    <div className="surface p-5 rounded-lg">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet size={16} style={{ color: 'var(--accent)' }} />
            <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>Provider Balances</h3>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Credit remaining upstream vs spend over the last {days}d — {reporting} of {data.length} providers
            publish a balance. Total spend {formatCost(totalSpend)}.
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg transition-all shrink-0"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', opacity: loading ? 0.5 : 1 }}
            title="Re-read balances from the providers"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {loading ? 'Loading balances…' : 'No data'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Remaining</th>
                <th className="pb-2 font-medium text-right">Spent ({days}d)</th>
                <th className="pb-2 font-medium text-right">Calls</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                // A vendor that reports a real zero is out of credit, which is
                // the one number on this panel worth interrupting someone for.
                const depleted = row.status === 'ok' && Number(row.balance) === 0
                return (
                  <tr key={row.provider} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="py-2.5 pr-4 align-top">
                      <div className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{row.display_name}</div>
                      {row.detail && (
                        <div
                          className="text-[11px] mt-0.5 max-w-md"
                          style={{ color: 'var(--text-tertiary)' }}
                          title={row.detail}
                        >
                          {row.detail}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <StatusBadge status={row.status} />
                    </td>
                    <td
                      className="py-2.5 pr-4 text-right align-top text-[13px] font-medium"
                      style={{ color: depleted ? 'var(--badge-red-text)' : 'var(--text-primary)' }}
                    >
                      {formatBalance(row)}
                      {depleted && (
                        <div className="text-[11px] font-normal" style={{ color: 'var(--badge-red-text)' }}>
                          out of credit
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right align-top text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      {formatCost(row.spend_usd)}
                    </td>
                    <td className="py-2.5 text-right align-top text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
                      {(row.call_count || 0).toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
