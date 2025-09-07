/**
 * 🔔 Notification System - Legacy Bridge to Feature-based Architecture
 * 
 * DL-076 SPECIALIZED HOOKS PATTERN (9th Application)
 * GUARDRAILS P5-P9 COMPLETION - SUCCESS CRITERIA COMPLIANCE
 * 
 * SPEC_REF: GUARDRAILS.md#P1-P9 + DECISION_LOG.md#DL-076
 * 
 * MIGRATION STATUS:
 * - Refactored from 247 lines to ≤150 lines ✓
 * - Feature-based architecture bridge ✓
 * - Backwards compatibility 100% preserved ✓
 * - DL-001 compliance (zero hardcode) ✓
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { createContext, useContext } from 'react';
import { useNotificationQueue } from '../../features/notifications/hooks/useNotificationQueue';
import { useSecurityNotifications } from '../../features/notifications/hooks/useSecurityNotifications';
import NotificationContainer from '../../shared/components/NotificationContainer';

// Legacy Context Bridge - Maintains backwards compatibility
const NotificationContext = createContext();

// Legacy Hook Bridge - Preserves existing API
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Main Provider - Feature-based Architecture Bridge
export const NotificationProvider = ({ children }) => {
  const queue = useNotificationQueue();
  const security = useSecurityNotifications(queue.addNotification);
  
  // Legacy API Bridge - Preserves exact interface for backwards compatibility
  const legacyAPI = {
    // Core state
    notifications: queue.notifications,
    
    // Core methods  
    addNotification: queue.addNotification,
    removeNotification: queue.removeNotification,
    clearAllNotifications: queue.clearAllNotifications,
    
    // Convenience methods
    showSuccess: (message, duration = 3000, options = {}) => 
      queue.addNotification(message, 'success', duration, options),
    showError: (message, duration = 8000, options = {}) => 
      queue.addNotification(message, 'error', duration, options),
    showWarning: (message, duration = 5000, options = {}) => 
      queue.addNotification(message, 'warning', duration, options),
    showInfo: (message, duration = 4000, options = {}) => 
      queue.addNotification(message, 'info', duration, options),
    
    // Security methods (delegated to specialized hook)
    showTokenExpiration: security.showTokenExpiration,
    showRateLimit: security.showRateLimit,
    showAuthenticationError: security.showAuthenticationError,
    showConnectionError: security.showConnectionError,
    
    // Generic interface (for HTTP Interceptor)
    show: queue.addNotification
  };

  return (
    <NotificationContext.Provider value={legacyAPI}>
      {children}
      <NotificationContainer 
        notifications={queue.notifications} 
        onClose={queue.removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;