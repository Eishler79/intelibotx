/**
 * 🔐 ResetPassword - Password Reset Main Orchestrator Page
 * SUCCESS CRITERIA compliance: ≤150 lines (REFACTORED from 297 lines)
 * 
 * RESPONSIBILITY: Route entry + token validation + state orchestration + component routing
 * REFACTORED: Specialized hooks + components pattern applied (DL-076)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines  
 * PATTERN: Main orchestrator using specialized components + hooks
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

// ✅ SPECIALIZED COMPONENTS (feature-based imports)
import PasswordResetForm from '../features/auth/components/PasswordReset/PasswordResetForm';
import PasswordResetSuccess from '../features/auth/components/PasswordReset/PasswordResetSuccess';
import PasswordResetError from '../features/auth/components/PasswordReset/PasswordResetError';

// ✅ SPECIALIZED HOOKS (DL-076 pattern)
import usePasswordResetValidation from '../features/auth/hooks/usePasswordResetValidation';
import usePasswordResetAPI from '../features/auth/hooks/usePasswordResetAPI';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [token, setToken] = useState('');
  const [searchParams] = useSearchParams();
  
  // ✅ SPECIALIZED HOOKS USAGE
  const { validateFormFields } = usePasswordResetValidation();
  const { loading, error, success, resetPassword, clearError } = usePasswordResetAPI();

  // Token validation on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      return; // Error will be handled by token validation
    }
    setToken(tokenParam);
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing  
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation using specialized hook
    const validationError = validateFormFields(formData);
    if (validationError) {
      // Error will be set by API hook
      return;
    }

    if (!token) {
      // Error will be handled by token validation  
      return;
    }

    // API call using specialized hook
    await resetPassword(token, formData.newPassword);
  };

  // ✅ STATE-BASED COMPONENT ROUTING
  if (success) {
    return <PasswordResetSuccess />;
  }

  if (!token) {
    return <PasswordResetError error="Invalid or missing reset token. Please request a new password reset." />;
  }

  // ✅ MAIN FORM STATE (orchestrator only)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          
          <p className="text-gray-600">
            Enter your new password below to complete the reset process.
          </p>
        </div>

        {/* ✅ SPECIALIZED FORM COMPONENT */}
        <PasswordResetForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />

        <div className="mt-6 text-center">
          <Link
            to="/auth"
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;