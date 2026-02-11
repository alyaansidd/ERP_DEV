import express from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all classes
router.get('/', getAllClasses);

// Get class by ID
router.get('/:id', getClassById);

// Create new class
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createClass);

// Update class
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateClass);

// Delete class
router.delete('/:id', verifyToken, checkRole(['admin']), deleteClass);

export default router;
