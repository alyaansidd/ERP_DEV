import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import { attendanceApi, classesApi, facultyApi, subjectsApi } from '../../api/services'
import { Alert, Card, CardHeader, Empty, PageHeader, Spinner } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import styles from './Attendance.module.css'
import toast from 'react-hot-toast'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

const formatDateKey = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

const formatFullDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getMonthLabel = (value) => {
  const date = new Date(value)
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  })
}

function buildCalendarDays(monthValue, entryByDate) {
  const monthDate = new Date(monthValue)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let index = 0; index < startDay; index += 1) {
    cells.push({ key: `empty-${index}`, empty: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    const dateKey = formatDateKey(date)
    cells.push({
      key: dateKey,
      day,
      dateKey,
      entry: entryByDate[dateKey] || null
    })
  }

  return cells
}

function extractAssignedLectures(routing) {
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

export default function AttendancePage() {
  const { can, user } = useAuth()
  const { data: classes = [] } = useList('classes', classesApi.getAll)
  const { data: faculty = [] } = useList('faculty', facultyApi.getAll)
  const { data: subjects = [] } = useList('subjects', subjectsApi.getAll)
  const {
    data: attendanceRecords = [],
    refetch: refetchAttendance
  } = useList('attendance', attendanceApi.getAll)

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [lectureNo, setLectureNo] = useState('')
  const [selectedLectureKey, setSelectedLectureKey] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [record, setRecord] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [calendarMonth, setCalendarMonth] = useState('')

  const isFaculty = user?.role === 'faculty'
  const myFaculty = useMemo(() => {
    const userId = String(user?.id || user?._id || '')
    return faculty.find((item) => toId(item.userId) === userId) || faculty[0] || null
  }, [faculty, user])

  const assignedLectures = useMemo(
    () => extractAssignedLectures(myFaculty?.routing || {}),
    [myFaculty]
  )
  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [toId(subject), subject])),
    [subjects]
  )
  const studentAttendanceCards = useMemo(() => {
    if (isFaculty) return []

    const summaryBySubject = attendanceRecords.reduce((acc, attendance) => {
      const subjectDoc = attendance?.subjectId
      const subjectKey = toId(subjectDoc)
      if (!subjectKey) return acc

      const ownStatus = attendance?.record?.[0]?.status
      if (!acc[subjectKey]) {
        acc[subjectKey] = {
          id: subjectKey,
          name: subjectDoc?.name || subjectById[subjectKey]?.name || 'Subject',
          code: subjectDoc?.subjectCode || subjectDoc?.code || subjectById[subjectKey]?.subjectCode || '-',
          totalLectures: 0,
          presentLectures: 0,
          attendanceEntries: []
        }
      }

      const dateKey = formatDateKey(attendance?.date)
      acc[subjectKey].totalLectures += 1
      if (ownStatus === 'P') acc[subjectKey].presentLectures += 1
      acc[subjectKey].attendanceEntries.push({
        id: attendance?._id || `${subjectKey}-${dateKey}-${attendance?.lectureNo || ''}`,
        date: attendance?.date,
        dateKey,
        lectureNo: attendance?.lectureNo || '-',
        status: ownStatus || 'A'
      })
      return acc
    }, {})

    return Object.values(summaryBySubject)
      .map((item) => ({
        ...item,
        attendanceEntries: item.attendanceEntries.sort((a, b) => new Date(a.date) - new Date(b.date)),
        percentage: item.totalLectures ? Math.round((item.presentLectures / item.totalLectures) * 100) : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [attendanceRecords, isFaculty, subjectById])
  const selectedStudentSubject = useMemo(
    () => studentAttendanceCards.find((subject) => subject.id === selectedSubjectId) || null,
    [selectedSubjectId, studentAttendanceCards]
  )
  const selectedSubjectEntryByDate = useMemo(() => {
    if (!selectedStudentSubject) return {}
    return selectedStudentSubject.attendanceEntries.reduce((acc, entry) => {
      if (entry.dateKey) acc[entry.dateKey] = entry
      return acc
    }, {})
  }, [selectedStudentSubject])
  const calendarDays = useMemo(
    () => (calendarMonth ? buildCalendarDays(calendarMonth, selectedSubjectEntryByDate) : []),
    [calendarMonth, selectedSubjectEntryByDate]
  )

  const assignedClasses = useMemo(() => {
    if (!isFaculty) return classes
    const assignedClassIds = new Set(assignedLectures.map((lecture) => lecture.classId))
    return classes.filter((classDoc) => assignedClassIds.has(toId(classDoc)))
  }, [assignedLectures, classes, isFaculty])

  const normalizedSelectedDate = useMemo(
    () => new Date(date).toISOString().split('T')[0],
    [date]
  )
  const markedAttendanceKeys = useMemo(() => {
    const keys = new Set()

    attendanceRecords.forEach((attendance) => {
      const attendanceDate = attendance?.date ? new Date(attendance.date).toISOString().split('T')[0] : ''
      if (attendanceDate !== normalizedSelectedDate) return

      const attendanceClassId = toId(attendance.classId)
      const attendanceSubjectId = toId(attendance.subjectId)
      const attendanceLectureNo = String(attendance?.lectureNo || '')
      if (!attendanceClassId || !attendanceSubjectId || !attendanceLectureNo) return

      keys.add(`${attendanceClassId}-${attendanceSubjectId}-${attendanceLectureNo}-${attendanceDate}`)
    })

    return keys
  }, [attendanceRecords, normalizedSelectedDate])
  const facultyLectureCards = useMemo(() => {
    if (!isFaculty) return []

    return assignedLectures
      .map((lecture) => {
        const classDoc = classes.find((item) => toId(item) === lecture.classId)
        const subjectDoc = subjectById[lecture.subjectId]
        if (!classDoc) return null

        return {
          key: `${lecture.day}-${lecture.lectureNo}-${lecture.classId}-${lecture.subjectId}`,
          ...lecture,
          classDoc,
          subjectDoc,
          isMarked: markedAttendanceKeys.has(`${lecture.classId}-${lecture.subjectId}-${lecture.lectureNo}-${normalizedSelectedDate}`)
        }
      })
      .filter(Boolean)
  }, [assignedLectures, classes, isFaculty, markedAttendanceKeys, normalizedSelectedDate, subjectById])
  const selectedLecture = useMemo(
    () => facultyLectureCards.find((lecture) => lecture.key === selectedLectureKey) || null,
    [facultyLectureCards, selectedLectureKey]
  )

  useEffect(() => {
    if (!isFaculty) return
    if (!facultyLectureCards.length) {
      setSelectedLectureKey('')
      setClassId('')
      setSubjectId('')
      setLectureNo('')
      return
    }

    const isValid = facultyLectureCards.some((lecture) => lecture.key === selectedLectureKey)
    if (!isValid) {
      const firstLecture = facultyLectureCards[0]
      setSelectedLectureKey(firstLecture.key)
      setClassId(firstLecture.classId)
      setSubjectId(firstLecture.subjectId)
      setLectureNo(firstLecture.lectureNo)
    }
  }, [facultyLectureCards, isFaculty, selectedLectureKey])

  useEffect(() => {
    if (!classId) {
      setStudents([])
      return
    }

    setLoading(true)
    classesApi.getById(classId)
      .then(({ data }) => {
        const cls = data?.data || data?.class || data
        setStudents(cls.studentIds || [])
        setRecord({})
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [classId])

  function toggle(id, status) {
    setRecord((prev) => ({ ...prev, [id]: status }))
  }

  function selectLectureCard(lecture) {
    setSelectedLectureKey(lecture.key)
    setClassId(lecture.classId)
    setSubjectId(lecture.subjectId)
    setLectureNo(lecture.lectureNo)
  }

  function openSubjectCalendar(subject) {
    setSelectedSubjectId(subject.id)
    const latestDate = subject.attendanceEntries.at(-1)?.date || new Date().toISOString()
    const monthStart = new Date(latestDate)
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    setCalendarMonth(monthStart.toISOString())
  }

  function closeSubjectCalendar() {
    setSelectedSubjectId('')
    setCalendarMonth('')
  }

  function changeCalendarMonth(offset) {
    if (!calendarMonth) return
    const nextMonth = new Date(calendarMonth)
    nextMonth.setMonth(nextMonth.getMonth() + offset)
    nextMonth.setDate(1)
    setCalendarMonth(nextMonth.toISOString())
  }

  async function submit() {
    if (!classId) {
      toast.error('Select an assigned class first')
      return
    }
    if (!subjectId) {
      toast.error('Select a routed lecture first')
      return
    }
    if (!lectureNo) {
      toast.error('Lecture number is missing for this assigned class')
      return
    }

    const payload = students.map((student) => ({
      studentId: student._id || student.id,
      status: record[student._id || student.id] || 'A'
    }))

    setSaving(true)
    try {
      await attendanceApi.create({ classId, subjectId, lectureNo, date, record: payload })
      await refetchAttendance()
      toast.success('Attendance saved')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (isFaculty && !assignedClasses.length) {
    return (
      <>
        <PageHeader title='Attendance' subtitle='Take attendance for your assigned routed classes.' />
        <Card>
          <Empty title='No assigned classes' icon='Class' />
          <Alert type='error' message='No classes are currently mapped in your routing, so attendance cannot be taken yet.' />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title='Attendance'
        subtitle={isFaculty ? 'Take attendance only for classes assigned in your routing.' : 'Track your attendance subject by subject.'}
      />

      {isFaculty && (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title='Assigned Class Boxes' />
          <div className={styles.assignmentGrid}>
            {facultyLectureCards.map((lecture) => {
              const active = lecture.key === selectedLectureKey
              const subjectName = lecture.subjectDoc?.name || 'Subject'
              const subjectCode = lecture.subjectDoc?.subjectCode || lecture.subjectDoc?.code || '-'
              return (
                <button
                  key={lecture.key}
                  type='button'
                  className={[styles.assignmentCard, active ? styles.assignmentCardActive : ''].join(' ')}
                  onClick={() => selectLectureCard(lecture)}
                >
                  <div className={styles.assignmentTop}>
                    <span className={styles.assignmentClass}>{lecture.classDoc.name}</span>
                    <div className={styles.assignmentTags}>
                      {lecture.isMarked && <span className={styles.assignmentMarked}>MARKED</span>}
                      <span className={styles.assignmentLecture}>Lecture {lecture.lectureNo}</span>
                    </div>
                  </div>
                  <div className={styles.assignmentMeta}>Semester {lecture.classDoc.semester || '-'}</div>
                  <div className={styles.assignmentSubject}>{subjectName}</div>
                  <div className={styles.assignmentMeta}>Code: {subjectCode}</div>
                  <div className={styles.assignmentMeta}>Room: {lecture.classDoc.roomNo || '-'}</div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {isFaculty ? (
        <Card style={{ marginBottom: 16 }}>
          {selectedLecture?.isMarked && (
            <Alert
              type='info'
              message='Attendance is already marked for this assigned class box on the current day.'
            />
          )}
        </Card>
      ) : (
        <Card style={{ marginBottom: 16 }}>
          <CardHeader title='Subject-wise Attendance' />
          {studentAttendanceCards.length === 0 ? (
            <Empty
              title='No attendance records yet'
              subtitle='Your subject attendance cards will appear here once attendance is marked.'
              icon='AT'
            />
          ) : (
            <div className={styles.subjectGrid}>
              {studentAttendanceCards.map((subject) => (
                <button
                  key={subject.id}
                  type='button'
                  className={styles.subjectCard}
                  onClick={() => openSubjectCalendar(subject)}
                >
                  <div className={styles.subjectCardTop}>
                    <div>
                      <div className={styles.subjectName}>{subject.name}</div>
                      <div className={styles.subjectCode}>Code: {subject.code}</div>
                    </div>
                    <div className={styles.subjectPercentage}>{subject.percentage}%</div>
                  </div>
                  <div className={styles.subjectStats}>
                    <div className={styles.subjectStatBox}>
                      <span className={styles.subjectStatLabel}>Total Lectures</span>
                      <strong>{subject.totalLectures}</strong>
                    </div>
                    <div className={styles.subjectStatBox}>
                      <span className={styles.subjectStatLabel}>Present Lectures</span>
                      <strong>{subject.presentLectures}</strong>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {isFaculty && classId && (students.length > 0 || loading) && (
        <Card>
          <CardHeader title={`Students${students.length ? ` (${students.length})` : ''}`}>
            {students.length > 0 && can('attendance', 'create') && (
              <Button loading={saving} onClick={submit}>Save Attendance</Button>
            )}
          </CardHeader>

          {loading ? (
            <Spinner />
          ) : students.length === 0 ? (
            <Empty icon='Student' title='No students in this class' />
          ) : (
            students.map((student) => {
              const id = student._id || student.id
              const status = record[id]

              return (
                <div key={id} className={styles.row}>
                  <div>
                    <div className={styles.sName}>{student.userId?.name || `Roll: ${student.rollNo || '-'}`}</div>
                    <div className={styles.sInfo}>{student.rollNo ? `Roll: ${student.rollNo}` : 'Student'}</div>
                  </div>
                  <div className={styles.toggle}>
                    <button className={[styles.pBtn, status === 'P' ? styles.pOn : ''].join(' ')} onClick={() => toggle(id, 'P')}>P</button>
                    <button className={[styles.aBtn, status === 'A' ? styles.aOn : ''].join(' ')} onClick={() => toggle(id, 'A')}>A</button>
                  </div>
                </div>
              )
            })
          )}
        </Card>
      )}

      {selectedStudentSubject && (
        <Modal
          title={`${selectedStudentSubject.name} Attendance`}
          onClose={closeSubjectCalendar}
          maxWidth={920}
        >
          <div className={styles.calendarHeader}>
            <div>
              <div className={styles.calendarSubTitle}>Subject Code: {selectedStudentSubject.code}</div>
              <div className={styles.calendarSummary}>
                Total {selectedStudentSubject.totalLectures} | Present {selectedStudentSubject.presentLectures} | {selectedStudentSubject.percentage}%
              </div>
            </div>
            <div className={styles.calendarControls}>
              <Button variant='secondary' size='sm' onClick={() => changeCalendarMonth(-1)}>Prev</Button>
              <span className={styles.calendarMonthLabel}>{getMonthLabel(calendarMonth)}</span>
              <Button variant='secondary' size='sm' onClick={() => changeCalendarMonth(1)}>Next</Button>
            </div>
          </div>

          <div className={styles.calendarLegend}>
            <span className={styles.legendItem}><span className={[styles.legendDot, styles.legendPresent].join(' ')} /> Present</span>
            <span className={styles.legendItem}><span className={[styles.legendDot, styles.legendAbsent].join(' ')} /> Absent</span>
          </div>

          <div className={styles.calendarGrid}>
            {WEEK_DAYS.map((day) => (
              <div key={day} className={styles.calendarWeekday}>{day}</div>
            ))}
            {calendarDays.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} className={[styles.calendarCell, styles.calendarCellEmpty].join(' ')} />
              }

              const statusClass = cell.entry?.status === 'P'
                ? styles.calendarPresent
                : cell.entry?.status === 'A'
                  ? styles.calendarAbsent
                  : ''

              return (
                <div key={cell.key} className={[styles.calendarCell, statusClass].join(' ')}>
                  <span className={styles.calendarDay}>{cell.day}</span>
                  {cell.entry && (
                    <>
                      <span className={styles.calendarStatusIcon}>{cell.entry.status === 'P' ? '●' : '●'}</span>
                      <span className={styles.calendarStatusText}>{cell.entry.status === 'P' ? 'Present' : 'Absent'}</span>
                      <span className={styles.calendarLecture}>Lecture {cell.entry.lectureNo}</span>
                      <span className={styles.calendarDateLabel}>{formatFullDate(cell.entry.date)}</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.attendanceTimeline}>
            {selectedStudentSubject.attendanceEntries.map((entry) => (
              <div key={entry.id} className={styles.timelineRow}>
                <span className={styles.timelineDate}>{formatFullDate(entry.date)}</span>
                <span className={entry.status === 'P' ? styles.timelinePresent : styles.timelineAbsent}>
                  {entry.status === 'P' ? 'Present' : 'Absent'}
                </span>
                <span className={styles.timelineLecture}>Lecture {entry.lectureNo}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}
