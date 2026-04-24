import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'

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
    subtitle:    isAr ? 'ابدأ مجاناً مع 20 رصيد' : 'Start free with 20 credits',
    name:        isAr ? 'الاسم' : 'Full name',
    email:       isAr ? 'البريد الإلكتروني' : 'Email',
    password:    isAr ? 'كلمة المرور' : 'Password',
    passwordHint:isAr ? '8 أحرف على الأقل' : 'At least 8 characters',
    submit:      isAr ? 'إنشاء الحساب' : 'Create account',
    hasAccount:  isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?',
    login:       isAr ? 'تسجيل الدخول' : 'Sign in',
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
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background orbs */}
      <div className="gradient-orb w-[500px] h-[500px] bg-violet-600 -top-40 -right-40 animate-float" />
      <div className="gradient-orb w-[400px] h-[400px] bg-cyan-600 -bottom-20 -left-20 animate-float" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10 animate-scaleIn">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="gradient-text">WAZZA</span>
          </h1>
        </div>

        {/* Card */}
        <div className="glass p-8 shadow-2xl shadow-black/50">
          <h2 className="text-xl font-semibold text-white mb-1">{t.title}</h2>
          <p className="text-white/40 text-sm mb-6">{t.subtitle}</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2 font-medium">{t.name}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full input-glass"
                placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-medium">{t.email}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full input-glass"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2 font-medium">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full input-glass ltr:pr-10 rtl:pl-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-white/25">{t.passwordHint}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3 rounded-xl font-medium mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isAr ? 'جاري الإنشاء...' : 'Creating account...'}
                </span>
              ) : t.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            {t.hasAccount}{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {t.login}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="mt-6 mx-auto flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          <Globe size={12} />
          {isAr ? 'English' : 'العربية'}
        </button>
      </div>
    </div>
  )
}

export default RegisterPage
