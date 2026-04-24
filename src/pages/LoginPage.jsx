import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Eye, EyeOff, Zap } from 'lucide-react'
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
    submit:      isAr ? 'تسجيل الدخول' : 'Sign in',
    noAccount:   isAr ? 'ليس لديك حساب؟' : "Don't have an account?",
    register:    isAr ? 'إنشاء حساب' : 'Get started',
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm animate-scaleIn">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Zap className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WAZZA</h1>
        </div>

        {/* Card */}
        <div className="card-light p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">{t.title}</h2>
          <p className="text-gray-400 text-sm mb-6">{t.subtitle}</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.email}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full input-light"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full input-light ltr:pr-10 rtl:pl-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                {t.forgot}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-light py-3 rounded-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isAr ? 'جاري الدخول...' : 'Signing in...'}
                </span>
              ) : t.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {t.noAccount}{' '}
            <Link to="/register" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
              {t.register}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="mt-6 mx-auto flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
        >
          <Globe size={12} />
          {isAr ? 'English' : 'العربية'}
        </button>
      </div>
    </div>
  )
}

export default LoginPage
