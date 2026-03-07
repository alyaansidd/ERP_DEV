import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { studentsApi } from '../../api/services'

function StudentForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Roll No' name='rollNo' value={data.rollNo} onChange={onChange} required />
        <Input label='Program' name='program' value={data.program} onChange={onChange} />
      </div>
      <div className='g2'>
        <Input label="Father's Name" name='fatherName' value={data.fatherName} onChange={onChange} />
        <Input label="Father's Phone" name='fatherNo' value={data.fatherNo} onChange={onChange} />
      </div>
      <Input label='Class ID' name='classId' value={data.classId} onChange={onChange} />
      <Input label='Department ID' name='departmentId' value={data.departmentId} onChange={onChange} />
    </>
  )
}

export default function StudentsPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Students' icon='👨‍🎓' resource='students' apiService={studentsApi}
      columns={[
        { key: 'rollNo', label: 'Roll No' },
        { key: 'program', label: 'Program' },
        { key: 'fatherName', label: "Father's Name" },
      ]}
      FormComponent={StudentForm} defaultValues={{}}
      canCreate={can('students', 'create')}
      canEdit={can('students', 'update')}
      canDelete={can('students', 'delete')}
    />
  )
}
