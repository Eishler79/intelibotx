/**
 * 🔐 useAuthDL008 - Hook Centralizado Authentication Pattern
 * Implementa DL-008 pattern del backend en frontend de forma consistente
 * 
 * SPEC_REF: GUARDRAILS.md#DL-008 + DECISION_LOG.md#DL-008
 * PROPÓSITO: Centralizar authentication siguiendo patrón backend get_current_user_safe()
 * 
 * CARACTERÍSTICAS:
 * - Single source of truth para authentication headers
 * - Consistent error handling across all API calls
 * - Integration con HTTP Interceptor para token expiration
 * - Fallback graceful si AuthContext no disponible
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook centralizado que implementa DL-008 Authentication Pattern
 * 
 * @returns {Object} Authentication utilities siguiendo DL-008 pattern
 */
export const useAuthDL008 = () => {
  // Get auth state from context
  const authContext = useAuth();
  
  const { 
    token, 
    user, 
    logout, 
    isAuthenticated, 
    sessionExpired 
  } = authContext || {};

  /**
   * Get authentication headers siguiendo DL-008 pattern
   * Equivalent to backend's get_current_user_safe() validation
   */
  const getAuthHeaders = useCallback(() => {
    // DL-008: Validate authentication state like backend
    if (!token) {
      console.warn('🔑 DL-008: No authentication token available');
      throw new Error('Authentication required - please login first');
    }
    
    if (sessionExpired) {
      console.warn('🔑 DL-008: Session expired detected');
      throw new Error('Session expired - please login again');
    }
    
    if (!isAuthenticated) {
      console.warn('🔑 DL-008: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token, isAuthenticated, sessionExpired]);

  /**
   * Authenticated fetch siguiendo DL-008 pattern
   * Handles authentication, errors, and token expiration uniformly
   */
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    try {
      // Get auth headers using DL-008 validation
      const authHeaders = getAuthHeaders();
      
      // Prepare request with authentication
      const requestOptions = {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers
        }
      };
      
      console.log('🔐 DL-008: Making authenticated request to:', url);
      
      // Execute fetch with authentication
      const response = await fetch(url, requestOptions);
      
      // DL-008: Handle authentication errors uniformly
      if (response.status === 401 || response.status === 403) {
        console.error('🚨 DL-008: Authentication failed on request:', url);
        
        // Trigger logout like backend would invalidate session
        if (logout) {
          await logout();
        }
        
        throw new Error('Authentication failed - session terminated');
      }
      
      return response;
      
    } catch (error) {
      console.error('🚨 DL-008: Authenticated fetch error:', error);
      
      // Handle token expiration errors
      if (error.message.includes('Authentication required') || 
          error.message.includes('Session expired') ||
          error.message.includes('not authenticated')) {
        
        // Auto-logout on authentication errors (DL-008 pattern)
        if (logout && !sessionExpired) {
          console.log('🔑 DL-008: Auto-logout triggered by auth error');
          await logout();
        }
      }
      
      throw error;
    }
  }, [getAuthHeaders, logout, sessionExpired]);

  /**
   * Validated API call wrapper with DL-008 error handling
   */
  const apiCall = useCallback(async (url, options = {}) => {
    try {
      const response = await authenticatedFetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData = null;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          console.warn('Non-JSON error response:', errorText);
        }
        
        throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('🚨 DL-008: API call failed:', error);
      throw error;
    }
  }, [authenticatedFetch]);

  /**
   * Get current user info (DL-008 equivalent to backend get_current_user_safe)
   */
  const getCurrentUser = useCallback(() => {
    if (!isAuthenticated || !user) {
      throw new Error('No authenticated user available');
    }
    
    return user;
  }, [isAuthenticated, user]);

  /**
   * Check if user is properly authenticated (DL-008 validation)
   */
  const validateAuthentication = useCallback(() => {
    const checks = {
      hasToken: !!token,
      isAuthenticated: !!isAuthenticated,
      hasUser: !!user,
      sessionValid: !sessionExpired,
      contextAvailable: !!authContext
    };
    
    const isValid = Object.values(checks).every(Boolean);
    
    if (!isValid) {
      console.warn('🚨 DL-008: Authentication validation failed:', checks);
    }
    
    return {
      isValid,
      checks,
      user: isValid ? user : null
    };
  }, [token, isAuthenticated, user, sessionExpired, authContext]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Core authentication utilities
    getAuthHeaders,
    authenticatedFetch,
    apiCall,
    getCurrentUser,
    validateAuthentication,
    
    // Auth state (read-only)
    isAuthenticated: !!isAuthenticated,
    user: user || null,
    token: token || null,
    sessionExpired: !!sessionExpired,
    
    // Auth actions
    logout: logout || (() => console.warn('Logout not available'))
  }), [
    getAuthHeaders,
    authenticatedFetch, 
    apiCall,
    getCurrentUser,
    validateAuthentication,
    isAuthenticated,
    user,
    token,
    sessionExpired,
    logout
  ]);
};

export default useAuthDL008;