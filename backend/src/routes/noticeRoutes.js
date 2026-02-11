import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} from '../controllers/noticeController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all notices
router.get('/', getAllNotices);

// Get notice by ID
router.get('/:id', getNoticeById);

// Create new notice
router.post('/', verifyToken, checkRole(['admin', 'faculty']), createNotice);

// Update notice
router.put('/:id', verifyToken, checkRole(['admin', 'faculty']), updateNotice);

// Delete notice
router.delete('/:id', verifyToken, checkRole(['admin']), deleteNotice);

export default router;
