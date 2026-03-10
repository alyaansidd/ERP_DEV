import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { coursesApi, departmentsApi } from '../../api/services'

function CourseForm({ data, onChange, departments }) {
  const departmentValue = typeof data.department === 'object'
    ? (data.department?._id || data.department?.id || '')
    : (data.department || '')

  return (
    <>
      <div className='g2'>
        <Input label='Course Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Code' name='code' value={data.code} onChange={onChange} required />
      </div>
      <div className='g2'>
        <Input label='Semester' name='semester' type='number' value={data.semester} onChange={onChange} required />
        <Input label='Credits' name='credits' type='number' value={data.credits} onChange={onChange} required />
      </div>
      <Input
        label='Department'
        name='department'
        type='select'
        value={departmentValue}
        onChange={onChange}
        options={departments.map((d) => ({ value: d._id || d.id, label: d.name }))}
        required
      />
    </>
  )
}

export default function CoursesPage() {
  const { can } = useAuth()
  const { data: departments = [] } = useList('departments', departmentsApi.getAll)

  const mapCoursePayload = (form) => ({
    name: form.name,
    code: form.code,
    semester: form.semester === '' || form.semester === undefined ? undefined : Number(form.semester),
    credits: form.credits === '' || form.credits === undefined ? undefined : Number(form.credits),
    department: typeof form.department === 'object'
      ? (form.department?._id || form.department?.id)
      : form.department,
  })

  return (
    <CrudPage
      title='Courses'
      icon='📚'
      resource='courses'
      apiService={coursesApi}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code' },
        { key: 'department', label: 'Department', render: (v) => v?.name || '—' },
        { key: 'semester', label: 'Semester' },
        { key: 'credits', label: 'Credits' },
      ]}
      FormComponent={(props) => <CourseForm {...props} departments={departments} />}
      defaultValues={{ name: '', code: '', semester: '', credits: '', department: '' }}
      mapCreatePayload={mapCoursePayload}
      mapUpdatePayload={mapCoursePayload}
      canCreate={can('courses', 'create')}
      canEdit={can('courses', 'update')}
      canDelete={can('courses', 'delete')}
    />
  )
}
