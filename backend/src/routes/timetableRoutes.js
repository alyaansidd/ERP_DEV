import express from 'express';
import {
  getAllTimetable,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable
} from '../controllers/timetableController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes (for viewing)
 */

// Get all timetable entries
router.get('/', getAllTimetable);

// Get timetable by ID
router.get('/:id', getTimetableById);

/**
 * Protected routes (require authentication)
 */

// Create new timetable entry
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createTimetable);

// Update timetable
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateTimetable);

// Delete timetable
router.delete('/:id', verifyToken, checkRole(['admin']), deleteTimetable);

export default router;
