// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const generateTokens = require('../utils/generateTokens');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Registration validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { email, password, name } = req.body;
    
    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    
    // Check if user exists
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
    if (existingUsers.length > 0) {
      console.log(`Registration attempt with existing email: ${sanitizedEmail}`);
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password with higher salt rounds for security
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [sanitizedEmail, hashedPassword, sanitizedName]
    );
    
    const userId = result.insertId;
    const tokens = generateTokens(userId);
    
    // Store refresh token
    await db.execute(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [tokens.refreshToken, userId]
    );
    
    console.log(`User registered successfully: ${sanitizedEmail} (ID: ${userId})`);
    
    res.status(201).json({
      message: 'User created successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: userId, email: sanitizedEmail, name: sanitizedName }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { email, password } = req.body;
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Find user with additional security fields (handle missing columns gracefully)
    let users;
    try {
      [users] = await db.execute(
        'SELECT id, email, password, name, subscription_status, failed_login_attempts, account_locked_until FROM users WHERE email = ?', 
        [sanitizedEmail]
      );
    } catch (dbError) {
      // If security columns don't exist, fall back to basic query
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Security fields not found, using basic user query');
        [users] = await db.execute(
          'SELECT id, email, password, name, subscription_status FROM users WHERE email = ?', 
          [sanitizedEmail]
        );
        // Add default values for missing fields
        if (users.length > 0) {
          users[0].failed_login_attempts = 0;
          users[0].account_locked_until = null;
        }
      } else {
        throw dbError;
      }
    }
    
    if (users.length === 0) {
      console.log(`Login attempt with non-existent email: ${sanitizedEmail}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      console.log(`Login attempt on locked account: ${sanitizedEmail}`);
      return res.status(423).json({ 
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' 
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Failed login attempt for: ${sanitizedEmail}`);
      
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;
      
      // Lock account after 5 failed attempts for 15 minutes
      if (failedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        console.log(`Account locked for: ${sanitizedEmail}`);
      }
      
      // Update failed attempts (handle missing columns gracefully)
      try {
        await db.execute(
          'UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?',
          [failedAttempts, lockUntil, user.id]
        );
      } catch (dbError) {
        if (dbError.code === 'ER_BAD_FIELD_ERROR') {
          console.log('Security fields not available, skipping failed attempt tracking');
        } else {
          throw dbError;
        }
      }
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Reset failed login attempts on successful login (handle missing columns gracefully)
    try {
      await db.execute(
        'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL, last_login = NOW() WHERE id = ?',
        [user.id]
      );
    } catch (dbError) {
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Security fields not available, skipping security field updates');
      } else {
        throw dbError;
      }
    }
    
    const tokens = generateTokens(user.id);
    
    // Store refresh token
    await db.execute(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [tokens.refreshToken, user.id]
    );
    
    console.log(`User logged in successfully: ${sanitizedEmail} (ID: ${user.id})`);
    
    res.json({
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { refreshToken } = req.body;
    
    // Verify and decode the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and verify refresh token matches
    const [users] = await db.execute(
      'SELECT id, email, name, subscription_status FROM users WHERE id = ? AND refresh_token = ?',
      [decoded.userId, refreshToken]
    );
    
    if (users.length === 0) {
      console.log(`Invalid refresh token attempt for user ID: ${decoded.userId}`);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    
    const user = users[0];
    const tokens = generateTokens(user.id);
    
    // Update refresh token (token rotation for security)
    await db.execute(
      'UPDATE users SET refresh_token = ? WHERE id = ?',
      [tokens.refreshToken, user.id]
    );
    
    console.log(`Token refreshed for user: ${user.email} (ID: ${user.id})`);
    
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const logout = async (req, res) => {
  try {
    // Invalidate refresh token in database
    await db.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    
    console.log(`User logged out: ${req.user.email} (ID: ${req.user.id})`);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = { register, login, refreshToken, logout };