import { useAuth } from '../../context/AuthContext'
import { useList } from '../../hooks/useCrud'
import CrudPage from '../../components/ui/CrudPage'
import Input from '../../components/ui/Input'
import { facultyApi, departmentsApi } from '../../api/services'

const toId = (value) => (value && typeof value === 'object' ? (value._id || value.id || '') : (value || ''))

function countRoutingSlots(routing) {
  return Object.values(routing || {}).reduce(
    (count, dayMap) => count + Object.keys(dayMap || {}).length,
    0
  )
}

function FacultyForm({ data, onChange, departments }) {
  const isEdit = Boolean(data._id || data.id)

  return (
    <>
      {!isEdit && (
        <>
          <div className='g2'>
            <Input label='Full Name' name='userName' value={data.userName} onChange={onChange} required />
            <Input label='Email' name='userEmail' type='email' value={data.userEmail} onChange={onChange} required />
          </div>
          <div className='g2'>
            <Input label='Password' name='userPassword' type='password' value={data.userPassword} onChange={onChange} required />
            <Input label='Phone No' name='userPhoneNo' value={data.userPhoneNo} onChange={onChange} required />
          </div>
          <div className='g2'>
            <Input label='Aadhar No' name='userAadharNo' value={data.userAadharNo} onChange={onChange} required />
            <Input label='Date of Birth' name='userDob' type='date' value={data.userDob} onChange={onChange} required />
          </div>
        </>
      )}

      <div className='g2'>
        <Input label='Employee No' name='employeeNo' value={data.employeeNo} onChange={onChange} required />
        <Input label='Designation' name='designation' value={data.designation} onChange={onChange} required />
      </div>

      <div className='g2'>
        <Input
          label='Department'
          name='departmentId'
          type='select'
          value={toId(data.departmentId)}
          onChange={onChange}
          options={departments.map((d) => ({ value: d._id || d.id, label: d.name }))}
          required
        />
      </div>

      <div className='g2'>
        <Input label='Joining Date' name='joiningDate' type='date' value={data.joiningDate} onChange={onChange} required />
      </div>
    </>
  )
}

export default function FacultyPage() {
  const { can, user } = useAuth()
  const { data: departments = [] } = useList('departments', departmentsApi.getAll)
  const FormComponent = (props) => <FacultyForm {...props} departments={departments} />
  const isFacultyView = user?.role === 'faculty'

  return (
    <CrudPage
      title={isFacultyView ? 'My Faculty Profile' : 'Faculty'}
      icon='Faculty'
      resource='faculty'
      apiService={facultyApi}
      columns={[
        { key: 'userId', label: 'Name', render: (v) => v?.name || '-' },
        { key: 'employeeNo', label: 'Employee No' },
        { key: 'designation', label: 'Designation' },
        { key: 'departmentId', label: 'Department', render: (v) => v?.name || '-' },
        { key: 'joiningDate', label: 'Joining Date', render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
        { key: 'routing', label: 'Routing Slots', render: (v) => countRoutingSlots(v) },
      ]}
      FormComponent={FormComponent}
      defaultValues={{
        userName: '',
        userEmail: '',
        userPassword: '',
        userPhoneNo: '',
        userAadharNo: '',
        userDob: '',
        employeeNo: '',
        designation: '',
        departmentId: '',
        joiningDate: '',
      }}
      mapCreatePayload={(form) => ({
        name: form.userName,
        phoneNo: form.userPhoneNo,
        aadharNo: form.userAadharNo,
        dob: form.userDob,
        email: form.userEmail,
        password: form.userPassword,
        employeeNo: form.employeeNo,
        designation: form.designation,
        departmentId: toId(form.departmentId),
        joiningDate: form.joiningDate,
      })}
      mapUpdatePayload={(form) => ({
        employeeNo: form.employeeNo,
        designation: form.designation,
        departmentId: toId(form.departmentId),
        joiningDate: form.joiningDate,
      })}
      canCreate={can('faculty', 'create')}
      canEdit={can('faculty', 'update') && !isFacultyView}
      canDelete={can('faculty', 'delete')}
    />
  )
}
