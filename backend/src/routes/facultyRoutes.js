import express from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} from '../controllers/facultyController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.FACULTY.READ),   getAllFaculty);
router.get('/:id', verifyToken, checkRole(ACCESS.FACULTY.READ),   getFacultyById);

// ─── Write (management / staff) ────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.FACULTY.CREATE), createFaculty);
router.put('/:id',    verifyToken, checkRole(ACCESS.FACULTY.UPDATE), updateFaculty);
router.delete('/:id', verifyToken, checkRole(ACCESS.FACULTY.DELETE), deleteFaculty);

export default router;
