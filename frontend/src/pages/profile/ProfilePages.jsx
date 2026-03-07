// ── REGISTER PAGE & PROFILE PAGE ──────────────────────────────
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/services'
import { PageHeader, Card, Alert, Badge } from '../../components/ui/Misc'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import styles from './Profile.module.css'

function RegisterForm({ data, onChange }) {
  return (
    <>
      <div className='g2'>
        <Input label='Full Name' name='name' value={data.name} onChange={onChange} required />
        <Input label='Email' name='email' type='email' value={data.email} onChange={onChange} required />
      </div>
      <div className='g2'>
        <Input label='Password' name='password' type='password' value={data.password} onChange={onChange} required />
        <Input
          label='Role' name='role' type='select' value={data.role} onChange={onChange} required
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'hod', label: 'HOD' },
            { value: 'faculty', label: 'Faculty' },
            { value: 'student', label: 'Student' },
          ]}
        />
      </div>
      <div className='g2'>
        <Input label='Phone No' name='phoneNo' value={data.phoneNo} onChange={onChange} />
        <Input label='Date of Birth' name='dob' type='date' value={data.dob} onChange={onChange} />
      </div>
      <Input label='Aadhar No' name='aadharNo' value={data.aadharNo} onChange={onChange} />
    </>
  )
}

export function RegisterPage() {
  const { can } = useAuth()
  const [form, setForm] = useState({ role: 'student' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  // Only admins can register users
  if (!can('register', 'create')) {
    return (
      <>
        <PageHeader title='⛔ Access Denied' subtitle='You do not have permission to access this page' />
        <Card style={{ maxWidth: 600 }}>
          <Alert type='error' message='Only administrators can register new users.' />
        </Card>
      </>
    )
  }

  function setField(n, v) { setForm((p) => ({ ...p, [n]: v })) }

  async function submit(e) {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      await authApi.register(form)
      setMsg({ type: 'success', text: 'User created successfully!' })
      setForm({ role: 'student' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Registration failed' })
    } finally { setSaving(false) }
  }

  return (
    <>
      <PageHeader title='➕ Register User' subtitle='Admin only — create new user accounts' />
      <Card style={{ maxWidth: 600 }}>
        <Alert type={msg?.type} message={msg?.text} />
        <form onSubmit={submit}>
          <RegisterForm data={form} onChange={setField} />
          <Button type='submit' fullWidth loading={saving} style={{ marginTop: 8 }}>Create User</Button>
        </form>
      </Card>
    </>
  )
}

// ── PROFILE PAGE ──────────────────────────────────────────────
export function ProfilePage() {
  const { user } = useAuth()
  const fields = [
    ['Email', user?.email],
    ['Phone', user?.phoneNo],
    ['Aadhar No', user?.aadharNo],
    ['Date of Birth', user?.dob],
  ].filter(([, v]) => v)

  return (
    <>
      <PageHeader title='⚙️ My Profile' subtitle='Your account information' />
      <Card style={{ maxWidth: 460 }}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{(user?.name || 'U')[0].toUpperCase()}</div>
          <div>
            <div className={styles.name}>{user?.name}</div>
            <div className={styles.email}>{user?.email}</div>
            <div style={{ marginTop: 6 }}><Badge role={user?.role} /></div>
          </div>
        </div>
        {fields.map(([k, v]) => (
          <div key={k} className={styles.row}>
            <span className={styles.key}>{k}</span>
            <span className={styles.val}>{v}</span>
          </div>
        ))}
      </Card>
    </>
  )
}
