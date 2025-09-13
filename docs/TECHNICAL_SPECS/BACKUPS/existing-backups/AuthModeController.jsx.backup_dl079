/**
 * 🔐 AuthModeController - Authentication Mode Management Component
 * SUCCESS CRITERIA compliance: ≤150 lines (refactored from 159 lines)
 * 
 * RESPONSIBILITY: Mode switching + form state + auth logic
 * REFACTORED: Extracted AuthCard wrapper component
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * PATTERN: Single responsibility logic component
 */

import React, { useState } from 'react';
// DL-076 COMPLIANCE: Direct hooks, no wrapper context
import useLogin from '../hooks/useLogin';
import useRegister from '../hooks/useRegister';
import AuthCard from './AuthCard';
import AuthFormContainer from './AuthFormContainer';
import EmailVerificationState from './EmailVerificationState';

const AuthModeController = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verification-sent'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Direct hook composition - no wrapper context
  const login = useLogin();
  const register = useRegister();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      email: '',
      password: '',
      fullName: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (mode === 'register' && !formData.fullName) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    setError('');

    let result;
    if (mode === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.email, formData.password, formData.fullName);
    }

    if (result.success) {
      console.log(`${mode} successful:`, result.data.user);
      
      // Handle email verification required
      if (result.requiresVerification) {
        setError('');
        setMode('verification-sent');
        return;
      }
      
      // Success callback
      onSuccess();
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  // Verification sent state
  if (mode === 'verification-sent') {
    return (
      <EmailVerificationState 
        email={formData.email}
        onBack={() => setMode('login')}
      />
    );
  }

  return (
    <AuthCard onSuccess={onSuccess}>
      <AuthFormContainer
        mode={mode}
        formData={formData}
        loading={loading}
        error={error}
        onSubmit={handleEmailSubmit}
        onChange={handleChange}
        onToggleMode={toggleMode}
      />
    </AuthCard>
  );
};

export default AuthModeController;