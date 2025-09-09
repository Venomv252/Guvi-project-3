// frontend/src/services/authService.js
import axios from 'axios';
import apiErrorHandler from './apiErrorHandler';

class AuthService {
  constructor() {
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add token to headers
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh and errors
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              await this.logout();
              window.location.href = '/login';
              return Promise.reject(apiErrorHandler.handleError(error, { 
                customMessage: 'Your session has expired. Please log in again.' 
              }));
            }

            const response = await axios.post(
              `${process.env.REACT_APP_API_URL}/auth/refresh`,
              { refreshToken },
              { _retry: true } // Prevent infinite loop
            );

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            // Update stored tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Update default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);

          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            await this.logout();
            window.location.href = '/login';
            return Promise.reject(apiErrorHandler.handleError(refreshError, {
              customMessage: 'Session refresh failed. Please log in again.'
            }));
          }
        }

        // Handle other errors with the error handler
        const handledError = apiErrorHandler.handleError(error, {
          showNotification: !originalRequest._skipErrorHandling
        });

        return Promise.reject(handledError);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password
      }, {
        _skipErrorHandling: false // Allow error handling for login
      });

      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      // Re-throw the handled error for the component to use
      throw error;
    }
  }

  async register(email, password, name) {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, {
        email,
        password,
        name
      }, {
        _skipErrorHandling: false // Allow error handling for registration
      });

      const { accessToken, refreshToken, user } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return { user, accessToken, refreshToken };
    } catch (error) {
      // Re-throw the handled error for the component to use
      throw error;
    }
  }

  async logout() {
    // Prevent multiple simultaneous logout calls
    if (this._loggingOut) {
      return;
    }
    
    this._loggingOut = true;
    
    try {
      // Only call logout endpoint if we have a token
      const token = localStorage.getItem('accessToken');
      if (token) {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, {
          timeout: 5000, // 5 second timeout
          _skipErrorHandling: true // Skip error handling for logout
        });
      }
    } catch (error) {
      // Only log non-rate-limit errors
      if (error.response?.status !== 429) {
        console.error('Logout API call failed:', error);
      }
      // Continue with local cleanup even if API call fails
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Remove default header
      delete axios.defaults.headers.common['Authorization'];
      
      this._loggingOut = false;
    }
  }

  getCurrentUser() {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // Decode JWT to get user info (without verification - just for display)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired (with 5 minute buffer)
      return payload.exp > (currentTime + 300);
    } catch (error) {
      return false;
    }
  }

  getToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }
}

// Create singleton instance
const authService = new AuthService();
export default authService;