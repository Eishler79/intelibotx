/**
 * 🔔 Notification Queue Management Hook
 * Part of DL-076 Specialized Hooks Pattern (9th Application)
 * 
 * SPEC_REF: GUARDRAILS.md#P1-P9 + DECISION_LOG.md#DL-076
 * 
 * RESPONSABILIDADES:
 * - Queue state management
 * - Add/remove notifications
 * - Clear all functionality
 * - Unique ID generation
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback } from 'react';

export const useNotificationQueue = () => {
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

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

export default useNotificationQueue;