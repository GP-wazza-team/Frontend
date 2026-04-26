import React, { useState } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Download, Loader2, Trash2 } from 'lucide-react'

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

function formatCost(val) {
  const n = parseFloat(val) || 0
  return `$${n.toFixed(4)}`
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function StatusBadge({ status }) {
  const styles = {
    completed: { bg: 'var(--badge-green-bg)', text: 'var(--badge-green-text)' },
    succeeded: { bg: 'var(--badge-green-bg)', text: 'var(--badge-green-text)' },
    failed: { bg: 'var(--badge-red-bg)', text: 'var(--badge-red-text)' },
    running: { bg: 'var(--badge-amber-bg)', text: 'var(--badge-amber-text)' },
    pending: { bg: 'var(--badge-amber-bg)', text: 'var(--badge-amber-text)' },
  }
  const s = (status || '').toLowerCase()
  const style = styles[s] || styles.pending
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase" style={{ backgroundColor: style.bg, color: style.text }}>
      {status || '—'}
    </span>
  )
}

export default function AdminRunsTable({
  runs = [],
  total = 0,
  page = 1,
  limit = 25,
  loading = false,
  onPageChange,
  onRunClick,
  onExport,
  onDelete,
  filters = {},
  onFilterChange,
}) {
  const [search, setSearch] = useState(filters.search || '')
  const totalPages = Math.ceil(total / limit) || 1

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      onFilterChange({ ...filters, search: search.trim() })
    }
  }

  const statusOptions = ['all', 'completed', 'failed', 'running', 'pending']

  return (
    <div className="surface p-5 rounded-lg">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>All Runs</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{total.toLocaleString()} total runs</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search prompts, users, IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="pl-8 pr-3 py-1.5 rounded-lg text-[12px] outline-none w-64"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            />
          </div>
          {/* Status Filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value })}
              className="pl-8 pr-6 py-1.5 rounded-lg text-[12px] outline-none appearance-none cursor-pointer"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          {/* Export */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>ID</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Time</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>User</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Prompt</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Path</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Duration</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Cost</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
              <th className="text-left py-2.5 px-3 font-medium text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto" style={{ color: 'var(--accent)' }} />
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No runs found</td>
              </tr>
            ) : (
              runs.map((run, index) => (
                <tr key={run.id ?? index} className="transition-colors hover:bg-[var(--bg-hover)] cursor-pointer" style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => onRunClick(run)}>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>#{run.id}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatTime(run.started_at)}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[12px]" style={{ color: 'var(--text-secondary)' }}>{run.user_email || run.user_id || '—'}</td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <span className="line-clamp-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>{run.user_prompt || '—'}</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{run.selected_path || '—'}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{formatDuration(run.duration_seconds ?? run.duration_ms / 1000)}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-[11px] font-semibold" style={{ color: 'var(--badge-green-text)' }}>{formatCost(run.total_cost_usd)}</td>
                  <td className="py-2.5 px-3"><StatusBadge status={run.status} /></td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); onRunClick(run) }} className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors">
                        <Eye size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(run) }} className="p-1 rounded hover:bg-rose-500/10 transition-colors">
                        <Trash2 size={14} style={{ color: 'var(--badge-red-text)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Page {page} of {totalPages} ({total.toLocaleString()} runs)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
