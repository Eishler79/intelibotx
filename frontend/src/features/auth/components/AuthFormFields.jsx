/**
 * 🔐 AuthFormFields - Form Fields Component
 * SUCCESS CRITERIA compliance: ≤150 lines
 * 
 * RESPONSIBILITY: Form input fields rendering + validation styles
 * EXTRACTED FROM: AuthFormContainer.jsx (form fields section)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + SUCCESS CRITERIA ≤150 lines
 * PATTERN: UI component specialized in form fields
 */

import React from 'react';

const AuthFormFields = ({ mode, formData, loading, onChange }) => {
  return (
    <>
      {mode === 'register' && (
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#b8bcc8' }}>
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={onChange}
            className="w-full px-4 py-3 rounded-lg text-white transition-all duration-300"
            style={{
              background: '#0a0e27',
              border: '1px solid #3a3f5a',
              color: '#ffffff'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#f7931a';
              e.target.style.boxShadow = '0 0 0 3px rgba(247, 147, 26, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#3a3f5a';
              e.target.style.boxShadow = 'none';
            }}
            placeholder="Enter your full name"
            disabled={loading}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg text-white transition-all duration-300"
          style={{
            background: 'rgba(30, 58, 138, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            color: '#ffffff'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#8b5cf6';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.target.style.boxShadow = 'none';
          }}
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={onChange}
          className="w-full px-4 py-3 rounded-lg text-white transition-all duration-300"
          style={{
            background: 'rgba(30, 58, 138, 0.3)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            color: '#ffffff'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#8b5cf6';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            e.target.style.boxShadow = 'none';
          }}
          placeholder="Enter your password"
          disabled={loading}
        />
      </div>
    </>
  );
};

export default AuthFormFields;