/**
 * 🔐 AuthPage - Main Authentication Page Orchestrator
 * SUCCESS CRITERIA compliance: ≤150 lines (refactored from 359 lines)
 * 
 * RESPONSIBILITY: Route entry point + authentication redirect logic
 * REFACTORED: DL-076 specialized component pattern applied
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines
 * PATTERN: Main orchestrator + specialized components (no wrappers)
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/contexts/AuthContext';
import AuthModeController from '../features/auth/components/AuthModeController';

const AuthPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // ✅ SPEC_REF: DESIGN_SYSTEM.md#login-redirect-behavior
      // DASHBOARD FIRST: Always redirect to dashboard, show empty state if needed
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Success callback for auth operations
  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-intelibot-primary">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <AuthModeController onSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;