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
    <div className="flex h-screen bg-slate-950 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(6,182,212,0.06),_transparent_50%)]" />

      <Sidebar />
      <main
        className={`flex-1 overflow-auto relative z-10 transition-all duration-500 ease-out ${
          sidebarOpen ? 'ltr:ml-0 rtl:mr-0' : 'ltr:-ml-64 rtl:-mr-64'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
