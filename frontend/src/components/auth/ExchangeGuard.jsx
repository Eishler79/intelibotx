import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ExchangeGuard = ({ children }) => {
  const { isAuthenticated, userExchanges, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication and exchanges
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-300">Verificando configuración...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has at least one exchange configured
  if (!userExchanges || userExchanges.length === 0) {
    return <Navigate to="/exchanges" state={{ from: location, requiresExchange: true }} replace />;
  }

  // Render protected component if user has exchanges configured
  return children;
};

export default ExchangeGuard;