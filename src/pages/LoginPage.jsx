/* ═══════════════════════════════════════════════════════════════════════════
   AUTH — /login, and the shared auth chrome.

   §11.6 of the spec: this is one of exactly four places in Wazza where the
   brand is allowed to be expressive. Everything here is built from the
   foundation's tokens and classes; nothing invents a second system.

   THE COMPOSITION
     · A 45/55 split. The leading side is THE LEAF — the head of the
       instrument, and the only composed surface in the application. ONE
       object: the sealed square, the wordmark, and the hāshiya carrying the
       folio. Nothing else.

       WHAT USED TO BE HERE, and why it is gone. This panel was a working
       instrument face: a 60-tick arc gauge with a needle drifting on a 6s
       loop, four screw heads, a feTurbulence grain layer, a fake serial
       ("WAZZA v1.0"), the internal codename "Miqyas" printed to customers,
       the wordmark in a military STENCIL face at 56px, and the whole panel
       force-scoped `.dark` in both themes. Each piece was craft. Stacked,
       they made the first screen a customer sees look like a game terminal,
       and that is the single loudest reason this system read as a game rather
       than as a company. A gauge that measures nothing is a prop. It is
       deleted, not restyled.

       It is no longer scoped `.dark` either. Light is the product and the
       theme the decisions are made in; a dark panel welded into a light page
       is the artefact that travels into a procurement deck.
     · The trailing side is the form, laid on the SAME 56px leading gutter grid
       every route uses. The gutter carries the field index (01 · 02), the
       error's shape marker and the live meter while a request is in flight —
       so the auth screen reads as the same document as the console behind it.
     · One filled element on the screen: the submit slab (§11.6 authorises it).
       Everything else free is a text action or a rocker.

   THIS FILE ALSO EXPORTS the auth chrome (AuthPlate, AuthRocker, FieldRow,
   AuthNotice) because the rebuild scope for this work is exactly two files —
   LoginPage.jsx and RegisterPage.jsx — so the shared parts live in the first
   of them rather than being duplicated into the second.

   BEHAVIOUR IS FROZEN. Form state, submit handler, the network-vs-credentials
   distinction, the password toggle, the language switcher, every English and
   Arabic string and the login/register links are unchanged. The only removal
   is the `/forgot-password` link, which routed nowhere (there is no such route
   in App.jsx, so it bounced through `*` back to /login). The spec forbids
   shipping a dead live-looking link; its string is retained below.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mark, Reveal, RevealOff, Caret, ShapeFail, ShapeCancelled } from '../components/Icon'
import Meter from '../components/ui/Meter'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'
import { clearAllStores } from '../utils/clearStores'

/* ── THE WORDMARK ──────────────────────────────────────────────────────────
   The lockup, and it is the fix for the clearest single tell that this was a
   Latin-first system wearing Arabic. It used to set وزّة in the BODY face at
   60px while the Latin "WAZZA" got a separate identity face — so the Arabic
   was the fallback and the Latin was the brand, in an Arabic-first product.
   That is exactly backwards.

   Now: وزّة is primary by size, by weight and by ink value, and "Wazza"
   beneath it is a subordinate TRANSLITERATION LINE. There is no second face,
   in either script, which is the point — the identity is the hand, not the
   alphabet. A manuscript does not pair typefaces; it is one hand written at
   different sizes, and the scribe does not switch alphabets for the title.

   Sentence case, not tracked-out caps: A1 forbids tracking in Arabic anyway,
   and a letterspaced Latin wordmark beside an untracked Arabic one would
   reintroduce the same two-tier lockup by other means. Latin gets 0.02em, and
   only inside [dir=ltr]. */
export function Wordmark({ size = 'record' }) {
  const isRecord = size === 'record'
  return (
    <div>
      <span
        className={isRecord ? 'record' : undefined}
        style={{
          display: 'block',
          color: 'var(--ink)',
          ...(isRecord ? null : { fontSize: 17, fontWeight: 600, lineHeight: 1.2 }),
        }}
      >
        وزّة
      </span>
      <span
        className="ltr:tracking-[0.02em]"
        style={{
          display: 'block',
          fontSize: isRecord ? 14 : 11,
          fontWeight: 500,
          lineHeight: 1.2,
          color: 'var(--ink-3)',
          marginBlockStart: isRecord ? 6 : 2,
        }}
      >
        Wazza
      </span>
    </div>
  )
}

/* ── THE LEAF ──────────────────────────────────────────────────────────────
   ONE composed object, on --paper, in whichever theme the user is actually
   in. No gauge, no needle, no screws, no serial, no codename, no grain layer
   (the page's own substrate tooth already runs beneath this), no stencil, no
   forced .dark.

   What carries it instead is structure, which is the whole claim of this
   system: a hāshiya down the leading edge with the jadwal on its trailing
   rule and the folio at its foot, and the leaf beside it holding the mark,
   the sentence, and the wordmark anchored to the bottom. That is a set page.
   It is the same apparatus every route in the application runs on, which is
   why signing in already looks like the product. */
export function AuthPlate({ isAr, headline, blurb, children }) {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[45%]" style={{ backgroundColor: 'var(--paper)' }}>
      {/* THE HĀSHIYA. The margin the whole app is built on, drawn at full
          height, with the jadwal on its trailing edge — the only vertical rule
          this system permits. */}
      <div
        aria-hidden="true"
        className="flex flex-col justify-end"
        style={{
          inlineSize: 'var(--rail-spine)',
          flex: 'none',
          backgroundColor: 'var(--margin)',
          boxShadow: `inset ${isAr ? '1px' : '-1px'} 0 0 0 var(--etch-strong)`,
          paddingBlockEnd: 48,
        }}
      >
        {/* the folio — real data, not a colophon */}
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', paddingInline: 12 }}>00</span>
      </div>

      {/* the seam where the leaf meets the form */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, inlineSize: 1, background: 'var(--etch-strong)' }}
      />

      <div className="relative flex min-w-0 flex-1 flex-col" style={{ padding: 48 }}>
        <Mark size={20} style={{ color: 'var(--ink)' }} />

        <div className="flex flex-1 flex-col justify-center" style={{ paddingBlock: 32 }}>
          <p style={{ fontSize: 16, color: 'var(--ink)', maxInlineSize: '34ch' }}>{headline}</p>
          <p style={{ fontSize: 14, color: 'var(--ink-3)', maxInlineSize: '42ch', marginBlockStart: 8 }}>{blurb}</p>
          {children}
        </div>

        {/* THE FOOT — the validation foot of the instrument. One rule, then
            the wordmark anchored to the bottom with real clearance above and
            below, so no glyph is ever shaved. */}
        <div>
          <div aria-hidden="true" style={{ blockSize: 1, background: 'var(--etch-strong)', marginBlockEnd: 24 }} />
          <Wordmark />
        </div>
      </div>
    </div>
  )
}

/* ── SHARED FORM CHROME ─────────────────────────────────────────────────── */

/* §9.6 — the segmented control. Two cells, always words, never a sun and a
   moon. It replaces the old text toggle that was buried in the plate footer
   and therefore invisible on every screen narrower than lg. */
export function AuthRocker({ isAr, setLanguage }) {
  return (
    <div className="rocker" role="group" aria-label={isAr ? 'اللغة' : 'Language'}>
      <button
        type="button"
        className="rocker__cell"
        data-on={String(!isAr)}
        aria-pressed={!isAr}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        type="button"
        className="rocker__cell"
        data-on={String(isAr)}
        aria-pressed={isAr}
        onClick={() => setLanguage('ar')}
      >
        العربية
      </button>
    </div>
  )
}

/* The auth form sits on the SAME 56px leading gutter as every route in the
   app, and here the gutter is drawn: a single engraved rule down the boundary,
   so the screen you sign in on already shows you where the rail will be. It is
   also what stops a two-field form from floating in the middle of a 740px
   column — the block is anchored to a spine instead. */
const GRID = 'var(--rail-spine) minmax(0, 1fr)'
const COLPAD = { paddingInlineStart: 20 }

export function AuthBlock({ isAr, title, subtitle, onSubmit, children }) {
  return (
    <div className="settle relative w-full" style={{ maxInlineSize: 460 }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: 'var(--rail-spine)',
          inlineSize: 1,
          background: 'var(--etch-strong)',
        }}
      />
      <div className="grid" style={{ gridTemplateColumns: GRID }}>
        <div className="wz-gutter" />
        <div className="wz-col" style={COLPAD}>
          {/* 22px, the rubric step. It used to be 32, which put the greeting
              above the wordmark in the hierarchy — on the one screen whose job
              is to say whose product this is. The wordmark owns the record
              register (28px); nothing else on this screen goes near it. */}
          <h1 style={{ fontSize: 22, fontWeight: 600, lineHeight: isAr ? 1.35 : 1.2, color: 'var(--ink)' }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBlockStart: 8 }}>{subtitle}</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="wz-col--span grid"
          style={{ gridTemplateColumns: GRID, rowGap: 24, marginBlockStart: 32 }}
        >
          {children}
        </form>
      </div>
    </div>
  )
}

/* A ruled entry on the gutter grid: the index in the gutter, the label and the
   underlined field in the content column. Returns a fragment so both cells are
   direct children of the form's grid. */
export function FieldRow({ index, id, label, children, below }) {
  return (
    <>
      <div className="wz-gutter" style={{ paddingBlockStart: 2 }}>
        <span className="mono" style={{ fontSize: 11 }}>{index}</span>
      </div>
      <div className="wz-col" style={COLPAD}>
        <label className="legend" htmlFor={id} style={{ margin: 0, marginBlockEnd: 6 }}>{label}</label>
        {children}
        {below}
      </div>
    </>
  )
}

/* The one filled element on the screen (§11.6). While the request is in flight
   the gutter beside it carries the app's only progress indicator — the same
   Meter the status bar runs during a render. */
export function SubmitRow({ loading, label, working }) {
  return (
    <>
      <div className="wz-gutter flex items-center" style={{ blockSize: 40 }}>
        {loading && <Meter cells={5} mode="indeterminate" tone="signal" label={working} />}
      </div>
      <div className="wz-col" style={COLPAD}>
        <button type="submit" disabled={loading} className="slab" style={{ inlineSize: '100%' }}>
          {loading ? working : label}
        </button>
      </div>
    </>
  )
}

/* The error state, designed rather than defaulted. Shape first, hue second:
   a broken link and a refused credential are different marks, not the same
   red box with different words. */
export function AuthNotice({ isAr, kind, legend, message }) {
  const Shape = kind === 'network' ? ShapeCancelled : ShapeFail
  return (
    <>
      <div className="wz-gutter" style={{ paddingBlockStart: 14 }}>
        <Shape size={10} style={{ color: 'var(--state-fail)' }} />
      </div>
      <div className="wz-col" style={COLPAD}>
        <div
          role="alert"
          /* L2: not cut. A refused credential is not a committed record. */
          style={{
            backgroundColor: 'var(--sunk)',
            boxShadow: `inset ${isAr ? '-2px' : '2px'} 0 0 0 var(--state-fail), inset 0 0 0 1px var(--etch)`,
            paddingBlock: 12,
            paddingInlineStart: 18,
            paddingInlineEnd: 16,
          }}
        >
          <span className="legend" style={{ margin: 0, color: 'var(--state-fail)' }}>{legend}</span>
          <p style={{ fontSize: 14, color: 'var(--ink)', marginBlockStart: 4 }}>{message}</p>
        </div>
      </div>
    </>
  )
}

/* The compact lockup, shown only where the leaf is not: below lg. Same
   relationship at a smaller size — Arabic primary, Latin subordinate — rather
   than a different lockup for the phone. */
export function AuthLockup() {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Mark size={20} style={{ color: 'var(--ink)' }} />
      <Wordmark size="compact" />
    </div>
  )
}

/* ── THE PAGE ───────────────────────────────────────────────────────────── */

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { language, setLanguage } = useUIStore()
  const isAr = language === 'ar'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  /* Presentation only: which of the two existing failure branches produced the
     message, so the notice can carry the right mark and legend. The messages
     themselves are unchanged. */
  const [errorKind, setErrorKind] = useState('credentials')

  const t = {
    title:       isAr ? 'تسجيل الدخول' : 'Welcome back',
    subtitle:    isAr ? 'أهلاً بك في Wazza' : 'Sign in to your Wazza workspace',
    email:       isAr ? 'البريد الإلكتروني' : 'Email address',
    password:    isAr ? 'كلمة المرور' : 'Password',
    submit:      isAr ? 'تسجيل الدخول' : 'Continue',
    noAccount:   isAr ? 'ليس لديك حساب؟' : "New here?",
    register:    isAr ? 'إنشاء حساب' : 'Create an account',
    /* Retained. The control is not rendered: /forgot-password has no route,
       so the link was dead. Wire the route and this string is ready. */
    forgot:      isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?',
  }

  const ui = {
    plateHead:   isAr ? 'منصة الذكاء الاصطناعي الخاصة بك' : 'Your AI generation platform',
    plateBlurb:  isAr ? 'أنشئ صوراً وفيديوهات ونصوصاً بقوة الذكاء الاصطناعي' : 'Create images, videos, and text with the power of artificial intelligence.',
    failNet:     isAr ? 'لا يوجد اتصال' : 'No connection',
    failCreds:   isAr ? 'فشل تسجيل الدخول' : 'Sign-in failed',
    reveal:      isAr ? 'إظهار كلمة المرور' : 'Show password',
    conceal:     isAr ? 'إخفاء كلمة المرور' : 'Hide password',
    working:     isAr ? 'جاري الدخول...' : 'Signing in...',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login(form.email, form.password)
      clearAllStores()
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err) {
      if (!err.response) {
        setErrorKind('network')
        setError(isAr ? 'تعذر الاتصال بالخادم. حاول لاحقاً.' : 'Cannot reach the server. Please try again later.')
      } else {
        setErrorKind('credentials')
        setError(err.response?.data?.detail || (isAr ? 'بيانات غير صحيحة' : 'Invalid email or password'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-shell safe-inset" style={{ backgroundColor: 'var(--paper)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <AuthPlate isAr={isAr} headline={ui.plateHead} blurb={ui.plateBlurb} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-4 p-6">
          <AuthLockup />
          <div className="ms-auto">
            <AuthRocker isAr={isAr} setLanguage={setLanguage} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-4">
          <AuthBlock isAr={isAr} title={t.title} subtitle={t.subtitle} onSubmit={handleSubmit}>
            {error && (
              <AuthNotice
                isAr={isAr}
                kind={errorKind}
                legend={errorKind === 'network' ? ui.failNet : ui.failCreds}
                message={error}
              />
            )}

            <FieldRow index="01" id="login-email" label={t.email}>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field field--underline"
                style={{ fontSize: 16 }}
                placeholder="you@example.com"
              />
            </FieldRow>

            <FieldRow index="02" id="login-password" label={t.password}>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field field--underline"
                  style={{ fontSize: 16, paddingInlineEnd: 32 }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? ui.conceal : ui.reveal}
                  aria-pressed={showPassword}
                  className="text-action absolute inset-y-0 end-0 items-center"
                  style={{ paddingBlock: 0, color: 'var(--ink-3)' }}
                >
                  {showPassword ? <RevealOff size={16} /> : <Reveal size={16} />}
                </button>
              </div>
            </FieldRow>

            <SubmitRow loading={loading} label={t.submit} working={ui.working} />
          </AuthBlock>
        </div>

        <div
          className="flex items-center justify-between gap-4 px-6 py-4"
          style={{ borderBlockStart: '1px solid var(--etch)' }}
        >
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t.noAccount}</span>
          <Link to="/register" className="text-action">
            {t.register}
            <Caret direction="end" size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
