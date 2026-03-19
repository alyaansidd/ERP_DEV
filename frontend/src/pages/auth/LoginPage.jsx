import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Alert } from '../../components/ui/Misc'
import styles from './Auth.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(name, value) { setForm((p) => ({ ...p, [name]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Campus ERP</div>
        <div className={styles.logoSub}>Institutional Management System</div>

        <h2 className={styles.heading}>Welcome back</h2>
        <p className={styles.sub}>Sign in to access your portal</p>

        <Alert type='error' message={error} />

        <form onSubmit={handleSubmit}>
          <Input label='Email Address' name='email' type='email' value={form.email}
            onChange={set} placeholder='you@institution.edu' required />
          <Input label='Password' name='password' type='password' value={form.password}
            onChange={set} placeholder='••••••••' required />

          <div className={styles.forgotRow}>
            <Link to='/forgot-password' className={styles.forgot}>Forgot password?</Link>
          </div>

          <Button type='submit' fullWidth loading={loading}>Sign In</Button>
        </form>

        <div className={styles.hint}>
          <div className={styles.hintTitle}>🧪 Test Credentials (no backend needed)</div>
          <table className={styles.credTable}>
            <thead>
              <tr><th>Role</th><th>Email</th><th>Password</th></tr>
            </thead>
            <tbody>
              <tr><td>Admin</td><td>test.admin01@example.com</td><td>pass@123</td></tr>
              <tr><td>HOD</td><td>test.hod@example.com</td><td>pass123</td></tr>
              <tr><td>Faculty</td><td>faculty3@example.com</td><td>pass123</td></tr>
              <tr><td>Student</td><td>test.student1@example.com</td><td>pass123</td></tr>
            </tbody>
          </table>
          <div className={styles.hintSub}>Replace with your real backend at <code>http://localhost:5000</code></div>
        </div>
      </div>
    </div>
  )
}
