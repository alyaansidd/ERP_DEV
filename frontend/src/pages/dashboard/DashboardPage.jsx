import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, PageHeader, Card, CardHeader, Empty, Spinner, Badge } from '../../components/ui/Misc'
import { departmentsApi, studentsApi, facultyApi, coursesApi, subjectsApi, classesApi, noticesApi, attendanceApi } from '../../api/services'
import styles from './Dashboard.module.css'

const ALL_STATS = [
  { key: 'students', label: 'Students', icon: 'ST', color: '#2563eb', bg: 'rgba(37,99,235,.08)', api: studentsApi },
  { key: 'faculty', label: 'Faculty', icon: 'FC', color: '#1d4ed8', bg: 'rgba(29,78,216,.08)', api: facultyApi },
  { key: 'departments', label: 'Departments', icon: 'DP', color: '#059669', bg: 'rgba(5,150,105,.08)', api: departmentsApi },
  { key: 'courses', label: 'Courses', icon: 'CR', color: '#d97706', bg: 'rgba(217,119,6,.08)', api: coursesApi },
  { key: 'subjects', label: 'Subjects', icon: 'SB', color: '#dc2626', bg: 'rgba(220,38,38,.08)', api: subjectsApi },
  { key: 'classes', label: 'Classes', icon: 'CL', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
]

const ROLE_STATS = {
  admin: ALL_STATS,
  hod: [
    { key: 'departments', label: 'My Department', icon: 'DP', color: '#059669', bg: 'rgba(5,150,105,.08)', api: departmentsApi },
    { key: 'faculty', label: 'Faculty', icon: 'FC', color: '#1d4ed8', bg: 'rgba(29,78,216,.08)', api: facultyApi },
    { key: 'students', label: 'Students', icon: 'ST', color: '#2563eb', bg: 'rgba(37,99,235,.08)', api: studentsApi },
    { key: 'subjects', label: 'Subjects', icon: 'SB', color: '#dc2626', bg: 'rgba(220,38,38,.08)', api: subjectsApi },
    { key: 'classes', label: 'Classes', icon: 'CL', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
    { key: 'attendance', label: 'Attendance', icon: 'AT', color: '#059669', bg: 'rgba(5,150,105,.08)', api: attendanceApi },
  ],
  faculty: [
    { key: 'classes', label: 'My Classes', icon: 'CL', color: '#16a34a', bg: 'rgba(22,163,74,.08)', api: classesApi },
    { key: 'students', label: 'Students', icon: 'ST', color: '#2563eb', bg: 'rgba(37,99,235,.08)', api: studentsApi },
  ],
  student: [],
}

const QUICK_LINKS = {
  admin: [
    { to: '/students', label: 'Students' },
    { to: '/faculty', label: 'Faculty' },
    { to: '/departments', label: 'Departments' },
    { to: '/courses', label: 'Courses' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/academic-years', label: 'Acad. Years' },
  ],
  hod: [
    { to: '/faculty', label: 'Faculty' },
    { to: '/students', label: 'Students' },
    { to: '/subjects', label: 'Subjects' },
    { to: '/classes', label: 'Classes' },
    { to: '/attendance', label: 'Attendance' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/notices', label: 'Notices' },
  ],
  faculty: [
    { to: '/attendance', label: 'Attendance' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/notices', label: 'Notices' },
    { to: '/classes', label: 'My Classes' },
    { to: '/students', label: 'Students' },
  ],
  student: [
    { to: '/notices', label: 'Notices' },
    { to: '/timetable', label: 'Timetable' },
    { to: '/profile', label: 'My Profile' },
  ],
}

const getArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  const firstArray = Object.values(payload || {}).find(Array.isArray)
  return firstArray || []
}

function StudentDashboard({ dashboard, quickLinks }) {
  const summary = dashboard?.attendanceSummary || { totalClasses: 0, presentClasses: 0, absentClasses: 0, percentage: 0 }

  return (
    <>
      <Card>
        <CardHeader title='All Attendance' />
        <div className={styles.attendanceSummary}>
          <div className={styles.summaryCard}><strong>{summary.totalClasses || 0}</strong><span>Total</span></div>
          <div className={styles.summaryCard}><strong>{summary.presentClasses || 0}</strong><span>Present</span></div>
          <div className={styles.summaryCard}><strong>{summary.absentClasses || 0}</strong><span>Absent</span></div>
          <div className={styles.summaryCard}><strong>{summary.percentage || 0}%</strong><span>Percentage</span></div>
        </div>
      </Card>

      <div className={styles.bottom}>
        <Card>
          <CardHeader title='Quick Actions' />
          <div className={styles.quickGrid}>
            {quickLinks.map((q) => (
              <Link key={q.to} to={q.to} className={styles.quickBtn}>
                {q.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
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
  const [studentDashboard, setStudentDashboard] = useState(null)
  const [studentLoad, setStudentLoad] = useState(role === 'student')
  const [nLoad, setNLoad] = useState(true)

  useEffect(() => {
    if (role !== 'student') {
      stats.forEach(({ key, api }) => {
        api.getAll().then(({ data }) => {
          const arr = getArray(data)
          setCounts((p) => ({ ...p, [key]: arr.length }))
        }).catch(() => {})
      })
    } else {
      setStudentLoad(true)
      Promise.all([studentsApi.getMyDashboard(), attendanceApi.getAll()])
        .then(([dashboardRes, attendanceRes]) => {
          const dashboardData = dashboardRes?.data?.data || dashboardRes?.data || {}
          const attendanceDocs = getArray(attendanceRes?.data)
          const attendanceRows = attendanceDocs.map((doc) => {
            const ownRecord = Array.isArray(doc.record) ? doc.record[0] : null
            return {
              id: doc._id || `${doc.date}-${doc.lectureNo}`,
              date: doc.date,
              lectureNo: doc.lectureNo,
              subjectName: doc.subjectId?.name || 'N/A',
              subjectCode: doc.subjectId?.subjectCode || 'N/A',
              status: ownRecord?.status || 'A',
            }
          }).sort((a, b) => new Date(b.date) - new Date(a.date))

          const totalClasses = attendanceRows.length
          const presentClasses = attendanceRows.filter((row) => row.status === 'P').length
          const absentClasses = totalClasses - presentClasses
          const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0

          setStudentDashboard({
            ...dashboardData,
            attendance: attendanceRows,
            attendanceSummary: { totalClasses, presentClasses, absentClasses, percentage },
          })
        })
        .catch(() => setStudentDashboard(null))
        .finally(() => setStudentLoad(false))
    }

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

  const hodDetailStats = useMemo(() => ([
    { label: 'Faculties', value: counts.faculty ?? 0 },
    { label: 'Students', value: counts.students ?? 0 },
    { label: 'Subjects', value: counts.subjects ?? 0 },
    { label: 'Classes', value: counts.classes ?? 0 },
    { label: 'Attendance', value: counts.attendance ?? 0 },
    { label: 'Notices', value: noticeTotal ?? 0 },
  ]), [counts, noticeTotal])

  const roleLabels = {
    admin: 'System Administrator',
    hod: 'Head of Department',
    faculty: 'Faculty Member',
    student: 'Student',
  }

  return (
    <>
      <PageHeader
        title={role === 'hod' && hodDepartments[0]?.name ? `Welcome, ${hodDepartments[0].name}` : `Welcome, ${user?.name || 'User'}`}
        subtitle={`${roleLabels[role] || 'User'} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      {role === 'student' ? (
        studentLoad ? (
          <Spinner />
        ) : (
          <StudentDashboard
            dashboard={studentDashboard}
            quickLinks={quickLinks}
          />
        )
      ) : (
        <>
          {stats.length > 0 && (
            <div className={styles.statsGrid}>
              {stats.map((s) => (
                <StatCard key={s.key} icon={s.icon} value={counts[s.key]} label={s.label} color={s.color} bg={s.bg} />
              ))}
            </div>
          )}

          {role === 'hod' && (
            <Card style={{ marginBottom: 16 }}>
              <CardHeader title='Assigned Department Details' />
              {hodDepartments.length === 0 ? (
                <Empty title='No department assigned' subtitle='Ask admin to map your faculty profile as HOD for a department.' />
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
            <Card>
              <CardHeader title='Recent Notices'>
                <Link to='/notices' className={styles.viewAll}>View All</Link>
              </CardHeader>
              {nLoad ? <Spinner /> :
                notices.length === 0 ? <Empty title='No notices yet' /> :
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

            <Card>
              <CardHeader title='Quick Actions' />
              <div className={styles.quickGrid}>
                {quickLinks.map((q) => (
                  <Link key={q.to} to={q.to} className={styles.quickBtn}>
                    {q.label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
