import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { StatCard, PageHeader, Card, CardHeader, Empty, Spinner, Badge } from '../../components/ui/Misc'
import { departmentsApi, studentsApi, facultyApi, coursesApi, subjectsApi, classesApi, noticesApi, attendanceApi, attendanceSessionsApi } from '../../api/services'
import styles from './Dashboard.module.css'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

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

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

const extractAssignedLectures = (routing) => {
  const entries = []

  Object.entries(routing || {}).forEach(([day, lectureMap]) => {
    Object.entries(lectureMap || {}).forEach(([lectureNo, lecture]) => {
      const classId = toId(lecture?.classId)
      if (!classId) return

      entries.push({
        day,
        lectureNo: String(lectureNo),
        classId,
        subjectId: toId(lecture?.subjectId),
      })
    })
  })

  return entries
}

const normalizeDayToken = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''

  const map = {
    sun: 'sun', sunday: 'sun',
    mon: 'mon', monday: 'mon',
    tue: 'tue', tues: 'tue', tuesday: 'tue',
    wed: 'wed', wednesday: 'wed',
    thu: 'thu', thur: 'thu', thurs: 'thu', thursday: 'thu',
    fri: 'fri', friday: 'fri',
    sat: 'sat', saturday: 'sat',
  }

  return map[raw] || raw.slice(0, 3)
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported in this browser'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => reject(new Error('Unable to fetch your current location')),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  })
}

function FacultySessionManager({ user }) {
  const [facultyRows, setFacultyRows] = useState([])
  const [classRows, setClassRows] = useState([])
  const [subjectRows, setSubjectRows] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [selectedLectureKey, setSelectedLectureKey] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(3)
  const [radiusMeters, setRadiusMeters] = useState(6)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [facultyLocation, setFacultyLocation] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [creatingSession, setCreatingSession] = useState(false)
  const [endingSessionId, setEndingSessionId] = useState('')
  const [nowTs, setNowTs] = useState(Date.now())
  const [recentMarks, setRecentMarks] = useState([])

  const userId = String(user?.id || user?._id || '')
  const myFaculty = useMemo(
    () => facultyRows.find((item) => toId(item.userId) === userId) || facultyRows[0] || null,
    [facultyRows, userId]
  )

  const assignedLectures = useMemo(
    () => extractAssignedLectures(myFaculty?.routing || {}),
    [myFaculty]
  )

  const todayToken = useMemo(
    () => normalizeDayToken(new Date().toLocaleDateString('en-US', { weekday: 'short' })),
    []
  )

  const todayLectures = useMemo(
    () => assignedLectures.filter((lecture) => normalizeDayToken(lecture.day) === todayToken),
    [assignedLectures, todayToken]
  )

  const lectureOptions = useMemo(() => {
    return todayLectures
      .map((lecture) => {
        const classDoc = classRows.find((item) => toId(item) === lecture.classId)
        const subjectDoc = subjectRows.find((item) => toId(item) === lecture.subjectId)
        if (!classDoc) return null

        return {
          key: `${lecture.day}-${lecture.lectureNo}-${lecture.classId}-${lecture.subjectId}`,
          classId: lecture.classId,
          subjectId: lecture.subjectId,
          lectureNo: lecture.lectureNo,
          className: classDoc.name || '-',
          semester: classDoc.semester || '-',
          roomNo: classDoc.roomNo || '-',
          subjectName: subjectDoc?.name || 'Subject',
          subjectCode: subjectDoc?.subjectCode || '-',
        }
      })
      .filter(Boolean)
  }, [todayLectures, classRows, subjectRows])

  const selectedLecture = useMemo(
    () => lectureOptions.find((item) => item.key === selectedLectureKey) || null,
    [lectureOptions, selectedLectureKey]
  )

  const fetchActiveSessions = async () => {
    setLoadingSessions(true)
    try {
      const { data } = await attendanceSessionsApi.getActive()
      setActiveSessions(getArray(data))
    } catch {
      setActiveSessions([])
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    Promise.all([facultyApi.getAll(), classesApi.getAll(), subjectsApi.getAll()])
      .then(([facultyRes, classRes, subjectRes]) => {
        setFacultyRows(getArray(facultyRes?.data))
        setClassRows(getArray(classRes?.data))
        setSubjectRows(getArray(subjectRes?.data))
      })
      .catch(() => {
        setFacultyRows([])
        setClassRows([])
        setSubjectRows([])
      })
  }, [])

  useEffect(() => {
    fetchActiveSessions()
  }, [])

  useEffect(() => {
    const stream = attendanceSessionsApi.streamEvents({
      onMessage: (payload) => {
        if (!payload || payload.type !== 'attendance_marked') return

        setRecentMarks((prev) => [
          {
            id: `${payload.sessionId}-${payload.studentId}-${payload.markedAt}`,
            className: payload.className || 'Class',
            lectureNo: payload.lectureNo,
            studentName: payload.studentName || 'Student',
            studentRollNo: payload.studentRollNo || '-',
            markedAt: payload.markedAt,
            markedCount: payload.markedCount,
          },
          ...prev,
        ].slice(0, 8))

        fetchActiveSessions()
      },
    })

    return () => {
      if (stream) stream.close()
    }
  }, [])

  useEffect(() => {
    if (!lectureOptions.length) {
      setSelectedLectureKey('')
      return
    }

    const exists = lectureOptions.some((option) => option.key === selectedLectureKey)
    if (!exists) setSelectedLectureKey(lectureOptions[0].key)
  }, [lectureOptions, selectedLectureKey])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  async function captureFacultyLocation() {
    setIsLocationLoading(true)
    try {
      const location = await getCurrentLocation()
      setFacultyLocation(location)
      toast.success('Current location captured successfully')
    } catch (error) {
      toast.error(error.message || 'Unable to fetch location')
    } finally {
      setIsLocationLoading(false)
    }
  }

  async function createSession() {
    if (!selectedLecture) {
      toast.error('Select class and lecture first')
      return
    }

    if (!facultyLocation) {
      toast.error('Capture your location before starting session')
      return
    }

    const parsedDuration = Number(durationMinutes)
    const parsedRadius = Number(radiusMeters)

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      toast.error('Session duration must be greater than 0 minutes')
      return
    }

    if (!Number.isFinite(parsedRadius) || parsedRadius <= 0) {
      toast.error('Radius must be greater than 0 meters')
      return
    }

    const start = new Date()
    const end = new Date(start.getTime() + parsedDuration * 60 * 1000)

    setCreatingSession(true)
    try {
      await attendanceSessionsApi.start({
        classId: selectedLecture.classId,
        subjectId: selectedLecture.subjectId,
        lectureNo: selectedLecture.lectureNo,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        radiusMeters: parsedRadius,
        facultyLocation,
      })
      toast.success('Attendance session started')
      fetchActiveSessions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start session')
    } finally {
      setCreatingSession(false)
    }
  }

  async function endSession(sessionId) {
    setEndingSessionId(sessionId)
    try {
      await attendanceSessionsApi.end(sessionId)
      toast.success('Session ended')
      fetchActiveSessions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end session')
    } finally {
      setEndingSessionId('')
    }
  }

  return (
    <div className={styles.sessionWrap}>
      <Card>
        <CardHeader title='Start Attendance Session' />
        {lectureOptions.length === 0 ? (
          <Empty
            title='No class assigned for today'
            subtitle='No routed lectures are assigned for today in your faculty timetable.'
            icon='AT'
          />
        ) : (
          <>
            <div className={styles.todayLectureGrid}>
              {lectureOptions.map((option) => {
                const active = option.key === selectedLectureKey
                return (
                  <button
                    key={option.key}
                    type='button'
                    className={[styles.todayLectureCard, active ? styles.todayLectureCardActive : ''].join(' ')}
                    onClick={() => setSelectedLectureKey(option.key)}
                  >
                    <div className={styles.todayLectureTop}>
                      <span className={styles.todayClassName}>{option.className}</span>
                      <span className={styles.todayLectureTag}>Lecture {option.lectureNo}</span>
                    </div>
                    <div className={styles.todayMeta}>Semester {option.semester}</div>
                    <div className={styles.todaySubjectName}>{option.subjectName}</div>
                    <div className={styles.todayMeta}>Code: {option.subjectCode}</div>
                    <div className={styles.todayMeta}>Room: {option.roomNo}</div>
                  </button>
                )
              })}
            </div>

            <div className={styles.sessionFormGrid}>
              <label className={styles.fieldLabel}>
                Session Time (minutes)
                <input
                  type='number'
                  min='1'
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className={styles.fieldInput}
                />
              </label>

              <label className={styles.fieldLabel}>
                Radius (meters)
                <input
                  type='number'
                  min='1'
                  value={radiusMeters}
                  onChange={(event) => setRadiusMeters(event.target.value)}
                  className={styles.fieldInput}
                />
              </label>

              <div className={styles.fieldReadOnly}>
                <span className={styles.fieldReadOnlyLabel}>Selected Lecture</span>
                <strong>{selectedLecture?.className || '-'} | Lecture {selectedLecture?.lectureNo || '-'}</strong>
                <span>{selectedLecture?.subjectName || '-'}</span>
              </div>
            </div>

            <div className={styles.sessionActions}>
              <Button variant='secondary' onClick={captureFacultyLocation} loading={isLocationLoading}>
                Capture Faculty Location
              </Button>
              <Button onClick={createSession} loading={creatingSession}>
                Start Session
              </Button>
            </div>

            {facultyLocation && (
              <p className={styles.geoLine}>
                Location: {facultyLocation.latitude.toFixed(6)}, {facultyLocation.longitude.toFixed(6)}
              </p>
            )}
          </>
        )}
      </Card>

      <Card>
        <CardHeader title='Active Sessions' />
        {loadingSessions ? (
          <Spinner />
        ) : activeSessions.length === 0 ? (
          <Empty title='No active session' subtitle='Start a session to allow students to verify and mark attendance.' icon='AT' />
        ) : (
          <>
            {recentMarks.length > 0 && (
              <div className={styles.liveMarksPanel}>
                <div className={styles.liveMarksTitle}>Live Marks</div>
                <div className={styles.liveMarksList}>
                  {recentMarks.map((item) => (
                    <div key={item.id} className={styles.liveMarkRow}>
                      <span>{item.className} | Lecture {item.lectureNo}</span>
                      <span>{item.studentName} | Roll No: {item.studentRollNo}</span>
                      <span>Total Marked: {item.markedCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.sessionList}>
              {activeSessions.map((session) => {
                const sessionId = toId(session)
                const remaining = Math.max(0, Math.floor((new Date(session.endTime).getTime() - nowTs) / 1000))
                const isOwnSession = toId(session.startedByFacultyId?.userId) === userId || toId(session.startedByFacultyId) === toId(myFaculty)
                const markedStudentNames = (session.markedStudents || [])
                  .map((entry) => {
                    const name = entry?.studentId?.userId?.name || 'Student'
                    const rollNo = entry?.studentId?.rollNo || '-'
                    return `${name} (${rollNo})`
                  })
                  .filter(Boolean)

                return (
                  <div key={sessionId} className={styles.sessionCard}>
                    <div className={styles.sessionTop}>
                      <strong>{session.classId?.name || 'Class'}</strong>
                      <span className={styles.sessionTimer}>{remaining}s left</span>
                    </div>
                    <p className={styles.sessionMeta}>Subject: {session.subjectId?.name || '-'} | Lecture {session.lectureNo || '-'}</p>
                    <p className={styles.sessionMeta}>Radius: {session.radiusMeters || '-'} m | Marked: {session.markedStudents?.length || 0}</p>
                    {markedStudentNames.length > 0 && (
                      <p className={styles.sessionMeta}>Students: {markedStudentNames.join(', ')}</p>
                    )}
                    <div className={styles.sessionActions}>
                      <Button
                        variant='danger'
                        onClick={() => endSession(sessionId)}
                        loading={endingSessionId === sessionId}
                        disabled={!isOwnSession}
                      >
                        End Session
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

function StudentSessionPanel({ onMarked }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingSessionId, setProcessingSessionId] = useState('')
  const [verifyMap, setVerifyMap] = useState({})
  const [nowTs, setNowTs] = useState(Date.now())

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const { data } = await attendanceSessionsApi.getActive()
      setSessions(getArray(data))
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()

    const poller = window.setInterval(fetchSessions, 15000)
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000)

    return () => {
      window.clearInterval(poller)
      window.clearInterval(timer)
    }
  }, [])

  async function verifySession(sessionId) {
    setProcessingSessionId(sessionId)
    try {
      const location = await getCurrentLocation()
      const { data } = await attendanceSessionsApi.verify(sessionId, location)
      const verifyData = data?.data || {}
      setVerifyMap((prev) => ({ ...prev, [sessionId]: verifyData }))
      if (verifyData.canMark) toast.success('Verified: You can mark attendance now')
      else toast.error('Verification failed: Out of range or session closed')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Verification failed')
    } finally {
      setProcessingSessionId('')
    }
  }

  async function markSession(sessionId) {
    setProcessingSessionId(sessionId)
    try {
      const location = await getCurrentLocation()
      await attendanceSessionsApi.mark(sessionId, location)
      toast.success('Attendance marked successfully')
      setVerifyMap((prev) => ({
        ...prev,
        [sessionId]: {
          ...(prev[sessionId] || {}),
          canMark: false,
          alreadyMarked: true,
          inRange: true,
        }
      }))
      fetchSessions()
      if (typeof onMarked === 'function') onMarked()
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to mark attendance')
    } finally {
      setProcessingSessionId('')
    }
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <CardHeader title='Live Attendance Sessions' />
      {loading ? (
        <Spinner />
      ) : sessions.length === 0 ? (
        <Empty
          title='No active session right now'
          subtitle='When faculty starts attendance for your class, it will appear here with countdown.'
          icon='AT'
        />
      ) : (
        <div className={styles.sessionList}>
          {sessions.map((session) => {
            const sessionId = toId(session)
            const verifyState = verifyMap[sessionId]
            const remaining = verifyState?.remainingSeconds ?? Math.max(0, Math.floor((new Date(session.endTime).getTime() - nowTs) / 1000))
            const canMark = Boolean(verifyState?.canMark)
            const alreadyMarked = Boolean(verifyState?.alreadyMarked)
            const inRange = verifyState?.inRange

            return (
              <div key={sessionId} className={styles.sessionCard}>
                <div className={styles.sessionTop}>
                  <strong>{session.subjectId?.name || 'Subject'}</strong>
                  <span className={styles.sessionTimer}>{remaining}s left</span>
                </div>
                <p className={styles.sessionMeta}>Class: {session.classId?.name || '-'} | Lecture {session.lectureNo || '-'}</p>
                <p className={styles.sessionMeta}>Allowed Radius: {session.radiusMeters || '-'} m</p>
                {verifyState && (
                  <p className={styles.sessionMeta}>
                    Distance: {verifyState.distanceMeters || '-'} m | In range: {String(inRange)} | Marked: {String(alreadyMarked)}
                  </p>
                )}
                <div className={styles.sessionActions}>
                  <Button
                    variant='secondary'
                    onClick={() => verifySession(sessionId)}
                    loading={processingSessionId === sessionId}
                  >
                    Verify
                  </Button>
                  <Button
                    onClick={() => markSession(sessionId)}
                    disabled={!canMark || alreadyMarked}
                    loading={processingSessionId === sessionId}
                  >
                    Mark Attendance
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function StudentDashboard({ dashboard, quickLinks, onMarked }) {
  const summary = dashboard?.attendanceSummary || { totalClasses: 0, presentClasses: 0, absentClasses: 0, percentage: 0 }

  return (
    <>
      <StudentSessionPanel onMarked={onMarked} />

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
  const [studentRefreshKey, setStudentRefreshKey] = useState(0)
  const [nLoad, setNLoad] = useState(true)

  const refreshStudentDashboard = () => {
    setStudentRefreshKey((value) => value + 1)
  }

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
  }, [role, studentRefreshKey])

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
            onMarked={refreshStudentDashboard}
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

          {role === 'faculty' && <FacultySessionManager user={user} />}

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
