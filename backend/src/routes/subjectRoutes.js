import express from 'express';
import {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.SUBJECT.READ),   getAllSubjects);
router.get('/:id', verifyToken, checkRole(ACCESS.SUBJECT.READ),   getSubjectById);

// ─── Write (management) ────────────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.SUBJECT.CREATE), createSubject);
router.put('/:id',    verifyToken, checkRole(ACCESS.SUBJECT.UPDATE), updateSubject);
router.delete('/:id', verifyToken, checkRole(ACCESS.SUBJECT.DELETE), deleteSubject);

export default router;
