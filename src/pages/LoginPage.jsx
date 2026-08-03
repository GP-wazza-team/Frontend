/* ═══════════════════════════════════════════════════════════════════════════
   AUTH — /login, and the shared auth chrome.

   This is the first screen a customer sees and the one that decides whether
   this looks like a company or a toy. So it is the plainest screen in the
   application: a warm limestone panel that says what the product is, and a
   white working panel that holds a titled form and one filled button.

   WHAT IS GONE, and stays gone. Earlier passes stripped a 60-tick arc gauge
   with a drifting needle, four screw heads, a fake serial, a stencil wordmark
   and a `.dark` panel welded into a light page. This pass finishes the job:
     · the 56px numbered gutter and its zero-padded field ordinals (01 · 02),
       drawn as a rule down the form. A form with two fields does not need an
       index, and a number beside "Email address" is decoration pretending to
       be system.
     · the indeterminate Meter that ran in that gutter during a request, and
       the 8-cell Meter that measured the register password. A meter is an
       instrument; a disabled button that says "Signing in..." is the truth.
     · the folio "00", the hāshiya spine and the seam rules — apparatus with
       nothing behind it.

   WHAT REPLACED THEM is the system in index.css and nothing else: .card,
   .field, .btn, .btn-t, .seg, .page-title, plus the tokens.

   THE WORDMARK. وزّة leads by size, weight and ink; "Wazza" sits under it as a
   transliteration line. This is an Arabic-first product and the Latin does not
   outrank the Arabic on the screen that introduces it. (The previous version
   set وزّة in a `.record` class that does not exist in this stylesheet, so the
   Arabic silently rendered at body size — smaller in effect than the Latin it
   was supposed to lead. Both sizes are explicit now.)

   THIS FILE ALSO EXPORTS the auth chrome — Wordmark, AuthPlate, AuthRocker,
   AuthLockup, AuthBlock, FieldRow, SubmitRow, AuthNotice — because the rebuild
   scope is exactly LoginPage and RegisterPage, so the shared parts live in the
   first of them rather than being duplicated into the second.

   BEHAVIOUR IS FROZEN. Form state, the submit handler, the network-vs-
   credentials distinction and its two messages, the password reveal toggle,
   the language switcher, every Arabic and English string and the link to
   /register are unchanged. `t.forgot` is still retained but not rendered:
   there is no /forgot-password route in App.jsx, and a live-looking link that
   bounces through `*` back to /login is a dead control.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mark, Reveal, RevealOff, Caret, ShapeFail, ShapeCancelled } from '../components/Icon'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'
import { clearAllStores } from '../utils/clearStores'

/* ── THE WORDMARK ─────────────────────────────────────────────────────────
   One hand at two sizes, not two typefaces. Arabic primary, Latin
   subordinate. Sentence case, not tracked-out caps: A1 forbids tracking in
   Arabic, and a letterspaced Latin beside an untracked Arabic would rebuild
   the two-tier lockup by other means. The 0.02em on the Latin line applies
   only inside [dir=ltr]. */
export function Wordmark({ size = 'lead' }) {
  const lead = size === 'lead'
  return (
    <div>
      <span
        style={{
          display: 'block',
          fontSize: lead ? 34 : 19,
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'var(--ink)',
        }}
      >
        وزّة
      </span>
      <span
        className="ltr:tracking-[0.02em]"
        style={{
          display: 'block',
          fontSize: lead ? 12 : 11,
          fontWeight: 500,
          lineHeight: 1.2,
          color: 'var(--ink-3)',
          marginBlockStart: lead ? 4 : 1,
        }}
      >
        Wazza
      </span>
    </div>
  )
}

/* ── THE PANEL ────────────────────────────────────────────────────────────
   The warm side. It states who the product is and what it does, in the theme
   the user is actually in — never forced dark. It is hidden below lg, where
   the compact lockup carries the identity instead. `children` is the slot
   /register uses for the free-credit line. */
export function AuthPlate({ headline, blurb, children }) {
  return (
    <div
      className="hidden lg:flex lg:w-[45%] flex-col shrink-0"
      style={{
        background: 'var(--page)',
        borderInlineEnd: '1px solid var(--line)',
        padding: '40px 48px',
      }}
    >
      <div className="flex items-start gap-4">
        <Mark size={26} style={{ color: 'var(--ink)', marginBlockStart: 4 }} />
        <Wordmark />
      </div>

      <div className="flex flex-1 flex-col justify-center" style={{ paddingBlock: 40 }}>
        <p style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.45, color: 'var(--ink)', maxInlineSize: '26ch' }}>
          {headline}
        </p>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', maxInlineSize: '40ch', marginBlockStart: 10 }}>
          {blurb}
        </p>
        {children}
      </div>
    </div>
  )
}

/* ── SHARED FORM CHROME ─────────────────────────────────────────────────── */

/* The segmented control: two cells, always words, never a sun and a moon.
   Same geometry as the theme and language controls in Settings and in the
   account menu, because there is one segmented control in this system. */
export function AuthRocker({ isAr, setLanguage }) {
  return (
    <div className="seg" role="group" aria-label={isAr ? 'اللغة' : 'Language'}>
      <button
        type="button"
        className="seg__cell"
        data-on={String(!isAr)}
        aria-pressed={!isAr}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        type="button"
        className="seg__cell"
        data-on={String(isAr)}
        aria-pressed={isAr}
        onClick={() => setLanguage('ar')}
      >
        العربية
      </button>
    </div>
  )
}

/* The titled form. A real <h1>: this screen says what it is, like every other
   screen in the application. No gutter, no spine, no ordinals. */
export function AuthBlock({ title, subtitle, onSubmit, children }) {
  return (
    <div className="settle w-full" style={{ maxInlineSize: 400 }}>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{subtitle}</p>
      <form onSubmit={onSubmit} className="grid" style={{ rowGap: 18, marginBlockStart: 28 }}>
        {children}
      </form>
    </div>
  )
}

/* A labelled field. `hint` renders as a caption beneath it and carries the id
   `${id}-hint`, which is what the register password's aria-describedby points
   at. */
export function FieldRow({ id, label, children, hint }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginBlockEnd: 6 }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="caption" style={{ marginBlockStart: 6 }}>{hint}</p>
      )}
    </div>
  )
}

/* The one filled control on the screen. While the request is in flight it
   states what it is doing and refuses a second press — that is the whole
   progress indication, and it is honest. */
export function SubmitRow({ loading, label, working }) {
  return (
    <button type="submit" disabled={loading} className="btn btn--lg" style={{ inlineSize: '100%', marginBlockStart: 4 }}>
      {loading ? working : label}
    </button>
  )
}

/* The failure notice. Shape first, hue second: a server that cannot be reached
   and a credential that was refused carry different marks and different
   legends, because they need different actions from the person reading them. */
export function AuthNotice({ kind, legend, message }) {
  const Shape = kind === 'network' ? ShapeCancelled : ShapeFail
  return (
    <div role="alert" className="card card-pad" style={{ borderColor: 'var(--bad)', background: 'var(--card-2)' }}>
      <div
        className="flex items-center gap-2"
        style={{ color: 'var(--bad)', fontSize: 13, fontWeight: 600 }}
      >
        <Shape size={10} />
        {legend}
      </div>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBlockStart: 5 }}>{message}</p>
    </div>
  )
}

/* The compact lockup, shown only where the panel is not: below lg. The same
   relationship at a smaller size, rather than a second lockup for the phone. */
export function AuthLockup() {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Mark size={20} style={{ color: 'var(--ink)' }} />
      <Wordmark size="compact" />
    </div>
  )
}

/* The reveal toggle that sits inside a password field. Exported implicitly by
   being used in both pages; it is declared here for the same reason as the
   rest of the chrome. */
export function RevealToggle({ shown, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={shown}
      className="btn-i"
      style={{ position: 'absolute', insetInlineEnd: 3, insetBlockStart: '50%', transform: 'translateY(-50%)' }}
    >
      {shown ? <RevealOff size={16} /> : <Reveal size={16} />}
    </button>
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
    <div className="flex min-h-shell safe-inset" style={{ background: 'var(--page)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <AuthPlate headline={ui.plateHead} blurb={ui.plateBlurb} />

      {/* The working panel. White, because this is where the work is. */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: 'var(--card)' }}>
        <div className="flex items-center gap-4" style={{ padding: '18px 24px' }}>
          <AuthLockup />
          <div className="ms-auto">
            <AuthRocker isAr={isAr} setLanguage={setLanguage} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto" style={{ padding: '16px 24px 32px' }}>
          <AuthBlock title={t.title} subtitle={t.subtitle} onSubmit={handleSubmit}>
            {error && (
              <AuthNotice
                kind={errorKind}
                legend={errorKind === 'network' ? ui.failNet : ui.failCreds}
                message={error}
              />
            )}

            <FieldRow id="login-email" label={t.email}>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
                placeholder="you@example.com"
              />
            </FieldRow>

            <FieldRow id="login-password" label={t.password}>
              {/* No inline font-size: the stylesheet lifts every field to 16px
                  on a coarse pointer, which is what stops iOS Safari zooming
                  the page on focus and never zooming back. */}
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="field"
                  style={{ paddingInlineEnd: 44 }}
                  placeholder="••••••••"
                />
                <RevealToggle
                  shown={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  label={showPassword ? ui.conceal : ui.reveal}
                />
              </div>
            </FieldRow>

            <SubmitRow loading={loading} label={t.submit} working={ui.working} />
          </AuthBlock>
        </div>

        <div
          className="flex items-center justify-between gap-4"
          style={{ padding: '14px 24px', borderBlockStart: '1px solid var(--line)' }}
        >
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.noAccount}</span>
          <Link to="/register" className="btn-t">
            {t.register}
            <Caret direction="end" size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
