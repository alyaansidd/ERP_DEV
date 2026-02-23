import express from 'express';
import {
  getAllAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from '../controllers/academicYearController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.ACADEMIC_YEAR.READ),   getAllAcademicYears);
router.get('/:id', verifyToken, checkRole(ACCESS.ACADEMIC_YEAR.READ),   getAcademicYearById);

// ─── Write (admin only) ────────────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.ACADEMIC_YEAR.CREATE), createAcademicYear);
router.put('/:id',    verifyToken, checkRole(ACCESS.ACADEMIC_YEAR.UPDATE), updateAcademicYear);
router.delete('/:id', verifyToken, checkRole(ACCESS.ACADEMIC_YEAR.DELETE), deleteAcademicYear);

export default router;
