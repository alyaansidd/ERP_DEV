import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { isSmtpConfigured, sendPasswordResetOtpEmail } from '../utils/email.js';

/**
 * Generate short-lived access token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || process.env.JWT_EXPIRE || '15m' }
  );
};

/**
 * Generate long-lived refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const issueAuthTokens = async (user) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  const refreshTokenHash = hashToken(refreshToken);

  const tokens = user.refreshTokens || [];
  user.refreshTokens = [...tokens, refreshTokenHash];
  await user.save();

  return { accessToken, refreshToken };
};

const buildAuthResponse = (user, accessToken, refreshToken, message) => {
  return {
    success: true,
    message,
    token: accessToken,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNo: user.phoneNo,
      aadharNo: user.aadharNo,
      dob: user.dob
    }
  };
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNo, aadharNo, dob } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validation
    if (!name || !email || !password || !phoneNo || !aadharNo || !dob || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, phoneNo, aadharNo, dob, role'
      });
    }

    // Check if user already exists (email, phone, or aadhar)
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phoneNo }, { aadharNo }]
    });
    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email'
        : existingUser.phoneNo === phoneNo ? 'phone number'
        : 'Aadhar number';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phoneNo,
      aadharNo,
      dob
    });

    // Generate access + refresh tokens
    const { accessToken, refreshToken } = await issueAuthTokens(newUser);

    // Return success response
    return res.status(201).json(buildAuthResponse(newUser, accessToken, refreshToken, 'User registered successfully'));
  } catch (error) {
    console.error('Registration error:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error during registration. Please try again.'
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user (include password field for comparison)
    let user = await User.findOne({ email: normalizedEmail }).select('+password +refreshTokens');

    // Fallback for legacy records that may contain accidental surrounding spaces in email.
    if (!user && normalizedEmail) {
      const escapedEmail = escapeRegex(normalizedEmail);
      user = await User.findOne({
        email: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: 'i' }
      }).select('+password +refreshTokens');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Compare passwords
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate access + refresh tokens
    const { accessToken, refreshToken } = await issueAuthTokens(user);

    // Return success response
    return res.status(200).json(buildAuthResponse(user, accessToken, refreshToken, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during login. Please try again.'
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @param {Object} req - Express request object (with user from middleware)
 * @param {Object} res - Express response object
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving user information'
    });
  }
};

/**
 * Logout user (client-side, just return success)
 * @route POST /api/auth/logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = (req, res) => {
  const { refreshToken } = req.body || {};

  if (refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);
    User.updateOne(
      { _id: req.user.id },
      { $pull: { refreshTokens: refreshTokenHash } }
    ).catch((error) => {
      console.error('Logout token cleanup error:', error.message);
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Logout successful. Please remove tokens from your client.'
  });
};

/**
 * Rotate refresh token and issue a new access token
 * @route POST /api/auth/refresh
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const oldRefreshTokenHash = hashToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokenExists = (user.refreshTokens || []).includes(oldRefreshTokenHash);

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked'
      });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const remainingTokens = (user.refreshTokens || []).filter((tokenHash) => tokenHash !== oldRefreshTokenHash);
    user.refreshTokens = [...remainingTokens, newRefreshTokenHash];
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: accessToken,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

/**
 * Send OTP to user's email for password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetOtpExpires');

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with this email exists, an OTP has been sent.'
      });
    }

    const otp = generateOtp();
    // Log OTP to backend terminal for testing purposes
    console.log('=== PASSWORD RESET OTP ===');
    console.log(`Email: ${user.email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires in: ${process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10} minutes`);
    console.log('===========================');
    const otpHash = hashOtp(otp);
    const expiryMinutes = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10);

    user.passwordResetOtp = otpHash;
    user.passwordResetOtpExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const smtpConfigured = isSmtpConfigured();
    const isDebugOtpEnabled = process.env.NODE_ENV !== 'production' && process.env.EMAIL_DEBUG_OTP === 'true';

    if (!smtpConfigured && isDebugOtpEnabled) {
      return res.status(200).json({
        success: true,
        message: 'SMTP is not configured. OTP is returned in debug mode for local testing.',
        debugOtp: otp
      });
    }

    try {
      await sendPasswordResetOtpEmail({
        to: user.email,
        name: user.name,
        otp
      });
    } catch (mailError) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Forgot password email error:', mailError);
      if (String(mailError.message || '').includes('Missing SMTP configuration')) {
        return res.status(500).json({
          success: false,
          message: 'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or enable EMAIL_DEBUG_OTP=true for local testing.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    const response = {
      success: true,
      message: 'Password reset OTP sent to your email'
    };

    // Include OTP in response for testing purposes (non-production)
    if (process.env.NODE_ENV !== 'production') {
      response.otp = otp;
      response.note = 'OTP displayed for testing purposes only';
    } else if (isDebugOtpEnabled) {
      response.debugOtp = otp;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing forgot password request'
    });
  }
};

/**
 * Reset password with email + OTP
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and newPassword are required'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const otpHash = hashOtp(String(otp));
    const user = await User.findOne({
      email,
      passwordResetOtp: otpHash,
      passwordResetOtpExpires: { $gt: new Date() }
    }).select('+password +refreshTokens +passwordResetOtp +passwordResetOtpExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login again.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

/**
 * Revoke all refresh tokens for the current user
 * @route POST /api/auth/logout-all
 */
export const logoutAll = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { refreshTokens: [] } }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged out from all sessions'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};
