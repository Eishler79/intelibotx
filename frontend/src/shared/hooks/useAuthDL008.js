/**
 * 🔐 useAuthDL008 - Centralized Authentication Hook (DL-008 Pattern)
 * 
 * SPEC_REF: DECISION_LOG.md#DL-008 - Authentication Refactoring Pattern
 * 
 * ROLLBACK PARCIAL - BRIDGE SOLUTION:
 * - Mantiene original interface para 11 dependent components
 * - Usa direct hooks internamente (no wrapper context)
 * - Preserva funcionalidad DL-008 authentication pattern
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useCallback } from 'react';
// BRIDGE: Use direct hooks instead of useAuth context
import useAuthState from '../../features/auth/hooks/useAuthState';
import useLogout from '../../features/auth/hooks/useLogout';

/**
 * Hook centralizado que implementa DL-008 Authentication Pattern
 * BRIDGE SOLUTION: Direct hooks internally, same interface externally
 */
export const useAuthDL008 = () => {
  // BRIDGE: Use direct hooks instead of context
  const authState = useAuthState();
  const { logout } = useLogout(authState);
  
  const { 
    token, 
    user, 
    isAuthenticated, 
    sessionExpired 
  } = authState || {};

  /**
   * Get authentication headers siguiendo DL-008 pattern
   */
  const getAuthHeaders = useCallback(() => {
    if (!isAuthenticated || !token || sessionExpired) {
      console.warn('🔐 DL-008: No valid authentication state');
      return {};
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, [token, isAuthenticated, sessionExpired]);

  /**
   * Authenticated fetch siguiendo DL-008 pattern
   */
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    try {
      const authHeaders = getAuthHeaders();
      
      const requestOptions = {
        ...options,
        headers: {
          ...authHeaders,
          ...options.headers
        }
      };
      
      console.log('🔐 DL-008: Making authenticated request to:', url);
      
      const response = await fetch(url, requestOptions);
      
      if (response.status === 401) {
        console.error('🔐 DL-008: Authentication failed (401)');
        if (logout) {
          logout();
        }
        throw new Error('Authentication required');
      }
      
      if (response.status === 403) {
        console.error('🔐 DL-008: Authorization failed (403)');
        throw new Error('Access forbidden');
      }
      
      return response;
      
    } catch (error) {
      console.error('🔐 DL-008: Authenticated fetch error:', error);
      
      if (error.message.includes('Authentication') && logout) {
        logout();
      }
      
      throw error;
    }
  }, [getAuthHeaders, logout]);

  /**
   * Check if user is properly authenticated
   */
  const isUserAuthenticated = useCallback(() => {
    return !!(isAuthenticated && token && user && !sessionExpired);
  }, [isAuthenticated, token, user, sessionExpired]);

  /**
   * Get current user info with DL-008 validation
   */
  const getCurrentUser = useCallback(() => {
    if (!isUserAuthenticated()) {
      return null;
    }
    
    return {
      id: user?.id,
      email: user?.email,
      is_verified: user?.is_verified || false,
      created_at: user?.created_at,
    };
  }, [user, isUserAuthenticated]);

  return {
    // Authentication utilities
    authenticatedFetch,
    getAuthHeaders,
    
    // Authentication state
    isAuthenticated: isUserAuthenticated(),
    user: getCurrentUser(),
    token,
    
    // Authentication actions
    logout
  };
};

export default useAuthDL008;