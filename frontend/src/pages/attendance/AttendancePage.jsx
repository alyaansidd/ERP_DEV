import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import { classesApi, subjectsApi, attendanceApi } from '../../api/services'
import { PageHeader, Card, CardHeader, Empty, Spinner, Alert } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import styles from './Attendance.module.css'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const { can } = useAuth()
  const { data: classes = [] } = useList('classes', classesApi.getAll)
  const { data: subjects = [] } = useList('subjects', subjectsApi.getAll)

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [record, setRecord] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!classId) { setStudents([]); return }
    setLoading(true)
    classesApi.getById(classId).then(({ data }) => {
      const cls = data.class || data
      const ids = cls.studentIds || []
      if (!ids.length) { setStudents([]); setLoading(false); return }
      Promise.all(ids.map((id) => import('../../api/services').then(m => m.studentsApi.getById(id))))
        .then((res) => { setStudents(res.map((r) => r.data.student || r.data)); setRecord({}) })
        .catch(() => setStudents([]))
        .finally(() => setLoading(false))
    }).catch(() => setLoading(false))
  }, [classId])

  function toggle(id, status) { setRecord((p) => ({ ...p, [id]: status })) }

  async function submit() {
    if (!classId) { toast.error('Select a class first'); return }
    setSaving(true)
    const rec = students.map((s) => ({ studentId: s._id || s.id, status: record[s._id || s.id] || 'A' }))
    try {
      await attendanceApi.create({ classId, subjectId, date, record: rec })
      toast.success('Attendance saved!')
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title='✅ Attendance' subtitle='Mark daily attendance by class and subject' />

      <Card style={{ marginBottom: 16 }}>
        <div className='g2'>
          <Input
            label='Class' name='classId' type='select' value={classId}
            onChange={(_, v) => setClassId(v)}
            options={classes.map((c) => ({ value: c._id || c.id, label: c.name }))}
          />
          <Input
            label='Subject' name='subjectId' type='select' value={subjectId}
            onChange={(_, v) => setSubjectId(v)}
            options={subjects.map((s) => ({ value: s._id || s.id, label: s.name }))}
          />
        </div>
        <Input label='Date' name='date' type='date' value={date} onChange={(_, v) => setDate(v)} />
      </Card>

      {classId && (
        <Card>
          <CardHeader title={`Students${students.length ? ` (${students.length})` : ''}`}>
            {students.length > 0 && can('attendance', 'create') && (
              <Button loading={saving} onClick={submit}>Save Attendance</Button>
            )}
          </CardHeader>

          {loading ? <Spinner /> :
            students.length === 0 ? <Empty icon='👤' title='No students in this class' /> :
            students.map((s) => {
              const id = s._id || s.id
              const st = record[id]
              return (
                <div key={id} className={styles.row}>
                  <div>
                    <div className={styles.sName}>{s.userId?.name || `Roll: ${s.rollNo || '—'}`}</div>
                    <div className={styles.sInfo}>{s.rollNo && `Roll: ${s.rollNo}`}{s.program && ` · ${s.program?.name || s.program?.code || s.program}`}</div>
                  </div>
                  <div className={styles.toggle}>
                    <button className={[styles.pBtn, st === 'P' ? styles.pOn : ''].join(' ')} onClick={() => toggle(id, 'P')}>P</button>
                    <button className={[styles.aBtn, st === 'A' ? styles.aOn : ''].join(' ')} onClick={() => toggle(id, 'A')}>A</button>
                  </div>
                </div>
              )
            })
          }
        </Card>
      )}
    </>
  )
}
