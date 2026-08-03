/* ═══════════════════════════════════════════════════════════════════════════
   AUTH — /register.

   Same housing as /login (§11.6), one deliberate difference: the plate's gauge
   reads low — a console that has not been asked to do anything yet — and it
   carries a second engraved instrument, the credit strip, showing the 20 free
   credits the subtitle already promises. Two plates, one machine.

   The form is the same gutter grid: index in the gutter, label and underlined
   field in the content column, the live meter in the gutter while the request
   is in flight. The password rule is no longer a grey sentence under the box —
   it is an 8-cell Meter that fills as you type and turns --state-done when the
   requirement the submit handler actually enforces is met. Same rule, same
   handler, now visible before you press.

   BEHAVIOUR IS FROZEN: form state, the 8-character guard, the submit handler,
   the password toggle, the language switcher, every string and the link back
   to /login are unchanged.

   The shared chrome is imported from LoginPage.jsx — the rebuild scope for
   this work is exactly these two files, so the common parts live in the first
   of them rather than being duplicated here.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Reveal, RevealOff, Caret } from '../components/Icon'
import Meter from '../components/ui/Meter'
import { AuthPlate, AuthRocker, AuthNotice, AuthLockup, AuthBlock, FieldRow, SubmitRow } from './LoginPage'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'
import { clearAllStores } from '../utils/clearStores'

function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { language, setLanguage } = useUIStore()
  const isAr = language === 'ar'

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = {
    title:       isAr ? 'إنشاء حساب' : 'Create account',
    subtitle:    isAr ? 'ابدأ مجاناً مع 20 رصيد' : 'Start generating with 20 free credits. No card required.',
    name:        isAr ? 'الاسم الكامل' : 'Full name',
    email:       isAr ? 'البريد الإلكتروني' : 'Email address',
    password:    isAr ? 'كلمة المرور' : 'Password',
    passwordHint:isAr ? '8 أحرف على الأقل' : 'Must be at least 8 characters',
    submit:      isAr ? 'إنشاء الحساب' : 'Get started',
    hasAccount:  isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    login:       isAr ? 'تسجيل الدخول' : 'Sign in',
  }

  const ui = {
    plateHead:   isAr ? 'ابدأ رحلتك مع الذكاء الاصطناعي' : 'Start your AI journey today',
    plateBlurb:  isAr ? 'انضم إلى آلاف المبدعين الذين يستخدمون Wazza' : 'Join thousands of creators already using Wazza to power their ideas.',
    credits:     isAr ? 'رصيد مجاني' : 'Free credits',
    failed:      isAr ? 'تعذر إنشاء الحساب' : 'Could not create account',
    reveal:      isAr ? 'إظهار كلمة المرور' : 'Show password',
    conceal:     isAr ? 'إخفاء كلمة المرور' : 'Hide password',
    working:     isAr ? 'جاري الإنشاء...' : 'Creating account...',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const data = await authService.register(form.name, form.email, form.password)
      clearAllStores()
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again'))
    } finally {
      setLoading(false)
    }
  }

  const pwLen = form.password.length
  const pwMet = pwLen >= 8

  /* The plate's second instrument: the offer, read as a meter. */
  const creditStrip = (
    <div style={{ maxInlineSize: 360 }}>
      <span className="legend" style={{ margin: 0 }}>{ui.credits}</span>
      <div className="flex items-center gap-3" style={{ marginBlockStart: 8 }}>
        <Meter cells={20} value={1} tone="signal" label={ui.credits} />
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink)' }}>20</span>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-shell safe-inset" style={{ backgroundColor: 'var(--paper)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <AuthPlate isAr={isAr} headline={ui.plateHead} blurb={ui.plateBlurb}>
        {creditStrip}
      </AuthPlate>

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
              <AuthNotice isAr={isAr} kind="credentials" legend={ui.failed} message={error} />
            )}

            <FieldRow index="01" id="register-name" label={t.name}>
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field field--underline"
                style={{ fontSize: 16 }}
                placeholder={isAr ? 'محمد أحمد' : 'John Doe'}
              />
            </FieldRow>

            <FieldRow index="02" id="register-email" label={t.email}>
              <input
                id="register-email"
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

            <FieldRow
              index="03"
              id="register-password"
              label={t.password}
              below={
                /* The rule the submit handler actually enforces, made visible
                   before you press it. Determinate, so reduced motion still
                   shows the true value. */
                <div className="flex items-center gap-3" style={{ marginBlockStart: 10 }}>
                  <Meter
                    cells={8}
                    value={Math.min(1, pwLen / 8)}
                    tone={pwMet ? 'done' : 'ink'}
                    label={t.passwordHint}
                  />
                  <span
                    id="register-password-hint"
                    style={{ fontSize: 11, color: pwMet ? 'var(--state-done)' : 'var(--ink-3)' }}
                  >
                    {t.passwordHint}
                  </span>
                </div>
              }
            >
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  aria-describedby="register-password-hint"
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
          <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{t.hasAccount}</span>
          <Link to="/login" className="text-action">
            {t.login}
            <Caret direction="end" size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
