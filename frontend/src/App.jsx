import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'

import AppLayout from './components/layout/AppLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/auth/ForgotResetPage'

// App pages
import DashboardPage from './pages/dashboard/DashboardPage'
import DepartmentsPage from './pages/departments/DepartmentsPage'
import StudentsPage from './pages/students/StudentsPage'
import FacultyPage from './pages/faculty/FacultyPage'
import CoursesPage from './pages/courses/CoursesPage'
import SubjectsPage from './pages/subjects/SubjectsPage'
import ClassesPage from './pages/classes/ClassesPage'
import AcademicYearsPage from './pages/academic-years/AcademicYearsPage'
import AcademicDetailsPage from './pages/academic-details/AcademicDetailsPage'
import AttendancePage from './pages/attendance/AttendancePage'
import NoticesPage from './pages/notices/NoticesPage'
import TimetablePage from './pages/timetable/TimetablePage'
import { RegisterPage, ProfilePage } from './pages/profile/ProfilePages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path='/login' element={<LoginPage />} />
            <Route path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route path='/reset-password' element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route element={<AppLayout />}>
              <Route path='/'                element={<DashboardPage />} />
              <Route path='/departments'     element={<DepartmentsPage />} />
              <Route path='/students'        element={<StudentsPage />} />
              <Route path='/faculty'         element={<FacultyPage />} />
              <Route path='/courses'         element={<CoursesPage />} />
              <Route path='/subjects'        element={<SubjectsPage />} />
              <Route path='/classes'         element={<ClassesPage />} />
              <Route path='/academic-years'  element={<AcademicYearsPage />} />
              <Route path='/academic-details' element={<AcademicDetailsPage />} />
              <Route path='/attendance'      element={<AttendancePage />} />
              <Route path='/timetable'       element={<TimetablePage />} />
              <Route path='/notices'         element={<NoticesPage />} />
              <Route path='/register'        element={<RegisterPage />} />
              <Route path='/profile'         element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position='top-right'
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #d4dce8',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 16px rgba(0,0,0,.08)',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
