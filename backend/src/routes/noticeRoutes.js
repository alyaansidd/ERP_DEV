import express from 'express';
import {
  getAllNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} from '../controllers/noticeController.js';
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Read (all authenticated users) ────────────────────
router.get('/',    verifyToken, checkRole(ACCESS.NOTICE.READ),   getAllNotices);
router.get('/:id', verifyToken, checkRole(ACCESS.NOTICE.READ),   getNoticeById);

// ─── Write (staff can post, management can delete) ─────
router.post('/',      verifyToken, checkRole(ACCESS.NOTICE.CREATE), createNotice);
router.put('/:id',    verifyToken, checkRole(ACCESS.NOTICE.UPDATE), updateNotice);
router.delete('/:id', verifyToken, checkRole(ACCESS.NOTICE.DELETE), deleteNotice);

export default router;
