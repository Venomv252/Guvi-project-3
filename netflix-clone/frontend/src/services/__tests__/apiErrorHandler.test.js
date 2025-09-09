// frontend/src/services/__tests__/apiErrorHandler.test.js
import apiErrorHandler from '../apiErrorHandler';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

describe('ApiErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
  });

  describe('extractErrorInfo', () => {
    it('should handle network errors', () => {
      const error = {
        message: 'Network Error',
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'network',
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        isRetryable: true
      });
    });

    it('should handle timeout errors', () => {
      const error = {
        code: 'ECONNABORTED',
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'timeout',
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please check your internet connection and try again.',
        code: 'TIMEOUT',
        isRetryable: true
      });
    });

    it('should handle 400 validation errors', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Invalid email format',
            code: 'VALIDATION_ERROR',
            errors: [{ field: 'email', message: 'Invalid format' }]
          }
        },
        config: { url: '/api/auth/login', method: 'POST' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'validation',
        title: 'Invalid Request',
        message: 'Invalid email format',
        code: 'VALIDATION_ERROR',
        errors: [{ field: 'email', message: 'Invalid format' }],
        isRetryable: false
      });
    });

    it('should handle 401 authentication errors', () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          }
        },
        config: { url: '/api/auth/login', method: 'POST' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'authentication',
        title: 'Authentication Required',
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        isRetryable: false
      });
    });

    it('should handle 403 authorization errors', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Subscription required',
            code: 'SUBSCRIPTION_REQUIRED'
          }
        },
        config: { url: '/api/videos/1', method: 'GET' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'authorization',
        title: 'Access Denied',
        message: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        isRetryable: false
      });
    });

    it('should handle 429 rate limit errors', () => {
      const error = {
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED'
          },
          headers: {
            'retry-after': '60'
          }
        },
        config: { url: '/api/auth/login', method: 'POST' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'rate_limit',
        title: 'Too Many Requests',
        message: 'You\'ve made too many requests. Please wait a moment and try again.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: '60',
        isRetryable: true
      });
    });

    it('should handle 500 server errors', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR'
          }
        },
        config: { url: '/api/videos', method: 'GET' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result).toEqual({
        type: 'server',
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again in a few moments.',
        code: 'INTERNAL_ERROR',
        isRetryable: true
      });
    });

    it('should use default messages for unknown status codes', () => {
      const error = {
        response: {
          status: 418, // I'm a teapot
          data: {}
        },
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.extractErrorInfo(error);

      expect(result.type).toBe('unknown');
      expect(result.title).toBe('Unexpected Error');
      expect(result.message).toBe('An unexpected error occurred. Please try again.');
      expect(result.code).toBe('HTTP_418');
      expect(result.isRetryable).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should return user-friendly error object', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Invalid input',
            code: 'VALIDATION_ERROR'
          }
        },
        config: { url: '/api/test', method: 'POST' }
      };

      const result = apiErrorHandler.handleError(error);

      expect(result).toHaveProperty('type', 'validation');
      expect(result).toHaveProperty('title', 'Invalid Request');
      expect(result).toHaveProperty('message', 'Invalid input');
      expect(result).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(result).toHaveProperty('originalError', error);
      expect(result.retry).toBeNull(); // Not retryable
    });

    it('should include retry function for retryable errors', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
            code: 'INTERNAL_ERROR'
          }
        },
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.handleError(error, { enableRetry: true });

      expect(result.retry).toBeInstanceOf(Function);
    });

    it('should not include retry function when disabled', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
            code: 'INTERNAL_ERROR'
          }
        },
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.handleError(error, { enableRetry: false });

      expect(result.retry).toBeNull();
    });

    it('should show notification by default', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Invalid input',
            code: 'VALIDATION_ERROR'
          }
        },
        config: { url: '/api/test', method: 'POST' }
      };

      apiErrorHandler.handleError(error);

      expect(console.warn).toHaveBeenCalledWith('Invalid Request: Invalid input');
    });

    it('should not show notification when disabled', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Invalid input',
            code: 'VALIDATION_ERROR'
          }
        },
        config: { url: '/api/test', method: 'POST' }
      };

      apiErrorHandler.handleError(error, { showNotification: false });

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUserId', () => {
    it('should extract user ID from valid token', () => {
      const mockToken = `header.${btoa(JSON.stringify({ userId: 123 }))}.signature`;
      localStorageMock.getItem.mockReturnValue(mockToken);

      const userId = apiErrorHandler.getCurrentUserId();

      expect(userId).toBe(123);
    });

    it('should return anonymous when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const userId = apiErrorHandler.getCurrentUserId();

      expect(userId).toBe('anonymous');
    });

    it('should return anonymous when token is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      const userId = apiErrorHandler.getCurrentUserId();

      expect(userId).toBe('anonymous');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const error = {
        response: {
          status: 500,
          data: {}
        },
        config: { url: '/api/test', method: 'GET' }
      };

      const result = apiErrorHandler.isRetryable(error);

      expect(result).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const error = {
        response: {
          status: 400,
          data: {}
        },
        config: { url: '/api/test', method: 'POST' }
      };

      const result = apiErrorHandler.isRetryable(error);

      expect(result).toBe(false);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly message', () => {
      const error = {
        response: {
          status: 404,
          data: {
            message: 'Video not found'
          }
        },
        config: { url: '/api/videos/999', method: 'GET' }
      };

      const message = apiErrorHandler.getUserMessage(error);

      expect(message).toBe('Video not found');
    });
  });
});