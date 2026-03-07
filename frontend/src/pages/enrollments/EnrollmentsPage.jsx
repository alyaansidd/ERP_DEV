import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { enrollmentsApi } from '../../api/services'

function EnrollmentForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Student ID' name='studentId' value={data.studentId} onChange={onChange} required />
        <Input label='Class ID' name='classId' value={data.classId} onChange={onChange} required />
      </div>
      <div className='g2'>
        <Input label='Academic Year ID' name='academicYearId' value={data.academicYearId} onChange={onChange} />
        <Input label='Enrollment Date' name='enrollmentDate' type='date' value={data.enrollmentDate} onChange={onChange} />
      </div>
      <Input
        label='Status' name='status' type='select' value={data.status} onChange={onChange}
        options={[
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'withdrawn', label: 'Withdrawn' },
        ]}
      />
    </>
  )
}

export default function EnrollmentsPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Enrollments' icon='📋' resource='enrollments' apiService={enrollmentsApi}
      columns={[
        { key: 'studentId', label: 'Student', render: (v) => v?.name || v?.rollNo || v || '—' },
        { key: 'classId', label: 'Class', render: (v) => v?.name || v || '—' },
        { key: 'status', label: 'Status' },
        { key: 'enrollmentDate', label: 'Enrollment Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
      ]}
      FormComponent={EnrollmentForm} defaultValues={{ status: 'active' }}
      canCreate={can('enrollments', 'create')}
      canEdit={can('enrollments', 'update')}
      canDelete={can('enrollments', 'delete')}
    />
  )
}
