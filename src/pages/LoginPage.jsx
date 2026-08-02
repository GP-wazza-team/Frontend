/* ═══════════════════════════════════════════════════════════════════════════
   AUTH — /login, and the shared auth chrome.

   §11.6 of the spec: this is one of exactly four places in Wazza where the
   brand is allowed to be expressive. Everything here is built from the
   foundation's tokens and classes; nothing invents a second system.

   THE COMPOSITION
     · A 45/55 split. The leading side is THE PLATE — a bespoke instrument
       face, identical in both themes, and the only composed surface in the
       application. It is scoped `.dark` so it draws its whole palette from the
       foundation's dark token block: no literal hex, no theme fork, and every
       contrast ratio on it is one the foundation already computed.
     · The trailing side is the form, laid on the SAME 56px leading gutter grid
       every route uses. The gutter carries the field index (01 · 02), the
       error's shape marker and the live meter while a request is in flight —
       so the auth screen reads as the same machine as the console behind it.
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

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mark, Reveal, RevealOff, Caret, ShapeFail, ShapeCancelled } from '../components/Icon'
import Meter from '../components/ui/Meter'
import { useReducedMotion } from '../components/ui/useReducedMotion'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'
import { clearAllStores } from '../utils/clearStores'

/* ── THE INSTRUMENT ────────────────────────────────────────────────────────
   The plate's one authored motion: the needle drifts across a 6s ease-in-out
   loop while the ticks beneath it light in sequence. Under reduced motion it
   sits at its mid position — readable, honest, never hidden. */

function useDrift(center, swing) {
  /* The foundation's reactive hook, not a read during render — flipping the OS
     preference has to settle a needle that is already drifting. */
  const reduce = useReducedMotion()
  const [value, setValue] = useState(center)
  useEffect(() => {
    if (reduce) { setValue(center); return undefined }
    const t0 = Date.now()
    /* The ticks are discrete and the whole drift is ~4 of 60 ticks, so a 120ms
       step is smoother than the eye can resolve and costs almost nothing. */
    const id = setInterval(() => {
      const p = ((Date.now() - t0) % 6000) / 6000
      setValue(center + swing * Math.sin(p * 2 * Math.PI))
    }, 120)
    return () => clearInterval(id)
  }, [center, swing, reduce])
  return value
}

const G = { w: 280, h: 180, cx: 140, cy: 170, r: 134, a0: 160, span: 140 }

function polar(radius, t) {
  const a = ((G.a0 - t * G.span) * Math.PI) / 180
  return [G.cx + radius * Math.cos(a), G.cy - radius * Math.sin(a)]
}

/* 60 ticks, every tenth long. Lit ticks are --signal (the accent means LIVE);
   unlit ticks are engraved edges. No text inside the SVG, so the whole face
   can mirror wholesale in RTL and the scale still runs in the reading
   direction. */
function ArcGauge({ value, isAr }) {
  const ticks = []
  for (let i = 0; i < 60; i += 1) {
    const t = i / 59
    const major = i % 10 === 0 || i === 59
    const [x1, y1] = polar(G.r, t)
    const [x2, y2] = polar(G.r - (major ? 16 : 9), t)
    const lit = t <= value
    ticks.push(
      <line
        key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={lit ? 'var(--signal)' : major ? 'var(--edge)' : 'var(--etch-strong)'}
        strokeWidth={major ? 2 : 1}
      />
    )
  }

  const [ax, ay] = polar(G.r - 22, 0)
  const [bx, by] = polar(G.r - 22, 1)
  /* The needle runs from the pivot's own centre; the pivot plate is drawn after
     it and covers the join, so the two read as one machined part. */
  const [nx2, ny2] = polar(G.r - 16, value)
  const p = G.r - 22

  return (
    <svg
      viewBox={`0 0 ${G.w} ${G.h}`}
      width="100%"
      style={{ height: 'auto', display: 'block' }}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={isAr ? `translate(${G.w},0) scale(-1,1)` : undefined}>
        <path
          d={`M${ax} ${ay} A${p} ${p} 0 0 1 ${bx} ${by}`}
          fill="none"
          stroke="var(--etch-strong)"
          strokeWidth="1"
        />
        {ticks}
        <line x1={G.cx} y1={G.cy} x2={nx2} y2={ny2} stroke="var(--signal)" strokeWidth="1.5" strokeLinecap="butt" />
        {/* The pivot is a notched plate, not a disc. Nothing here is round. */}
        <path
          d={`M${G.cx - 8} ${G.cy - 8} H${G.cx + 4} L${G.cx + 8} ${G.cy - 4} V${G.cy + 8} H${G.cx - 8} Z`}
          fill="var(--panel)"
          stroke="var(--edge)"
          strokeWidth="1"
        />
        <rect x={G.cx - 2} y={G.cy - 2} width="4" height="4" fill="var(--signal)" />
      </g>
    </svg>
  )
}

function Screw({ isAr, style }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10"
      fill="none" stroke="var(--edge)" strokeWidth="1"
      aria-hidden="true" focusable="false"
      style={{ position: 'absolute', transform: isAr ? 'scaleX(-1)' : undefined, ...style }}
    >
      <path d="M0.5 0.5 H7 L9.5 3 V9.5 H0.5 Z" />
      <path d="M3.2 6.8 L6.8 3.2" />
    </svg>
  )
}

/* feTurbulence grain sits BEHIND every element on the plate and never over the
   type — it is a texture on the housing, not a filter on the content. */
function Grain() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      style={{ opacity: 0.045, pointerEvents: 'none' }}
    >
      <filter id="wz-auth-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#wz-auth-grain)" />
    </svg>
  )
}

/* ── THE PLATE ─────────────────────────────────────────────────────────────
   `.dark` is applied deliberately: the plate is its own world in both themes,
   and scoping it to the foundation's dark token block is how it stays that way
   without a single literal colour in this file. */
export function AuthPlate({ isAr, reading, headline, blurb, children }) {
  const value = useDrift(reading, 0.03)

  return (
    <div
      className="dark cut cut-lg relative hidden overflow-hidden lg:flex lg:w-[45%]"
      style={{ backgroundColor: 'var(--paper)' }}
    >
      <Grain />
      <Screw isAr={isAr} style={{ insetBlockStart: 16, insetInlineStart: 16 }} />
      <Screw isAr={isAr} style={{ insetBlockStart: 16, insetInlineEnd: 16 }} />
      <Screw isAr={isAr} style={{ insetBlockEnd: 16, insetInlineStart: 16 }} />
      <Screw isAr={isAr} style={{ insetBlockEnd: 16, insetInlineEnd: 16 }} />
      {/* the seam: a single engraved edge where the plate meets the page */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, inlineSize: 1, background: 'var(--edge)' }}
      />

      <div className="relative flex w-full flex-col" style={{ padding: 48, zIndex: 1 }}>
        {/* HEAD — the maker's mark and the serial. */}
        <div className="flex items-center justify-between gap-4">
          <Mark size={20} style={{ color: 'var(--ink)' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>WAZZA v1.0</span>
        </div>

        {/* BODY — the gauge. مقياس. */}
        <div className="flex flex-1 flex-col justify-center" style={{ gap: 32, paddingBlock: 32 }}>
          <div style={{ maxInlineSize: 360 }}>
            <ArcGauge value={value} isAr={isAr} />
            <div className="flex items-baseline justify-between" style={{ marginBlockStart: 12 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>0</span>
              <span className="legend" style={{ margin: 0 }}>{isAr ? 'مقياس' : 'Miqyas'}</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>MAX</span>
            </div>
          </div>
          {children}
        </div>

        {/* FOOT — engraved legends, then the model name cut into the plate. */}
        <div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', maxInlineSize: '34ch' }}>{headline}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', maxInlineSize: '42ch', marginBlockStart: 6 }}>{blurb}</p>
          <div aria-hidden="true" style={{ blockSize: 1, background: 'var(--etch-strong)', marginBlockStart: 24 }} />
          <div style={{ marginBlockStart: 24 }}>
            {isAr ? (
              <span style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.15, color: 'var(--ink)' }}>وزّة</span>
            ) : (
              <span className="stencil" style={{ fontSize: 56, lineHeight: 1, color: 'var(--ink)', display: 'block' }}>
                WAZZA
              </span>
            )}
          </div>
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
          <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: isAr ? 1.35 : 1.15, color: 'var(--ink)' }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBlockStart: 8 }}>{subtitle}</p>
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
          className="cut cut-md"
          style={{
            backgroundColor: 'var(--sunk)',
            boxShadow: `inset ${isAr ? '-2px' : '2px'} 0 0 0 var(--state-fail), inset 0 0 0 1px var(--etch)`,
            paddingBlock: 12,
            paddingInlineStart: 18,
            paddingInlineEnd: 16,
          }}
        >
          <span className="legend" style={{ margin: 0, color: 'var(--state-fail)' }}>{legend}</span>
          <p style={{ fontSize: 13, color: 'var(--ink)', marginBlockStart: 4 }}>{message}</p>
        </div>
      </div>
    </>
  )
}

/* The compact lockup, shown only where the plate is not: below lg. */
export function AuthLockup({ isAr }) {
  return (
    <div className="flex items-center gap-3 lg:hidden">
      <Mark size={20} style={{ color: 'var(--ink)' }} />
      {isAr ? (
        <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1, color: 'var(--ink)' }}>وزّة</span>
      ) : (
        <span className="stencil" style={{ fontSize: 15, lineHeight: 1, color: 'var(--ink)' }}>WAZZA</span>
      )}
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
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--paper)' }} dir={isAr ? 'rtl' : 'ltr'}>
      <AuthPlate isAr={isAr} reading={0.71} headline={ui.plateHead} blurb={ui.plateBlurb} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-4 p-6">
          <AuthLockup isAr={isAr} />
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
                style={{ fontSize: 15 }}
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
                  style={{ fontSize: 15, paddingInlineEnd: 32 }}
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
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t.noAccount}</span>
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
