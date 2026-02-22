import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getCurrentUser,
  logout,
  logoutAll
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

// Send OTP to email for password reset
router.post('/forgot-password', forgotPassword);

// Reset password using OTP
router.post('/reset-password', resetPassword);

// Refresh access token
router.post('/refresh', refreshAccessToken);

/**
 * Protected routes (require authentication)
 */

// Get current user profile
router.get('/me', verifyToken, getCurrentUser);

// Logout user
router.post('/logout', verifyToken, logout);

// Logout user from all sessions
router.post('/logout-all', verifyToken, logoutAll);

export default router;
