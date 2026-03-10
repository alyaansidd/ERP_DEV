import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { studentsApi, departmentsApi, classesApi, coursesApi } from '../../api/services'

const toId = (value) => (value && typeof value === 'object' ? (value._id || value.id || '') : (value || ''))

function StudentForm({ data, onChange, departments, classes, courses }) {
  const isEdit = Boolean(data._id || data.id)
  const selectedDepartmentId = toId(data.departmentId)
  const classOptions = classes
    .filter((c) => toId(c.departmentId) === selectedDepartmentId)
    .map((c) => ({ value: c._id || c.id, label: c.name }))
  const courseOptions = courses
    .filter((c) => toId(c.department) === selectedDepartmentId)
    .map((c) => ({ value: c._id || c.id, label: `${c.name} (${c.code})` }))

  return (
    <>
      <div className='g2'>
        <Input label='Name' name='name' value={data.name ?? data.userId?.name} onChange={onChange} required />
        <Input label='Email' name='email' type='email' value={data.email ?? data.userId?.email} onChange={onChange} required />
      </div>

      <div className='g2'>
        <Input label='Phone No' name='phoneNo' value={data.phoneNo ?? data.userId?.phoneNo} onChange={onChange} required />
        <Input label='Aadhar No' name='aadharNo' value={data.aadharNo ?? ''} onChange={onChange} required />
      </div>

      <div className='g2'>
        <Input label='Date of Birth' name='dob' type='date' value={data.dob ?? ''} onChange={onChange} required />
        <Input label='Password' name='password' type='password' value={data.password ?? ''} onChange={onChange} required={!isEdit} />
      </div>

      <div className='g2'>
        <Input label='Roll No' name='rollNo' value={data.rollNo} onChange={onChange} required />
        <Input label="Father's Name" name='fatherName' value={data.fatherName} onChange={onChange} required />
      </div>

      <div className='g2'>
        <Input label="Father's Phone No" name='fatherNo' value={data.fatherNo} onChange={onChange} />
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

      <div className='g2'>
        <Input
          label='Class'
          name='classId'
          type='select'
          value={toId(data.classId)}
          onChange={onChange}
          options={classOptions}
          required
        />
        <Input
          label='Program (Course)'
          name='program'
          type='select'
          value={toId(data.program)}
          onChange={onChange}
          options={courseOptions}
          required
        />
      </div>
    </>
  )
}

export default function StudentsPage() {
  const { can } = useAuth()
  const { data: departments = [] } = useList('departments', departmentsApi.getAll)
  const { data: classes = [] } = useList('classes', classesApi.getAll)
  const { data: courses = [] } = useList('courses', coursesApi.getAll)

  const mapCreatePayload = (form) => ({
    name: form.name,
    phoneNo: form.phoneNo,
    aadharNo: form.aadharNo,
    dob: form.dob,
    email: form.email,
    password: form.password,
    rollNo: form.rollNo,
    fatherName: form.fatherName,
    fatherNo: form.fatherNo,
    departmentId: toId(form.departmentId),
    classId: toId(form.classId),
    program: toId(form.program),
  })

  const mapUpdatePayload = (form) => {
    const payload = {
      name: form.name,
      phoneNo: form.phoneNo,
      aadharNo: form.aadharNo,
      dob: form.dob,
      email: form.email,
      rollNo: form.rollNo,
      fatherName: form.fatherName,
      fatherNo: form.fatherNo,
      departmentId: toId(form.departmentId),
      classId: toId(form.classId),
      program: toId(form.program),
    }

    if (form.password) {
      payload.password = form.password
    }

    return payload
  }

  return (
    <CrudPage
      title='Students'
      icon='👨‍🎓'
      resource='students'
      apiService={studentsApi}
      columns={[
        { key: 'userId', label: 'Name', render: (v) => v?.name || '—' },
        { key: 'rollNo', label: 'Roll No' },
        { key: 'departmentId', label: 'Department', render: (v) => v?.name || '—' },
        { key: 'classId', label: 'Class', render: (v) => v?.name || '—' },
        { key: 'program', label: 'Program', render: (v) => v?.name || v?.code || '—' },
      ]}
      FormComponent={(props) => (
        <StudentForm
          {...props}
          departments={departments}
          classes={classes}
          courses={courses}
        />
      )}
      defaultValues={{
        name: '',
        phoneNo: '',
        aadharNo: '',
        dob: '',
        email: '',
        password: '',
        rollNo: '',
        fatherName: '',
        fatherNo: '',
        departmentId: '',
        classId: '',
        program: '',
      }}
      mapCreatePayload={mapCreatePayload}
      mapUpdatePayload={mapUpdatePayload}
      canCreate={can('students', 'create')}
      canEdit={can('students', 'update')}
      canDelete={can('students', 'delete')}
    />
  )
}
