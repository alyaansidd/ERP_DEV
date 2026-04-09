import apiClient, { getAccessToken } from './client'

// ── AUTH ──────────────────────────────────────────────────────
export const authApi = {
  login:         (data) => apiClient.post('/auth/login', data),
  register:      (data) => apiClient.post('/auth/register', data),
  me:            ()     => apiClient.get('/auth/me'),
  logout:        (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
  logoutAll:     ()     => apiClient.post('/auth/logout-all'),
  forgotPassword:(data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
}

// ── GENERIC CRUD FACTORY ──────────────────────────────────────
function crudService(resource) {
  return {
    getAll:  ()       => apiClient.get(`/${resource}`),
    getById: (id)     => apiClient.get(`/${resource}/${id}`),
    create:  (data)   => apiClient.post(`/${resource}`, data),
    update:  (id, data) => apiClient.put(`/${resource}/${id}`, data),
    remove:  (id)     => apiClient.delete(`/${resource}/${id}`),
  }
}

export const departmentsApi    = {
  ...crudService('departments'),
  assignHod: (data) => apiClient.post('/departments/assign-hod', data),
}
export const studentsApi       = {
  ...crudService('students'),
  getMyDashboard: () => apiClient.get('/students/me/dashboard'),
}
export const facultyApi        = crudService('faculty')
export const coursesApi        = crudService('courses')
export const subjectsApi       = crudService('subjects')
export const classesApi        = crudService('classes')
export const attendanceApi     = crudService('attendance')
export const attendanceSessionsApi = {
  start: (data) => apiClient.post('/attendance/sessions/start', data),
  getActive: (classId) =>
    apiClient.get('/attendance/sessions/active', {
      params: classId ? { classId } : undefined
    }),
  getById: (sessionId) => apiClient.get(`/attendance/sessions/${sessionId}`),
  verify: (sessionId, data) => apiClient.post(`/attendance/sessions/${sessionId}/verify`, data),
  mark: (sessionId, data) => apiClient.post(`/attendance/sessions/${sessionId}/mark`, data),
  end: (sessionId) => apiClient.post(`/attendance/sessions/${sessionId}/end`),
  streamEvents: ({ onMessage, onError } = {}) => {
    const token = getAccessToken()
    if (!token) return null

    const streamUrl = `${apiClient.defaults.baseURL}/attendance/sessions/stream/events?token=${encodeURIComponent(token)}`
    const eventSource = new EventSource(streamUrl)

    eventSource.addEventListener('attendance_marked', (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (typeof onMessage === 'function') onMessage(payload)
      } catch {
        if (typeof onMessage === 'function') onMessage(null)
      }
    })

    eventSource.onerror = (error) => {
      if (typeof onError === 'function') onError(error)
    }

    return eventSource
  },
}
export const academicYearsApi  = crudService('academic-years')
export const noticesApi        = crudService('notices')
export const timetableApi      = crudService('timetable')
