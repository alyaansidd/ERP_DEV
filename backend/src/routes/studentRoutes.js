import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all students
router.get('/', getAllStudents);

// Get student by ID
router.get('/:id', getStudentById);

// Create new student
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createStudent);

// Update student
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateStudent);

// Delete student
router.delete('/:id', verifyToken, checkRole(['admin']), deleteStudent);

export default router;
