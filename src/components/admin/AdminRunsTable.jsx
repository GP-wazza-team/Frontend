/* ALL RUNS — the densest surface in the application.

   THE RECOMPOSITION
     · The plate is gone. Nine columns of run data do not need a card around
       them; on a 1280 laptop that card's padding was the difference between
       fitting and scrolling sideways. The table now runs the full band width
       with a 56px leading column that lands on the page's gutter axis.
     · The filter set left the table header entirely. Search, status and
       Export are route controls, so they mount into the RAIL PANEL through
       the named RunsFilters export below — which is why this component is now
       just a table and a pager.
     · The tinted uppercase pill chips are gone: state is a SHAPE in the
       leading column (readable without colour, L4) and the word repeats at
       the trailing edge in its tone.
     · Every number goes through the ledger line, so a column of costs scans
       magnitude-first.
     · The row actions were pointer-only. They are now reachable by keyboard
       through :focus-within, and they are bare marks — no circle, no tint.
     · The spinner became a skeleton body at the true 36px row height, so the
       table does not resize when the data lands.

   Every prop is unchanged: runs, total, page, limit, loading, onPageChange,
   onRunClick, onExport, onDelete, filters, onFilterChange. */

import React, { useEffect, useState } from 'react'
import { Search, Caret, Expand, Strike, Download } from '../Icon'
import { Money, Duration, RunId } from '../ui/Money'
import { RunMarker, TableSkeleton } from '../dashboard/Instruments'
import EmptyState from '../ui/EmptyState'
import { useUIStore } from '../../store/uiStore'

const STATUS_OPTIONS = ['all', 'completed', 'failed', 'running', 'pending']

/* The app is Arabic-first and every other route is bilingual; admin was the
   one screen still hardcoded to English. uiStore has no key for a run's column
   set or its status words and the store is frozen, so the pair is inlined here
   exactly as AssetsPage inlines its filter labels — t() still wins the moment
   those keys are added upstream. */
function useLabel() {
  const { t, language } = useUIStore()
  const ar = language === 'ar'
  const label = (key, arText, enText) => {
    const v = t(key)
    return v === key ? (ar ? arText : enText) : v
  }
  return { label, ar }
}

const STATUS_WORD = {
  all: ['كل الحالات', 'All statuses'],
  completed: ['مكتمل', 'Completed'],
  failed: ['فاشل', 'Failed'],
  running: ['قيد التنفيذ', 'Running'],
  pending: ['في الانتظار', 'Pending'],
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

/* ── THE RAIL-PANEL FILTER SET ─────────────────────────────────────────────
   Mounted by the route into <RailPanelPortal>. It holds exactly the controls
   that used to sit in the table header, with the same handlers. */
export function RunsFilters({ filters = {}, onFilterChange, onExport, total = 0, matched }) {
  const [search, setSearch] = useState(filters.search || '')
  const { label, ar } = useLabel()

  // Keep the field in step if the route resets the filters.
  useEffect(() => { setSearch(filters.search || '') }, [filters.search])

  const commit = () => onFilterChange({ ...filters, search: search.trim() })

  return (
    <div>
      <div className="relative" style={{ marginBlockEnd: 12 }}>
        <input
          type="text"
          value={search}
          placeholder={ar ? 'ابحث في الطلبات والمستخدمين والمعرّفات…' : 'Search prompts, users, IDs…'}
          aria-label={ar ? 'البحث في التشغيلات' : 'Search runs'}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
          onBlur={commit}
          className="field field--sm"
          style={{ paddingInlineStart: 32 }}
        />
        <Search
          size={14}
          className="absolute top-1/2 -translate-y-1/2 start-[10px] pointer-events-none"
          style={{ color: 'var(--ink-3)' }}
        />
      </div>

      <div className="relative" style={{ marginBlockEnd: 12 }}>
        <select
          value={filters.status || 'all'}
          aria-label={ar ? 'تصفية حسب الحالة' : 'Status filter'}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value })}
          className="field field--sm select"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{ar ? STATUS_WORD[s][0] : STATUS_WORD[s][1]}</option>
          ))}
        </select>
        <Caret
          direction="down"
          size={14}
          className="absolute top-1/2 -translate-y-1/2 end-[12px] pointer-events-none"
          style={{ color: 'var(--ink-3)' }}
        />
      </div>

      {/* A3: the figure is isolated and the word sits outside it, so the count
          reads correctly in an Arabic run instead of being dragged into an LTR
          box with the noun. */}
      <p style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'start', marginBlockEnd: 8 }}>
        <span className="figure">
          {matched === undefined || matched === total
            ? total.toLocaleString('en-US')
            : `${matched.toLocaleString('en-US')} / ${total.toLocaleString('en-US')}`}
        </span>
        {' '}
        {ar ? 'تشغيل' : 'runs'}
      </p>

      <button type="button" className="text-action" onClick={onExport}>
        <Download size={16} />
        {label('exportCsv', 'تصدير CSV', 'Export CSV')}
      </button>
    </div>
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
  onExport,     // eslint-disable-line no-unused-vars -- rendered by RunsFilters in the rail
  onDelete,
  filters = {}, // eslint-disable-line no-unused-vars -- rendered by RunsFilters in the rail
  onFilterChange, // eslint-disable-line no-unused-vars -- rendered by RunsFilters in the rail
}) {
  const totalPages = Math.ceil(total / limit) || 1
  const { label, ar } = useLabel()

  return (
    <div>
      {/* The sticky thead needs a real scrollport. `overflow-x: auto` alone
          computes overflow-y to auto too, which makes THIS div the nearest
          scroll container — but it has auto height and never scrolls, so the
          header scrolled away with the rows. A bounded block size gives the
          header something to stick to, keeps horizontal scroll, and leaves the
          pager on screen. */}
      <div style={{ overflow: 'auto', maxBlockSize: 'calc(100vh - 260px)' }}>
        <table className="dtable">
          <thead>
            <tr>
              <th style={{ inlineSize: 'var(--rail-spine)', paddingInlineStart: 0 }} aria-label={label('status', 'الحالة', 'State')} />
              <th>{label('id', 'المعرّف', 'ID')}</th>
              <th>{label('time', 'الوقت', 'Time')}</th>
              <th>{label('user', 'المستخدم', 'User')}</th>
              <th style={{ inlineSize: '26%' }}>{label('prompt', 'الطلب', 'Prompt')}</th>
              <th>{label('path', 'المسار', 'Path')}</th>
              <th className="num">{label('duration', 'المدة', 'Duration')}</th>
              <th className="num">{label('cost', 'التكلفة', 'Cost')}</th>
              <th>{label('status', 'الحالة', 'Status')}</th>
              <th style={{ inlineSize: 64 }} aria-label={label('actions', 'إجراءات', 'Actions')} />
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton columns={10} rows={8} />
          ) : (
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ blockSize: 'auto', paddingBlock: 4 }}>
                    <EmptyState
                      legend={label('noRuns', 'لا توجد تشغيلات', 'No runs')}
                      line={ar
                        ? 'لا شيء يطابق الفلتر الحالي. امسح البحث من الشريط لعرض النافذة كاملة.'
                        : 'Nothing matches the current filter. Clear the search in the rail to see the full window.'}
                      compact
                    />
                  </td>
                </tr>
              ) : (
                runs.map((run, index) => (
                  <tr
                    key={run.id ?? index}
                    className="group"
                    onClick={() => onRunClick(run)}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRunClick(run) } }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ paddingInlineStart: 0 }}>
                      <RunMarker status={run.status} word={false} />
                    </td>
                    <td><RunId id={run.id} style={{ color: 'var(--ink-3)' }} /></td>
                    <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11, color: 'var(--ink-3)', textAlign: 'start' }}>
                      {formatTime(run.started_at)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="truncate" style={{ display: 'block', maxInlineSize: 160 }}>
                        {run.user_email || run.user_id || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="truncate" style={{ display: 'block', color: 'var(--ink)' }}>
                        {run.user_prompt || '—'}
                      </span>
                    </td>
                    <td className="mono" style={{ whiteSpace: 'nowrap', fontSize: 11, textAlign: 'start' }}>
                      {run.selected_path || '—'}
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
                      <RunMarker status={run.status} shape={false} />
                    </td>
                    <td style={{ paddingInlineEnd: 4 }}>
                      {/* .stow: keyboard-reachable through focus-within, and
                          always visible on a coarse pointer — a tap on the row
                          opens the run, so hover-gating hid these for good on
                          a tablet. */}
                      <span className="flex items-center gap-1 stow">
                        <button
                          type="button"
                          className="text-action"
                          style={{ padding: 4 }}
                          aria-label={ar ? `فتح التشغيل ${run.id}` : `Open run ${run.id}`}
                          onClick={(e) => { e.stopPropagation(); onRunClick(run) }}
                        >
                          <Expand size={14} />
                        </button>
                        <button
                          type="button"
                          className="text-action text-action--danger"
                          style={{ padding: 4 }}
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

      {/* PAGER — text actions with the one caret mark rotated, never two icons. */}
      <div
        className="flex items-center justify-between gap-4"
        style={{ paddingBlockStart: 10, borderBlockStart: '1px solid var(--etch-strong)' }}
      >
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'start' }}>
          {page} / {totalPages} · {total.toLocaleString('en-US')}
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-action"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label={ar ? 'الصفحة السابقة' : 'Previous page'}
          >
            <Caret direction="start" size={16} />
            {label('prev', 'السابق', 'Prev')}
          </button>
          <button
            type="button"
            className="text-action"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label={ar ? 'الصفحة التالية' : 'Next page'}
          >
            {label('next', 'التالي', 'Next')}
            <Caret direction="end" size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
