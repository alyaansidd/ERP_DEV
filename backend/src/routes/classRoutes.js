import express from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.CLASS.READ),   getAllClasses);
router.get('/:id', verifyToken, checkRole(ACCESS.CLASS.READ),   getClassById);

// ─── Write (management) ────────────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.CLASS.CREATE), createClass);
router.put('/:id',    verifyToken, checkRole(ACCESS.CLASS.UPDATE), updateClass);
router.delete('/:id', verifyToken, checkRole(ACCESS.CLASS.DELETE), deleteClass);

export default router;
