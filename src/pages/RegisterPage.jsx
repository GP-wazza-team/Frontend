import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Eye, EyeOff } from 'lucide-react'
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
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Globe className="text-[#6c63ff]" size={32} />
          <h1 className="text-2xl font-bold text-white">WAZZA</h1>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">{t.title}</h2>
          <p className="text-gray-400 text-sm mb-6">{t.subtitle}</p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">{t.name}</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] transition-colors"
                placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">{t.email}</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0f0f0f] border border-[#2a2a3e] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] transition-colors ltr:pr-10 rtl:pl-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 ltr:right-3 rtl:left-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">{t.passwordHint}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isAr ? 'جاري الإنشاء...' : 'Creating account...'}
                </span>
              ) : t.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            {t.hasAccount}{' '}
            <Link to="/login" className="text-[#6c63ff] hover:underline font-medium">
              {t.login}
            </Link>
          </p>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(isAr ? 'en' : 'ar')}
          className="mt-4 mx-auto flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Globe size={12} />
          {isAr ? 'English' : 'العربية'}
        </button>
      </div>
    </div>
  )
}

export default RegisterPage
