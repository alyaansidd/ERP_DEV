import express from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import {
  startAttendanceSession,
  getActiveAttendanceSessions,
  streamAttendanceSessionEvents,
  getAttendanceSessionById,
  verifyStudentForAttendanceSession,
  markAttendanceFromSession,
  endAttendanceSession
} from '../controllers/attendanceSessionController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Session-based attendance flow ──────────────────────
router.post('/sessions/start', verifyToken, checkRole(ACCESS.ATTENDANCE.CREATE), startAttendanceSession);
router.get('/sessions/active', verifyToken, checkRole(ACCESS.ATTENDANCE.READ), getActiveAttendanceSessions);
router.get('/sessions/stream/events', verifyToken, checkRole(ACCESS.ATTENDANCE.READ), streamAttendanceSessionEvents);
router.get('/sessions/:sessionId', verifyToken, checkRole(ACCESS.ATTENDANCE.READ), getAttendanceSessionById);
router.post('/sessions/:sessionId/verify', verifyToken, checkRole(ACCESS.ATTENDANCE.READ), verifyStudentForAttendanceSession);
router.post('/sessions/:sessionId/mark', verifyToken, checkRole(ACCESS.ATTENDANCE.READ), markAttendanceFromSession);
router.post('/sessions/:sessionId/end', verifyToken, checkRole(ACCESS.ATTENDANCE.UPDATE), endAttendanceSession);

// ─── Read (all authenticated users – students see own) ─
router.get('/',    verifyToken, checkRole(ACCESS.ATTENDANCE.READ),   getAllAttendance);
router.get('/:id', verifyToken, checkRole(ACCESS.ATTENDANCE.READ),   getAttendanceById);

// ─── Write (staff – faculty marks attendance) ──────────
router.post('/',      verifyToken, checkRole(ACCESS.ATTENDANCE.CREATE), createAttendance);
router.put('/:id',    verifyToken, checkRole(ACCESS.ATTENDANCE.UPDATE), updateAttendance);
router.delete('/:id', verifyToken, checkRole(ACCESS.ATTENDANCE.DELETE), deleteAttendance);

export default router;
