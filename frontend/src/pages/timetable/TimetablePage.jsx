import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { timetableApi } from '../../api/services'

function TimetableForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Day' name='day' type='select' value={data.day} onChange={onChange} required
          options={[
            { value: 'Monday', label: 'Monday' },
            { value: 'Tuesday', label: 'Tuesday' },
            { value: 'Wednesday', label: 'Wednesday' },
            { value: 'Thursday', label: 'Thursday' },
            { value: 'Friday', label: 'Friday' },
            { value: 'Saturday', label: 'Saturday' },
          ]}
        />
        <Input label='Time Slot' name='timeSlot' value={data.timeSlot} onChange={onChange} required />
      </div>
      <div className='g2'>
        <Input label='Class ID' name='classId' value={data.classId} onChange={onChange} required />
        <Input label='Subject ID' name='subjectId' value={data.subjectId} onChange={onChange} required />
      </div>
      <Input label='Faculty ID' name='facultyId' value={data.facultyId} onChange={onChange} required />
      <Input label='Room No' name='roomNo' value={data.roomNo} onChange={onChange} />
    </>
  )
}

export default function TimetablePage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Timetable' icon='📅' resource='timetable' apiService={timetableApi}
      columns={[
        { key: 'day', label: 'Day' },
        { key: 'timeSlot', label: 'Time Slot' },
        { key: 'subjectId', label: 'Subject', render: (v) => v?.name || v || '—' },
        { key: 'facultyId', label: 'Faculty', render: (v) => v?.name || v || '—' },
        { key: 'roomNo', label: 'Room' },
      ]}
      FormComponent={TimetableForm} defaultValues={{ day: 'Monday' }}
      canCreate={can('timetable', 'create')}
      canEdit={can('timetable', 'update')}
      canDelete={can('timetable', 'delete')}
    />
  )
}
