import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  logout
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Public routes
 */

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

/**
 * Protected routes (require authentication)
 */

// Get current user profile
router.get('/me', verifyToken, getCurrentUser);

// Logout user
router.post('/logout', verifyToken, logout);

export default router;
