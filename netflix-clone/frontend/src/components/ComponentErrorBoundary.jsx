// frontend/src/components/ComponentErrorBoundary.jsx
import React from 'react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Component Error in ${this.props.componentName}:`, error, errorInfo);
    this.setState({ error });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI for specific components
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h3 style={styles.title}>
              {this.props.componentName || 'Component'} Error
            </h3>
            <p style={styles.message}>
              This component encountered an error and couldn't load properly.
            </p>
            <button onClick={this.handleRetry} style={styles.retryButton}>
              Try Again
            </button>
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
    padding: '2rem',
    backgroundColor: '#111',
    borderRadius: '8px',
    border: '1px solid #333',
    margin: '1rem 0'
  },
  content: {
    textAlign: 'center'
  },
  icon: {
    fontSize: '2rem',
    marginBottom: '1rem'
  },
  title: {
    color: '#fff',
    fontSize: '1.2rem',
    marginBottom: '0.5rem'
  },
  message: {
    color: '#ccc',
    fontSize: '0.9rem',
    marginBottom: '1rem'
  },
  retryButton: {
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default ComponentErrorBoundary;