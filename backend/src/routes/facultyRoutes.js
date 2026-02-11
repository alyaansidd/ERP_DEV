import express from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} from '../controllers/facultyController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all faculty members
router.get('/', getAllFaculty);

// Get faculty by ID
router.get('/:id', getFacultyById);

// Create new faculty
router.post('/', verifyToken, checkRole(['admin']), createFaculty);

// Update faculty
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateFaculty);

// Delete faculty
router.delete('/:id', verifyToken, checkRole(['admin']), deleteFaculty);

export default router;
