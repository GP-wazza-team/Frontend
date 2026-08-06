/* ── THE ACCOUNT DRAWER — inspect one user, end to end ────────────────────
   The same panel contract as RunDetailDrawer: docked to the inline-end edge,
   Escape closes, focus trapped and returned, the callback held in a ref so a
   parent re-render mid-open (the detail fetch resolving) cannot tear the trap
   down. See the ref-dance comment in RunDetailDrawer — it is load-bearing and
   it applies here verbatim.

   The three figures at the top — credits, runs, lifetime spend — are the
   judging surface; the ledger and the run list below are scanning surfaces
   and stay dense. The drawer opens on the LIST row and upgrades in place when
   the detail lands, so `credit_history` / `recent_runs` being absent means
   "still loading or unavailable", never an error. */

import React, { useEffect, useRef } from 'react'
import { Close } from '../Icon'
import { Money, RunId } from '../ui/Money'
import RunStatusField from './RunStatusField'
import EmptyState from '../ui/EmptyState'
import { useUIStore } from '../../store/uiStore'

/* ── ROLE, AS A FIELD ──────────────────────────────────────────────────────
   Same voice as run status: a word in a tone, no pill. ADMIN takes --warn —
   it is the one role worth noticing in a scan. Lives here rather than in the
   table so the drawer and the table state the same thing about the same
   account and cannot drift (the table imports these). */
export const ROLES = ['USER', 'TESTER', 'ADMIN']

const ROLE_TONE = { ADMIN: 'var(--warn)', TESTER: 'var(--ink-2)', USER: 'var(--ink-3)' }

export function roleWord(role, ar) {
  const r = String(role || '').toUpperCase()
  if (r === 'ADMIN') return ar ? 'مدير' : 'Admin'
  if (r === 'TESTER') return ar ? 'مختبِر' : 'Tester'
  if (r === 'USER') return ar ? 'مستخدم' : 'User'
  return r || '—'
}

export function RoleBadge({ role }) {
  const ar = useUIStore((s) => s.language) === 'ar'
  const r = String(role || '').toUpperCase()
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: ROLE_TONE[r] || 'var(--ink-3)' }}>
      {roleWord(r, ar)}
    </span>
  )
}

function formatTime(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

/* A ruled label/value pair — same geometry as the run drawer's Entry. */
function Entry({ label, value, mono = false }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 104px) minmax(0, 1fr)',
        gap: 12,
        paddingBlock: 9,
        borderBlockStart: '1px solid var(--line)',
      }}
    >
      <span className="label">{label}</span>
      <bdi
        className={mono ? 'mono' : undefined}
        style={mono
          ? { fontSize: 13, color: 'var(--ink)', justifySelf: 'start', minInlineSize: 0, overflowWrap: 'anywhere' }
          : { fontSize: 13, color: 'var(--ink)', justifySelf: 'stretch', minInlineSize: 0, overflowWrap: 'break-word', textAlign: 'start', lineHeight: 1.6 }}
      >
        {value || '—'}
      </bdi>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBlockStart: 24 }}>
      <h3 className="sec-title" style={{ fontSize: 14, marginBlockEnd: 8 }}>{title}</h3>
      {children}
    </section>
  )
}

function Figure({ legend, children, note }) {
  return (
    <div style={{ minInlineSize: 0 }}>
      <div className="label">{legend}</div>
      <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.2, marginBlockStart: 3, color: 'var(--ink)' }}>
        {children}
      </div>
      {note && <div className="caption" style={{ marginBlockStart: 3 }}>{note}</div>}
    </div>
  )
}

/* The delta carries its own sign and tone — a ledger line you can read
   without the description: +500 in ok, -120 in ink. Spending is normal, so
   negative is NOT red; red would make every legitimate charge an alarm. */
function Delta({ value }) {
  const n = Number(value) || 0
  return (
    <span
      className="mono"
      style={{ color: n > 0 ? 'var(--ok)' : 'var(--ink)', whiteSpace: 'nowrap' }}
    >
      {n > 0 ? '+' : ''}{n.toLocaleString('en-US')}
    </span>
  )
}

export default function UserDetailDrawer({ user, onClose }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreRef = useRef(null)
  const { language } = useUIStore()
  const ar = language === 'ar'

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!user) return undefined
    if (!restoreRef.current) restoreRef.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (restoreRef.current && typeof restoreRef.current.focus === 'function') restoreRef.current.focus()
      restoreRef.current = null
    }
  }, [user])

  if (!user) return null

  /* undefined = the detail has not landed yet (drawer opened on a list row);
     [] = the server answered and there is genuinely nothing. The skeleton
     shows for the first, the empty state for the second. */
  const history = Array.isArray(user.credit_history) ? user.credit_history : null
  const recentRuns = Array.isArray(user.recent_runs) ? user.recent_runs : null
  const detailPending = user.credit_history === undefined && user.recent_runs === undefined

  return (
    <div className="fixed inset-0 z-overlay" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        aria-label={ar ? 'إغلاق' : 'Close'}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'var(--scrim)' }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={user.email}
        className="card overlay-cast settle-inline"
        style={{
          position: 'relative',
          inlineSize: 560,
          maxInlineSize: '100%',
          blockSize: '100%',
          overflowY: 'auto',
          borderRadius: 0,
          borderBlock: 0,
          borderInlineEnd: 0,
        }}
      >
        {/* The account's identity never scrolls away. */}
        <div
          style={{
            position: 'sticky', insetBlockStart: 0, zIndex: 1,
            background: 'var(--card)',
            borderBlockEnd: '1px solid var(--line)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
          }}
        >
          <div style={{ minInlineSize: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minInlineSize: 0 }}>
              <span className="truncate" style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600 }}>
                <bdi>{user.email}</bdi>
              </span>
              <RoleBadge role={user.role} />
            </div>
            <p className="caption" style={{ marginBlockStart: 2 }}>
              <span className={`st st--${user.is_active ? 'ok' : 'idle'}`}>
                {user.is_active ? (ar ? 'نشط' : 'Active') : (ar ? 'معطّل' : 'Inactive')}
              </span>
              {' · '}
              {user.is_verified ? (ar ? 'موثّق' : 'Verified') : (ar ? 'غير موثّق' : 'Unverified')}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="btn-i"
            style={{ flex: 'none' }}
            aria-label={ar ? 'إغلاق' : 'Close'}
          >
            <Close size={16} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 32px' }}>
          {/* THE THREE FIGURES — what the account holds, did, and cost. */}
          <div
            className="card card-pad"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
          >
            <Figure legend={ar ? 'الرصيد' : 'Credits'}>
              <span className="mono">{Number(user.credits ?? 0).toLocaleString('en-US')}</span>
            </Figure>
            <Figure legend={ar ? 'التشغيلات' : 'Runs'}>
              <span className="mono">{Number(user.run_count ?? 0).toLocaleString('en-US')}</span>
            </Figure>
            <Figure legend={ar ? 'الإنفاق الكلي' : 'Total spend'}>
              <Money usd={user.total_spend_usd} />
            </Figure>
          </div>

          <Section title={ar ? 'الملف' : 'Profile'}>
            <div>
              <Entry label={ar ? 'الاسم' : 'Name'} value={user.name} />
              <Entry label={ar ? 'البريد' : 'Email'} value={user.email} mono />
              <Entry label={ar ? 'المعرّف' : 'ID'} value={user.id} mono />
              <Entry label={ar ? 'الانضمام' : 'Joined'} value={formatTime(user.created_at)} mono />
            </div>
          </Section>

          {detailPending ? (
            /* The list row opened the drawer before the detail landed —
               ledger and runs arrive together, so one skeleton covers both.
               detail_failed is the table telling us the fetch already lost;
               without it this skeleton would wait forever. */
            <Section title={ar ? 'السجل' : 'History'}>
              {user.detail_failed ? (
                <EmptyState
                  line={ar
                    ? 'تعذّر تحميل سجل الرصيد والتشغيلات. أغلق اللوحة وأعد المحاولة.'
                    : 'Could not load the credit ledger and runs. Close the panel and try again.'}
                  compact
                />
              ) : (
                <div className="skel" style={{ blockSize: 120 }} aria-busy="true" />
              )}
            </Section>
          ) : (
            <>
              <Section
                title={ar
                  ? <>سجل الرصيد · <span className="mono">{(history || []).length}</span></>
                  : <>Credit history · <span className="mono">{(history || []).length}</span></>}
              >
                {(history || []).length === 0 ? (
                  <EmptyState
                    line={ar
                      ? 'لا حركة رصيد مسجّلة لهذا الحساب.'
                      : 'No credit movement is recorded for this account.'}
                    compact
                  />
                ) : (
                  <div>
                    {history.map((tx) => (
                      <div key={tx.id} style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                          <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                            {String(tx.type || '—').toLowerCase()}
                          </span>
                          <Delta value={tx.credits_delta} />
                        </div>
                        {tx.description && (
                          <p style={{ fontSize: 12, color: 'var(--ink-2)', marginBlockStart: 3 }}>
                            <bdi>{tx.description}</bdi>
                          </p>
                        )}
                        <p className="caption" style={{ marginBlockStart: 2 }}>
                          <span className="mono">{formatTime(tx.created_at)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section
                title={ar
                  ? <>آخر التشغيلات · <span className="mono">{(recentRuns || []).length}</span></>
                  : <>Recent runs · <span className="mono">{(recentRuns || []).length}</span></>}
              >
                {(recentRuns || []).length === 0 ? (
                  <EmptyState
                    line={ar
                      ? 'لم يُنفِّذ هذا الحساب أي تشغيل بعد.'
                      : 'This account has not executed a run yet.'}
                    compact
                  />
                ) : (
                  <div>
                    {recentRuns.map((run) => (
                      <div key={run.id} style={{ paddingBlock: 10, borderBlockStart: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, minInlineSize: 0 }}>
                            <RunId id={run.id} style={{ color: 'var(--ink-3)' }} />
                            <RunStatusField status={run.status} />
                          </span>
                          <span style={{ display: 'flex', alignItems: 'baseline', gap: 12, flex: 'none' }}>
                            {run.credits_charged != null && (
                              <span className="caption" style={{ whiteSpace: 'nowrap' }}>
                                <span className="mono">{Number(run.credits_charged).toLocaleString('en-US')}</span>
                                {' '}{ar ? 'رصيد' : 'cr'}
                              </span>
                            )}
                            <Money usd={run.total_cost_usd} />
                          </span>
                        </div>
                        {run.user_prompt && (
                          <p
                            className="truncate"
                            style={{ fontSize: 12, color: 'var(--ink-2)', marginBlockStart: 3 }}
                            title={run.user_prompt}
                          >
                            <bdi>{run.user_prompt}</bdi>
                          </p>
                        )}
                        <p className="caption" style={{ marginBlockStart: 2 }}>
                          <span className="mono">{formatTime(run.started_at)}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
