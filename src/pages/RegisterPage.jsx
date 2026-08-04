/* ═══════════════════════════════════════════════════════════════════════════
   AUTH — /register.

   The same housing as /login, with one difference on the warm panel: the free
   credits the subtitle already promises, stated as a sentence. They used to be
   a 20-cell Meter — an instrument drawn to measure an offer that is not a
   quantity you watch. The 8-cell Meter under the password went the same way:
   the rule the submit handler enforces is now written as the caption it always
   should have been, and the caption is what aria-describedby points at.

   The numbered gutter (01 · 02 · 03) is gone with the rest of it. Three
   labelled fields on a titled form need no index.

   BEHAVIOUR IS FROZEN: form state, the 8-character guard, the submit handler,
   the password reveal toggle, the language switcher, every Arabic and English
   string and the link back to /login are unchanged.

   The shared chrome is imported from LoginPage.jsx — the rebuild scope is
   exactly these two files, so the common parts live in the first of them
   rather than being duplicated here.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Caret } from '../components/Icon'
import {
  AuthPlate, AuthRocker, AuthNotice, AuthLockup, AuthBlock, FieldRow, SubmitRow, RevealToggle,
} from './LoginPage'
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
    plateBlurb:  isAr ? 'انضم إلى آلاف المبدعين الذين يستخدمون مِخيال' : 'Join thousands of creators already using مِخيال to power their ideas.',
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

  /* The offer, stated. A3: the numeral is isolated with .mono so the bidi
     algorithm cannot reverse it or strand it inside the Arabic run. */
  const creditLine = (
    <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBlockStart: 22 }}>
      <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>20</span>
      {' '}
      {ui.credits}
    </p>
  )

  return (
    <div className="flex min-h-shell safe-inset" style={{ background: 'var(--page)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <AuthPlate headline={ui.plateHead} blurb={ui.plateBlurb}>
        {creditLine}
      </AuthPlate>

      <div className="flex min-w-0 flex-1 flex-col" style={{ background: 'var(--card)' }}>
        <div className="flex items-center gap-4" style={{ padding: '18px 24px' }}>
          <AuthLockup />
          <div className="ms-auto">
            <AuthRocker isAr={isAr} setLanguage={setLanguage} />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-y-auto" style={{ padding: '16px 24px 32px' }}>
          <AuthBlock title={t.title} subtitle={t.subtitle} onSubmit={handleSubmit}>
            {error && <AuthNotice kind="credentials" legend={ui.failed} message={error} />}

            <FieldRow id="register-name" label={t.name}>
              <input
                id="register-name"
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="field"
                placeholder={isAr ? 'محمد أحمد' : 'John Doe'}
              />
            </FieldRow>

            <FieldRow id="register-email" label={t.email}>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="field"
                placeholder="you@example.com"
              />
            </FieldRow>

            {/* The hint renders as #register-password-hint, which is exactly
                what the input below points aria-describedby at. */}
            <FieldRow id="register-password" label={t.password} hint={t.passwordHint}>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  aria-describedby="register-password-hint"
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
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.hasAccount}</span>
          <Link to="/login" className="btn-t">
            {t.login}
            <Caret direction="end" size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
