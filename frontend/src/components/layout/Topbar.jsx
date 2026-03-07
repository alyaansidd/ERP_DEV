import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Badge } from '../ui/Misc'
import styles from './Topbar.module.css'

const TITLES = {
  '/':               '🏠 Dashboard',
  '/notices':        '📢 Notices',
  '/departments':    '🏛️ Departments',
  '/courses':        '📚 Courses',
  '/subjects':       '📝 Subjects',
  '/classes':        '🏫 Classes',
  '/academic-years': '📅 Academic Years',
  '/students':       '👨‍🎓 Students',
  '/faculty':        '👩‍🏫 Faculty',
  '/attendance':     '✅ Attendance',
  '/register':       '➕ Register User',
  '/profile':        '⚙️ My Profile',
}

export default function Topbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const title = TITLES[pathname] || 'Campus ERP'

  return (
    <header className={styles.topbar}>
      <div className={styles.title}>{title}</div>
      <div className={styles.right}>
        <Badge role={user?.role} />
        <span className={styles.name}>{user?.name}</span>
      </div>
    </header>
  )
}
