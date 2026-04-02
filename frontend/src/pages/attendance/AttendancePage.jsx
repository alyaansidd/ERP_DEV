import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import { attendanceApi, classesApi, facultyApi, subjectsApi } from '../../api/services'
import { Alert, Card, CardHeader, Empty, PageHeader, Spinner } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import styles from './Attendance.module.css'
import toast from 'react-hot-toast'

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
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

  const assignedClasses = useMemo(() => {
    if (!isFaculty) return classes
    const assignedClassIds = new Set(assignedLectures.map((lecture) => lecture.classId))
    return classes.filter((classDoc) => assignedClassIds.has(toId(classDoc)))
  }, [assignedLectures, classes, isFaculty])

  const selectedClass = useMemo(
    () => assignedClasses.find((classDoc) => toId(classDoc) === String(classId)) || null,
    [assignedClasses, classId]
  )
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

  const subjectOptions = useMemo(() => {
    if (!isFaculty) {
      return subjects.map((subject) => ({
        value: toId(subject),
        label: subject.name || subject.code || 'Subject'
      }))
    }
    return []
  }, [isFaculty, subjects])

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
    if (isFaculty) return
    if (!subjectOptions.length) {
      setSubjectId('')
      return
    }

    const isValid = subjectOptions.some((option) => option.value === String(subjectId))
    if (!isValid) setSubjectId(subjectOptions[0].value)
  }, [isFaculty, subjectId, subjectOptions])

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
        subtitle={isFaculty ? 'Take attendance only for classes assigned in your routing.' : 'Mark daily attendance by class and subject.'}
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

      <Card style={{ marginBottom: 16 }}>
        <div className='g2'>
          {!isFaculty && (
            <Input
              label='Class'
              name='classId'
              type='select'
              value={classId}
              onChange={(_, value) => setClassId(value)}
              options={classes.map((classDoc) => ({ value: toId(classDoc), label: classDoc.name }))}
            />
          )}
          {!isFaculty && (
            <Input
              label='Subject'
              name='subjectId'
              type='select'
              value={subjectId}
              onChange={(_, value) => setSubjectId(value)}
              options={subjectOptions}
            />
          )}
        </div>
        {!isFaculty && (
          <Input label='Date' name='date' type='date' value={date} onChange={(_, value) => setDate(value)} />
        )}
        {isFaculty && selectedLecture?.isMarked && (
          <Alert
            type='info'
            message='Attendance is already marked for this assigned class box on the current day.'
          />
        )}
        {selectedClass && !isFaculty && (
          <Alert
            type='info'
            message={`Selected class: ${selectedClass.name}${selectedClass.roomNo ? ` • Room ${selectedClass.roomNo}` : ''}`}
          />
        )}
      </Card>

      {classId && (!isFaculty || students.length > 0 || loading) && (
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
    </>
  )
}
