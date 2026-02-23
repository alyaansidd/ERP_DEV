import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.DEPARTMENT.READ),   getAllDepartments);
router.get('/:id', verifyToken, checkRole(ACCESS.DEPARTMENT.READ),   getDepartmentById);

// ─── Write (management / admin) ────────────────────────
router.post('/',      verifyToken, checkRole(ACCESS.DEPARTMENT.CREATE), createDepartment);
router.put('/:id',    verifyToken, checkRole(ACCESS.DEPARTMENT.UPDATE), updateDepartment);
router.delete('/:id', verifyToken, checkRole(ACCESS.DEPARTMENT.DELETE), deleteDepartment);

export default router;
