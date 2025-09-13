// ✅ DL-040 Phase 5: Notifications Hook
// EXTRACTED FROM: pages/BotsAdvanced.jsx (successMessage state management)
// RISK LEVEL: 10% - Notification state management hook

import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

/**
 * Notifications Hook
 * 
 * React hook for managing notification state in components.
 * Provides a clean interface for displaying and managing notifications
 * while abstracting the underlying notification service implementation.
 * 
 * This hook replaces the scattered successMessage/error state management
 * found across multiple components with a centralized, reusable solution.
 * 
 * @returns {Object} Notification state and methods
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      if (notification.type === 'clear') {
        setNotifications([]);
        return;
      }

      // Add new notification
      setNotifications(prev => [
        ...prev.filter(n => n.id !== notification.id), // Remove duplicates
        {
          ...notification,
          id: notification.timestamp || Date.now()
        }
      ]);

      // Auto-remove notification after duration (except loading)
      if (notification.duration && notification.type !== 'loading') {
        setTimeout(() => {
          removeNotification(notification.timestamp || Date.now());
        }, notification.duration);
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Remove specific notification by ID
   * @param {number} id - Notification ID to remove
   */
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    notificationService.clear();
  };

  /**
   * Get notification style classes based on type
   * @param {string} type - Notification type
   * @returns {string} CSS classes for styling
   */
  const getNotificationClasses = (type) => {
    const baseClasses = 'px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm border';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-900/90 border-green-500/50 text-green-100`;
      case 'error':
        return `${baseClasses} bg-red-900/90 border-red-500/50 text-red-100`;
      case 'warning':
        return `${baseClasses} bg-yellow-900/90 border-yellow-500/50 text-yellow-100`;
      case 'info':
        return `${baseClasses} bg-blue-900/90 border-blue-500/50 text-blue-100`;
      case 'loading':
        return `${baseClasses} bg-gray-900/90 border-gray-500/50 text-gray-100`;
      default:
        return `${baseClasses} bg-gray-900/90 border-gray-500/50 text-gray-100`;
    }
  };

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Icon character/emoji
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'loading':
        return '⏳';
      default:
        return 'ℹ️';
    }
  };

  /**
   * Show success notification
   * @param {string} message - Message to display
   * @param {number} duration - Display duration in ms
   */
  const success = (message, duration) => {
    notificationService.success(message, duration);
  };

  /**
   * Show error notification
   * @param {string} message - Message to display
   * @param {number} duration - Display duration in ms
   */
  const error = (message, duration) => {
    notificationService.error(message, duration);
  };

  /**
   * Show info notification
   * @param {string} message - Message to display
   * @param {number} duration - Display duration in ms
   */
  const info = (message, duration) => {
    notificationService.info(message, duration);
  };

  /**
   * Show warning notification
   * @param {string} message - Message to display
   * @param {number} duration - Display duration in ms
   */
  const warning = (message, duration) => {
    notificationService.warning(message, duration);
  };

  /**
   * Show loading notification
   * @param {string} message - Message to display
   */
  const loading = (message) => {
    notificationService.loading(message);
  };

  /**
   * Show bot-specific success notification
   * @param {string} botName - Bot name
   * @param {string} operation - Operation performed
   * @param {Object} details - Additional details
   */
  const botSuccess = (botName, operation, details) => {
    notificationService.botSuccess(botName, operation, details);
  };

  /**
   * Show bot-specific error notification
   * @param {string} botName - Bot name
   * @param {string} operation - Operation attempted
   * @param {string} errorMessage - Error details
   */
  const botError = (botName, operation, errorMessage) => {
    notificationService.botError(botName, operation, errorMessage);
  };

  /**
   * Show trading notification
   * @param {Object} trade - Trade details
   */
  const tradeNotification = (trade) => {
    notificationService.tradeNotification(trade);
  };

  return {
    // State
    notifications,
    
    // Methods
    removeNotification,
    clearAll,
    
    // Notification methods
    success,
    error,
    info,
    warning,
    loading,
    botSuccess,
    botError,
    tradeNotification,
    
    // Utility methods
    getNotificationClasses,
    getNotificationIcon,
    
    // Computed values
    hasNotifications: notifications.length > 0,
    latestNotification: notifications[notifications.length - 1] || null
  };
}