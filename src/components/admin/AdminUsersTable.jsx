/* ── EVERY ACCOUNT — the user ledger ──────────────────────────────────────
   The same dense geometry as the runs table: 13px, 40px rows, tabular
   figures, one hairline between rows. This surface differs from the runs
   table in one structural way: pagination, search and the role filter are
   SERVER-SIDE — the account list is not preloaded by the overview, so every
   control here is a request, and search is debounced rather than live.

   MUTATIONS TRUST THE RESPONSE, NOT THE HOPE. PATCH returns the updated
   list-item shape and the credits endpoint returns the new balance, so a
   successful action replaces the row with what the server said rather than
   what we asked for — and a rejection (the self-lockout guard, a deduction
   below zero) leaves the row exactly as it was, with the server's reason in
   a toast.

   DESTRUCTIVE ACTS CONFIRM FIRST. Deactivating an account and deducting
   credits both go through ConfirmDialog; a grant and a role change apply on
   the spot. The role select stops row-click propagation for the same reason
   every action cell here does: the row opens the drawer, the cell acts. */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminService } from '../../services/adminService'
import { describeFailure } from '../../services/errorText'
import { useUIStore } from '../../store/uiStore'
import { useToastStore } from '../../store/toastStore'
import { Search, Caret, Close, Revise } from '../Icon'
import { Money } from '../ui/Money'
import EmptyState from '../ui/EmptyState'
import ConfirmDialog from '../ConfirmDialog'
import UserDetailDrawer, { ROLES, RoleBadge, roleWord } from './UserDetailDrawer'

const PAGE_LIMIT = 25
const COLUMNS = 9

function formatDay(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleDateString([], { dateStyle: 'medium' })
  } catch {
    return '—'
  }
}

function TableSkeleton({ rows = 8 }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: COLUMNS }).map((__, c) => (
            <td key={c}>
              <span
                className="skel"
                style={{ display: 'block', blockSize: 10, inlineSize: `${40 + ((r * 11 + c * 17) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

/* ── THE CREDITS MODAL ─────────────────────────────────────────────────────
   One amount, one reason, both explicit. The sign is part of the amount —
   typing -50 is a deduction — and the consequence is spelled out in words
   under the field before the button is pressed. A deduction routes through
   ConfirmDialog on top of this modal; a grant applies directly. The reason
   is required because the server writes it into the ledger with the acting
   admin's email — an unexplained balance change is the thing this modal
   exists to prevent. */
function CreditsModal({ user, saving, onSubmit, onClose }) {
  const { language } = useUIStore()
  const ar = language === 'ar'
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!restoreRef.current) restoreRef.current = document.activeElement
    inputRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusables = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  }, [])

  const n = Math.trunc(Number(amount))
  const valid = Number.isFinite(n) && n !== 0 && reason.trim().length > 0
  const deduction = valid && n < 0

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center" style={{ padding: 16 }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'var(--scrim)' }} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wz-credits-title"
        className="relative settle overlay-cast"
        style={{
          inlineSize: '100%', maxInlineSize: 420,
          backgroundColor: 'var(--panel)',
          boxShadow: 'inset 0 0 0 1px var(--etch-strong)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <h2 id="wz-credits-title" className="page-title" style={{ marginBlockEnd: 4 }}>
            {ar ? 'تعديل الرصيد' : 'Adjust credits'}
          </h2>
          <button type="button" className="btn-i" onClick={onClose} aria-label={ar ? 'إغلاق' : 'Close'}>
            <Close size={16} />
          </button>
        </div>
        <p className="caption" style={{ marginBlockEnd: 16 }}>
          <bdi>{user.email}</bdi>
          {' · '}
          {ar
            ? <>الرصيد الحالي <span className="mono">{Number(user.credits ?? 0).toLocaleString('en-US')}</span></>
            : <>current balance <span className="mono">{Number(user.credits ?? 0).toLocaleString('en-US')}</span></>}
        </p>

        <label className="label" htmlFor="wz-credits-amount" style={{ display: 'block', marginBlockEnd: 6 }}>
          {ar ? 'المقدار (موجب للمنح، سالب للخصم)' : 'Amount (positive grants, negative deducts)'}
        </label>
        <input
          id="wz-credits-amount"
          ref={inputRef}
          type="number"
          step="1"
          className="field mono"
          value={amount}
          placeholder={ar ? 'مثال: 100 أو -50' : 'e.g. 100 or -50'}
          onChange={(e) => setAmount(e.target.value)}
          style={{ marginBlockEnd: 14 }}
        />

        <label className="label" htmlFor="wz-credits-reason" style={{ display: 'block', marginBlockEnd: 6 }}>
          {ar ? 'السبب (إلزامي، يُسجَّل في الدفتر)' : 'Reason (required, written to the ledger)'}
        </label>
        <input
          id="wz-credits-reason"
          type="text"
          className="field"
          value={reason}
          placeholder={ar ? 'لماذا يتغير هذا الرصيد؟' : 'Why is this balance changing?'}
          onChange={(e) => setReason(e.target.value)}
        />

        {/* The consequence, in words, before the act. */}
        <p className="caption" style={{ marginBlockStart: 10, minBlockSize: 17 }}>
          {!valid
            ? (ar
              ? 'مقدار غير صفري وسبب مكتوب — كلاهما مطلوب.'
              : 'A non-zero amount and a written reason are both required.')
            : deduction
              ? (ar
                ? <>سيُخصم <span className="mono">{Math.abs(n).toLocaleString('en-US')}</span> — لا يمكن أن يهبط الرصيد تحت الصفر.</>
                : <>Deducts <span className="mono">{Math.abs(n).toLocaleString('en-US')}</span> credits — the balance cannot go below zero.</>)
              : (ar
                ? <>سيُمنح <span className="mono">{n.toLocaleString('en-US')}</span> رصيداً فور التأكيد.</>
                : <>Grants <span className="mono">{n.toLocaleString('en-US')}</span> credits immediately.</>)}
        </p>

        <div className="flex items-center justify-end gap-6" style={{ marginBlockStart: 18 }}>
          <button type="button" onClick={onClose} className="text-action">
            {ar ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn"
            disabled={!valid || saving}
            onClick={() => onSubmit(n, reason.trim())}
          >
            {saving
              ? (ar ? 'جارٍ الحفظ…' : 'Applying…')
              : deduction
                ? (ar ? 'خصم الرصيد' : 'Deduct credits')
                : (ar ? 'منح الرصيد' : 'Grant credits')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersTable() {
  const { language } = useUIStore()
  const { addToast } = useToastStore()
  const ar = language === 'ar'

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')       // the debounced value that actually queries
  const [roleFilter, setRoleFilter] = useState('')
  const [savingId, setSavingId] = useState(null)

  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [creditsTarget, setCreditsTarget] = useState(null)
  const [creditsSaving, setCreditsSaving] = useState(false)
  const [pendingDeduction, setPendingDeduction] = useState(null)
  const [userToDeactivate, setUserToDeactivate] = useState(null)

  /* Search hits the server, so it waits for the typist — 350ms of quiet —
     where the runs table filters memory and does not. */
  useEffect(() => {
    const id = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(id)
  }, [search])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getUsers({
        skip: (page - 1) * PAGE_LIMIT,
        limit: PAGE_LIMIT,
        search: query || undefined,
        role: roleFilter || undefined,
      })
      setUsers(Array.isArray(data?.items) ? data.items : [])
      setTotal(Number(data?.total) || 0)
      setError(null)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError(describeFailure(ar ? 'تعذّر تحميل المستخدمين' : 'Could not load the users', err))
    } finally {
      setLoading(false)
    }
  }, [page, query, roleFilter, ar])

  useEffect(() => { loadUsers() }, [loadUsers])

  const totalPages = Math.ceil(total / PAGE_LIMIT) || 1
  const filtered = Boolean(query || roleFilter)

  /* The server's answer replaces the row; nothing is guessed. */
  const replaceRow = useCallback((updated) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    setSelectedUser((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
    setUserDetail((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev))
  }, [])

  const applyUpdate = useCallback(async (user, changes, successText) => {
    setSavingId(user.id)
    try {
      const updated = await adminService.updateUser(user.id, changes)
      replaceRow(updated)
      addToast(successText, 'success')
    } catch (err) {
      console.error('Failed to update user:', err)
      addToast(
        describeFailure(ar ? 'تعذّر تحديث الحساب' : 'Could not update the account', err),
        'error',
      )
    } finally {
      setSavingId(null)
    }
  }, [replaceRow, addToast, ar])

  const handleRoleChange = (user, role) => {
    if (role === user.role) return
    applyUpdate(
      user,
      { role },
      ar ? `تغيّر الدور إلى ${roleWord(role, ar)}` : `Role changed to ${roleWord(role, ar)}`,
    )
  }

  const handleToggleActive = (user) => {
    if (user.is_active) {
      /* Deactivation locks a person out mid-anything — it confirms first. */
      setUserToDeactivate(user)
    } else {
      applyUpdate(user, { is_active: true }, ar ? 'تم تفعيل الحساب' : 'Account activated')
    }
  }

  const confirmDeactivate = () => {
    const target = userToDeactivate
    setUserToDeactivate(null)
    if (target) {
      applyUpdate(target, { is_active: false }, ar ? 'تم تعطيل الحساب' : 'Account deactivated')
    }
  }

  const submitCredits = async (amount, reason) => {
    /* A deduction takes real money-equivalent away from the account, so it
       gets the same confirm gate a deactivation does. The grant does not. */
    if (amount < 0 && !pendingDeduction) {
      setPendingDeduction({ amount, reason })
      return
    }
    const target = creditsTarget
    setCreditsSaving(true)
    try {
      const result = await adminService.adjustCredits(target.id, { amount, reason })
      replaceRow({ id: target.id, credits: result.credits })
      addToast(
        ar
          ? `الرصيد الجديد: ${Number(result.credits).toLocaleString('en-US')}`
          : `New balance: ${Number(result.credits).toLocaleString('en-US')} credits`,
        'success',
      )
      setCreditsTarget(null)
    } catch (err) {
      console.error('Failed to adjust credits:', err)
      addToast(
        describeFailure(ar ? 'تعذّر تعديل الرصيد' : 'Could not adjust the credits', err),
        'error',
      )
    } finally {
      setCreditsSaving(false)
      setPendingDeduction(null)
    }
  }

  const handleUserClick = async (user) => {
    setSelectedUser(user)
    try {
      const detail = await adminService.getUserDetail(user.id)
      setUserDetail(detail)
    } catch (err) {
      /* The drawer still opens on the list row — less detail beats no drawer.
         The flag stops the drawer's history skeleton from waiting forever for
         a response that already failed. */
      console.error('Failed to load user detail:', err)
      setUserDetail({ ...user, detail_failed: true })
    }
  }

  const countLine = useMemo(() => (
    filtered
      ? (ar
        ? <><span className="mono">{total.toLocaleString('en-US')}</span> حساب مطابق</>
        : <><span className="mono">{total.toLocaleString('en-US')}</span> matching accounts</>)
      : (ar
        ? <><span className="mono">{total.toLocaleString('en-US')}</span> حساب</>
        : <><span className="mono">{total.toLocaleString('en-US')}</span> accounts</>)
  ), [filtered, total, ar])

  return (
    <>
      {/* THE TOOLBAR — search and the role filter, directly above the table
          they query. Both are requests, not memory filters. */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBlockEnd: 12 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minInlineSize: 0 }}>
          <input
            type="text"
            value={search}
            placeholder={ar ? 'ابحث بالبريد أو الاسم…' : 'Search email or name…'}
            aria-label={ar ? 'البحث في المستخدمين' : 'Search users'}
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

        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <select
            value={roleFilter}
            aria-label={ar ? 'تصفية حسب الدور' : 'Role filter'}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="field select"
            style={{ inlineSize: 'auto', minInlineSize: 148 }}
          >
            <option value="">{ar ? 'كل الأدوار' : 'All roles'}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleWord(r, ar)}</option>
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

        <span className="caption" style={{ marginInlineStart: 'auto', whiteSpace: 'nowrap' }}>
          {countLine}
        </span>
      </div>

      {error && (
        <div style={{ marginBlockEnd: 12 }}>
          <span className="st st--bad">{ar ? 'خطأ' : 'Error'}</span>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, marginBlockStart: 4 }}>{error}</p>
          <button type="button" className="btn-q btn-q--sm" style={{ marginBlockStart: 8 }} onClick={loadUsers}>
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
              <th>{ar ? 'البريد' : 'Email'}</th>
              <th>{ar ? 'الاسم' : 'Name'}</th>
              <th>{ar ? 'الدور' : 'Role'}</th>
              <th>{ar ? 'الحالة' : 'Status'}</th>
              <th className="num">{ar ? 'الرصيد' : 'Credits'}</th>
              <th className="num">{ar ? 'التشغيلات' : 'Runs'}</th>
              <th className="num">{ar ? 'الإنفاق' : 'Spend'}</th>
              <th>{ar ? 'الانضمام' : 'Joined'}</th>
              <th style={{ inlineSize: 250 }} aria-label={ar ? 'إجراءات' : 'Actions'} />
            </tr>
          </thead>

          {loading ? (
            <TableSkeleton />
          ) : (
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS} style={{ blockSize: 'auto' }}>
                    <EmptyState
                      legend={ar ? 'لا مستخدمين' : 'No users'}
                      line={filtered
                        ? (ar
                          ? 'لا حساب يطابق البحث أو الدور المختار.'
                          : 'No account matches the search or the role you picked.')
                        : (ar
                          ? 'لا توجد حسابات مسجّلة بعد.'
                          : 'No accounts are registered yet.')}
                      compact
                    >
                      {filtered && (
                        <button
                          type="button"
                          className="btn-q btn-q--sm"
                          onClick={() => { setSearch(''); setRoleFilter(''); setPage(1) }}
                        >
                          {ar ? 'مسح الفلاتر' : 'Clear filters'}
                        </button>
                      )}
                    </EmptyState>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="group"
                    onClick={() => handleUserClick(u)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUserClick(u) }
                    }}
                    style={{ cursor: 'pointer', opacity: u.is_active ? 1 : 0.6 }}
                  >
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--ink)' }}>
                      <span className="truncate" style={{ display: 'block', maxInlineSize: 200 }} title={u.email}>
                        {u.email}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="truncate" style={{ display: 'block', maxInlineSize: 140 }}>
                        {u.name || '—'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}><RoleBadge role={u.role} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {/* Two facts, one cell: reachable and trusted. Verified is
                          secondary and only speaks when it is missing. */}
                      <span className={`st st--${u.is_active ? 'ok' : 'idle'}`}>
                        {u.is_active ? (ar ? 'نشط' : 'Active') : (ar ? 'معطّل' : 'Inactive')}
                      </span>
                      {!u.is_verified && (
                        <span className="caption" style={{ display: 'block', marginBlockStart: 1 }}>
                          {ar ? 'غير موثّق' : 'Unverified'}
                        </span>
                      )}
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <span className="mono">{Number(u.credits ?? 0).toLocaleString('en-US')}</span>
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <span className="mono">{Number(u.run_count ?? 0).toLocaleString('en-US')}</span>
                    </td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>
                      <Money usd={u.total_spend_usd} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)' }}>
                      <span className="mono">{formatDay(u.created_at)}</span>
                    </td>
                    <td style={{ paddingInlineEnd: 4 }} onClick={(e) => e.stopPropagation()}>
                      {/* The action cell is its own click surface — the row
                          opens the drawer, these act on the account. */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                        <select
                          className="field select field--sm"
                          value={String(u.role || 'USER').toUpperCase()}
                          disabled={savingId === u.id}
                          aria-label={ar ? `دور ${u.email}` : `Role for ${u.email}`}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          style={{ inlineSize: 'auto', minInlineSize: 96, paddingInlineEnd: 24 }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{roleWord(r, ar)}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-q btn-q--sm"
                          disabled={savingId === u.id}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.is_active ? (ar ? 'تعطيل' : 'Deactivate') : (ar ? 'تفعيل' : 'Activate')}
                        </button>
                        <button
                          type="button"
                          className="btn-q btn-q--sm"
                          disabled={savingId === u.id}
                          onClick={() => setCreditsTarget(u)}
                        >
                          {ar ? 'الرصيد' : 'Credits'}
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

      {/* THE PAGER — same object as the runs table's. */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBlockStart: 11, marginBlockStart: 4,
          borderBlockStart: '1px solid var(--line)',
        }}
      >
        <span className="caption">
          {ar
            ? <>صفحة <span className="mono">{page}</span> من <span className="mono">{totalPages}</span> · <span className="mono">{total.toLocaleString('en-US')}</span> حساب</>
            : <>Page <span className="mono">{page}</span> of <span className="mono">{totalPages}</span> · <span className="mono">{total.toLocaleString('en-US')}</span> accounts</>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn-q btn-q--sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <Caret direction="start" size={14} />
            {ar ? 'السابق' : 'Prev'}
          </button>
          <button
            type="button"
            className="btn-q btn-q--sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            {ar ? 'التالي' : 'Next'}
            <Caret direction="end" size={14} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!userToDeactivate}
        title={ar ? 'تعطيل الحساب' : 'Deactivate account'}
        message={ar
          ? `سيُمنع ${userToDeactivate?.email} من تسجيل الدخول حتى يُعاد تفعيل الحساب. لا تُحذف أي بيانات.`
          : `${userToDeactivate?.email} will be unable to sign in until the account is reactivated. No data is deleted.`}
        confirmLabel={ar ? 'تعطيل' : 'Deactivate'}
        cancelLabel={ar ? 'إلغاء' : 'Cancel'}
        danger
        onConfirm={confirmDeactivate}
        onCancel={() => setUserToDeactivate(null)}
      />

      {creditsTarget && (
        <CreditsModal
          user={creditsTarget}
          saving={creditsSaving}
          onSubmit={submitCredits}
          onClose={() => { setCreditsTarget(null); setPendingDeduction(null) }}
        />
      )}

      {/* The deduction confirm stacks over the modal on purpose: the amount
          and reason stay visible behind the question they triggered. */}
      <ConfirmDialog
        isOpen={!!pendingDeduction}
        title={ar ? 'تأكيد الخصم' : 'Confirm deduction'}
        message={ar
          ? `سيُخصم ${Math.abs(pendingDeduction?.amount ?? 0).toLocaleString('en-US')} من رصيد ${creditsTarget?.email}. الخصم الأكبر من الرصيد سيُرفض.`
          : `Deduct ${Math.abs(pendingDeduction?.amount ?? 0).toLocaleString('en-US')} credits from ${creditsTarget?.email}? A deduction larger than the balance will be refused.`}
        confirmLabel={ar ? 'خصم' : 'Deduct'}
        cancelLabel={ar ? 'إلغاء' : 'Cancel'}
        danger
        onConfirm={() => submitCredits(pendingDeduction.amount, pendingDeduction.reason)}
        onCancel={() => setPendingDeduction(null)}
      />

      {selectedUser && (
        <UserDetailDrawer
          user={userDetail || selectedUser}
          onClose={() => { setSelectedUser(null); setUserDetail(null) }}
        />
      )}
    </>
  )
}
