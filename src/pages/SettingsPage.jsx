/* SETTINGS — /settings

   THE RECOMPOSITION
     · Four separate `.surface` cards, each led by an amber icon, collapse
       into ONE continuous settings sheet on the app's 56px gutter grid. The
       amber glyph on a heading was the accent used as decoration, which this
       system forbids outright; and four cards for eight lines of content is
       three containers of pure overhead.
     · Every group is a numbered docket band; every setting is a ruled row —
       label at the inline-start, control at the inline-end, a 1px rule
       between. That is a two-column grid, so the controls line up down the
       page instead of floating at the end of four different card widths.
     · Both filled-pill toggles became Rockers. The active cell is RAISED and
       inked, not filled amber — an appearance setting does not cost money,
       and this app has exactly one filled thing per screen (L1). The labels
       are words, never a sun and a moon.
     · The `w-2 h-2 rounded-full bg-emerald-400` dot became the status marker:
       a shape plus a word, readable without colour (L4).
     · Sign out was a `bg-rose-500` filled button. Signing out costs nothing,
       so it is a text action in --state-fail — and it now goes through the
       app's ConfirmDialog rather than logging you out on one stray click.

   setDarkMode, setLanguage, logout and the redirect are untouched. */

import React, { useState } from 'react'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { SignOut } from '../components/Icon'
import ConfirmDialog from '../components/ConfirmDialog'
import {
  Band, RunMarker, SectionIndex, PanelGroup,
} from '../components/dashboard/Instruments'
import Rocker from '../components/ui/Rocker'
import { RailPanelPortal } from '../components/Sidebar'

/* A ruled setting: label and its one-line explanation at the inline-start,
   the control at the inline-end. */
function Row({ label, hint, children }) {
  return (
    <div
      className="grid items-center gap-6"
      style={{
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        paddingBlock: 12,
        borderBlockStart: '1px solid var(--etch)',
      }}
    >
      <div className="min-w-0">
        <span style={{ display: 'block', fontSize: 13, color: 'var(--ink)' }}>{label}</span>
        {hint && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginBlockStart: 2 }}>
            {hint}
          </span>
        )}
      </div>
      <div className="flex items-center justify-end flex-none">{children}</div>
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

  const sections = [
    { id: 'wz-set-appearance', ord: '01', label: ar ? 'المظهر' : 'Appearance' },
    { id: 'wz-set-language', ord: '02', label: t('language') },
    { id: 'wz-set-api', ord: '03', label: t('apiStatus') },
    { id: 'wz-set-account', ord: '04', label: ar ? 'الحساب' : 'Account' },
  ]

  return (
    <div className="wz-page" style={{ rowGap: 32, alignContent: 'start' }}>
      <RailPanelPortal>
        <PanelGroup legend={ar ? 'الأقسام' : 'Sections'} first>
          <SectionIndex items={sections} />
        </PanelGroup>
      </RailPanelPortal>

      <Band
        index={1}
        id="wz-set-appearance"
        legend={ar ? 'المظهر' : 'Appearance'}
      >
        <div style={{ maxInlineSize: '68ch' }}>
          <Row
            label={t('theme')}
            hint={ar ? 'يُطبَّق فورًا على كل الشاشات.' : 'Applies immediately, everywhere.'}
          >
            <Rocker
              value={darkMode}
              onChange={setDarkMode}
              ariaLabel={t('theme')}
              options={[
                { value: false, label: t('light') },
                { value: true, label: t('dark') },
              ]}
            />
          </Row>
        </div>
      </Band>

      <Band
        index={2}
        id="wz-set-language"
        legend={t('language')}
      >
        <div style={{ maxInlineSize: '68ch' }}>
          <Row
            label={t('language')}
            hint={ar
              ? 'تغيير اللغة يعكس اتجاه الواجهة بالكامل.'
              : 'Changing the language mirrors the entire interface.'}
          >
            <Rocker
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
      </Band>

      <Band
        index={3}
        id="wz-set-api"
        legend={t('apiStatus')}
      >
        <div style={{ maxInlineSize: '68ch' }}>
          <Row
            label={ar ? 'الاتصال بالخادم' : 'Server link'}
            hint={ar ? 'يُفحص كل ٣٠ ثانية.' : 'Polled every 30 seconds.'}
          >
            <RunMarker
              status={apiConnected ? 'completed' : 'failed'}
              label={apiConnected ? t('connected') : t('disconnected')}
            />
          </Row>
        </div>
      </Band>

      {user && (
        <Band
          index={4}
          id="wz-set-account"
          legend={ar ? 'الحساب' : 'Account'}
        >
          <div style={{ maxInlineSize: '68ch' }}>
            <Row label={ar ? 'البريد' : 'Email'}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{user.email}</span>
            </Row>
            {user.name && (
              <Row label={ar ? 'الاسم' : 'Name'}>
                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{user.name}</span>
              </Row>
            )}
            <Row
              label={ar ? 'الجلسة' : 'Session'}
              hint={ar
                ? 'ينهي الجلسة على هذا الجهاز. لا يحذف أي شيء.'
                : 'Ends the session on this device. Nothing is deleted.'}
            >
              <button
                type="button"
                className="text-action text-action--danger"
                onClick={() => setConfirmLogout(true)}
              >
                <SignOut size={16} />
                {ar ? 'تسجيل الخروج' : 'Sign out'}
              </button>
            </Row>
          </div>
        </Band>
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
