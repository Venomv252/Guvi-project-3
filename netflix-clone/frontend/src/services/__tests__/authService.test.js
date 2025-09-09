import axios from 'axios';
import authService from '../authService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    window.location.href = '';
  });

  describe('Token Refresh Functionality', () => {
    it('should automatically refresh token on 401 response', async () => {
      const mockRefreshToken = 'mock-refresh-token';
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      // Mock localStorage to return refresh token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return mockRefreshToken;
        if (key === 'accessToken') return 'expired-token';
        return null;
      });

      // Mock the initial 401 response
      const originalError = {
        response: { status: 401 },
        config: { url: '/api/videos', headers: {} }
      };

      // Mock the refresh token response
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          accessToken: mockNewAccessToken,
          refreshToken: mockNewRefreshToken
        }
      });

      // Mock the retry request
      mockedAxios.mockResolvedValueOnce({
        data: { videos: [] }
      });

      // Get the response interceptor
      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      // Execute the interceptor with the 401 error
      const result = await responseInterceptor(originalError);

      // Verify refresh token was called
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/auth/refresh`,
        { refreshToken: mockRefreshToken },
        { _retry: true }
      );

      // Verify tokens were updated in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', mockNewAccessToken);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', mockNewRefreshToken);

      // Verify original request was retried
      expect(mockedAxios).toHaveBeenCalledWith({
        url: '/api/videos',
        headers: { Authorization: `Bearer ${mockNewAccessToken}` }
      });
    });

    it('should logout user when refresh token is invalid', async () => {
      const mockRefreshToken = 'invalid-refresh-token';

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'refreshToken') return mockRefreshToken;
        if (key === 'accessToken') return 'expired-token';
        return null;
      });

      const originalError = {
        response: { status: 401 },
        config: { url: '/api/videos', headers: {} }
      };

      // Mock refresh token failure
      mockedAxios.post.mockRejectedValueOnce({
        response: { status: 401, data: { message: 'Invalid refresh token' } }
      });

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      try {
        await responseInterceptor(originalError);
      } catch (error) {
        // Verify logout was called (tokens removed)
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
        
        // Verify redirect to login
        expect(window.location.href).toBe('/login');
      }
    });

    it('should logout user when no refresh token exists', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'accessToken') return 'expired-token';
        return null; // No refresh token
      });

      const originalError = {
        response: { status: 401 },
        config: { url: '/api/videos', headers: {} }
      };

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      try {
        await responseInterceptor(originalError);
      } catch (error) {
        // Verify logout was called
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
        
        // Verify redirect to login
        expect(window.location.href).toBe('/login');
      }
    });

    it('should not retry refresh requests to prevent infinite loops', async () => {
      const originalError = {
        response: { status: 401 },
        config: { 
          url: '/auth/refresh',
          headers: {} 
        }
      };

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      try {
        await responseInterceptor(originalError);
      } catch (error) {
        // Verify refresh was not attempted for refresh endpoint
        expect(mockedAxios.post).not.toHaveBeenCalled();
      }
    });

    it('should not retry requests that already have _retry flag', async () => {
      const originalError = {
        response: { status: 401 },
        config: { 
          url: '/api/videos',
          headers: {},
          _retry: true // Already retried
        }
      };

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      try {
        await responseInterceptor(originalError);
      } catch (error) {
        // Verify refresh was not attempted for already retried request
        expect(mockedAxios.post).not.toHaveBeenCalled();
      }
    });
  });

  describe('Authentication Methods', () => {
    it('should store tokens on successful login', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 1, email: 'test@example.com' }
        }
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
      expect(result.user).toEqual(mockResponse.data.user);
    });

    it('should clear tokens on logout', async () => {
      localStorageMock.getItem.mockReturnValue('some-token');
      mockedAxios.post.mockResolvedValueOnce({});

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle logout gracefully when API call fails', async () => {
      localStorageMock.getItem.mockReturnValue('some-token');
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      // Should still clear tokens even if API call fails
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('Token Validation', () => {
    it('should return true for valid non-expired token', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockToken = `header.${btoa(JSON.stringify({ exp: futureTime }))}.signature`;
      
      localStorageMock.getItem.mockReturnValue(mockToken);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false for expired token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockToken = `header.${btoa(JSON.stringify({ exp: pastTime }))}.signature`;
      
      localStorageMock.getItem.mockReturnValue(mockToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false for malformed token', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});