import express from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes (for viewing)
 */

// Get all subjects
router.get('/', getAllSubjects);

// Get subject by ID
router.get('/:id', getSubjectById);

/**
 * Protected routes (require authentication)
 */

// Create new subject
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createSubject);

// Update subject
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateSubject);

// Delete subject
router.delete('/:id', verifyToken, checkRole(['admin']), deleteSubject);

export default router;
