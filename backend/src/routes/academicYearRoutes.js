import express from 'express';
import {
  getAllAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from '../controllers/academicYearController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes (for viewing)
 */

// Get all academic years
router.get('/', getAllAcademicYears);

// Get academic year by ID
router.get('/:id', getAcademicYearById);

/**
 * Protected routes (require authentication)
 */

// Create new academic year
router.post('/', verifyToken, checkRole(['admin']), createAcademicYear);

// Update academic year
router.put('/:id', verifyToken, checkRole(['admin']), updateAcademicYear);

// Delete academic year
router.delete('/:id', verifyToken, checkRole(['admin']), deleteAcademicYear);

export default router;
