// frontend/src/components/EmptyState.jsx
import React from 'react';

const EmptyState = ({ 
  icon = '📭',
  title = 'No content available',
  message = 'There\'s nothing to show here right now.',
  actionButton = null,
  size = 'medium'
}) => {
  const sizes = {
    small: {
      container: { padding: '2rem' },
      icon: { fontSize: '3rem' },
      title: { fontSize: '1.2rem' },
      message: { fontSize: '0.9rem' }
    },
    medium: {
      container: { padding: '4rem 2rem' },
      icon: { fontSize: '4rem' },
      title: { fontSize: '1.5rem' },
      message: { fontSize: '1rem' }
    },
    large: {
      container: { padding: '6rem 2rem' },
      icon: { fontSize: '5rem' },
      title: { fontSize: '2rem' },
      message: { fontSize: '1.1rem' }
    }
  };

  const sizeConfig = sizes[size] || sizes.medium;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#ccc',
    ...sizeConfig.container
  };

  const iconStyle = {
    marginBottom: '1.5rem',
    opacity: 0.7,
    ...sizeConfig.icon
  };

  const titleStyle = {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: '1rem',
    ...sizeConfig.title
  };

  const messageStyle = {
    lineHeight: '1.6',
    maxWidth: '400px',
    marginBottom: actionButton ? '2rem' : '0',
    ...sizeConfig.message
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>{icon}</div>
      <h3 style={titleStyle}>{title}</h3>
      <p style={messageStyle}>{message}</p>
      {actionButton}
    </div>
  );
};

// Pre-built empty states for common scenarios
export const NoVideosFound = ({ onRefresh }) => (
  <EmptyState
    icon="🎬"
    title="No videos found"
    message="We couldn't find any videos matching your criteria. Try adjusting your search or browse our categories."
    actionButton={onRefresh && (
      <button 
        onClick={onRefresh}
        style={{
          backgroundColor: '#e50914',
          color: '#fff',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Refresh
      </button>
    )}
  />
);

export const NoSearchResults = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    icon="🔍"
    title="No results found"
    message={`We couldn't find any videos for "${searchTerm}". Try different keywords or browse our categories.`}
    actionButton={onClearSearch && (
      <button 
        onClick={onClearSearch}
        style={{
          backgroundColor: 'transparent',
          color: '#ccc',
          border: '1px solid #666',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Clear Search
      </button>
    )}
  />
);

export const SubscriptionRequired = ({ onSubscribe }) => (
  <EmptyState
    icon="🔒"
    title="Subscription Required"
    message="You need an active subscription to access this content. Choose a plan that works for you."
    actionButton={onSubscribe && (
      <button 
        onClick={onSubscribe}
        style={{
          backgroundColor: '#e50914',
          color: '#fff',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        View Plans
      </button>
    )}
  />
);

export const NetworkError = ({ onRetry }) => (
  <EmptyState
    icon="📡"
    title="Connection Problem"
    message="We're having trouble connecting to our servers. Please check your internet connection and try again."
    actionButton={onRetry && (
      <button 
        onClick={onRetry}
        style={{
          backgroundColor: '#e50914',
          color: '#fff',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Try Again
      </button>
    )}
  />
);

export const MaintenanceMode = () => (
  <EmptyState
    icon="🔧"
    title="Under Maintenance"
    message="We're currently performing maintenance to improve your experience. Please check back in a few minutes."
    size="large"
  />
);

export default EmptyState;