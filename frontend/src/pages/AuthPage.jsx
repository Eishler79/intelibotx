import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthProviders from '../components/auth/AuthProviders';

const AuthPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/bots-advanced';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Redirect path after successful auth
  const from = location.state?.from?.pathname || '/bots-advanced';

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
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      email: '',
      password: '',
      fullName: ''
    });
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
    }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <div 
            className="rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
            style={{
              background: 'rgba(30, 58, 138, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(30, 58, 138, 0.4)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
                }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">InteliBotX</h1>
              <p className="text-gray-300">
                Sign in to your account
              </p>
            </div>

            {/* Multi-Provider Auth Options - MANTENER FUNCIONALIDAD */}
            <AuthProviders onSuccess={() => navigate(from, { replace: true })} />

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span 
                  className="px-4 text-sm text-gray-400"
                  style={{ 
                    background: 'rgba(30, 58, 138, 0.85)'
                  }}
                >
                  or
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-100 border border-red-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                    onChange={handleChange}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                  color: '#ffffff',
                  border: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.background = 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
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
            </form>

            {/* Mode Toggle */}
            <div className="mt-8 text-center">
              <p style={{ color: '#6c7293' }}>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button 
                  onClick={toggleMode}
                  className="font-medium transition-colors hover:opacity-80"
                  style={{ color: '#f7931a' }}
                  disabled={loading}
                >
                  {mode === 'login' ? 'Create account' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Demo Credentials - Only in Login Mode */}
            {mode === 'login' && (
              <div 
                className="mt-6 p-4 rounded-lg border"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
              >
                <p className="text-sm font-medium mb-2 text-blue-300">Demo Admin Access:</p>
                <p className="text-xs text-gray-300">Email: admin@intelibotx.com</p>
                <p className="text-xs text-gray-300">Password: admin123</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;