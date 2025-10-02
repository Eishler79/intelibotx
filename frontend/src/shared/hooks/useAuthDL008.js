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
// ✅ P4 ROOT CAUSE FIX: Use AuthContext (same as BotsAdvanced) to prevent state sync issues
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hook centralizado que implementa DL-008 Authentication Pattern
 * ✅ P4 ROOT CAUSE FIX: Uses AuthContext directly to prevent timing issues with useAuthState
 *
 * PROBLEM IDENTIFIED:
 * - useAuthState reads from localStorage in useEffect (async)
 * - authenticatedFetch runs BEFORE useAuthState.useEffect completes
 * - getAuthHeaders sees isAuthenticated=false → returns empty headers
 * - Request goes WITHOUT Authorization token → 401 → logout()
 *
 * SOLUTION:
 * - Use AuthContext (single source of truth, same as ProtectedRoute)
 * - AuthContext has token in memory immediately after login
 * - No timing issues, no state duplication
 */
export const useAuthDL008 = () => {
  // ✅ P4: Use AuthContext directly (same as BotsAdvanced, same as ProtectedRoute)
  const { token, user, isAuthenticated, sessionExpired, logout } = useAuth();

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
   * ✅ P3: ERROR HANDLING - Solo logout en 401 confirmado, NO en errores de red
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

      // ✅ P3: CRITICAL FIX - Solo logout si el servidor responde 401 explícitamente
      if (response.status === 401) {
        console.error('🔐 DL-008: Authentication failed (401) - Invalid/expired token');
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

      // ✅ P3: CRITICAL FIX - NO hacer logout en errores de red/CORS
      // Solo logout si el error es explícitamente de autenticación (401)
      // Los errores de red (Load failed, CORS) NO deben causar logout
      if (error.message === 'Authentication required' && logout) {
        // Ya se hizo logout arriba en el if (401), esto es redundante pero seguro
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