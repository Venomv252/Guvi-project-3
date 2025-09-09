// frontend/src/services/apiService.js
import axios from 'axios';
import apiErrorHandler from './apiErrorHandler';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
    this.timeout = 10000; // 10 seconds default timeout
  }

  /**
   * Make a GET request with error handling
   */
  async get(url, options = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${url}`, {
        timeout: this.timeout,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, options.errorHandling);
    }
  }

  /**
   * Make a POST request with error handling
   */
  async post(url, data = {}, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}${url}`, data, {
        timeout: this.timeout,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, options.errorHandling);
    }
  }

  /**
   * Make a PUT request with error handling
   */
  async put(url, data = {}, options = {}) {
    try {
      const response = await axios.put(`${this.baseURL}${url}`, data, {
        timeout: this.timeout,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, options.errorHandling);
    }
  }

  /**
   * Make a DELETE request with error handling
   */
  async delete(url, options = {}) {
    try {
      const response = await axios.delete(`${this.baseURL}${url}`, {
        timeout: this.timeout,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, options.errorHandling);
    }
  }

  /**
   * Make a PATCH request with error handling
   */
  async patch(url, data = {}, options = {}) {
    try {
      const response = await axios.patch(`${this.baseURL}${url}`, data, {
        timeout: this.timeout,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, options.errorHandling);
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(url, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${this.baseURL}${url}`, formData, {
        timeout: 30000, // 30 seconds for file uploads
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: options.onProgress,
        ...options
      });
      return response.data;
    } catch (error) {
      throw apiErrorHandler.handleError(error, {
        customMessage: 'File upload failed. Please try again.',
        ...options.errorHandling
      });
    }
  }

  /**
   * Make request with retry logic
   */
  async requestWithRetry(method, url, data = null, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let response;
        switch (method.toLowerCase()) {
          case 'get':
            response = await this.get(url, { ...options, errorHandling: { showNotification: false } });
            break;
          case 'post':
            response = await this.post(url, data, { ...options, errorHandling: { showNotification: false } });
            break;
          case 'put':
            response = await this.put(url, data, { ...options, errorHandling: { showNotification: false } });
            break;
          case 'delete':
            response = await this.delete(url, { ...options, errorHandling: { showNotification: false } });
            break;
          case 'patch':
            response = await this.patch(url, data, { ...options, errorHandling: { showNotification: false } });
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (!apiErrorHandler.isRetryable(error.originalError)) {
          break;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Show error notification on final failure
    throw apiErrorHandler.handleError(lastError.originalError, options.errorHandling);
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    // This would require implementing request cancellation tokens
    // For now, just log the action
    console.log('Cancelling all pending requests...');
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await this.get('/health', {
        timeout: 5000,
        errorHandling: { showNotification: false }
      });
      return response;
    } catch (error) {
      console.warn('API health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();
export default apiService;