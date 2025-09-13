/**
 * 🔐 useLogin - Specialized Login API Hook
 * SUCCESS CRITERIA compliance: useAuthAPI.js split (169→≤150 lines)
 * 
 * RESPONSIBILITY: Login API operations only
 * EXTRACTED FROM: useAuthAPI.js (lines 27-67)
 */

import { useCallback } from 'react';

export const useLogin = (authState, loadUserExchanges) => {
  const { setToken, setUser, setAuthProvider, setSessionExpired } = authState;

  // API base URL - DL-001 compliance
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:8000' : 
      'https://intelibotx-production.up.railway.app');

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Guardar token y usuario
      const accessToken = data.auth.access_token;
      const userData = data.user;

      setToken(accessToken);
      setUser(userData);
      setAuthProvider('email');
      setSessionExpired(false);
      
      // Persistir en localStorage
      localStorage.setItem('intelibotx_token', accessToken);
      localStorage.setItem('intelibotx_user', JSON.stringify(userData));
      localStorage.setItem('intelibotx_auth_provider', 'email');
      
      // Load user exchanges
      await loadUserExchanges();

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, [API_BASE_URL, setToken, setUser, setAuthProvider, setSessionExpired, loadUserExchanges]);

  return { login };
};

export default useLogin;