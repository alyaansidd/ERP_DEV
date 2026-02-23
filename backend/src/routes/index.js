import authRoutes from './authRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import studentRoutes from './studentRoutes.js';
import facultyRoutes from './facultyRoutes.js';
import courseRoutes from './courseRoutes.js';
import subjectRoutes from './subjectRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import classRoutes from './classRoutes.js';
import academicYearRoutes from './academicYearRoutes.js';
import noticeRoutes from './noticeRoutes.js';

const routeRegistry = [
  { path: '/api/auth', router: authRoutes },
  { path: '/api/departments', router: departmentRoutes },
  { path: '/api/students', router: studentRoutes },
  { path: '/api/faculty', router: facultyRoutes },
  { path: '/api/courses', router: courseRoutes },
  { path: '/api/subjects', router: subjectRoutes },
  { path: '/api/attendance', router: attendanceRoutes },
  { path: '/api/classes', router: classRoutes },
  { path: '/api/academic-years', router: academicYearRoutes },
  { path: '/api/notices', router: noticeRoutes }
];

export const registerRoutes = (app) => {
  routeRegistry.forEach(({ path, router }) => {
    app.use(path, router);
  });
};

export default routeRegistry;
