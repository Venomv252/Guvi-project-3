// backend/src/middleware/__tests__/authMiddleware.test.js
const jwt = require('jsonwebtoken');
const { authMiddleware, requireActiveSubscription } = require('../authMiddleware');
const db = require('../../config/db');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../config/db');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      header: jest.fn()
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscription_status: 'active',
        account_locked_until: null
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ userId: 1, iat: 1234567890, exp: 9999999999 });
      db.execute.mockResolvedValue([[mockUser]]);

      await authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_ACCESS_SECRET);
      expect(req.user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscription_status: 'active'
      });
      expect(req.tokenInfo).toEqual({
        userId: 1,
        iat: 1234567890,
        exp: 9999999999
      });
      expect(next).toHaveBeenCalled();
    });

    it('should reject request with no authorization header', async () => {
      req.header.mockReturnValue(undefined);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. No authorization header provided.',
        code: 'NO_AUTH_HEADER'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      req.header.mockReturnValue('InvalidFormat token');

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Invalid authorization format.',
        code: 'INVALID_AUTH_FORMAT'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with expired token', async () => {
      req.header.mockReturnValue('Bearer expired-token');
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for non-existent user', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ userId: 999 });
      db.execute.mockResolvedValue([[]]);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request for locked account', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscription_status: 'active',
        account_locked_until: new Date(Date.now() + 60000) // Locked for 1 minute
      };

      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ userId: 1 });
      db.execute.mockResolvedValue([[mockUser]]);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(423);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      jwt.verify.mockReturnValue({ userId: 1 });
      
      const dbError = new Error('Database connection failed');
      dbError.code = 'ER_CONNECTION_FAILED';
      db.execute.mockRejectedValue(dbError);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error. Please try again later.',
        code: 'DATABASE_ERROR'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireActiveSubscription', () => {
    it('should allow access for user with active subscription', () => {
      req.user = {
        id: 1,
        email: 'test@example.com',
        subscription_status: 'active'
      };

      requireActiveSubscription(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without active subscription', () => {
      req.user = {
        id: 1,
        email: 'test@example.com',
        subscription_status: 'inactive'
      };

      requireActiveSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Active subscription required to access this content.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      req.user = null;

      requireActiveSubscription(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});