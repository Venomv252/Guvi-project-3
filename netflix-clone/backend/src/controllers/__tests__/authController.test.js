const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const db = require('../../config/db');

// Mock database
jest.mock('../../config/db');
const mockDb = db;

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt;

// Mock JWT
jest.mock('jsonwebtoken');
const mockJwt = jwt;

// Mock generateTokens
jest.mock('../../utils/generateTokens');
const mockGenerateTokens = require('../../utils/generateTokens');

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      // Mock database responses
      mockDb.execute
        .mockResolvedValueOnce([[]]) // Check existing user - none found
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insert user
        .mockResolvedValueOnce([{}]); // Update refresh token

      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockGenerateTokens.mockReturnValue(mockTokens);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
    });

    it('should return error for existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'TestPass123!',
        name: 'Test User'
      };

      // Mock existing user found
      mockDb.execute.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return validation errors for invalid input', async () => {
      const userData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: '' // Empty name
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        subscription_status: 'active',
        failed_login_attempts: 0,
        account_locked_until: null
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      mockDb.execute
        .mockResolvedValueOnce([[mockUser]]) // Find user
        .mockResolvedValueOnce([{}]) // Reset failed attempts
        .mockResolvedValueOnce([{}]); // Store refresh token

      mockBcrypt.compare.mockResolvedValue(true);
      mockGenerateTokens.mockReturnValue(mockTokens);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        subscription_status: 'active',
        failed_login_attempts: 0,
        account_locked_until: null
      };

      mockDb.execute
        .mockResolvedValueOnce([[mockUser]]) // Find user
        .mockResolvedValueOnce([{}]); // Update failed attempts

      mockBcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!'
      };

      mockDb.execute.mockResolvedValueOnce([[]]); // No user found

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return error for locked account', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        subscription_status: 'active',
        failed_login_attempts: 5,
        account_locked_until: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      };

      mockDb.execute.mockResolvedValueOnce([[mockUser]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(423);
      expect(response.body.message).toContain('Account temporarily locked');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        subscription_status: 'active'
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      mockJwt.verify.mockReturnValue({ userId: 1 });
      mockDb.execute
        .mockResolvedValueOnce([[mockUser]]) // Find user with refresh token
        .mockResolvedValueOnce([{}]); // Update refresh token

      mockGenerateTokens.mockReturnValue(mockTokens);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken', 'new-access-token');
      expect(response.body).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should return error for invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      mockJwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return error for expired refresh token', async () => {
      const refreshData = {
        refreshToken: 'expired-refresh-token'
      };

      const error = new Error('TokenExpiredError');
      error.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Refresh token expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      
      // Mock authentication middleware
      const authMiddleware = require('../../middleware/authMiddleware').authMiddleware;
      jest.spyOn(authMiddleware, 'authMiddleware').mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });

      mockDb.execute.mockResolvedValueOnce([{}]); // Clear refresh token

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });
});