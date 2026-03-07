import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { academicYearsApi } from '../../api/services'

function AcYrForm({ data, onChange }) {
  return <Input label='Year (e.g. 2024-25)' name='year' value={data.year} onChange={onChange} required />
}

export default function AcademicYearsPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Academic Years' icon='📅' resource='academic-years' apiService={academicYearsApi}
      columns={[{ key: 'year', label: 'Year' }]}
      FormComponent={AcYrForm} defaultValues={{}}
      canCreate={can('academic-years', 'create')}
      canEdit={can('academic-years', 'update')}
      canDelete={can('academic-years', 'delete')}
    />
  )
}
