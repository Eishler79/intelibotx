/**
 * 🔐 usePasswordResetAPI - Password Reset API Hook
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: API calls + error handling + loading states
 * EXTRACTED FROM: ResetPassword.jsx (API section)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-008 COMPLIANCE (JWT pattern)
 * PATTERN: Specialized API hook
 */

import { useState, useCallback } from 'react';

const usePasswordResetAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetPassword = useCallback(async (token, newPassword) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        return { success: true, data };
      } else {
        const errorMessage = data.detail || 'Failed to reset password. Please try again or request a new reset link.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const networkError = 'Network error. Please check your connection and try again.';
      setError(networkError);
      return { success: false, error: networkError };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    loading,
    error,
    success,
    resetPassword,
    clearError
  };
};

export default usePasswordResetAPI;