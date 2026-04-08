import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  const { user, loading, can } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const facultyAllowedPrefixes = ['/', '/attendance', '/timetable', '/profile', '/notices']
  const studentAllowedPrefixes = ['/', '/attendance', '/timetable', '/profile', '/notices', '/academic-details']

  const protectedRoutes = [
    { prefix: '/departments', resource: 'departments', action: 'read' },
    { prefix: '/students', resource: 'students', action: 'read' },
    { prefix: '/faculty', resource: 'faculty', action: 'read' },
    { prefix: '/courses', resource: 'courses', action: 'read' },
    { prefix: '/subjects', resource: 'subjects', action: 'read' },
    { prefix: '/classes', resource: 'classes', action: 'read' },
    { prefix: '/academic-years', resource: 'academic-years', action: 'read' },
    { prefix: '/academic-details', resource: 'students', action: 'read' },
    { prefix: '/attendance', resource: 'attendance', action: 'read' },
    { prefix: '/timetable', resource: 'timetable', action: 'read' },
    { prefix: '/notices', resource: 'notices', action: 'read' },
    { prefix: '/register', resource: 'register', action: 'create' },
  ]

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

  if (
    user.role === 'faculty' &&
    !facultyAllowedPrefixes.some((prefix) => (
      prefix === '/'
        ? pathname === '/'
        : pathname === prefix || pathname.startsWith(`${prefix}/`)
    ))
  ) {
    return <Navigate to='/attendance' replace />
  }

  if (
    user.role === 'student' &&
    !studentAllowedPrefixes.some((prefix) => (
      prefix === '/'
        ? pathname === '/'
        : pathname === prefix || pathname.startsWith(`${prefix}/`)
    ))
  ) {
    return <Navigate to='/' replace />
  }

  const routeRule = protectedRoutes.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (routeRule && !can(routeRule.resource, routeRule.action)) {
    return <Navigate to='/' replace />
  }

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
