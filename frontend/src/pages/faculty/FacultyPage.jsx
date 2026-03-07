import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { facultyApi } from '../../api/services'

function FacultyForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Employee No' name='employeeNo' value={data.employeeNo} onChange={onChange} />
        <Input label='Designation' name='designation' value={data.designation} onChange={onChange} />
      </div>
      <Input label='Department ID' name='departmentId' value={data.departmentId} onChange={onChange} />
      <Input label='Joining Date' name='joiningDate' type='date' value={data.joiningDate} onChange={onChange} />
    </>
  )
}

export default function FacultyPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Faculty' icon='👩‍🏫' resource='faculty' apiService={facultyApi}
      columns={[
        { key: 'employeeNo', label: 'Employee No' },
        { key: 'designation', label: 'Designation' },
        { key: 'joiningDate', label: 'Joining Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
      ]}
      FormComponent={FacultyForm} defaultValues={{}}
      canCreate={can('faculty', 'create')}
      canEdit={can('faculty', 'update')}
      canDelete={can('faculty', 'delete')}
    />
  )
}
