/**
 * 🔐 AuthCard - Authentication Card Wrapper Component
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: Card UI wrapper + header + divider
 * EXTRACTED FROM: AuthModeController.jsx (card wrapper + header)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines
 * PATTERN: UI wrapper component
 */

import React from 'react';
import AuthProviders from '../../../components/auth/AuthProviders';

const AuthCard = ({ onSuccess, children }) => {
  return (
    <div 
      className="rounded-2xl p-8 shadow-intelibot-card backdrop-blur-xl border"
      style={{
        background: 'rgba(26, 31, 58, 0.85)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(247, 147, 26, 0.3)'
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div 
          className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 bg-gradient-intelibot-gold shadow-intelibot-gold"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-intelibot-text-primary mb-2">InteliBotX</h1>
        <p className="text-intelibot-text-secondary">
          Sign in to your account
        </p>
      </div>

      {/* Multi-Provider Auth Options */}
      <AuthProviders onSuccess={onSuccess} />

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-intelibot-border-primary"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span 
            className="px-4 text-sm text-intelibot-text-muted"
            style={{ 
              background: 'rgba(26, 31, 58, 0.85)'
            }}
          >
            or
          </span>
        </div>
      </div>

      {/* Form Content */}
      {children}
    </div>
  );
};

export default AuthCard;