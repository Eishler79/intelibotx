/**
 * 🔐 useRegister - Specialized Register API Hook  
 * SUCCESS CRITERIA compliance: useAuthAPI.js split (169→≤150 lines)
 * 
 * RESPONSIBILITY: Registration API operations only
 * EXTRACTED FROM: useAuthAPI.js (lines 69-129)
 */

import { useCallback } from 'react';

export const useRegister = (authState, loadUserExchanges) => {
  const { setToken, setUser, setAuthProvider } = authState;

  // API base URL - DL-001 compliance
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:8000' : 
      'https://intelibotx-production.up.railway.app');

  const register = useCallback(async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      
      // ✅ DL-001 compliant: Handle email verification required
      if (data.verification_required) {
        return {
          success: true,
          requiresVerification: true,
          data: {
            user: data.user,
            message: data.message,
            email_sent: data.email_sent
          }
        };
      }
      
      // If no verification required, proceed with auto-login
      const accessToken = data.auth?.access_token;
      const userData = data.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData);
        setAuthProvider('email');
        
        // Persistir en localStorage
        localStorage.setItem('intelibotx_token', accessToken);
        localStorage.setItem('intelibotx_user', JSON.stringify(userData));
        localStorage.setItem('intelibotx_auth_provider', 'email');
        
        // Load user exchanges (empty for new user)
        await loadUserExchanges();
      }

      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }, [API_BASE_URL, setToken, setUser, setAuthProvider, loadUserExchanges]);

  return { register };
};

export default useRegister;