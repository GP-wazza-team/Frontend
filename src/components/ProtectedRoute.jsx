/* The FIRST thing painted on every page load, while the auth store rehydrates
   from localStorage. It therefore has to be on the foundation like everything
   else: the page is --paper, and the wait is the application's ONE progress
   indicator — the Meter in indeterminate mode — not a spinning ring. (The ring
   it used to draw was `rounded-full animate-spin` on the retired --accent
   token; with border-radius pinned to 0 globally it rendered as a spinning
   SQUARE with one transparent edge, on first paint, on every route.)

   The refresh / logout / Navigate logic below is untouched. */

import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { authService } from '../services/authService'
import Meter from './ui/Meter'

function ProtectedRoute({ children }) {
  const { accessToken, refreshToken, logout, hasHydrated } = useAuthStore()
  const t = useUIStore((s) => s.t)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!hasHydrated) return
    if (!accessToken && refreshToken) {
      setChecking(true)
      authService.refresh(refreshToken)
        .then((data) => {
          useAuthStore.setState({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: data.user,
          })
        })
        .catch(() => logout())
        .finally(() => setChecking(false))
    }
  }, [hasHydrated, accessToken, refreshToken, logout])

  // The store is still rehydrating from localStorage.
  if (!hasHydrated || checking) {
    return (
      <div
        className="min-h-shell flex items-center justify-center"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        <Meter cells={5} mode="indeterminate" tone="ink" label={t('loading')} />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

/* ── ADMIN ONLY ────────────────────────────────────────────────────────────
   /admin had no role guard at all, and the consequence was worse than an
   unhelpful page: a signed-in NON-admin who reached that URL was SIGNED OUT.
   The route mounted, called the admin endpoints, the server refused with 401,
   and the response interceptor in services/api.js reads any 401 as an expired
   session — it attempts a refresh and then logs the user out. So a mistyped
   URL or a stale bookmark ended the session.

   The rail already hides the Admin destination for non-admins, which is why
   this stayed hidden: it was only reachable by typing it. Hiding a door is not
   the same as locking it.

   Sends them to the dashboard rather than to /login, because they ARE
   authenticated — they simply are not an admin. */
export function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.is_admin === true || user?.role === 'admin'
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

export default ProtectedRoute
