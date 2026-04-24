import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'

function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { language, setLanguage } = useUIStore()
  const isAr = language === 'ar'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = {
    title:       isAr ? 'تسجيل الدخول' : 'Welcome back',
    subtitle:    isAr ? 'أهلاً بك في Wazza' : 'Sign in to your Wazza workspace',
    email:       isAr ? 'البريد الإلكتروني' : 'Email address',
    password:    isAr ? 'كلمة المرور' : 'Password',
    submit:      isAr ? 'تسجيل الدخول' : 'Continue',
    noAccount:   isAr ? 'ليس لديك حساب؟' : "New here?",
    register:    isAr ? 'إنشاء حساب' : 'Create an account',
    forgot:      isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login(form.email, form.password)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || (isAr ? 'بيانات غير صحيحة' : 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Left - Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="mesh-gradient absolute inset-0" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white/90 tracking-tight">WAZZA</span>
          </div>

          <div className="max-w-sm">
            <h2 className="text-3xl font-semibold leading-snug mb-3 text-white/90">
              {isAr ? 'منصة الذكاء الاصطناعي الخاصة بك' : 'Your AI generation platform'}
            </h2>
            <p className="text-white/40 text-base leading-relaxed">
              {isAr ? 'أنشئ صوراً وفيديوهات ونصوصاً بقوة الذكاء الاصطناعي' : 'Create images, videos, and text with the power of artificial intelligence.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/30">
            <span>WAZZA v1.0</span>
            <span>·</span>
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="hover:text-white/60 transition-colors">
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slideUp">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>WAZZA</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{t.title}</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{t.subtitle}</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm animate-fadeIn" style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)', color: '#fb7185' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t.email}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-claude"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{t.password}</label>
                <Link to="/forgot-password" className="text-[11px] font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                  {t.forgot}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-claude ltr:pr-10 rtl:pl-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg flex items-center justify-center gap-2 text-[14px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isAr ? 'جاري الدخول...' : 'Signing in...'}
                </span>
              ) : (
                <>
                  {t.submit}
                  <ArrowRight size={15} className={isAr ? 'rotate-180' : ''} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {t.noAccount}{' '}
            <Link to="/register" className="font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
              {t.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
