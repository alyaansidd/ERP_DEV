import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, PageHeader, Card, CardHeader, Empty, Spinner, Badge } from '../../components/ui/Misc'
import { departmentsApi, studentsApi, facultyApi, coursesApi, subjectsApi, classesApi, noticesApi, attendanceApi } from '../../api/services'
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
  hod: [
    { key: 'departments', label: 'My Department', icon: '🏛️', color: '#059669', bg: 'rgba(5,150,105,.08)', api: departmentsApi },
    { key: 'faculty', label: 'Faculty', icon: '👩‍🏫', color: '#1d4ed8', bg: 'rgba(29,78,216,.08)', api: facultyApi },
    { key: 'students', label: 'Students', icon: '👨‍🎓', color: '#2563eb', bg: 'rgba(37,99,235,.08)', api: studentsApi },
    { key: 'subjects', label: 'Subjects', icon: '📝', color: '#dc2626', bg: 'rgba(220,38,38,.08)', api: subjectsApi },
    { key: 'classes', label: 'Classes', icon: '🏫', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
    { key: 'attendance', label: 'Attendance', icon: '✅', color: '#059669', bg: 'rgba(5,150,105,.08)', api: attendanceApi },
  ],
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
    { to: '/subjects',       icon: '📝', label: 'Subjects' },
    { to: '/classes',        icon: '🏫', label: 'Classes' },
    { to: '/attendance',     icon: '✅', label: 'Attendance' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
    { to: '/notices',        icon: '📢', label: 'Notices' },
  ],
  faculty: [
    { to: '/attendance',     icon: '✅', label: 'Attendance' },
    { to: '/timetable',      icon: '🕐', label: 'Timetable' },
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
  const [noticeTotal, setNoticeTotal] = useState(0)
  const [hodDepartments, setHodDepartments] = useState([])
  const [nLoad, setNLoad] = useState(true)

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    const firstArray = Object.values(payload || {}).find(Array.isArray)
    return firstArray || []
  }

  useEffect(() => {
    stats.forEach(({ key, api }) => {
      api.getAll().then(({ data }) => {
        const arr = getArray(data)
        setCounts((p) => ({ ...p, [key]: arr.length }))
      }).catch(() => {})
    })

    if (role === 'hod') {
      departmentsApi.getAll().then(({ data }) => {
        setHodDepartments(getArray(data))
      }).catch(() => setHodDepartments([]))
    }

    noticesApi.getAll().then(({ data }) => {
      const arr = getArray(data)
      setNoticeTotal(arr.length)
      setNotices(arr.slice(0, 4))
    }).catch(() => {}).finally(() => setNLoad(false))
  }, [role])

  const hodDetailStats = [
    { label: 'Faculties', value: counts.faculty ?? 0 },
    { label: 'Students', value: counts.students ?? 0 },
    { label: 'Subjects', value: counts.subjects ?? 0 },
    { label: 'Classes', value: counts.classes ?? 0 },
    { label: 'Attendance', value: counts.attendance ?? 0 },
    { label: 'Notices', value: noticeTotal ?? 0 },
  ]

  const roleLabels = {
    admin: '🔑 System Administrator',
    hod: '👔 Head of Department',
    faculty: '👩‍🏫 Faculty Member',
    student: '👨‍🎓 Student',
  }

  return (
    <>
      <PageHeader
        title={role === 'hod' && hodDepartments[0]?.name ? `Welcome, ${hodDepartments[0].name}` : `Welcome, ${user?.name || 'User'}`}
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

      {role === 'hod' && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title='🏛️ Assigned Department Details' />
          {hodDepartments.length === 0 ? (
            <Empty icon='🏛️' title='No department assigned' subtitle='Ask admin to map your faculty profile as HOD for a department.' />
          ) : (
            hodDepartments.map((dept) => (
              <div key={dept._id || dept.id} className={styles.deptDetailCard}>
                <div className={styles.deptTitleRow}>
                  <div className={styles.noticeTitle}>{dept.name}</div>
                  <span className={styles.deptCode}>Code: {dept.code || 'N/A'}</span>
                </div>

                <div className={styles.deptStatsGrid}>
                  {hodDetailStats.map((item) => (
                    <div key={item.label} className={styles.deptStatItem}>
                      <span className={styles.deptStatValue}>{item.value}</span>
                      <span className={styles.deptStatLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.noticeMeta}>
                  <span className={styles.date}>Notices visible: targetRole = all OR department scoped</span>
                </div>
              </div>
            ))
          )}
        </Card>
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
