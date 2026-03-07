import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { classesApi } from '../../api/services'

function ClassForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Class Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Room No' name='roomNo' value={data.roomNo} onChange={onChange} />
      </div>
      <Input label='Department ID' name='departmentId' value={data.departmentId} onChange={onChange} />
      <Input label='Coordinator ID' name='coordinatorId' value={data.coordinatorId} onChange={onChange} />
    </>
  )
}

export default function ClassesPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Classes' icon='🏫' resource='classes' apiService={classesApi}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'roomNo', label: 'Room No' },
      ]}
      FormComponent={ClassForm} defaultValues={{}}
      canCreate={can('classes', 'create')}
      canEdit={can('classes', 'update')}
      canDelete={can('classes', 'delete')}
    />
  )
}
