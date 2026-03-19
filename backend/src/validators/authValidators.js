import { body } from 'express-validator';

const roles = ['admin', 'faculty', 'student', 'hod'];

const normalizeEmailInput = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .trim()
    .replace(/^['\"]+|['\"]+$/g, '')
    .toLowerCase();
};

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters'),
  body('email')
    .customSanitizer(normalizeEmailInput)
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(roles)
    .withMessage('Role must be one of: admin, faculty, student, hod'),
  body('phoneNo')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone number must be 10 digits'),
  body('aadharNo')
    .notEmpty()
    .withMessage('Aadhar number is required')
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhar must be 12 digits'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
];

export const loginValidator = [
  body('email')
    .customSanitizer(normalizeEmailInput)
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isString()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password is required')
];

export const forgotPasswordValidator = [
  body('email')
    .customSanitizer(normalizeEmailInput)
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
];

export const resetPasswordValidator = [
  body('email')
    .customSanitizer(normalizeEmailInput)
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only digits'),
  body('newPassword')
    .isString()
    .withMessage('New password must be a string')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

export const refreshTokenValidator = [
  body('refreshToken')
    .isString()
    .withMessage('Refresh token is required')
    .notEmpty()
    .withMessage('Refresh token is required')
];

export const logoutValidator = [
  body('refreshToken')
    .optional()
    .isString()
    .withMessage('Refresh token must be a string')
    .notEmpty()
    .withMessage('Refresh token cannot be empty')
];
