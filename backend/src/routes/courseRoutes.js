import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes (for viewing)
 */

// Get all courses
router.get('/', getAllCourses);

// Get course by ID
router.get('/:id', getCourseById);

/**
 * Protected routes (require authentication)
 */

// Create new course
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createCourse);

// Update course
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateCourse);

// Delete course
router.delete('/:id', verifyToken, checkRole(['admin']), deleteCourse);

export default router;
