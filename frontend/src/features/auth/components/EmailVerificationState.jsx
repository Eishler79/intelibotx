/**
 * 🔐 EmailVerificationState - Email Verification Display Component
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: Email verification UI + back navigation + user feedback
 * EXTRACTED FROM: AuthPage.jsx (lines 98-142, verification state UI)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * PATTERN: Single responsibility UI component
 */

import React from 'react';

const EmailVerificationState = ({ email, onBack }) => {
  return (
    <div className="max-w-md w-full">
      <div 
        className="rounded-2xl p-8 shadow-intelibot-card backdrop-blur-xl border text-center"
        style={{
          background: 'rgba(26, 31, 58, 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(139, 92, 246, 0.3)'
        }}
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-gray-300 mb-4">
            We've sent a verification link to <span className="text-white font-semibold">{email}</span>. 
            Please check your email and click the link to verify your account.
          </p>
          <p className="text-sm text-gray-400">
            Don't see the email? Check your spam folder.
          </p>
        </div>
        
        <button
          onClick={onBack}
          className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: 'white'
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationState;