import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Sidebar.module.css'

const NAV = [
  { section: 'Overview' },
  { to: '/',                icon: '🏠', label: 'Dashboard' },
  { to: '/notices',         icon: '📢', label: 'Notices' },
  { section: 'Academic' },
  { to: '/departments',     icon: '🏛️',  label: 'Departments' },
  { to: '/courses',         icon: '📚', label: 'Courses' },
  { to: '/subjects',        icon: '📝', label: 'Subjects' },
  { to: '/classes',         icon: '🏫', label: 'Classes' },
  { to: '/academic-years',  icon: '📅', label: 'Academic Years' },
  { section: 'People' },
  { to: '/students',        icon: '👨‍🎓', label: 'Students' },
  { to: '/faculty',         icon: '👩‍🏫', label: 'Faculty' },
  { section: 'Operations' },
  { to: '/attendance',      icon: '✅', label: 'Attendance' },
  { to: '/timetable',       icon: '🕐', label: 'Timetable' },
  { to: '/enrollments',     icon: '📋', label: 'Enrollments' },
  { section: 'Account' },
  { to: '/register',        icon: '➕', label: 'Register User', roles: ['admin'] },
  { to: '/profile',         icon: '⚙️',  label: 'My Profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoText}>Campus ERP</div>
        <div className={styles.logoSub}>Institutional Portal</div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV.map((item, i) => {
          if (item.section) {
            return <div key={i} className={styles.section}>{item.section}</div>
          }
          if (item.roles && !item.roles.includes(user?.role)) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
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
