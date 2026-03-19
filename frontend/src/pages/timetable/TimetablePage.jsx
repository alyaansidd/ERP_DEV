import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import { classesApi, facultyApi, subjectsApi } from '../../api/services'
import { PageHeader, Card, Empty, Spinner } from '../../components/ui/Misc'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import styles from './Timetable.module.css'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const FIXED_LECTURE_POSITIONS = [1, 2, 3, 4, 5, 6]
const DAY_LABEL = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
}

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

const toEntries = (value) => {
  if (!value || typeof value !== 'object') return []
  if (value instanceof Map) return Array.from(value.entries())
  return Object.entries(value)
}

const normalizeDay = (value) => String(value || '').trim().toLowerCase()

const parseLecture = (value) => {
  const direct = Number(value)
  if (Number.isFinite(direct)) return direct
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : Number.NaN
}

const lectureSort = (a, b) => {
  const an = parseLecture(a)
  const bn = parseLecture(b)
  const aNum = Number.isFinite(an)
  const bNum = Number.isFinite(bn)
  if (aNum && bNum) return an - bn
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

const normalizeSchedule = (schedule) => {
  const normalized = {}
  toEntries(schedule).forEach(([dayKey, slotMap]) => {
    const day = normalizeDay(dayKey)
    if (!DAY_ORDER.includes(day)) return
    normalized[day] = normalized[day] || {}
    toEntries(slotMap).forEach(([slot, lecture]) => {
      if (!lecture || typeof lecture !== 'object') return
      normalized[day][String(slot)] = lecture
    })
  })
  return normalized
}

export default function TimetablePage() {
  const { user } = useAuth()
  const {
    data: classes = [],
    isLoading: classesLoading,
    refetch: refetchClasses
  } = useList('classes', classesApi.getAll)
  const {
    data: faculty = [],
    isLoading: facultyLoading,
    refetch: refetchFaculty
  } = useList('faculty', facultyApi.getAll)
  const { data: subjects = [], isLoading: subjectsLoading } = useList('subjects', subjectsApi.getAll)

  const [view, setView] = useState('class')
  const [classId, setClassId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    subjectId: '',
    facultyId: '',
    classId: '',
  })

  const userRole = user?.role || 'student'
  const loading = classesLoading || facultyLoading || subjectsLoading

  const subjectById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [toId(s), s])),
    [subjects]
  )
  const classById = useMemo(
    () => Object.fromEntries(classes.map((c) => [toId(c), c])),
    [classes]
  )
  const facultyById = useMemo(
    () => Object.fromEntries(faculty.map((f) => [toId(f), f])),
    [faculty]
  )

  const myFacultyId = useMemo(
    () => toId(faculty.find((f) => toId(f.userId) === String(user?.id || user?._id || ''))),
    [faculty, user]
  )

  useEffect(() => {
    if (userRole === 'faculty' && myFacultyId) {
      setView('faculty')
      if (!facultyId) setFacultyId(myFacultyId)
      return
    }
    if (userRole === 'student') setView('class')
  }, [userRole, myFacultyId, facultyId])

  useEffect(() => {
    if (!classId && classes.length > 0) setClassId(toId(classes[0]))
  }, [classId, classes])

  useEffect(() => {
    if (!facultyId && faculty.length > 0) {
      setFacultyId(myFacultyId || toId(faculty[0]))
    }
  }, [facultyId, faculty, myFacultyId])

  const selectedClass = useMemo(
    () => classes.find((item) => toId(item) === classId),
    [classes, classId]
  )
  const selectedFaculty = useMemo(
    () => faculty.find((item) => toId(item) === facultyId),
    [faculty, facultyId]
  )

  const normalizedSchedule = useMemo(() => {
    if (view === 'faculty') return normalizeSchedule(selectedFaculty?.routing || {})
    return normalizeSchedule(selectedClass?.timeTable || {})
  }, [view, selectedClass, selectedFaculty])

  const dayLectures = useMemo(() => {
    const out = {}
    DAY_ORDER.forEach((day) => {
      const dayMap = normalizedSchedule[day] || {}
      out[day] = FIXED_LECTURE_POSITIONS.map((position) => {
        const slotKey = String(position)
        return {
          slot: slotKey,
          lecture: dayMap[slotKey] || null
        }
      })
    })
    return out
  }, [normalizedSchedule])

  const getLectureByPosition = (day, position) => {
    const safeIndex = Math.max(0, position - 1)
    return (dayLectures[day] || [])[safeIndex] || null
  }

  const getSubjectName = (subjectId) => {
    const subject = subjectById[toId(subjectId)]
    return subject?.name || subject?.code || 'Subject'
  }

  const getFacultyName = (fid) => {
    const fac = facultyById[toId(fid)]
    return fac?.userId?.name || fac?.employeeNo || 'Faculty'
  }

  const getClassName = (cid) => {
    const cls = classById[toId(cid)]
    return cls?.name || 'Class'
  }

  const showViewSwitch = userRole === 'admin' || userRole === 'hod'
  const canEditGrid = userRole === 'admin' || userRole === 'hod'

  const upsertLectureByPosition = (schedule, day, position, lectureData) => {
    const dayMap = { ...(schedule[day] || {}) }
    const slotKey = String(position)

    if (lectureData) {
      dayMap[slotKey] = lectureData
      schedule[day] = dayMap
      return
    }

    if (dayMap[slotKey]) {
      delete dayMap[slotKey]
    }
    if (Object.keys(dayMap).length > 0) schedule[day] = dayMap
    else delete schedule[day]
  }

  const startEditCell = (day, position) => {
    if (!canEditGrid) return
    const cell = getLectureByPosition(day, position)
    const lecture = cell?.lecture || {}
    setEditTarget({ day, position })

    if (view === 'class') {
      setEditForm({
        subjectId: toId(lecture.subjectId),
        facultyId: toId(lecture.facultyId),
        classId: '',
      })
      return
    }

    setEditForm({
      subjectId: toId(lecture.subjectId),
      classId: toId(lecture.classId),
      facultyId: '',
    })
  }

  const cancelEdit = () => {
    setEditTarget(null)
    setEditForm({ subjectId: '', facultyId: '', classId: '' })
  }

  const refreshAfterSave = async () => {
    await Promise.all([refetchClasses(), refetchFaculty()])
  }

  const saveClassEdit = async (clearMode) => {
    if (!selectedClass || !editTarget) return
    if (!clearMode && (!editForm.subjectId || !editForm.facultyId)) {
      toast.error('Select both subject and faculty')
      return
    }

    const nextTimeTable = normalizeSchedule(selectedClass.timeTable || {})
    upsertLectureByPosition(
      nextTimeTable,
      editTarget.day,
      editTarget.position,
      clearMode ? null : { subjectId: editForm.subjectId, facultyId: editForm.facultyId }
    )

    setSaving(true)
    try {
      await classesApi.update(toId(selectedClass), { timeTable: nextTimeTable })
      await refreshAfterSave()
      toast.success('Timetable updated')
      cancelEdit()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update timetable')
    } finally {
      setSaving(false)
    }
  }

  const saveFacultyEdit = async (clearMode) => {
    if (!selectedFaculty || !editTarget) return
    const selectedFacultyId = toId(selectedFaculty)
    const currentCell = getLectureByPosition(editTarget.day, editTarget.position)
    const oldClassId = toId(currentCell?.lecture?.classId)
    const nextClassId = clearMode ? '' : toId(editForm.classId)
    const nextSubjectId = clearMode ? '' : toId(editForm.subjectId)

    if (!clearMode && (!nextClassId || !nextSubjectId)) {
      toast.error('Select both class and subject')
      return
    }

    const classIdsToUpdate = [...new Set([oldClassId, nextClassId].filter(Boolean))]
    if (classIdsToUpdate.length === 0) {
      cancelEdit()
      return
    }

    setSaving(true)
    try {
      for (const targetClassId of classIdsToUpdate) {
        const classDoc = classes.find((item) => toId(item) === targetClassId)
        if (!classDoc) continue

        const nextTimeTable = normalizeSchedule(classDoc.timeTable || {})

        if (targetClassId === oldClassId && (clearMode || oldClassId !== nextClassId)) {
          upsertLectureByPosition(nextTimeTable, editTarget.day, editTarget.position, null)
        }

        if (!clearMode && targetClassId === nextClassId) {
          upsertLectureByPosition(nextTimeTable, editTarget.day, editTarget.position, {
            subjectId: nextSubjectId,
            facultyId: selectedFacultyId
          })
        }

        await classesApi.update(targetClassId, { timeTable: nextTimeTable })
      }

      await refreshAfterSave()
      toast.success('Routing updated')
      cancelEdit()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update routing')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    if (view === 'class') return saveClassEdit(false)
    return saveFacultyEdit(false)
  }

  const handleClear = () => {
    if (view === 'class') return saveClassEdit(true)
    return saveFacultyEdit(true)
  }

  const renderLectureCell = (day, position) => {
    const cell = getLectureByPosition(day, position)
    const lecture = cell?.lecture || null
    const isActive = editTarget?.day === day && editTarget?.position === position

    if (!lecture) {
      return (
        <td key={`${day}-${position}`} className={styles.emptyCell}>
          <div className={styles.cellTop}>
            {canEditGrid && (
              <button className={styles.editCellBtn} onClick={() => startEditCell(day, position)}>Edit</button>
            )}
          </div>
          Free
        </td>
      )
    }

    const subjectName = getSubjectName(lecture.subjectId)
    const secondLine = view === 'class'
      ? getFacultyName(lecture.facultyId)
      : getClassName(lecture.classId)
    return (
      <td key={`${day}-${position}`} className={[styles.cell, isActive ? styles.activeEdit : ''].join(' ')}>
        <div className={styles.cellTop}>
          {canEditGrid && (
            <button className={styles.editCellBtn} onClick={() => startEditCell(day, position)}>Edit</button>
          )}
        </div>
        <div className={styles.subject}>{subjectName}</div>
        <div className={styles.meta}>{secondLine}</div>
      </td>
    )
  }

  return (
    <>
      <PageHeader
        title='Class & Faculty Timetable'
        subtitle='Select by class or faculty. Admin and HOD can create/update slots directly in this matrix.'
      />

      <Card className={styles.controlCard}>
        <div className={styles.controls}>
          {showViewSwitch && (
            <Input
              label='View'
              name='view'
              type='select'
              value={view}
              onChange={(_, value) => setView(value)}
              options={[
                { value: 'class', label: 'Class Timetable' },
                { value: 'faculty', label: 'Faculty Timetable' },
              ]}
            />
          )}

          {view === 'class' ? (
            <Input
              label='Class'
              name='classId'
              type='select'
              value={classId}
              onChange={(_, value) => setClassId(value)}
              options={classes.map((c) => ({ value: toId(c), label: `${c.name}${c.roomNo ? ` (${c.roomNo})` : ''}` }))}
            />
          ) : (
            <Input
              label='Faculty'
              name='facultyId'
              type='select'
              value={facultyId}
              onChange={(_, value) => setFacultyId(value)}
              options={faculty.map((f) => ({
                value: toId(f),
                label: `${f.userId?.name || f.employeeNo || 'Faculty'}${f.employeeNo ? ` (${f.employeeNo})` : ''}`
              }))}
            />
          )}
        </div>
      </Card>

      <Card className={styles.boardCard} padding={false}>
        {loading ? (
          <Spinner />
        ) : (
          <div className={styles.gridWrap}>
            <div className={styles.boardTitle}>
              {view === 'class'
                ? `Class : ${selectedClass?.name || '—'}`
                : `Faculty : ${selectedFaculty?.userId?.name || selectedFaculty?.employeeNo || '—'}`}
            </div>

            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th className={styles.corner}>#</th>
                  <th className={styles.slotHead}>1</th>
                  <th className={styles.slotHead}>2</th>
                  <th className={styles.slotHead}>3</th>
                  <th className={styles.breakHead}>BREAK</th>
                  <th className={styles.slotHead}>4</th>
                  <th className={styles.slotHead}>5</th>
                  <th className={styles.slotHead}>6</th>
                </tr>
              </thead>
              <tbody>
                {DAY_ORDER.map((day) => (
                  <tr key={day}>
                    <th className={styles.dayCell}>{DAY_LABEL[day]}</th>
                    {FIXED_LECTURE_POSITIONS.slice(0, 3).map((position) => renderLectureCell(day, position))}
                    <td className={styles.breakCell}>BREAK</td>
                    {FIXED_LECTURE_POSITIONS.slice(3).map((position) => renderLectureCell(day, position))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canEditGrid && editTarget && (
        <div className={styles.modalBackdrop} onClick={cancelEdit}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.editorTitle}>
                  Edit {DAY_LABEL[editTarget.day]} Lecture {editTarget.position}
                </div>
                <div className={styles.modalHint}>
                  {view === 'class'
                    ? `Class is auto-selected: ${selectedClass?.name || '—'}`
                    : `Faculty is auto-selected: ${selectedFaculty?.userId?.name || selectedFaculty?.employeeNo || '—'}`}
                </div>
              </div>
              <button className={styles.modalClose} onClick={cancelEdit} disabled={saving}>×</button>
            </div>

            <div className={styles.editorGrid}>
              <Input
                label='Subject'
                name='subjectId'
                type='select'
                value={editForm.subjectId}
                onChange={(_, value) => setEditForm((prev) => ({ ...prev, subjectId: value }))}
                options={subjects.map((s) => ({ value: toId(s), label: `${s.name}${s.code ? ` (${s.code})` : ''}` }))}
              />
              {view === 'class' ? (
                <Input
                  label='Faculty'
                  name='facultyId'
                  type='select'
                  value={editForm.facultyId}
                  onChange={(_, value) => setEditForm((prev) => ({ ...prev, facultyId: value }))}
                  options={faculty.map((f) => ({
                    value: toId(f),
                    label: `${f.userId?.name || f.employeeNo || 'Faculty'}${f.employeeNo ? ` (${f.employeeNo})` : ''}`
                  }))}
                />
              ) : (
                <Input
                  label='Class'
                  name='classId'
                  type='select'
                  value={editForm.classId}
                  onChange={(_, value) => setEditForm((prev) => ({ ...prev, classId: value }))}
                  options={classes.map((c) => ({ value: toId(c), label: `${c.name}${c.roomNo ? ` (${c.roomNo})` : ''}` }))}
                />
              )}
            </div>

            <div className={styles.editorActions}>
              <Button onClick={handleSave} loading={saving}>Create / Update</Button>
              <Button variant='danger' onClick={handleClear} disabled={saving}>Clear Slot</Button>
              <Button variant='secondary' onClick={cancelEdit} disabled={saving}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
