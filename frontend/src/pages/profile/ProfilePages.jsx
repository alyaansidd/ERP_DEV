import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authApi, facultyApi } from '../../api/services'
import { useList } from '../../hooks/useCrud'
import { PageHeader, Card, Alert, Badge } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import styles from './Profile.module.css'

function getRegisterErrorState(err) {
  const response = err?.response?.data
  const apiErrors = Array.isArray(response?.errors) ? response.errors : []
  const fieldErrors = apiErrors.reduce((acc, { field, message }) => {
    if (field && message && !acc[field]) acc[field] = message
    return acc
  }, {})

  const conflictMessage = String(response?.message || '')
  if (conflictMessage.includes('email already exists')) fieldErrors.email ||= conflictMessage
  if (conflictMessage.includes('phone number already exists')) fieldErrors.phoneNo ||= conflictMessage
  if (conflictMessage.includes('Aadhar number already exists')) fieldErrors.aadharNo ||= conflictMessage

  const summary = apiErrors.length > 0
    ? apiErrors.map(({ message }) => message).join(' ')
    : conflictMessage || 'Registration failed'

  return { summary, fieldErrors }
}

function RegisterForm({ data, errors, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Full Name' name='name' value={data.name} onChange={onChange} error={errors.name} required />
        <Input label='Email' name='email' type='email' value={data.email} onChange={onChange} error={errors.email} required />
      </div>
      <div className='g2'>
        <Input label='Password' name='password' type='password' value={data.password} onChange={onChange} error={errors.password} required />
        <Input
          label='Role'
          name='role'
          type='select'
          value={data.role}
          onChange={onChange}
          error={errors.role}
          required
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'hod', label: 'HOD' },
            { value: 'faculty', label: 'Faculty' },
            { value: 'student', label: 'Student' },
          ]}
        />
      </div>
      <div className='g2'>
        <Input label='Phone No' name='phoneNo' value={data.phoneNo} onChange={onChange} error={errors.phoneNo} required />
        <Input label='Date of Birth' name='dob' type='date' value={data.dob} onChange={onChange} error={errors.dob} required />
      </div>
      <Input label='Aadhar No' name='aadharNo' value={data.aadharNo} onChange={onChange} error={errors.aadharNo} required />
    </>
  )
}

export function RegisterPage() {
  const { can } = useAuth()
  const [form, setForm] = useState({ role: 'student' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [errors, setErrors] = useState({})

  if (!can('register', 'create')) {
    return (
      <>
        <PageHeader title='Access Denied' subtitle='You do not have permission to access this page' />
        <Card style={{ maxWidth: 600 }}>
          <Alert type='error' message='Only administrators can register new users.' />
        </Card>
      </>
    )
  }

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      return { ...prev, [name]: null }
    })
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    setErrors({})

    try {
      await authApi.register(form)
      setMsg({ type: 'success', text: 'User created successfully!' })
      setForm({ role: 'student' })
    } catch (err) {
      const { summary, fieldErrors } = getRegisterErrorState(err)
      setErrors(fieldErrors)
      setMsg({ type: 'error', text: summary })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title='Register User' subtitle='Admin only - create new user accounts' />
      <Card style={{ maxWidth: 600 }}>
        <Alert type={msg?.type} message={msg?.text} />
        <form onSubmit={submit}>
          <RegisterForm data={form} errors={errors} onChange={setField} />
          <Button type='submit' fullWidth loading={saving} style={{ marginTop: 8 }}>Create User</Button>
        </form>
      </Card>
    </>
  )
}

export function ProfilePage() {
  const { user } = useAuth()
  const { data: faculty = [] } = useList('faculty', facultyApi.getAll)
  const myFacultyProfile = faculty[0] || null
  const fields = [
    ['Email', user?.email],
    ['Phone', user?.phoneNo],
    ['Aadhar No', user?.aadharNo],
    ['Date of Birth', user?.dob],
  ].filter(([, value]) => value)

  return (
    <>
      <PageHeader title='My Profile' subtitle='Your account information' />
      <Card style={{ maxWidth: 460 }}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{(user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div className={styles.name}>{user?.name}</div>
            <div className={styles.email}>{user?.email}</div>
            <div style={{ marginTop: 6 }}><Badge role={user?.role} /></div>
          </div>
        </div>
        {fields.map(([key, value]) => (
          <div key={key} className={styles.row}>
            <span className={styles.key}>{key}</span>
            <span className={styles.val}>{value}</span>
          </div>
        ))}
        {myFacultyProfile && (
          <>
            <div className={styles.row}>
              <span className={styles.key}>Employee No</span>
              <span className={styles.val}>{myFacultyProfile.employeeNo || '-'}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Designation</span>
              <span className={styles.val}>{myFacultyProfile.designation || '-'}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Department</span>
              <span className={styles.val}>{myFacultyProfile.departmentId?.name || '-'}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.key}>Joining Date</span>
              <span className={styles.val}>{myFacultyProfile.joiningDate ? new Date(myFacultyProfile.joiningDate).toLocaleDateString() : '-'}</span>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
