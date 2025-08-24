/**
 * 🕒 Session Manager - Real-time Session Status & Auto-refresh
 * Integrado con sistema de seguridad backend para mostrar estado de sesión
 * 
 * CARACTERÍSTICAS:
 * - Token expiration countdown
 * - Auto-refresh token functionality
 * - Session health monitoring
 * - User-friendly session status display
 * - Integration with HTTP Interceptor
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../notifications/NotificationSystem';

const SessionManager = () => {
  const { token, user, logout, sessionExpired, isAuthenticated } = useAuth();
  const { showWarning, showInfo } = useNotifications();
  
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionHealth, setSessionHealth] = useState('healthy'); // healthy, warning, expired
  const [lastActivity, setLastActivity] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Parse JWT token to get expiration
  const parseTokenExpiration = useCallback((token) => {
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }, []);

  // Calculate time remaining until token expires
  const calculateTimeRemaining = useCallback(() => {
    if (!token) return 0;
    
    const expirationTime = parseTokenExpiration(token);
    if (!expirationTime) return 0;
    
    const now = Date.now();
    const remaining = Math.max(0, expirationTime - now);
    
    return remaining;
  }, [token, parseTokenExpiration]);

  // Update session health based on time remaining
  const updateSessionHealth = useCallback((timeLeft) => {
    const minutes = timeLeft / (1000 * 60);
    
    if (timeLeft <= 0) {
      setSessionHealth('expired');
    } else if (minutes <= 5) {
      setSessionHealth('warning');
    } else {
      setSessionHealth('healthy');
    }
  }, []);

  // Track user activity for session management
  const trackActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  // Setup activity listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [trackActivity]);

  // Update time remaining every second
  useEffect(() => {
    if (!isAuthenticated || sessionExpired) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      updateSessionHealth(remaining);
    };

    updateTimer(); // Initial calculation
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, sessionExpired, calculateTimeRemaining, updateSessionHealth]);

  // Handle session warnings
  useEffect(() => {
    if (!isAuthenticated || sessionExpired) return;

    const minutes = timeRemaining / (1000 * 60);
    
    // Show warning at 5 minutes remaining
    if (minutes <= 5 && minutes > 4.9 && sessionHealth === 'warning') {
      showWarning(
        'Your session will expire in 5 minutes. Please save your work.',
        8000,
        { persistent: true }
      );
    }
    
    // Show final warning at 1 minute remaining
    if (minutes <= 1 && minutes > 0.9 && sessionHealth === 'warning') {
      showWarning(
        'Session expires in 1 minute. You will be logged out automatically.',
        10000,
        { persistent: true }
      );
    }
  }, [timeRemaining, sessionHealth, isAuthenticated, sessionExpired, showWarning]);

  // Handle auto-logout when token expires
  useEffect(() => {
    if (timeRemaining <= 0 && isAuthenticated && !sessionExpired) {
      console.log('🕒 Token expired - triggering auto-logout');
      logout();
    }
  }, [timeRemaining, isAuthenticated, sessionExpired, logout]);

  // Format time remaining for display
  const formatTimeRemaining = (timeMs) => {
    if (timeMs <= 0) return '0:00';
    
    const minutes = Math.floor(timeMs / (1000 * 60));
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format last activity time
  const formatLastActivity = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  // Get status color based on session health
  const getStatusColor = () => {
    switch (sessionHealth) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (sessionHealth) {
      case 'healthy':
        return '🟢';
      case 'warning':
        return '🟡';
      case 'expired':
        return '🔴';
      default:
        return '⚪';
    }
  };

  // Don't render if user is not authenticated
  if (!isAuthenticated || sessionExpired) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-lg" role="img" aria-label="status">
            {getStatusIcon()}
          </span>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Session Status
            </h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {sessionHealth === 'healthy' && 'Active & Secure'}
              {sessionHealth === 'warning' && 'Expiring Soon'}
              {sessionHealth === 'expired' && 'Session Expired'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-mono text-gray-900">
            {formatTimeRemaining(timeRemaining)}
          </p>
          <p className="text-xs text-gray-500">
            remaining
          </p>
        </div>
      </div>
      
      {/* Session Details (collapsible) */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">User:</span>
            <p className="truncate">{user?.email || 'Unknown'}</p>
          </div>
          <div>
            <span className="font-medium">Last Activity:</span>
            <p>{formatLastActivity(lastActivity)}</p>
          </div>
        </div>
        
        {sessionHealth === 'warning' && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            ⚠️ Session expiring soon. Save your work to avoid data loss.
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionManager;