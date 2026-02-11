import express from 'express';
import {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment
} from '../controllers/enrollmentController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all enrollments
router.get('/', getAllEnrollments);

// Get enrollment by ID
router.get('/:id', getEnrollmentById);

// Create new enrollment
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createEnrollment);

// Update enrollment
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateEnrollment);

// Delete enrollment
router.delete('/:id', verifyToken, checkRole(['admin']), deleteEnrollment);

export default router;
