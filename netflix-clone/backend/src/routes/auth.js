// backend/src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { loginLimiter, authLimiter } = require('../middleware/rateLimitMiddleware');
const { register, login, refreshToken, logout } = require('../controllers/authController');

const router = express.Router();

// Enhanced validation rules
const passwordValidation = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');

const emailValidation = body('email')
  .isEmail()
  .withMessage('Please provide a valid email address')
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage('Email must not exceed 255 characters');

const nameValidation = body('name')
  .notEmpty()
  .withMessage('Name is required')
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('Name must be between 2 and 50 characters')
  .matches(/^[a-zA-Z\s]+$/)
  .withMessage('Name can only contain letters and spaces');

router.post('/register', 
  loginLimiter,
  [
    emailValidation,
    passwordValidation,
    nameValidation
  ], 
  register
);

router.post('/login', 
  loginLimiter,
  [
    emailValidation,
    body('password').notEmpty().withMessage('Password is required')
  ], 
  login
);

router.post('/refresh', 
  authLimiter,
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required')
  ],
  refreshToken
);

router.post('/logout', authMiddleware, logout);

module.exports = router;