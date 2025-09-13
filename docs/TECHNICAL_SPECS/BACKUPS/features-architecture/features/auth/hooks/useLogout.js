/**
 * 🔐 useLogout - Specialized Logout API Hook
 * SUCCESS CRITERIA compliance: useAuthAPI.js split (169→≤150 lines)
 * 
 * RESPONSIBILITY: Logout API operations only
 * EXTRACTED FROM: useAuthAPI.js (lines 131-169)
 */

import { useCallback } from 'react';

export const useLogout = (authState) => {
  const { setToken, setUser, setAuthProvider, setUserExchanges, setSessionExpired } = authState;

  // API base URL - DL-001 compliance
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:8000' : 
      'https://intelibotx-production.up.railway.app');

  const logout = useCallback(async () => {
    try {
      // Get current token for API call
      const currentToken = localStorage.getItem('intelibotx_token');
      
      // Llamar endpoint de logout si está disponible
      if (currentToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Limpiar estado local siempre
    setToken(null);
    setUser(null);
    setAuthProvider(null);
    setUserExchanges([]);
    setSessionExpired(false);
    localStorage.removeItem('intelibotx_token');
    localStorage.removeItem('intelibotx_user');
    localStorage.removeItem('intelibotx_auth_provider');
    
    console.log('🔑 Logout completed - user state cleared');
  }, [API_BASE_URL, setToken, setUser, setAuthProvider, setUserExchanges, setSessionExpired]);

  return { logout };
};

export default useLogout;