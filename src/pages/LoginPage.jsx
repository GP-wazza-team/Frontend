import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Eye, EyeOff, Sparkles } from 'lucide-react'
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
    subtitle:    isAr ? 'أهلاً بك في Wazza' : 'Sign in to your Wazza account',
    email:       isAr ? 'البريد الإلكتروني' : 'Email address',
    password:    isAr ? 'كلمة المرور' : 'Password',
    submit:      isAr ? 'تسجيل الدخول' : 'Sign in',
    noAccount:   isAr ? 'ليس لديك حساب؟' : "Don't have an account?",
    register:    isAr ? 'إنشاء حساب' : 'Create one',
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background orbs */}
      <div className="gradient-orb w-[500px] h-[500px] bg-violet-600 -top-40 -left-40 animate-float" />
      <div className="gradient-orb w-[400px] h-[400px] bg-cyan-600 -bottom-20 -right-20 animate-float" style={{ animationDelay: '3s' }} />

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
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                {t.forgot}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3 rounded-xl font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isAr ? 'جاري الدخول...' : 'Signing in...'}
                </span>
              ) : t.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            {t.noAccount}{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              {t.register}
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

export default LoginPage
