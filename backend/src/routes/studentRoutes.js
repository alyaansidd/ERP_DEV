import express from 'express';
import {
  getAllStudents,
  getStudentById,
  getMyStudentDashboard,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

router.get('/me/dashboard', verifyToken, checkRole(ACCESS.STUDENT.READ), getMyStudentDashboard);
router.get('/', verifyToken, checkRole(ACCESS.STUDENT.READ), getAllStudents);
router.get('/:id', verifyToken, checkRole(ACCESS.STUDENT.READ), getStudentById);

router.post('/', verifyToken, checkRole(ACCESS.STUDENT.CREATE), createStudent);
router.put('/:id', verifyToken, checkRole(ACCESS.STUDENT.UPDATE), updateStudent);
router.delete('/:id', verifyToken, checkRole(ACCESS.STUDENT.DELETE), deleteStudent);

export default router;
