import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useUIStore } from './store/uiStore'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import SettingsPage from './pages/SettingsPage'

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
        <Route element={<Layout />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
