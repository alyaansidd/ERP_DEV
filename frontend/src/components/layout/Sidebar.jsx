import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const NAV = [
  { section: 'Overview' },
  { to: '/',                icon: '🏠', label: 'Dashboard' },
  { to: '/notices',         icon: '📢', label: 'Notices', resource: 'notices' },
  { section: 'Academic' },
  { to: '/departments',     icon: '🏛️',  label: 'Departments', resource: 'departments' },
  { to: '/courses',         icon: '📚', label: 'Courses', resource: 'courses' },
  { to: '/subjects',        icon: '📝', label: 'Subjects', resource: 'subjects' },
  { to: '/classes',         icon: '🏫', label: 'Classes', resource: 'classes' },
  { to: '/academic-years',  icon: '📅', label: 'Academic Years', resource: 'academic-years' },
  { section: 'People' },
  { to: '/students',        icon: '👨‍🎓', label: 'Students', resource: 'students' },
  { to: '/faculty',         icon: '👩‍🏫', label: 'Faculty', resource: 'faculty' },
  { section: 'Operations' },
  { to: '/attendance',      icon: '✅', label: 'Attendance', resource: 'attendance' },
  { to: '/timetable',       icon: '🕐', label: 'Timetable', resource: 'timetable' },
  { section: 'Account' },
  { to: '/register',        icon: '➕', label: 'Register User', resource: 'register', action: 'create' },
  { to: '/profile',         icon: '⚙️',  label: 'My Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, can } = useAuth()

  return (
    <aside className={[styles.sidebar, isOpen ? styles.open : ''].join(' ')}>
      {/* Logo */}
      <div className={styles.logo}>
        <button type='button' className={styles.mobileClose} onClick={onClose} aria-label='Close menu'>✕</button>
        <div className={styles.logoText}>Campus ERP</div>
        <div className={styles.logoSub}>Institutional Portal</div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={i} className={styles.section}>{item.section}</div>
          }
          if (item.resource && !can(item.resource, item.action || 'read')) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                [styles.link, isActive ? styles.active : ''].join(' ')
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User footer */}
      <div className={styles.footer}>
        <div className={styles.userChip}>
          <div className={styles.avatar}>
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userRole}>{user?.role}</div>
          </div>
          <button
            className={styles.logoutBtn}
            title='Logout'
            onClick={() => logout().then(() => (window.location.href = '/login'))}
          >
            →
          </button>
        </div>
      </div>
    </aside>
  )
}
