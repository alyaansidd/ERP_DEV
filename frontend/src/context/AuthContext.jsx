import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/services'
import {
  setAccessToken, setRefreshToken,
  clearTokens, getRefreshToken,
} from '../api/client'

const AuthContext = createContext(null)

// ── MOCK USERS (remove once real backend is connected) ────────
const MOCK_USERS = {
  'admin@campus.com':   { password: 'admin123',   user: { id: '1', name: 'Arjun Sharma',   email: 'admin@campus.com',   role: 'admin',   phoneNo: '9876543210', dob: '1985-06-15' } },
  'hod@campus.com':     { password: 'hod123',     user: { id: '2', name: 'Priya Mehta',    email: 'hod@campus.com',     role: 'hod',     phoneNo: '9876543211', dob: '1978-03-22' } },
  'faculty@campus.com': { password: 'faculty123', user: { id: '3', name: 'Rahul Verma',    email: 'faculty@campus.com', role: 'faculty', phoneNo: '9876543212', dob: '1990-09-10' } },
  'student@campus.com': { password: 'student123', user: { id: '4', name: 'Sneha Patel',    email: 'student@campus.com', role: 'student', phoneNo: '9876543213', dob: '2002-11-05' } },
}

const MOCK_TOKEN = 'mock-token-for-ui-testing'
const MOCK_SESSION_KEY = 'mock_user'

function mockLogin(email, password) {
  const entry = MOCK_USERS[email]
  if (!entry || entry.password !== password) throw new Error('Invalid email or password')
  return entry.user
}

function isMockSession() {
  return localStorage.getItem(MOCK_SESSION_KEY) !== null
}

function saveMockSession(user) {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user))
}

function loadMockSession() {
  try { return JSON.parse(localStorage.getItem(MOCK_SESSION_KEY)) } catch { return null }
}

function clearMockSession() {
  localStorage.removeItem(MOCK_SESSION_KEY)
}

// RBAC permission map - Matches Route Access Matrix exactly
const PERMISSIONS = {
  // Auth
  register:         { read: ['admin','hod','faculty','student'], create: ['admin'] },
  
  // Resources
  departments:      { read: ['admin','hod','faculty','student'], create: ['admin'],             update: ['admin','hod'],              delete: ['admin'] },
  faculty:          { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod','faculty'],   delete: ['admin'] },
  students:         { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod','faculty'],   delete: ['admin'] },
  courses:          { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod'],              delete: ['admin'] },
  subjects:         { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod'],              delete: ['admin'] },
  classes:          { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod'],              delete: ['admin'] },
  attendance:       { read: ['admin','hod','faculty','student'], create: ['admin','hod','faculty'], update: ['admin','hod','faculty'], delete: ['admin','hod'] },
  timetable:        { read: ['admin','hod','faculty','student'], create: ['admin','hod'],        update: ['admin','hod'],              delete: ['admin'] },
  'academic-years': { read: ['admin','hod','faculty','student'], create: ['admin'],             update: ['admin'],                    delete: ['admin'] },
  notices:          { read: ['admin','hod','faculty','student'], create: ['admin','hod','faculty'], update: ['admin','hod','faculty'], delete: ['admin','hod'] },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap — restore session (mock or real)
  useEffect(() => {
    // 1. Check mock session first
    if (isMockSession()) {
      const u = loadMockSession()
      if (u) { setUser(u); setLoading(false); return }
    }
    // 2. Try real backend session
    const rt = getRefreshToken()
    if (rt) {
      authApi.me()
        .then(({ data }) => setUser(data.user || data))
        .catch(() => clearTokens())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    // Try mock credentials first
    if (MOCK_USERS[email]) {
      const u = mockLogin(email, password)   // throws if wrong password
      saveMockSession(u)
      setUser(u)
      return u
    }
    // Fall through to real backend
    try {
      const { data } = await authApi.login({ email, password })
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setUser(data.user)
      return data.user
    } catch (err) {
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    if (isMockSession()) {
      clearMockSession()
      setUser(null)
      return
    }
    try { await authApi.logout(getRefreshToken()) } catch (_) {}
    clearTokens()
    setUser(null)
  }, [])

  const can = useCallback((resource, action) => {
    if (!user?.role) return false
    const perms = PERMISSIONS[resource]
    return Array.isArray(perms?.[action]) && perms[action].includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
