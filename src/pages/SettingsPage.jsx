/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS — /settings

   A SETTINGS PAGE, NOT AN INSTRUMENT PANEL. What was here was four numbered
   "docket bands" hanging off a 56px gutter, indexed 01–04, with a section
   index portalled into the rail so a page with five rows could be navigated.
   No heading said what the screen was. It is now what every settings screen in
   every professional tool is: a title, grouped cards with real headings, and
   plain labelled rows — label and its one-line explanation at the inline
   start, the control at the inline end, a hairline between.

   WHAT WENT
     · .wz-page, the gutter grid and the ordinals 01–04.
     · The rail portal (RailPanelPortal + SectionIndex). Navigation lives in
       the rail; a route's own controls belong on the route. A table of
       contents for five rows was apparatus for its own sake.
     · Band / RunMarker from the Instruments set — replaced by .card + .sechead
       and by .st, which is how status is stated everywhere else in this app.

   THE CONTROLS ARE DOUBLED, DELIBERATELY. Theme and language appear here AND
   in the top-bar account menu. Both are bound to the same setDarkMode /
   setLanguage on the UI store, so they cannot disagree: the account menu is
   the shortcut, this page is where you would go looking. setDarkMode,
   setLanguage, logout and the post-logout redirect are untouched.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { SignOut } from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'

/* The segmented control from the system stylesheet. Words, always — never a
   sun and a moon — and the selected cell is raised and inked rather than
   filled, because choosing a theme does not spend anything. */
function Seg({ value, options, onChange, ariaLabel }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="seg__cell"
          data-on={value === o.value ? 'true' : 'false'}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* A ruled setting. Two columns, so every control on the page lines up down one
   edge instead of floating at the end of four different card widths. */
function Row({ label, hint, first, children }) {
  return (
    <div
      className="grid items-center gap-5"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        padding: '13px 20px',
        borderBlockStart: first ? undefined : '1px solid var(--line)',
      }}
    >
      <div className="min-w-0">
        <span style={{ display: 'block', fontSize: 14, color: 'var(--ink)' }}>{label}</span>
        {hint && (
          <span className="caption" style={{ display: 'block', marginBlockStart: 2 }}>{hint}</span>
        )}
      </div>
      <div className="flex items-center justify-end shrink-0">{children}</div>
    </div>
  )
}

function SettingsPage() {
  const { darkMode, setDarkMode, language, setLanguage, t, apiConnected } = useUIStore()
  const { user, logout } = useAuthStore()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const ar = language === 'ar'

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="main main--narrow">
      <div className="pagehead">
        <div className="min-w-0">
          <h1 className="page-title">{t('settings')}</h1>
          <p className="page-sub">
            {ar ? 'تفضيلات الواجهة وحسابك.' : 'Your interface preferences and your account.'}
          </p>
        </div>
      </div>

      {/* ── APPEARANCE AND LANGUAGE ──────────────────────────────────────── */}
      <div className="sechead" style={{ marginBlockStart: 0 }}>
        <h2 className="sec-title">{ar ? 'المظهر واللغة' : 'Appearance and language'}</h2>
      </div>
      <div className="card">
        <Row
          first
          label={t('theme')}
          hint={ar ? 'يُطبَّق فورًا على كل الشاشات.' : 'Applies immediately, everywhere.'}
        >
          <Seg
            value={darkMode}
            onChange={setDarkMode}
            ariaLabel={t('theme')}
            options={[
              { value: false, label: t('light') },
              { value: true, label: t('dark') },
            ]}
          />
        </Row>
        <Row
          label={t('language')}
          hint={ar
            ? 'تغيير اللغة يعكس اتجاه الواجهة بالكامل.'
            : 'Changing the language mirrors the entire interface.'}
        >
          <Seg
            value={language}
            onChange={setLanguage}
            ariaLabel={t('language')}
            options={[
              { value: 'en', label: t('english') },
              { value: 'ar', label: t('arabic') },
            ]}
          />
        </Row>
      </div>

      {/* ── THE SERVER LINK. Status is a field, not an event. ─────────────── */}
      <div className="sechead">
        <h2 className="sec-title">{t('apiStatus')}</h2>
      </div>
      <div className="card">
        <Row
          first
          label={ar ? 'الاتصال بالخادم' : 'Server link'}
          hint={ar ? 'يُفحص كل ٣٠ ثانية.' : 'Polled every 30 seconds.'}
        >
          <span className={`st ${apiConnected ? 'st--ok' : 'st--bad'}`}>
            {apiConnected ? t('connected') : t('disconnected')}
          </span>
        </Row>
      </div>

      {/* ── THE ACCOUNT ──────────────────────────────────────────────────── */}
      {user && (
        <>
          <div className="sechead">
            <h2 className="sec-title">{ar ? 'الحساب' : 'Account'}</h2>
          </div>
          <div className="card">
            {/* A3: the address is isolated so the bidi algorithm cannot
                reverse it inside an Arabic run. */}
            <Row first label={ar ? 'البريد' : 'Email'}>
              <span className="mono break-anywhere" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                {user.email}
              </span>
            </Row>
            {user.name && (
              <Row label={ar ? 'الاسم' : 'Name'}>
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{user.name}</span>
              </Row>
            )}
            <Row
              label={ar ? 'الجلسة' : 'Session'}
              hint={ar
                ? 'ينهي الجلسة على هذا الجهاز. لا يحذف أي شيء.'
                : 'Ends the session on this device. Nothing is deleted.'}
            >
              {/* Signing out costs nothing, so it is a tertiary action, and it
                  goes through the confirm dialog rather than ending the
                  session on one stray click. */}
              <button
                type="button"
                className="btn-t btn-t--danger"
                onClick={() => setConfirmLogout(true)}
              >
                <SignOut size={16} />
                {ar ? 'تسجيل الخروج' : 'Sign out'}
              </button>
            </Row>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={confirmLogout}
        title={ar ? 'تسجيل الخروج' : 'Sign out'}
        message={ar
          ? 'سيتم إنهاء جلستك على هذا الجهاز.'
          : 'Your session on this device will end.'}
        confirmLabel={ar ? 'تسجيل الخروج' : 'Sign out'}
        cancelLabel={ar ? 'إلغاء' : 'Cancel'}
        danger
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}

export default SettingsPage
