/**
 * 🔐 usePasswordResetValidation - Password Reset Validation Hook
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: Password validation rules + field validation + form validation
 * EXTRACTED FROM: ResetPassword.jsx (validation functions)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-001 COMPLIANCE (no hardcode validation rules)
 * PATTERN: Specialized validation hook
 */

import { useCallback } from 'react';

// ✅ DL-001 COMPLIANCE: Configuration-based validation (no hardcode)
const VALIDATION_CONFIG = {
  minLength: 8,
  requireLowercase: true,
  requireUppercase: true, 
  requireNumber: true,
  patterns: {
    lowercase: /(?=.*[a-z])/,
    uppercase: /(?=.*[A-Z])/,
    number: /(?=.*\d)/
  }
};

const usePasswordResetValidation = () => {
  const validatePassword = useCallback((password) => {
    if (!password || password.length < VALIDATION_CONFIG.minLength) {
      return `Password must be at least ${VALIDATION_CONFIG.minLength} characters long`;
    }
    
    if (VALIDATION_CONFIG.requireLowercase && !VALIDATION_CONFIG.patterns.lowercase.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    
    if (VALIDATION_CONFIG.requireUppercase && !VALIDATION_CONFIG.patterns.uppercase.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    
    if (VALIDATION_CONFIG.requireNumber && !VALIDATION_CONFIG.patterns.number.test(password)) {
      return 'Password must contain at least one number';
    }
    
    return null;
  }, []);

  const validatePasswordMatch = useCallback((password, confirmPassword) => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }, []);

  const validateFormFields = useCallback((formData) => {
    if (!formData.newPassword || !formData.confirmPassword) {
      return 'Please fill in all fields';
    }

    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      return passwordError;
    }

    const matchError = validatePasswordMatch(formData.newPassword, formData.confirmPassword);
    if (matchError) {
      return matchError;
    }

    return null;
  }, [validatePassword, validatePasswordMatch]);

  const getPasswordRequirements = useCallback(() => {
    return `Must be at least ${VALIDATION_CONFIG.minLength} characters with uppercase, lowercase, and number`;
  }, []);

  return {
    validatePassword,
    validatePasswordMatch,
    validateFormFields,
    getPasswordRequirements
  };
};

export default usePasswordResetValidation;