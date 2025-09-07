/**
 * 🔐 AuthFormActions - Form Actions Component
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: Form submit button + forgot password + mode toggle
 * EXTRACTED FROM: AuthFormContainer.jsx (form actions section)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines
 * PATTERN: UI component specialized in form actions
 */

import React from 'react';
import { Link } from 'react-router-dom';

const AuthFormActions = ({ mode, loading, onToggleMode }) => {
  return (
    <>
      {/* Sign In Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-intelibot-gold text-intelibot-text-on-gold shadow-intelibot-gold hover:shadow-lg hover:scale-105"
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(-1px) scale(1.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(0) scale(1)';
          }
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* Forgot Password Link - Only in Login Mode */}
      {mode === 'login' && (
        <div className="mt-6 text-center">
          <Link 
            to="/forgot-password"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: '#8b5cf6' }}
          >
            Forgot your password?
          </Link>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="mt-8 text-center">
        <p style={{ color: '#6c7293' }}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button 
            onClick={onToggleMode}
            className="font-medium transition-colors hover:opacity-80"
            style={{ color: '#f7931a' }}
            disabled={loading}
          >
            {mode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </>
  );
};

export default AuthFormActions;