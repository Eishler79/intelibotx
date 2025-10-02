/**
 * 🔐 useAuthenticatedFetch - Specialized Authenticated HTTP Operations Hook
 * Part of AuthContext.jsx refactoring (DL-079 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Authenticated HTTP operations + HTTP Interceptor integration
 * EXTRACTED FROM: AuthContext.jsx (lines 39-78, 113-126)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * NO REDUNDANCY: Different from useAuthDL008.js (lower level implementation)
 */

import { useCallback } from 'react';
import httpInterceptor from '../../../services/httpInterceptor';
import { useNotifications } from '../../../components/notifications/NotificationSystem';

/**
 * Specialized hook for authenticated HTTP operations
 * Handles: authenticatedFetch, HTTP Interceptor integration, getAuthHeaders
 */
export const useAuthenticatedFetch = (authState, logout) => {
  const { token, user, sessionExpired, setSessionExpired } = authState;

  // Try to get notifications system if available
  let notifications = null;
  try {
    notifications = useNotifications();
  } catch (error) {
    console.warn('Notifications not available in useAuthenticatedFetch');
  }

  // API base URL - DL-001 compliance
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:8000' : 
      'https://intelibotx-production.up.railway.app');

  // Función para hacer llamadas API autenticadas
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    try {
      if (!token) {
        setSessionExpired(true);
        throw new Error('No authentication token available');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // HTTP Interceptor ya maneja 401/403, pero mantenemos compatibilidad
      if (response.status === 401 || response.status === 403) {
        setSessionExpired(true);
        await logout();
        throw new Error('Session expired. Please login again.');
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      
      // Check if it's a token expiration error
      if (error.message.includes('expired') || error.message.includes('TOKEN_EXPIRED')) {
        setSessionExpired(true);
        await logout();
      }
      
      throw error;
    }
  }, [API_BASE_URL, token, setSessionExpired, logout]);

  // Función para obtener headers autenticados (compatibility)
  const getAuthHeaders = useCallback(() => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [token]);

  // Initialize HTTP Interceptor
  const initializeHttpInterceptor = useCallback((loading) => {
    if (!loading) {
      // Initialize HTTP Interceptor with this AuthContext
      httpInterceptor.init({
        token,
        logout,
        user,
        sessionExpired
      }, notifications);
      
      console.log('🔒 HTTP Interceptor initialized with AuthContext and notifications');
    }
  }, [token, logout, user, sessionExpired, notifications]);

  return {
    authenticatedFetch,
    getAuthHeaders,
    initializeHttpInterceptor,
  };
};

export default useAuthenticatedFetch;