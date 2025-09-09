// frontend/src/components/NotificationSystem.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
      timestamp: Date.now()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (message, options = {}) => {
    return addNotification({
      type: 'success',
      title: 'Success',
      message,
      ...options
    });
  };

  const showError = (message, options = {}) => {
    return addNotification({
      type: 'error',
      title: 'Error',
      message,
      duration: 7000, // Longer duration for errors
      ...options
    });
  };

  const showWarning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      title: 'Warning',
      message,
      ...options
    });
  };

  const showInfo = (message, options = {}) => {
    return addNotification({
      type: 'info',
      title: 'Info',
      message,
      ...options
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const containerStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px',
    width: '100%'
  };

  return (
    <div style={containerStyle}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Wait for exit animation
  };

  const getTypeStyles = (type) => {
    const styles = {
      success: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
        icon: '✅'
      },
      error: {
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        icon: '❌'
      },
      warning: {
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        icon: '⚠️'
      },
      info: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        icon: 'ℹ️'
      }
    };
    return styles[type] || styles.info;
  };

  const typeStyles = getTypeStyles(notification.type);

  const itemStyle = {
    backgroundColor: typeStyles.backgroundColor,
    border: `1px solid ${typeStyles.borderColor}`,
    borderRadius: '8px',
    padding: '16px',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
    opacity: isVisible && !isExiting ? 1 : 0,
    transition: 'all 0.3s ease-in-out',
    cursor: 'pointer',
    position: 'relative',
    minHeight: '60px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  };

  const iconStyle = {
    fontSize: '20px',
    flexShrink: 0,
    marginTop: '2px'
  };

  const contentStyle = {
    flex: 1,
    minWidth: 0
  };

  const titleStyle = {
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '4px',
    wordBreak: 'break-word'
  };

  const messageStyle = {
    fontSize: '13px',
    lineHeight: '1.4',
    opacity: 0.9,
    wordBreak: 'break-word'
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '18px',
    opacity: 0.7,
    padding: '4px',
    borderRadius: '4px',
    transition: 'opacity 0.2s'
  };

  const actionsStyle = {
    marginTop: '8px',
    display: 'flex',
    gap: '8px'
  };

  const actionButtonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  return (
    <div style={itemStyle} onClick={handleClose}>
      <div style={iconStyle}>{typeStyles.icon}</div>
      <div style={contentStyle}>
        {notification.title && <div style={titleStyle}>{notification.title}</div>}
        <div style={messageStyle}>{notification.message}</div>
        {notification.actions && notification.actions.length > 0 && (
          <div style={actionsStyle}>
            {notification.actions.map((action, index) => (
              <button
                key={index}
                style={actionButtonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  action.handler();
                  if (action.closeOnClick !== false) {
                    handleClose();
                  }
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        style={closeButtonStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0.7';
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationProvider;