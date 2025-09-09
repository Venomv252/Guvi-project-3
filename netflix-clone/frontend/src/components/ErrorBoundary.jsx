// frontend/src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to external service (future enhancement)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This would send error to logging service like Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      errorId: this.state.errorId
    };

    // For now, just log to console
    console.log('Error logged:', errorData);
    
    // Future: Send to error tracking service
    // errorTrackingService.logError(errorData);
  };

  getUserId = () => {
    // Get user ID from localStorage or context
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
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.iconContainer}>
              <div style={styles.errorIcon}>⚠️</div>
            </div>
            
            <h1 style={styles.title}>Oops! Something went wrong</h1>
            
            <p style={styles.message}>
              We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue.
            </p>

            <div style={styles.errorDetails}>
              <p style={styles.errorId}>Error ID: {this.state.errorId}</p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={styles.debugInfo}>
                  <summary style={styles.debugSummary}>Debug Information (Development Only)</summary>
                  <div style={styles.debugContent}>
                    <h4>Error:</h4>
                    <pre style={styles.errorText}>{this.state.error.toString()}</pre>
                    
                    <h4>Component Stack:</h4>
                    <pre style={styles.errorText}>{this.state.errorInfo?.componentStack}</pre>
                    
                    <h4>Stack Trace:</h4>
                    <pre style={styles.errorText}>{this.state.error.stack}</pre>
                  </div>
                </details>
              )}
            </div>

            <div style={styles.actions}>
              <button 
                onClick={this.handleRetry} 
                style={styles.retryButton}
              >
                Try Again
              </button>
              
              <button 
                onClick={this.handleReload} 
                style={styles.reloadButton}
              >
                Reload Page
              </button>
              
              <button 
                onClick={() => window.location.href = '/'} 
                style={styles.homeButton}
              >
                Go Home
              </button>
            </div>

            <div style={styles.supportInfo}>
              <p style={styles.supportText}>
                If this problem persists, please contact our support team with the error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif'
  },
  errorCard: {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '3rem',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    border: '1px solid #333'
  },
  iconContainer: {
    marginBottom: '2rem'
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1rem'
  },
  title: {
    color: '#fff',
    fontSize: '2rem',
    marginBottom: '1rem',
    fontWeight: 'bold'
  },
  message: {
    color: '#ccc',
    fontSize: '1.1rem',
    lineHeight: '1.6',
    marginBottom: '2rem'
  },
  errorDetails: {
    marginBottom: '2rem'
  },
  errorId: {
    color: '#666',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    marginBottom: '1rem'
  },
  debugInfo: {
    textAlign: 'left',
    backgroundColor: '#222',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '1rem',
    marginTop: '1rem'
  },
  debugSummary: {
    color: '#e50914',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem'
  },
  debugContent: {
    marginTop: '1rem'
  },
  errorText: {
    color: '#ccc',
    fontSize: '0.8rem',
    backgroundColor: '#000',
    padding: '0.5rem',
    borderRadius: '4px',
    overflow: 'auto',
    maxHeight: '200px',
    marginBottom: '1rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '2rem'
  },
  retryButton: {
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  reloadButton: {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  homeButton: {
    backgroundColor: 'transparent',
    color: '#ccc',
    border: '1px solid #666',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  supportInfo: {
    borderTop: '1px solid #333',
    paddingTop: '1.5rem'
  },
  supportText: {
    color: '#666',
    fontSize: '0.9rem',
    lineHeight: '1.4'
  }
};

export default ErrorBoundary;