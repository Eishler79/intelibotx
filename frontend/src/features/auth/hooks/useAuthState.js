/**
 * 🔐 useAuthState - Specialized Authentication State Management Hook
 * Part of AuthContext.jsx refactoring (DL-079 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Core authentication state management
 * EXTRACTED FROM: AuthContext.jsx (lines 16-30)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * NO REDUNDANCY: Different from useAuthDL008.js (which wraps this)
 */

import { useState, useEffect } from 'react';

/**
 * Specialized hook for authentication state management
 * Handles: user, token, loading, authProvider, userExchanges, sessionExpired
 */
export const useAuthState = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState(null); // 'email', 'google', 'binance', etc.
  const [userExchanges, setUserExchanges] = useState([]); // User's configured exchanges
  const [sessionExpired, setSessionExpired] = useState(false); // Track session expiration

  // ✅ DL-101: Load authentication state from localStorage on initialization
  useEffect(() => {
    const savedToken = localStorage.getItem('intelibotx_token');
    const savedUser = localStorage.getItem('intelibotx_user');
    const savedProvider = localStorage.getItem('intelibotx_auth_provider');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setAuthProvider(savedProvider || 'email');
    }
    setLoading(false);
  }, []);

  // ✅ DL-101: Save authentication state to localStorage
  const saveAuthState = (newToken, newUser, provider = 'email') => {
    localStorage.setItem('intelibotx_token', newToken);
    localStorage.setItem('intelibotx_user', JSON.stringify(newUser));
    localStorage.setItem('intelibotx_auth_provider', provider);
    setToken(newToken);
    setUser(newUser);
    setAuthProvider(provider);
    setSessionExpired(false);
  };

  // ✅ DL-101: Clear authentication state from localStorage
  const clearAuthState = () => {
    localStorage.removeItem('intelibotx_token');
    localStorage.removeItem('intelibotx_user');
    localStorage.removeItem('intelibotx_auth_provider');
    setToken(null);
    setUser(null);
    setAuthProvider(null);
    setUserExchanges([]);
    setSessionExpired(false);
  };

  // Computed authentication status
  const isAuthenticated = !!token && !!user && !sessionExpired;

  return {
    // State values
    user,
    token,
    loading,
    authProvider,
    userExchanges,
    sessionExpired,
    isAuthenticated,
    
    // State setters
    setUser,
    setToken,
    setLoading,
    setAuthProvider,
    setUserExchanges,
    setSessionExpired,

    // ✅ DL-101: Persistence functions
    saveAuthState,
    clearAuthState,
  };
};

export default useAuthState;