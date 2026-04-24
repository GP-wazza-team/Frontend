import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

function ProtectedRoute({ children }) {
  const { accessToken, refreshToken, logout } = useAuthStore()
  const [checking, setChecking] = useState(!accessToken && !!refreshToken)

  useEffect(() => {
    if (!accessToken && refreshToken) {
      authService.refresh()
        .then((data) => {
          useAuthStore.setState({
            accessToken: data.access_token,
            user: data.user,
          })
        })
        .catch(() => logout())
        .finally(() => setChecking(false))
    }
  }, [accessToken, refreshToken, logout])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
