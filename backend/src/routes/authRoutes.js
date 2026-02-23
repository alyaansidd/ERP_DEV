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
import { verifyToken, checkRole } from '../middleware/authMiddleware.js';
import { handleValidationErrors } from '../middleware/validationMiddleware.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  refreshTokenValidator,
  logoutValidator
} from '../validators/authValidators.js';
import { ACCESS } from '../config/roles.js';

const router = express.Router();

// ─── Public routes (no auth required) ───────────────────

// Login user
router.post('/login', loginValidator, handleValidationErrors, login);

// Send OTP to email for password reset
router.post('/forgot-password', forgotPasswordValidator, handleValidationErrors, forgotPassword);

// Reset password using OTP
router.post('/reset-password', resetPasswordValidator, handleValidationErrors, resetPassword);

// Refresh access token
router.post('/refresh', refreshTokenValidator, handleValidationErrors, refreshAccessToken);

// ─── Protected routes ───────────────────────────────────

// Register a new user (admin only)
router.post('/register', verifyToken, checkRole(ACCESS.AUTH.REGISTER), registerValidator, handleValidationErrors, register);

// Get current user profile
router.get('/me', verifyToken, getCurrentUser);

// Logout user
router.post('/logout', verifyToken, logoutValidator, handleValidationErrors, logout);

// Logout user from all sessions
router.post('/logout-all', verifyToken, logoutAll);

export default router;
