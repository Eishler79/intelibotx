import React, { createContext, useContext, useState, useEffect } from 'react';
import httpInterceptor from '../services/httpInterceptor';
import { useNotifications } from '../components/notifications/NotificationSystem';

const AuthContext = createContext();

// Hook para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authProvider, setAuthProvider] = useState(null); // 'email', 'google', 'binance', etc.
  const [userExchanges, setUserExchanges] = useState([]); // User's configured exchanges
  const [sessionExpired, setSessionExpired] = useState(false); // Track session expiration
  
  // Try to get notifications system if available
  let notifications = null;
  try {
    notifications = useNotifications();
  } catch (error) {
    console.warn('Notifications not available in AuthProvider');
  }

  // API base URL - Fix temporal para producción
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:8000' : 
      'https://intelibotx-production.up.railway.app');

  // Función para hacer llamadas API autenticadas (mejorada con HTTP Interceptor)
  const authenticatedFetch = async (url, options = {}) => {
    try {
      if (!token) {
        setSessionExpired(true);
        throw new Error('No authentication token available');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // HTTP Interceptor ya maneja 401/403, pero mantenemos compatibilidad
      if (response.status === 401 || response.status === 403) {
        setSessionExpired(true);
        await logout();
        throw new Error('Session expired. Please login again.');
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      
      // Check if it's a token expiration error
      if (error.message.includes('expired') || error.message.includes('TOKEN_EXPIRED')) {
        setSessionExpired(true);
        await logout();
      }
      
      throw error;
    }
  };

  // Load user exchanges
  const loadUserExchanges = async () => {
    try {
      if (!token) return;
      
      const response = await authenticatedFetch('/api/user/exchanges');
      if (response.ok) {
        const exchanges = await response.json();
        setUserExchanges(exchanges);
      }
    } catch (error) {
      console.error('Error loading exchanges:', error);
      setUserExchanges([]);
    }
  };

  // Cargar token del localStorage al inicializar e inicializar HTTP Interceptor
  useEffect(() => {
    const savedToken = localStorage.getItem('intelibotx_token');
    const savedUser = localStorage.getItem('intelibotx_user');
    const savedProvider = localStorage.getItem('intelibotx_auth_provider');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setAuthProvider(savedProvider || 'email');
      
      // Load user exchanges if authenticated
      loadUserExchanges();
    }
    setLoading(false);
  }, []);

  // Initialize HTTP Interceptor when context is ready
  useEffect(() => {
    if (!loading) {
      // Initialize HTTP Interceptor with this AuthContext
      httpInterceptor.init({
        token,
        logout,
        user,
        sessionExpired
      }, notifications);
      
      console.log('🔒 HTTP Interceptor initialized with AuthContext and notifications');
    }
  }, [loading, token, user, sessionExpired, notifications]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Guardar token y usuario
      const accessToken = data.auth.access_token;
      const userData = data.user;

      setToken(accessToken);
      setUser(userData);
      setAuthProvider('email');
      setSessionExpired(false); // Reset session expiration flag
      
      // Persistir en localStorage
      localStorage.setItem('intelibotx_token', accessToken);
      localStorage.setItem('intelibotx_user', JSON.stringify(userData));
      localStorage.setItem('intelibotx_auth_provider', 'email');
      
      // Load user exchanges
      await loadUserExchanges();

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      
      // ✅ FIXED: Handle email verification required (apegado a premisas DL-001)
      if (data.verification_required) {
        // Registration successful, but email verification required
        return {
          success: true,
          requiresVerification: true,
          data: {
            user: data.user,
            message: data.message,
            email_sent: data.email_sent
          }
        };
      }
      
      // If no verification required, proceed with auto-login
      const accessToken = data.auth?.access_token;
      const userData = data.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData);
        setAuthProvider('email');
        
        // Persistir en localStorage
        localStorage.setItem('intelibotx_token', accessToken);
        localStorage.setItem('intelibotx_user', JSON.stringify(userData));
        localStorage.setItem('intelibotx_auth_provider', 'email');
        
        // Load user exchanges (empty for new user)
        await loadUserExchanges();
      }

      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function (mejorada con HTTP Interceptor integration)
  const logout = async () => {
    try {
      // Llamar endpoint de logout si está disponible
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Limpiar estado local siempre
    setToken(null);
    setUser(null);
    setAuthProvider(null);
    setUserExchanges([]);
    setSessionExpired(false); // Reset session expiration flag
    localStorage.removeItem('intelibotx_token');
    localStorage.removeItem('intelibotx_user');
    localStorage.removeItem('intelibotx_auth_provider');
    
    console.log('🔑 Logout completed - user state cleared');
  };

  // Función para obtener headers autenticados (compatibility)
  const getAuthHeaders = () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Exchange management functions
  const addExchange = async (exchangeData) => {
    try {
      const response = await authenticatedFetch('/api/user/exchanges', {
        method: 'POST',
        body: JSON.stringify(exchangeData),
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add exchange');
      }
    } catch (error) {
      console.error('Add exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateExchange = async (exchangeId, exchangeData) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}`, {
        method: 'PUT',
        body: JSON.stringify(exchangeData),
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true, data: await response.json() };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update exchange');
      }
    } catch (error) {
      console.error('Update exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteExchange = async (exchangeId) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadUserExchanges();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete exchange');
      }
    } catch (error) {
      console.error('Delete exchange error:', error);
      return { success: false, error: error.message };
    }
  };

  const testExchangeConnection = async (exchangeId) => {
    try {
      const response = await authenticatedFetch(`/api/user/exchanges/${exchangeId}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        await loadUserExchanges(); // Refresh to get updated status
        return { success: true, data: result };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Connection test failed');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    authProvider,
    userExchanges,
    sessionExpired, // Add session expiration state
    isAuthenticated: !!token && !!user && !sessionExpired,
    login,
    register,
    logout,
    getAuthHeaders,
    authenticatedFetch,
    loadUserExchanges,
    addExchange,
    updateExchange,
    deleteExchange,
    testExchangeConnection,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};