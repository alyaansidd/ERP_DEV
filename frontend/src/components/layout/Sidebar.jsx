import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const NAV = [
  { section: 'Overview' },
  { to: '/', icon: 'HM', label: 'Dashboard' },
  { to: '/notices', icon: 'NT', label: 'Notices', resource: 'notices' },
  { section: 'Academic' },
  { to: '/departments', icon: 'DP', label: 'Departments', resource: 'departments' },
  { to: '/courses', icon: 'CR', label: 'Courses', resource: 'courses' },
  { to: '/subjects', icon: 'SB', label: 'Subjects', resource: 'subjects' },
  { to: '/classes', icon: 'CL', label: 'Classes', resource: 'classes' },
  { to: '/academic-years', icon: 'YR', label: 'Academic Years', resource: 'academic-years' },
  { section: 'People' },
  { to: '/students', icon: 'ST', label: 'Students', resource: 'students' },
  { to: '/faculty', icon: 'FC', label: 'Faculty', resource: 'faculty' },
  { section: 'Operations' },
  { to: '/attendance', icon: 'AT', label: 'Attendance', resource: 'attendance' },
  { to: '/timetable', icon: 'TT', label: 'Timetable', resource: 'timetable' },
  { section: 'Account' },
  { to: '/register', icon: 'RG', label: 'Register User', resource: 'register', action: 'create' },
  { to: '/profile', icon: 'PR', label: 'My Profile' },
]

const FACULTY_ALLOWED_PATHS = new Set(['/', '/attendance', '/timetable', '/profile', '/notices'])

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, can } = useAuth()

  return (
    <aside className={[styles.sidebar, isOpen ? styles.open : ''].join(' ')}>
      <div className={styles.logo}>
        <button type='button' className={styles.mobileClose} onClick={onClose} aria-label='Close menu'>x</button>
        <div className={styles.logoText}>Campus ERP</div>
        <div className={styles.logoSub}>Institutional Portal</div>
      </div>

      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) {
            const hasVisibleLinkAfterSection = NAV.slice(i + 1).some((candidate) => {
              if (candidate.section) return false
              if (user?.role === 'faculty' && !FACULTY_ALLOWED_PATHS.has(candidate.to)) return false
              if (candidate.resource && !can(candidate.resource, candidate.action || 'read')) return false
              return true
            })

            return hasVisibleLinkAfterSection ? <div key={i} className={styles.section}>{item.section}</div> : null
          }

          if (user?.role === 'faculty' && !FACULTY_ALLOWED_PATHS.has(item.to)) return null
          if (item.resource && !can(item.resource, item.action || 'read')) return null

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) => [styles.link, isActive ? styles.active : ''].join(' ')}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

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
            {'>'}
          </button>
        </div>
      </div>
    </aside>
  )
}
