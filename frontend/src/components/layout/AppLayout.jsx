import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e2638', borderTopColor: '#4f8ef7', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <Navigate to='/login' replace />

  return (
    <div className='shell'>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <button type='button' className='shellBackdrop' onClick={() => setSidebarOpen(false)} aria-label='Close menu' />}
      <div className='main'>
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <div className='page'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
