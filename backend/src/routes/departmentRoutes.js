import express from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes
 */

// Get all departments
router.get('/', getAllDepartments);

// Get department by ID
router.get('/:id', getDepartmentById);

/**
 * Protected routes (require authentication and admin role)
 */

// Create new department
router.post('/', verifyToken, checkRole(['admin']), createDepartment);

// Update department
router.put('/:id', verifyToken, checkRole(['admin']), updateDepartment);

// Delete department
router.delete('/:id', verifyToken, checkRole(['admin']), deleteDepartment);

export default router;
