import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { Spinner } from '../ui/Misc'

export default function AppLayout() {
  const { user, loading } = useAuth()

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
      <Sidebar />
      <div className='main'>
        <Topbar />
        <div className='page'>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
