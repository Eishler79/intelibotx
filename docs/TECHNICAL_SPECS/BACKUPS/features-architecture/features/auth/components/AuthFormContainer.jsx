/**
 * 🔐 AuthFormContainer - Authentication Form Orchestrator
 * SUCCESS CRITERIA compliance: ≤150 lines (refactored from 189 lines)
 * 
 * RESPONSIBILITY: Form orchestration + error display
 * REFACTORED: Split into AuthFormFields + AuthFormActions
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * PATTERN: Orchestrator component (no wrapper anti-pattern)
 */

import React from 'react';
import AuthFormFields from './AuthFormFields';
import AuthFormActions from './AuthFormActions';

const AuthFormContainer = ({ 
  mode, 
  formData, 
  loading, 
  error, 
  onSubmit, 
  onChange, 
  onToggleMode 
}) => {
  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-intelibot-error-red-light border border-intelibot-error-red">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-intelibot-error-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-intelibot-error-red">{error}</span>
          </div>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <AuthFormFields 
          mode={mode}
          formData={formData}
          loading={loading}
          onChange={onChange}
        />
        
        <AuthFormActions 
          mode={mode}
          loading={loading}
          onToggleMode={onToggleMode}
        />
      </form>
    </>
  );
};

export default AuthFormContainer;