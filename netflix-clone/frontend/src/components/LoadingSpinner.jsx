// frontend/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#e50914', 
  message = '', 
  overlay = false,
  fullScreen = false 
}) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px',
    xlarge: '80px'
  };

  const spinnerSize = sizes[size] || sizes.medium;

  const spinnerStyle = {
    width: spinnerSize,
    height: spinnerSize,
    border: `3px solid rgba(255, 255, 255, 0.1)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    ...(overlay && {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000
    }),
    ...(fullScreen && {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000',
      zIndex: 9999
    }),
    ...(!overlay && !fullScreen && {
      padding: '2rem'
    })
  };

  const messageStyle = {
    color: '#ccc',
    fontSize: '0.9rem',
    textAlign: 'center',
    maxWidth: '300px'
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={containerStyle}>
        <div style={spinnerStyle}></div>
        {message && <div style={messageStyle}>{message}</div>}
      </div>
    </>
  );
};

export default LoadingSpinner;