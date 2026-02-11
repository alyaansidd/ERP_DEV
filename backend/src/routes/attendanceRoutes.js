import express from 'express';
import {
  getAllAttendance,
  getAttendanceById,
  createAttendance,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes (for viewing)
 */

// Get all attendance records
router.get('/', getAllAttendance);

// Get attendance by ID
router.get('/:id', getAttendanceById);

/**
 * Protected routes (require authentication)
 */

// Create new attendance record
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createAttendance);

// Update attendance
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateAttendance);

// Delete attendance
router.delete('/:id', verifyToken, checkRole(['admin']), deleteAttendance);

export default router;
