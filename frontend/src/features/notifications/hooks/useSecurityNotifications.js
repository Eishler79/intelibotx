/**
 * 🔐 Security Notifications Hook
 * Part of DL-076 Specialized Hooks Pattern (9th Application)
 * 
 * SPEC_REF: GUARDRAILS.md#P1-P9 + DECISION_LOG.md#DL-076 + DL-008 authentication
 * 
 * RESPONSABILIDADES:
 * - Token expiration notifications
 * - Rate limiting alerts
 * - Authentication error messages
 * - Connection error handling
 * - Security-specific notification formatting
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useCallback } from 'react';

export const useSecurityNotifications = (addNotification) => {
  
  // Token expiration notification
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

  // Rate limit notification
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

  // Authentication error notification
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

  // Connection error notification
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

  return {
    showTokenExpiration,
    showRateLimit,
    showAuthenticationError,
    showConnectionError
  };
};

export default useSecurityNotifications;