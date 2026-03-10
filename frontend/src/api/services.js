import apiClient from './client'

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
export const studentsApi       = crudService('students')
export const facultyApi        = crudService('faculty')
export const coursesApi        = crudService('courses')
export const subjectsApi       = crudService('subjects')
export const classesApi        = crudService('classes')
export const attendanceApi     = crudService('attendance')
export const academicYearsApi  = crudService('academic-years')
export const noticesApi        = crudService('notices')
export const timetableApi      = crudService('timetable')
