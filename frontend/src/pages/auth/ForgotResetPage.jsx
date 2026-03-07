import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/services'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { Alert } from '../../components/ui/Misc'
import styles from './Auth.module.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handle(e) {
    e.preventDefault(); setLoading(true); setError('')
    try { await authApi.forgotPassword({ email }); setSent(true) }
    catch (err) { setError(err.response?.data?.message || 'Request failed') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Campus ERP</div>
        <h2 className={styles.heading}>Reset Password</h2>
        <p className={styles.sub}>Enter your email and we'll send an OTP</p>

        {sent
          ? <Alert type='success' message='OTP sent! Check your inbox.' />
          : (
            <form onSubmit={handle}>
              <Alert type='error' message={error} />
              <Input label='Email' name='email' type='email' value={email}
                onChange={(_, v) => setEmail(v)} placeholder='you@institution.edu' required />
              <Button type='submit' fullWidth loading={loading}>Send OTP</Button>
            </form>
          )}

        <Link to='/login' className={styles.back}>← Back to login</Link>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function set(name, value) { setForm((p) => ({ ...p, [name]: value })) }

  async function handle(e) {
    e.preventDefault(); setLoading(true); setError('')
    try { await authApi.resetPassword(form); setDone(true) }
    catch (err) { setError(err.response?.data?.message || 'Reset failed') }
    finally { setLoading(false) }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.logo}>Campus ERP</div>
        <h2 className={styles.heading}>New Password</h2>
        <p className={styles.sub}>Enter the OTP you received and your new password</p>

        {done ? (
          <>
            <Alert type='success' message='Password updated successfully!' />
            <Link to='/login'><Button fullWidth>Go to Login</Button></Link>
          </>
        ) : (
          <form onSubmit={handle}>
            <Alert type='error' message={error} />
            <Input label='Email' name='email' type='email' value={form.email} onChange={set} required />
            <Input label='OTP Code' name='otp' value={form.otp} onChange={set} placeholder='6-digit code' required />
            <Input label='New Password' name='newPassword' type='password' value={form.newPassword} onChange={set} required />
            <Button type='submit' fullWidth loading={loading}>Reset Password</Button>
          </form>
        )}

        <Link to='/login' className={styles.back}>← Back to login</Link>
      </div>
    </div>
  )
}
