const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        message: 'Access denied. No authorization header provided.',
        code: 'NO_AUTH_HEADER'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid authorization format.',
        code: 'INVALID_AUTH_FORMAT'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    // Check if token has required fields
    if (!decoded.userId) {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token structure.',
        code: 'INVALID_TOKEN_STRUCTURE'
      });
    }
    
    // Fetch user from database with additional security checks
    const [users] = await db.execute(
      `SELECT id, email, name, subscription_status, account_locked_until 
       FROM users 
       WHERE id = ?`, 
      [decoded.userId]
    );
    
    if (users.length === 0) {
      console.log(`Authentication failed: User not found for ID ${decoded.userId}`);
      return res.status(401).json({ 
        message: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = users[0];
    
    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      console.log(`Authentication failed: Account locked for user ${user.email}`);
      return res.status(423).json({ 
        message: 'Account temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED'
      });
    }
    
    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_status: user.subscription_status
    };
    
    // Add token info for potential use
    req.tokenInfo = {
      userId: decoded.userId,
      iat: decoded.iat,
      exp: decoded.exp
    };
    
    next();
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        message: 'Access denied. Token not active yet.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    
    // Handle database errors
    if (error.code && error.code.startsWith('ER_')) {
      console.error('Database error in auth middleware:', error);
      return res.status(500).json({ 
        message: 'Internal server error. Please try again later.',
        code: 'DATABASE_ERROR'
      });
    }
    
    // Generic error
    return res.status(500).json({ 
      message: 'Internal server error. Please try again later.',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Optional middleware for routes that require active subscription
const requireActiveSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.subscription_status !== 'active') {
    return res.status(403).json({ 
      message: 'Active subscription required to access this content.',
      code: 'SUBSCRIPTION_REQUIRED'
    });
  }
  
  next();
};

// Optional middleware for admin routes (future use)
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // This would check for admin role when implemented
  if (!req.user.isAdmin) {
    return res.status(403).json({ 
      message: 'Admin access required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

module.exports = {
  authMiddleware,
  requireActiveSubscription,
  requireAdmin
};