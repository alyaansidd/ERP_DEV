// ── COURSES ───────────────────────────────────────────────────
import { useAuth } from '../../context/AuthContext'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { coursesApi } from '../../api/services'

function CourseForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Course Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Code' name='code' value={data.code} onChange={onChange} required />
      </div>
      <div className='g2'>
        <Input label='Semester' name='semester' value={data.semester} onChange={onChange} />
        <Input label='Credits' name='credits' type='number' value={data.credits} onChange={onChange} />
      </div>
      <Input label='Department' name='department' value={data.department} onChange={onChange} />
    </>
  )
}

export default function CoursesPage() {
  const { can } = useAuth()
  return (
    <CrudPage
      title='Courses' icon='📚' resource='courses' apiService={coursesApi}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'semester', label: 'Semester' },
        { key: 'credits', label: 'Credits' },
      ]}
      FormComponent={CourseForm} defaultValues={{}}
      canCreate={can('courses', 'create')}
      canEdit={can('courses', 'update')}
      canDelete={can('courses', 'delete')}
    />
  )
}
