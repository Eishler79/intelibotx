import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Cargar token del localStorage al inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('intelibotx_token');
    const savedUser = localStorage.getItem('intelibotx_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

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
      
      // Persistir en localStorage
      localStorage.setItem('intelibotx_token', accessToken);
      localStorage.setItem('intelibotx_user', JSON.stringify(userData));

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
      
      // Después del registro exitoso, hacer login automático
      const accessToken = data.auth.access_token;
      const userData = data.user;

      setToken(accessToken);
      setUser(userData);
      
      // Persistir en localStorage
      localStorage.setItem('intelibotx_token', accessToken);
      localStorage.setItem('intelibotx_user', JSON.stringify(userData));

      return { success: true, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
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
    localStorage.removeItem('intelibotx_token');
    localStorage.removeItem('intelibotx_user');
  };

  // Función para obtener headers autenticados
  const getAuthHeaders = () => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Función para hacer llamadas API autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // Si recibimos 401/403, el token expiró
      if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Session expired. Please login again.');
      }

      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    getAuthHeaders,
    authenticatedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};