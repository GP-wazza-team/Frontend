/* ── ALL RUNS — the densest surface in the application ────────────────────
   A table is where you SCAN, so this is the dense half of principle 2: 13px
   type, 40px rows, tabular figures in every repeating column, one hairline
   between rows and nothing else.

   THE CONTROLS CAME BACK OUT OF THE RAIL.
   Search, the status filter and Export CSV used to be portalled into the left
   rail through <RailPanelPortal>, which meant this page's ONLY search box
   lived inside a collapsible panel that had to force itself open on arrival
   so its own controls could be found. That is the shape of the problem, not a
   fix — and the rail is where you ARE, never what is selected (principle 11).
   They are now a toolbar row sitting directly above the table they filter,
   exported as <RunsToolbar> so the route can place it there.

   THE STATUS FILTER USED TO BE A DEAD CONTROL. Its options were
   [completed, failed, running, pending] but the API emits `succeeded`, never
   `completed`, so picking "Completed" emptied the table every time. The list
   now comes from the real enum (see RunStatusField.jsx).

   SEARCH IS LIVE. It reads the runs already in memory — there is no request
   behind it — so making the user press Enter to see an in-memory filter was
   latency that did not exist.

   Props are unchanged: runs, total, page, limit, loading, onPageChange,
   onRunClick, onDelete, filters, onFilterChange, onExport. */

import React from 'react'
import { Search, Caret, Expand, Strike, Download } from '../Icon'
import { Money, Duration, RunId } from '../ui/Money'
import RunStatusField, { STATUS_FILTERS, statusLabel } from './RunStatusField'
import EmptyState from '../ui/EmptyState'
import { useUIStore } from '../../store/uiStore'

const COLUMNS = 9

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

/* ── THE TOOLBAR ──────────────────────────────────────────────────────────
   Search · status · the matched count · Export. The one filled button on this
   screen is Export: on a page an auditor reads, taking the ledger away with
   you is the action the screen exists to enable (principle 12). Everything
   else here is quiet. */
export function RunsToolbar({ filters = {}, onFilterChange, onExport, total = 0, matched = 0, disabled = false }) {
  const { language } = useUIStore()
  const ar = language === 'ar'
  const filtered = Boolean(filters.search || filters.status)

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: 10, marginBlockEnd: 12,
      }}
    >
      <div style={{ position: 'relative', flex: '1 1 260px', minInlineSize: 0 }}>
        <input
          type="text"
          value={filters.search || ''}
          placeholder={ar ? 'ابحث في الطلبات والمستخدمين والمعرّفات…' : 'Search prompts, users, IDs…'}
          aria-label={ar ? 'البحث في التشغيلات' : 'Search runs'}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          className="field"
          style={{ paddingInlineStart: 36 }}
        />
        <Search
          size={15}
          style={{
            position: 'absolute', insetBlockStart: '50%', insetInlineStart: 12,
            transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <select
          value={filters.status || 'all'}
          aria-label={ar ? 'تصفية حسب الحالة' : 'Status filter'}
          onChange={(e) => onFilterChange({
            ...filters,
            status: e.target.value === 'all' ? undefined : e.target.value,
          })}
          className="field select"
          style={{ inlineSize: 'auto', minInlineSize: 172 }}
        >
          <option value="all">{ar ? 'كل الحالات' : 'All statuses'}</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{statusLabel(s, ar)}</option>
          ))}
        </select>
        <Caret
          direction="down"
          size={14}
          style={{
            position: 'absolute', insetBlockStart: '50%', insetInlineEnd: 12,
            transform: 'translateY(-50%)', color: 'var(--ink-3)', pointerEvents: 'none',
          }}
        />
      </div>

      {/* A3 — the figures are isolated and the noun sits outside them, so the
          count reads correctly in an Arabic run. */}
      <span className="caption" style={{ marginInlineStart: 'auto', whiteSpace: 'nowrap' }}>
        {filtered
          ? (ar
            ? <><span className="mono">{matched.toLocaleString('en-US')}</span> من <span className="mono">{total.toLocaleString('en-US')}</span> تشغيل</>
            : <><span className="mono">{matched.toLocaleString('en-US')}</span> of <span className="mono">{total.toLocaleString('en-US')}</span> runs</>)
          : (ar
            ? <><span className="mono">{total.toLocaleString('en-US')}</span> تشغيل</>
            : <><span className="mono">{total.toLocaleString('en-US')}</span> runs</>)}
      </span>

      <button type="button" className="btn" onClick={onExport} disabled={disabled}>
        <Download size={15} />
        {ar ? 'تصدير CSV' : 'Export CSV'}
      </button>
    </div>
  )
}

/* Rows at their TRUE final height, so nothing reflows when the data lands,
   and no pulse — a pulsing skeleton is decorative motion. */
function TableSkeleton({ rows = 8 }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: COLUMNS }).map((__, c) => (
            <td key={c}>
              <span
                className="skel"
                style={{ display: 'block', blockSize: 10, inlineSize: c === 0 ? 28 : `${45 + ((r * 7 + c * 13) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
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
  onDelete,
  onClearFilters,
  filtered = false,
}) {
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const totalPages = Math.ceil(total / limit) || 1

  return (
    <>
      {/* The sticky thead needs a real scrollport. `overflow-x: auto` alone
          computes overflow-y to auto as well, which makes THIS box the nearest
          scroll container — but with auto height it never scrolls, so the
          header scrolled away with the rows. A bounded block size gives the
          header something to stick to and keeps the pager on screen.
          dvh, not vh: Safari's 100vh excludes the URL bar, so a vh-derived
          bound is taller than the visible page. */}
      <div
        className="scroll-x"
        style={{ overflowY: 'auto', maxBlockSize: 'min(calc(100vh - 300px), calc(100dvh - 300px))' }}
      >
        <table className="dtable dtable--min">
          <thead>
            <tr>
              <th style={{ inlineSize: 72 }}>{ar ? 'المعرّف' : 'ID'}</th>
              <th>{ar ? 'البداية' : 'Started'}</th>
              <th>{ar ? 'المستخدم' : 'User'}</th>
              <th style={{ inlineSize: '26%' }}>{t('prompt')}</th>
              <th>{ar ? 'المسار' : 'Path'}</th>
              <th className="num">{ar ? 'المدة' : 'Duration'}</th>
              <th className="num">{t('cost')}</th>
              <th>{t('status')}</th>
              <th style={{ inlineSize: 76 }} aria-label={ar ? 'إجراءات' : 'Actions'} />
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton />
          ) : (
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS} style={{ blockSize: 'auto' }}>
                    <EmptyState
                      legend={t('noRuns')}
                      line={filtered
                        ? (ar
                          ? 'لا شيء يطابق البحث أو الحالة المختارة في هذه النافذة.'
                          : 'Nothing matches the search or the status you picked in this window.')
                        : (ar
                          ? 'لم يُنفَّذ أي تشغيل داخل النافذة المختارة.'
                          : 'No run was executed inside the selected window.')}
                      compact
                    >
                      {filtered && onClearFilters && (
                        <button type="button" className="btn-q btn-q--sm" onClick={onClearFilters}>
                          {ar ? 'مسح الفلاتر' : 'Clear filters'}
                        </button>
                      )}
                    </EmptyState>
                  </td>
                </tr>
              ) : (
                runs.map((run, index) => (
                  <tr
                    key={run.id ?? index}
                    className="group"
                    onClick={() => onRunClick(run)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRunClick(run) }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td><RunId id={run.id} style={{ color: 'var(--ink-3)' }} /></td>
                    {/* .mono is display:inline-block, so it can never sit on
                        the <td> itself — that pulls the cell out of the table
                        box and its row rule stops lining up with the rest of
                        the row. It always wraps the value instead. */}
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)' }}>
                      <span className="mono">{formatTime(run.started_at)}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="truncate" style={{ display: 'block', maxInlineSize: 168 }}>
                        {run.user_email || run.user_id || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="truncate" style={{ display: 'block', color: 'var(--ink)' }} title={run.user_prompt || ''}>
                        {run.user_prompt || '—'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {run.selected_path ? <span className="mono">{run.selected_path}</span> : '—'}
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      {(run.duration_seconds ?? run.duration_ms) != null
                        ? <Duration seconds={run.duration_seconds ?? run.duration_ms / 1000} />
                        : <span className="mono">—</span>}
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <Money usd={run.total_cost_usd} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <RunStatusField status={run.status} />
                    </td>
                    <td style={{ paddingInlineEnd: 4 }}>
                      {/* .stow: invisible at rest, reachable by keyboard through
                          focus-within, and ALWAYS visible on a coarse pointer —
                          a tap on the row opens the run, so hover-gating hid
                          delete for good on a tablet. */}
                      <span className="stow" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button
                          type="button"
                          className="btn-i"
                          style={{ inlineSize: 26, blockSize: 26 }}
                          aria-label={ar ? `فتح التشغيل ${run.id}` : `Open run ${run.id}`}
                          onClick={(e) => { e.stopPropagation(); onRunClick(run) }}
                        >
                          <Expand size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-i"
                          style={{ inlineSize: 26, blockSize: 26, color: 'var(--bad)' }}
                          aria-label={ar ? `حذف التشغيل ${run.id}` : `Delete run ${run.id}`}
                          onClick={(e) => { e.stopPropagation(); onDelete(run) }}
                        >
                          <Strike size={14} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* THE PAGER — one caret mark, rotated, never two drawn arrows. */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBlockStart: 11, marginBlockStart: 4,
          borderBlockStart: '1px solid var(--line)',
        }}
      >
        <span className="caption">
          {ar
            ? <>صفحة <span className="mono">{page}</span> من <span className="mono">{totalPages}</span> · <span className="mono">{total.toLocaleString('en-US')}</span> تشغيل</>
            : <>Page <span className="mono">{page}</span> of <span className="mono">{totalPages}</span> · <span className="mono">{total.toLocaleString('en-US')}</span> runs</>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn-q btn-q--sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <Caret direction="start" size={14} />
            {ar ? 'السابق' : 'Prev'}
          </button>
          <button
            type="button"
            className="btn-q btn-q--sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            {ar ? 'التالي' : 'Next'}
            <Caret direction="end" size={14} />
          </button>
        </div>
      </div>
    </>
  )
}
