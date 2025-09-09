// frontend/src/services/apiErrorHandler.js

class ApiErrorHandler {
  constructor() {
    this.retryAttempts = new Map(); // Track retry attempts per request
    this.maxRetries = 3;
    this.retryDelay = 1000; // Base delay in milliseconds
  }

  /**
   * Handle API errors with user-friendly messages and retry logic
   */
  handleError(error, options = {}) {
    const {
      showNotification = true,
      enableRetry = true,
      customMessage = null,
      onRetry = null
    } = options;

    // Extract error information
    const errorInfo = this.extractErrorInfo(error);
    
    // Log error for debugging
    this.logError(error, errorInfo);

    // Create user-friendly error object
    const userError = {
      ...errorInfo,
      retry: enableRetry ? () => this.retryRequest(error, onRetry) : null,
      originalError: error
    };

    // Show notification if enabled
    if (showNotification) {
      this.showErrorNotification(userError, customMessage);
    }

    return userError;
  }

  /**
   * Extract meaningful error information from API response
   */
  extractErrorInfo(error) {
    // Network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          type: 'timeout',
          title: 'Request Timeout',
          message: 'The request took too long to complete. Please check your internet connection and try again.',
          code: 'TIMEOUT',
          isRetryable: true
        };
      }

      if (error.message === 'Network Error') {
        return {
          type: 'network',
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          code: 'NETWORK_ERROR',
          isRetryable: true
        };
      }

      return {
        type: 'network',
        title: 'Network Error',
        message: 'Something went wrong with the network connection. Please try again.',
        code: 'UNKNOWN_NETWORK_ERROR',
        isRetryable: true
      };
    }

    const { status, data } = error.response;
    const errorCode = data?.code || `HTTP_${status}`;
    const errorMessage = data?.message || this.getDefaultErrorMessage(status);

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return {
          type: 'validation',
          title: 'Invalid Request',
          message: errorMessage,
          code: errorCode,
          errors: data?.errors || [],
          isRetryable: false
        };

      case 401:
        return {
          type: 'authentication',
          title: 'Authentication Required',
          message: errorMessage,
          code: errorCode,
          isRetryable: false
        };

      case 403:
        return {
          type: 'authorization',
          title: 'Access Denied',
          message: errorMessage,
          code: errorCode,
          isRetryable: false
        };

      case 404:
        return {
          type: 'not_found',
          title: 'Not Found',
          message: errorMessage,
          code: errorCode,
          isRetryable: false
        };

      case 409:
        return {
          type: 'conflict',
          title: 'Conflict',
          message: errorMessage,
          code: errorCode,
          isRetryable: false
        };

      case 422:
        return {
          type: 'validation',
          title: 'Validation Error',
          message: errorMessage,
          code: errorCode,
          errors: data?.errors || [],
          isRetryable: false
        };

      case 423:
        return {
          type: 'locked',
          title: 'Account Locked',
          message: errorMessage,
          code: errorCode,
          isRetryable: false
        };

      case 429:
        return {
          type: 'rate_limit',
          title: 'Too Many Requests',
          message: 'You\'ve made too many requests. Please wait a moment and try again.',
          code: errorCode,
          retryAfter: error.response.headers['retry-after'],
          isRetryable: true
        };

      case 500:
        return {
          type: 'server',
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again in a few moments.',
          code: errorCode,
          isRetryable: true
        };

      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again in a few moments.',
          code: errorCode,
          isRetryable: true
        };

      default:
        return {
          type: 'unknown',
          title: 'Unexpected Error',
          message: errorMessage || 'An unexpected error occurred. Please try again.',
          code: errorCode,
          isRetryable: status >= 500
        };
    }
  }

  /**
   * Get default error message for HTTP status codes
   */
  getDefaultErrorMessage(status) {
    const messages = {
      400: 'The request was invalid. Please check your input and try again.',
      401: 'You need to log in to access this resource.',
      403: 'You don\'t have permission to access this resource.',
      404: 'The requested resource was not found.',
      409: 'There was a conflict with the current state of the resource.',
      422: 'The request was well-formed but contains invalid data.',
      423: 'The resource is currently locked.',
      429: 'Too many requests. Please wait and try again.',
      500: 'Internal server error. Please try again later.',
      502: 'Bad gateway. The server is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. The request took too long to process.'
    };

    return messages[status] || 'An unexpected error occurred.';
  }

  /**
   * Retry failed request with exponential backoff
   */
  async retryRequest(originalError, onRetry) {
    const requestKey = this.getRequestKey(originalError.config);
    const attempts = this.retryAttempts.get(requestKey) || 0;

    if (attempts >= this.maxRetries) {
      this.retryAttempts.delete(requestKey);
      throw new Error('Maximum retry attempts exceeded');
    }

    // Calculate delay with exponential backoff
    const delay = this.retryDelay * Math.pow(2, attempts);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay));

    // Increment retry count
    this.retryAttempts.set(requestKey, attempts + 1);

    try {
      // Execute retry callback if provided
      if (onRetry) {
        return await onRetry();
      }

      // Default retry: repeat the original request
      const axios = require('axios').default;
      const response = await axios(originalError.config);
      
      // Clear retry count on success
      this.retryAttempts.delete(requestKey);
      
      return response;
    } catch (retryError) {
      // If retry fails, handle the new error
      return this.handleError(retryError, { enableRetry: attempts < this.maxRetries - 1 });
    }
  }

  /**
   * Generate unique key for request to track retries
   */
  getRequestKey(config) {
    return `${config.method}_${config.url}_${JSON.stringify(config.data || {})}`;
  }

  /**
   * Log error for debugging and monitoring
   */
  logError(error, errorInfo) {
    const logData = {
      timestamp: new Date().toISOString(),
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      errorType: errorInfo.type,
      errorCode: errorInfo.code,
      message: errorInfo.message,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId()
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 API Error');
      console.error('Error Info:', errorInfo);
      console.error('Original Error:', error);
      console.error('Log Data:', logData);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(logData, error);
    }
  }

  /**
   * Show error notification to user
   */
  showErrorNotification(errorInfo, customMessage) {
    const message = customMessage || errorInfo.message;
    
    // For now, use console.warn - in a real app, this would integrate with a toast/notification system
    console.warn(`${errorInfo.title}: ${message}`);
    
    // Future: Integrate with notification system
    // notificationService.showError({
    //   title: errorInfo.title,
    //   message: message,
    //   duration: errorInfo.isRetryable ? 5000 : 3000,
    //   actions: errorInfo.retry ? [{ label: 'Retry', action: errorInfo.retry }] : []
    // });
  }

  /**
   * Get current user ID for error tracking
   */
  getCurrentUserId() {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch (e) {
      return 'anonymous';
    }
    return 'anonymous';
  }

  /**
   * Send error to external tracking service
   */
  sendToErrorTracking(logData, originalError) {
    // Future: Integrate with error tracking service like Sentry
    // Sentry.captureException(originalError, {
    //   tags: {
    //     errorType: logData.errorType,
    //     errorCode: logData.errorCode
    //   },
    //   extra: logData
    // });
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error) {
    const errorInfo = this.extractErrorInfo(error);
    return errorInfo.isRetryable;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error) {
    const errorInfo = this.extractErrorInfo(error);
    return errorInfo.message;
  }
}

// Create singleton instance
const apiErrorHandler = new ApiErrorHandler();
export default apiErrorHandler;