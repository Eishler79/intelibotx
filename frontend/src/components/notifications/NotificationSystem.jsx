/**
 * 🔔 Notification System - User Alerts & Security Messages
 * Integrado con HTTP Interceptor para mostrar errores de autenticación
 * 
 * CARACTERÍSTICAS:
 * - Auto-dismissible notifications
 * - Diferentes tipos: success, error, warning, info
 * - Queue system para múltiples notificaciones
 * - Integración con token expiration UX
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Notification Context
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Component
const NotificationItem = ({ notification, onClose }) => {
  const { id, message, type, duration, persistent } = notification;

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onClose]);

  const getNotificationStyles = () => {
    const baseClasses = "mb-4 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getNotificationStyles()}>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <span className="text-lg" role="img" aria-label={type}>
            {getIcon()}
          </span>
          <div className="flex-1">
            <p className="font-medium">
              {message}
            </p>
            {notification.details && (
              <p className="text-sm mt-1 opacity-80">
                {notification.details}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onClose(id)}
          className="text-gray-400 hover:text-gray-600 ml-4 text-xl"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((message, type = 'info', duration = 5000, options = {}) => {
    const id = Date.now() + Math.random();
    
    const notification = {
      id,
      message,
      type,
      duration,
      persistent: options.persistent || false,
      details: options.details || null,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, notification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Specialized notification methods
  const showSuccess = useCallback((message, duration = 3000, options = {}) => {
    return addNotification(message, 'success', duration, options);
  }, [addNotification]);

  const showError = useCallback((message, duration = 8000, options = {}) => {
    return addNotification(message, 'error', duration, options);
  }, [addNotification]);

  const showWarning = useCallback((message, duration = 5000, options = {}) => {
    return addNotification(message, 'warning', duration, options);
  }, [addNotification]);

  const showInfo = useCallback((message, duration = 4000, options = {}) => {
    return addNotification(message, 'info', duration, options);
  }, [addNotification]);

  // Security-specific notifications
  const showTokenExpiration = useCallback(() => {
    return addNotification(
      'Your session has expired. You will be redirected to login.',
      'warning',
      5000,
      {
        details: 'Please save any unsaved work before continuing.',
        persistent: true
      }
    );
  }, [addNotification]);

  const showRateLimit = useCallback((retryAfter = 60) => {
    return addNotification(
      `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
      'warning',
      retryAfter * 1000,
      {
        details: 'Too many requests have been made. Please slow down.',
        persistent: false
      }
    );
  }, [addNotification]);

  const showAuthenticationError = useCallback(() => {
    return addNotification(
      'Authentication failed. Please login again.',
      'error',
      6000,
      {
        details: 'Your session may have expired or credentials are invalid.',
        persistent: false
      }
    );
  }, [addNotification]);

  const showConnectionError = useCallback(() => {
    return addNotification(
      'Connection error. Please check your internet connection.',
      'error',
      5000,
      {
        details: 'Unable to reach the server. Retrying automatically...',
        persistent: false
      }
    );
  }, [addNotification]);

  // Generic notification system interface for HTTP Interceptor
  const show = useCallback((message, type = 'info', duration = 5000, options = {}) => {
    return addNotification(message, type, duration, options);
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTokenExpiration,
    showRateLimit,
    showAuthenticationError,
    showConnectionError,
    show // Generic interface for HTTP Interceptor
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        onClose={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Notification Container
const NotificationContainer = ({ notifications, onClose }) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
};

export default NotificationProvider;