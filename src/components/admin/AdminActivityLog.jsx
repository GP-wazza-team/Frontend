/* ── THE ACTIVITY FEED — what the platform is doing, right now ────────────
   A live surface, which this dashboard otherwise does not have. The poll
   moves a CURSOR instead of re-reading the page: every 5s it asks for rows
   newer than the newest id it holds (`since_id` — the server ignores skip in
   that mode and answers newest-first), prepends them, and lets the tail fall
   off past ~500 rows so an afternoon left open cannot grow without bound.

   THE POLL IS SILENT ABOUT ITS OWN FAILURES. A missed tick self-heals on the
   next one — the cursor has not moved — so a transient network blip must not
   toast, and only the INITIAL load may show the error card with a retry.
   Pausing tears the interval down entirely (so does unmount); "paused" is a
   state the reader chose and the header says so in place of the live dot.

   Filters are part of the cursor's world: changing kind or search resets the
   list and the cursor together, and the poll carries the same filters, so a
   prepended row always belongs to the view it lands in.

   STATUS IS COLOUR-CODED BY CLASS — 2xx ok, 4xx warn, 5xx bad — because on a
   scanning surface the one question is "is anything failing", and the code
   itself stays printed for the reader who wants which failure. */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { adminService } from '../../services/adminService'
import { describeFailure } from '../../services/errorText'
import { formatRelativeTime } from '../../utils/helpers'
import { useUIStore } from '../../store/uiStore'
import { Search, Revise } from '../Icon'
import Rocker from '../ui/Rocker'
import EmptyState from '../ui/EmptyState'

const POLL_MS = 5000
const CAP = 500          // in-memory bound; the tail falls off, the server keeps the rest
const FIRST_LOAD = 100
const COLUMNS = 6

/* The backend emits naive-UTC isoformat (no zone marker). new Date() would
   read that as LOCAL time and a feed of fresh rows would open saying
   "in 3 hours", so an unzoned stamp is pinned to UTC before parsing. Stamps
   that do carry a zone pass through untouched. */
function parseStamp(ts) {
  if (!ts) return null
  const s = String(ts)
  return new Date(/Z|[+-]\d{2}:?\d{2}$/.test(s) ? s : `${s}Z`)
}

function relTime(ts, ar) {
  const d = parseStamp(ts)
  if (!d || Number.isNaN(d.getTime())) return '—'
  try {
    return formatRelativeTime(d, ar ? 'ar' : 'en')
  } catch {
    return '—'
  }
}

function absTime(ts) {
  const d = parseStamp(ts)
  if (!d || Number.isNaN(d.getTime())) return ''
  try {
    return d.toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return ''
  }
}

const KIND_TONE = { REQUEST: 'var(--ink-3)', AUTH: 'var(--warn)', ADMIN: 'var(--ok)' }

function KindWord({ kind }) {
  const ar = useUIStore((s) => s.language) === 'ar'
  const k = String(kind || '').toUpperCase()
  const word = k === 'REQUEST' ? (ar ? 'طلب' : 'Request')
    : k === 'AUTH' ? (ar ? 'دخول' : 'Auth')
      : k === 'ADMIN' ? (ar ? 'إدارة' : 'Admin')
        : (k || '—')
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: KIND_TONE[k] || 'var(--ink-3)' }}>
      {word}
    </span>
  )
}

/* 2xx ok · 3xx quiet · 4xx warn · 5xx bad. The number stays printed — the
   colour answers "is anything failing", the code answers "failing how". */
function StatusCode({ code }) {
  if (code == null) return <span className="mono">—</span>
  const n = Number(code)
  const color = n >= 500 ? 'var(--bad)'
    : n >= 400 ? 'var(--warn)'
      : n >= 200 && n < 300 ? 'var(--ok)'
        : 'var(--ink-3)'
  return <span className="mono" style={{ color, fontWeight: 600 }}>{code}</span>
}

function FeedSkeleton({ rows = 10 }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: COLUMNS }).map((__, c) => (
            <td key={c}>
              <span
                className="skel"
                style={{ display: 'block', blockSize: 10, inlineSize: `${35 + ((r * 13 + c * 19) % 50)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

export default function AdminActivityLog() {
  const { language } = useUIStore()
  const ar = language === 'ar'

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [kind, setKind] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [paused, setPaused] = useState(false)

  /* The cursor. A ref, not state — the interval reads it on every tick and
     must not be torn down and rebuilt each time a row arrives. */
  const newestIdRef = useRef(null)

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 350)
    return () => clearTimeout(id)
  }, [search])

  /* THE INITIAL READ — and the re-read whenever the filters change. It resets
     the cursor along with the list, because rows loaded under the old filters
     say nothing about where "new" starts under the new ones. */
  const loadFeed = useCallback(async () => {
    setLoading(true)
    newestIdRef.current = null
    try {
      const data = await adminService.getActivity({
        limit: FIRST_LOAD,
        kind: kind || undefined,
        search: query || undefined,
      })
      const items = Array.isArray(data?.items) ? data.items : []
      setRows(items)
      setTotal(Number(data?.total) || 0)
      newestIdRef.current = items[0]?.id || null
      setError(null)
    } catch (err) {
      console.error('Failed to load activity:', err)
      setError(describeFailure(ar ? 'تعذّر تحميل سجل النشاط' : 'Could not load the activity log', err))
    } finally {
      setLoading(false)
    }
  }, [kind, query, ar])

  useEffect(() => { loadFeed() }, [loadFeed])

  /* THE POLL. Torn down while paused and on unmount — `return undefined`
     when paused means there is no timer at all, not a timer that checks a
     flag. Failures are swallowed: the cursor has not moved, so the next tick
     asks the same question and a blip costs one tick of freshness. */
  useEffect(() => {
    if (paused) return undefined
    const tick = async () => {
      try {
        const data = await adminService.getActivity({
          limit: 200,
          kind: kind || undefined,
          search: query || undefined,
          since_id: newestIdRef.current || undefined,
        })
        const items = Array.isArray(data?.items) ? data.items : []
        if (Number.isFinite(Number(data?.total))) setTotal(Number(data.total))
        if (!items.length) return
        newestIdRef.current = items[0].id
        setRows((prev) => {
          /* since_id should preclude overlap, but a poll racing the initial
             load (which just reset the cursor) can answer with rows already
             held — dedupe by id so a race costs nothing. */
          const seen = new Set(items.map((r) => r.id))
          return [...items, ...prev.filter((r) => !seen.has(r.id))].slice(0, CAP)
        })
      } catch (err) {
        console.debug('Activity poll skipped a tick:', err?.message)
      }
    }
    const id = setInterval(tick, POLL_MS)
    return () => clearInterval(id)
  }, [paused, kind, query])

  const filteredView = Boolean(kind || query)

  return (
    <>
      {/* THE TOOLBAR — kind, search, and the feed's own state. The live dot
          is the one permitted motion (.st--run breathes); paused swaps it for
          a still word, so the header always states what the feed is doing. */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBlockEnd: 12 }}>
        <Rocker
          value={kind}
          onChange={setKind}
          ariaLabel={ar ? 'نوع النشاط' : 'Activity kind'}
          options={[
            { value: '', label: ar ? 'الكل' : 'All' },
            { value: 'REQUEST', label: ar ? 'الطلبات' : 'Requests' },
            { value: 'AUTH', label: ar ? 'الدخول' : 'Auth' },
            { value: 'ADMIN', label: ar ? 'الإدارة' : 'Admin' },
          ]}
        />

        <div style={{ position: 'relative', flex: '1 1 220px', minInlineSize: 0 }}>
          <input
            type="text"
            value={search}
            placeholder={ar ? 'ابحث بالبريد أو المسار أو التفاصيل…' : 'Search email, path, detail…'}
            aria-label={ar ? 'البحث في النشاط' : 'Search activity'}
            onChange={(e) => setSearch(e.target.value)}
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

        <span className="caption" style={{ marginInlineStart: 'auto', whiteSpace: 'nowrap' }}>
          {paused
            ? <span className="st st--idle">{ar ? 'متوقف' : 'Paused'}</span>
            : <span className="st st--run">{ar ? 'مباشر' : 'Live'}</span>}
          {' · '}
          {ar
            ? <><span className="mono">{total.toLocaleString('en-US')}</span> حدث</>
            : <><span className="mono">{total.toLocaleString('en-US')}</span> events</>}
        </span>

        <button type="button" className="btn-q btn-q--sm" onClick={() => setPaused((p) => !p)}>
          {paused ? (ar ? 'استئناف' : 'Resume') : (ar ? 'إيقاف مؤقت' : 'Pause')}
        </button>
      </div>

      {error && (
        <div style={{ marginBlockEnd: 12 }}>
          <span className="st st--bad">{ar ? 'خطأ' : 'Error'}</span>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, marginBlockStart: 4 }}>{error}</p>
          <button type="button" className="btn-q btn-q--sm" style={{ marginBlockStart: 8 }} onClick={loadFeed}>
            <Revise size={14} />
            {ar ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      <div
        className="scroll-x"
        style={{ overflowY: 'auto', maxBlockSize: 'min(calc(100vh - 300px), calc(100dvh - 300px))' }}
      >
        <table className="dtable dtable--min">
          <thead>
            <tr>
              <th style={{ inlineSize: 110 }}>{ar ? 'متى' : 'When'}</th>
              <th style={{ inlineSize: 80 }}>{ar ? 'النوع' : 'Kind'}</th>
              <th>{ar ? 'المستخدم' : 'User'}</th>
              <th style={{ inlineSize: '40%' }}>{ar ? 'الحدث' : 'Event'}</th>
              <th className="num">{ar ? 'الرمز' : 'Status'}</th>
              <th className="num">{ar ? 'الزمن' : 'Latency'}</th>
            </tr>
          </thead>

          {loading ? (
            <FeedSkeleton />
          ) : (
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS} style={{ blockSize: 'auto' }}>
                    <EmptyState
                      legend={ar ? 'لا نشاط' : 'No activity'}
                      line={filteredView
                        ? (ar
                          ? 'لا حدث يطابق النوع أو البحث المختار.'
                          : 'No event matches the kind or the search you picked.')
                        : (ar
                          ? 'لم يُسجَّل أي حدث بعد — تصل الأحداث الجديدة هنا خلال ثوانٍ.'
                          : 'Nothing is recorded yet — new events land here within seconds.')}
                      compact
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isRequest = String(row.kind || '').toUpperCase() === 'REQUEST'
                  return (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)' }} title={absTime(row.created_at)}>
                        {relTime(row.created_at, ar)}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}><KindWord kind={row.kind} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className="truncate" style={{ display: 'block', maxInlineSize: 180 }}>
                          {row.user_email
                            ? <bdi>{row.user_email}</bdi>
                            : <span style={{ color: 'var(--ink-3)' }}>{ar ? 'مجهول' : 'anonymous'}</span>}
                        </span>
                      </td>
                      <td>
                        {isRequest ? (
                          /* METHOD then path, both mono — reads like an access
                             log line, which is what it is. */
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, minInlineSize: 0 }}>
                            <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)', flex: 'none' }}>
                              {row.method || '—'}
                            </span>
                            <span className="mono truncate" style={{ fontSize: 12, color: 'var(--ink)' }} title={row.path || ''}>
                              {row.path || '—'}
                            </span>
                          </span>
                        ) : (
                          /* AUTH and ADMIN carry a written sentence — that
                             sentence IS the event, so it gets the cell. */
                          <span
                            className="truncate"
                            style={{ display: 'block', fontSize: 12, color: 'var(--ink)' }}
                            title={row.detail || ''}
                          >
                            <bdi>{row.detail || row.path || '—'}</bdi>
                          </span>
                        )}
                      </td>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>
                        <StatusCode code={row.status_code} />
                      </td>
                      <td className="num" style={{ whiteSpace: 'nowrap' }}>
                        {row.latency_ms != null
                          ? <span className="mono">{Number(row.latency_ms).toLocaleString('en-US')}<span style={{ color: 'var(--ink-3)' }}>ms</span></span>
                          : <span className="mono">—</span>}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          )}
        </table>
      </div>

      {/* The bound, stated: the feed keeps the newest CAP rows in memory. */}
      {rows.length >= CAP && (
        <p className="caption" style={{ marginBlockStart: 8 }}>
          {ar
            ? <>يعرض أحدث <span className="mono">{CAP}</span> حدث — القديم يسقط من الذاكرة ويبقى على الخادم.</>
            : <>Showing the newest <span className="mono">{CAP}</span> events — older rows drop from memory and stay on the server.</>}
        </p>
      )}
    </>
  )
}
