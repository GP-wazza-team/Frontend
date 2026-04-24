import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useUIStore } from './store/uiStore'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const { language } = useUIStore()

  React.useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.lang = language
    htmlElement.dir = language === 'ar' ? 'rtl' : 'ltr'
  }, [language])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes — no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes — require login */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
