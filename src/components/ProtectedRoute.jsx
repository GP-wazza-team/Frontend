import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

function ProtectedRoute({ children }) {
  const { accessToken, refreshToken, setAuth, logout, isAuthenticated } = useAuthStore()
  const [checking, setChecking] = useState(!accessToken && !!refreshToken)

  useEffect(() => {
    if (!accessToken && refreshToken) {
      authService
        .refresh(refreshToken)
        .then((data) => setAuth(data.user, data.access_token, data.refresh_token))
        .catch(() => logout())
        .finally(() => setChecking(false))
    }
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="gradient-orb w-[300px] h-[300px] bg-violet-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin relative z-10" />
      </div>
    )
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
