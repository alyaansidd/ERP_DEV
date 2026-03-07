// ── DEPARTMENTS ───────────────────────────────────────────────
import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { departmentsApi } from '../../api/services'

function DeptForm({ data, onChange }) {
  return <Input label='Department Name' name='name' value={data.name} onChange={onChange} required />
}

export default function DepartmentsPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Departments' icon='🏛️' resource='departments' apiService={departmentsApi}
      columns={[{ key: 'name', label: 'Name' }]}
      FormComponent={DeptForm} defaultValues={{}}
      canCreate={can('departments', 'create')}
      canEdit={can('departments', 'update')}
      canDelete={can('departments', 'delete')}
    />
  )
}
