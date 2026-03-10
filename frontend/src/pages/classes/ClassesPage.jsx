import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { classesApi, departmentsApi, facultyApi } from '../../api/services'

const toId = (value) => (value && typeof value === 'object' ? (value._id || value.id || '') : (value || ''))

function ClassForm({ data, onChange, departments, faculty }) {
  const selectedDepartmentId = toId(data.departmentId)
  const coordinatorOptions = faculty
    .filter((f) => toId(f.departmentId) === selectedDepartmentId)
    .map((f) => ({
      value: f._id || f.id,
      label: `${f.userId?.name || 'Unknown'} (${f.employeeNo || 'No Employee No'})`
    }))

  return (
    <>
      <div className='g2'>
        <Input label='Class Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Room No' name='roomNo' value={data.roomNo} onChange={onChange} />
      </div>

      <div className='g2'>
        <Input label='Semester' name='semester' type='number' value={data.semester} onChange={onChange} required />
        <Input
          label='Department'
          name='departmentId'
          type='select'
          value={selectedDepartmentId}
          onChange={onChange}
          options={departments.map((d) => ({ value: d._id || d.id, label: d.name }))}
          required
        />
      </div>

      <Input
        label='Coordinator'
        name='coordinatorId'
        type='select'
        value={toId(data.coordinatorId)}
        onChange={onChange}
        options={coordinatorOptions}
      />
    </>
  )
}

export default function ClassesPage() {
  const { can } = useAuth()
  const { data: departments = [] } = useList('departments', departmentsApi.getAll)
  const { data: faculty = [] } = useList('faculty', facultyApi.getAll)

  const mapClassPayload = (form) => {
    const departmentId = toId(form.departmentId)
    const coordinatorId = toId(form.coordinatorId)
    const coordinatorInDepartment = faculty.some(
      (f) => String(f._id || f.id) === String(coordinatorId) && String(toId(f.departmentId)) === String(departmentId)
    )

    return {
      name: form.name,
      roomNo: form.roomNo,
      semester: form.semester === '' || form.semester === undefined ? undefined : Number(form.semester),
      departmentId,
      coordinatorId: coordinatorInDepartment ? coordinatorId : undefined,
    }
  }

  return (
    <CrudPage
      title='Classes'
      icon='🏫'
      resource='classes'
      apiService={classesApi}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'roomNo', label: 'Room No' },
        { key: 'semester', label: 'Semester' },
        { key: 'departmentId', label: 'Department', render: (v) => v?.name || '—' },
        { key: 'coordinatorId', label: 'Coordinator', render: (v) => v?.userId?.name || v?.employeeNo || '—' },
      ]}
      FormComponent={(props) => <ClassForm {...props} departments={departments} faculty={faculty} />}
      defaultValues={{ name: '', roomNo: '', semester: '', departmentId: '', coordinatorId: '' }}
      mapCreatePayload={mapClassPayload}
      mapUpdatePayload={mapClassPayload}
      canCreate={can('classes', 'create')}
      canEdit={can('classes', 'update')}
      canDelete={can('classes', 'delete')}
    />
  )
}
