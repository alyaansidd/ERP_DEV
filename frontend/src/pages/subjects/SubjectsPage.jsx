import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { subjectsApi } from '../../api/services'

function SubjectForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Subject Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Subject Code' name='subjectCode' value={data.subjectCode} onChange={onChange} required />
      </div>
      <Input label='Credits' name='credit' type='number' value={data.credit} onChange={onChange} />
    </>
  )
}

export default function SubjectsPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Subjects' icon='📝' resource='subjects' apiService={subjectsApi}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'subjectCode', label: 'Code' },
        { key: 'credit', label: 'Credits' },
      ]}
      FormComponent={SubjectForm} defaultValues={{}}
      canCreate={can('subjects', 'create')}
      canEdit={can('subjects', 'update')}
      canDelete={can('subjects', 'delete')}
    />
  )
}
