import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controllers/courseController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.COURSE.READ),   getAllCourses);
router.get('/:id', verifyToken, checkRole(ACCESS.COURSE.READ),   getCourseById);

// ─── Write (management) ────────────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.COURSE.CREATE), createCourse);
router.put('/:id',    verifyToken, checkRole(ACCESS.COURSE.UPDATE), updateCourse);
router.delete('/:id', verifyToken, checkRole(ACCESS.COURSE.DELETE), deleteCourse);

export default router;
