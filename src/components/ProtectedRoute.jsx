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

export default ProtectedRoute
