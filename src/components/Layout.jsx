import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useUIStore } from '../store/uiStore'
import { dashboardService } from '../services/dashboardService'

function Layout() {
  const { sidebarOpen, setApiConnected } = useUIStore()

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await dashboardService.checkHealth()
        setApiConnected(true)
      } catch (error) {
        setApiConnected(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [setApiConnected])

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar />
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          sidebarOpen ? 'ltr:ml-0 rtl:mr-0' : 'ltr:-ml-64 rtl:-mr-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
