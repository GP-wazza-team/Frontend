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
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
