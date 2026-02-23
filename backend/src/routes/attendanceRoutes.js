import express from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users – students see own) ─
router.get('/',    verifyToken, checkRole(ACCESS.ATTENDANCE.READ),   getAllAttendance);
router.get('/:id', verifyToken, checkRole(ACCESS.ATTENDANCE.READ),   getAttendanceById);

// ─── Write (staff – faculty marks attendance) ──────────
router.post('/',      verifyToken, checkRole(ACCESS.ATTENDANCE.CREATE), createAttendance);
router.put('/:id',    verifyToken, checkRole(ACCESS.ATTENDANCE.UPDATE), updateAttendance);
router.delete('/:id', verifyToken, checkRole(ACCESS.ATTENDANCE.DELETE), deleteAttendance);

export default router;
