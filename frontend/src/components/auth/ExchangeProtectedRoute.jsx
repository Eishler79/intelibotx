import React from 'react';
import ProtectedRoute from './ProtectedRoute';
import ExchangeGuard from './ExchangeGuard';

/**
 * Route wrapper que requiere tanto autenticación como exchanges configurados
 * Usado para páginas que necesitan exchanges (como bots-advanced)
 */
const ExchangeProtectedRoute = ({ children }) => {
  return (
    <ProtectedRoute>
      <ExchangeGuard>
        {children}
      </ExchangeGuard>
    </ProtectedRoute>
  );
};

export default ExchangeProtectedRoute;