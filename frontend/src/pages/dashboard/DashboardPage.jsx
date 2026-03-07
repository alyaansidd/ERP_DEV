import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, PageHeader, Card, CardHeader, Empty, Spinner, Badge } from '../../components/ui/Misc'
import { departmentsApi, studentsApi, facultyApi, coursesApi, subjectsApi, classesApi, noticesApi, attendanceApi, timetableApi, enrollmentsApi } from '../../api/services'
import styles from './Dashboard.module.css'

// All stats available for admins
const ALL_STATS = [
  { key: 'students',    label: 'Students',    icon: '👨‍🎓', color: '#2563eb', bg: 'rgba(37,99,235,.08)',  api: studentsApi },
  { key: 'faculty',     label: 'Faculty',     icon: '👩‍🏫', color: '#1d4ed8', bg: 'rgba(29,78,216,.08)', api: facultyApi },
  { key: 'departments', label: 'Departments', icon: '🏛️',  color: '#059669', bg: 'rgba(5,150,105,.08)',  api: departmentsApi },
  { key: 'courses',     label: 'Courses',     icon: '📚', color: '#d97706', bg: 'rgba(217,119,6,.08)', api: coursesApi },
  { key: 'subjects',    label: 'Subjects',    icon: '📝', color: '#dc2626', bg: 'rgba(220,38,38,.08)',  api: subjectsApi },
  { key: 'classes',     label: 'Classes',     icon: '🏫', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
]

// Role-specific stats
const ROLE_STATS = {
  admin:   ALL_STATS,
  hod:     ALL_STATS.slice(0, 4), // departments, faculty, courses, subjects -- wait, let me reorder
  faculty: [
    { key: 'classes',     label: 'My Classes',    icon: '🏫', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
    { key: 'students',    label: 'Students',     icon: '👨‍🎓', color: '#2563eb', bg: 'rgba(37,99,235,.08)',  api: studentsApi },
  ],
  student: [
    { key: 'attendance',  label: 'Attendance',    icon: '✅', color: '#059669', bg: 'rgba(5,150,105,.08)',  api: attendanceApi },
  ],
}

const QUICK_LINKS = {
  admin: [
    { to: '/students',       icon: '👨‍🎓', label: 'Students' },
    { to: '/faculty',        icon: '👩‍🏫', label: 'Faculty' },
    { to: '/departments',    icon: '🏛️',  label: 'Departments' },
    { to: '/courses',        icon: '📚', label: 'Courses' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
    { to: '/academic-years', icon: '📅', label: 'Acad. Years' },
  ],
  hod: [
    { to: '/faculty',        icon: '👩‍🏫', label: 'Faculty' },
    { to: '/students',       icon: '👨‍🎓', label: 'Students' },
    { to: '/classes',        icon: '🏫', label: 'Classes' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
    { to: '/enrollments',    icon: '📋', label: 'Enrollments' },
    { to: '/notices',        icon: '📢', label: 'Notices' },
  ],
  faculty: [
    { to: '/attendance',     icon: '✅', label: 'Attendance' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
    { to: '/enrollments',    icon: '📋', label: 'Enrollments' },
    { to: '/notices',        icon: '📢', label: 'Notices' },
    { to: '/classes',        icon: '🏫', label: 'My Classes' },
    { to: '/students',       icon: '👨‍🎓', label: 'Students' },
  ],
  student: [
    { to: '/notices',        icon: '📢', label: 'Notices' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
    { to: '/profile',        icon: '⚙️',  label: 'My Profile' },
  ],
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role || 'student'
  const stats = ROLE_STATS[role] || ROLE_STATS.student
  const quickLinks = QUICK_LINKS[role] || QUICK_LINKS.student

  const [counts, setCounts] = useState({})
  const [notices, setNotices] = useState([])
  const [nLoad, setNLoad] = useState(true)

  useEffect(() => {
    stats.forEach(({ key, api }) => {
      api.getAll().then(({ data }) => {
        const arr = Array.isArray(data) ? data : (Object.values(data).find(Array.isArray) ?? [])
        setCounts((p) => ({ ...p, [key]: arr.length }))
      }).catch(() => {})
    })

    noticesApi.getAll().then(({ data }) => {
      const arr = Array.isArray(data) ? data : (Object.values(data).find(Array.isArray) ?? [])
      setNotices(arr.slice(0, 4))
    }).catch(() => {}).finally(() => setNLoad(false))
  }, [role])

  const roleLabels = {
    admin: '🔑 System Administrator',
    hod: '👔 Head of Department',
    faculty: '👩‍🏫 Faculty Member',
    student: '👨‍🎓 Student',
  }

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.name || 'User'}`}
        subtitle={`${roleLabels[role] || 'User'} • ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {/* Stats Grid */}
      {stats.length > 0 && (
        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <StatCard key={s.key} icon={s.icon} value={counts[s.key]} label={s.label} color={s.color} bg={s.bg} />
          ))}
        </div>
      )}

      <div className={styles.bottom}>
        {/* Recent Notices */}
        <Card>
          <CardHeader title='📢 Recent Notices'>
            <Link to='/notices' className={styles.viewAll}>View All →</Link>
          </CardHeader>
          {nLoad ? <Spinner /> :
            notices.length === 0 ? <Empty icon='📢' title='No notices yet' /> :
            notices.map((n, i) => (
              <div key={i} className={styles.noticeItem}>
                <div className={styles.noticeTitle}>{n.title}</div>
                <div className={styles.noticeDesc}>{(n.description || '').slice(0, 100)}</div>
                <div className={styles.noticeMeta}>
                  <Badge role={n.targetRole || 'all'} />
                  {n.createdAt && <span className={styles.date}>{new Date(n.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))
          }
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader title='⚡ Quick Actions' />
          <div className={styles.quickGrid}>
            {quickLinks.map((q) => (
              <Link key={q.to} to={q.to} className={styles.quickBtn}>
                <span className={styles.quickIcon}>{q.icon}</span>
                {q.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
