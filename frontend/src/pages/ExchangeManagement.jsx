import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AddExchangeModal from '../components/exchanges/AddExchangeModal';
import ExchangeCard from '../components/exchanges/ExchangeCard';

const ExchangeManagement = () => {
  const { 
    userExchanges, 
    loadUserExchanges, 
    deleteExchange, 
    testExchangeConnection,
    isAuthenticated 
  } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingExchanges, setTestingExchanges] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      loadUserExchanges().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleAddExchange = () => {
    setShowAddModal(true);
  };

  const handleExchangeAdded = () => {
    setShowAddModal(false);
    loadUserExchanges();
  };

  const handleDeleteExchange = async (exchangeId, exchangeName) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${exchangeName}"?`)) {
      const result = await deleteExchange(exchangeId);
      if (result.success) {
        // Success notification could be added here
        console.log('Exchange deleted successfully');
      } else {
        alert('Error al eliminar exchange: ' + result.error);
      }
    }
  };

  const handleTestConnection = async (exchangeId) => {
    setTestingExchanges(prev => new Set(prev).add(exchangeId));
    
    try {
      const result = await testExchangeConnection(exchangeId);
      if (result.success) {
        console.log('Connection test successful:', result.data);
        // Could show success toast here
      } else {
        alert('Error en conexión: ' + result.error);
      }
    } finally {
      setTestingExchanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(exchangeId);
        return newSet;
      });
    }
  };

  if (!isAuthenticated) {
    return <div>Please login to manage exchanges</div>;
  }

  return (
    <div className="min-h-screen p-6" style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)'
    }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🔗 Mis Exchanges</h1>
            <p style={{ color: '#b8bcc8' }}>
              Conecta tus exchanges favoritos para operar con bots en múltiples plataformas
            </p>
          </div>
          
          <button
            onClick={handleAddExchange}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            style={{
              background: '#f7931a',
              color: '#0a0e27'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#e8841a';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 20px rgba(247, 147, 26, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#f7931a';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Añadir exchange</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8" style={{ color: '#f7931a' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-white">Cargando exchanges...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Exchanges Grid */}
            {userExchanges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userExchanges.map(exchange => (
                  <ExchangeCard
                    key={exchange.id}
                    exchange={exchange}
                    onDelete={() => handleDeleteExchange(exchange.id, exchange.connection_name)}
                    onTest={() => handleTestConnection(exchange.id)}
                    onEdit={() => {
                      // TODO: Implement edit functionality
                      console.log('Edit exchange:', exchange.id);
                    }}
                    isTesting={testingExchanges.has(exchange.id)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-20">
                <div 
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: 'rgba(247, 147, 26, 0.1)',
                    border: '2px dashed #f7931a'
                  }}
                >
                  <svg className="w-12 h-12" style={{ color: '#f7931a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  No tienes exchanges conectados
                </h3>
                <p className="mb-8" style={{ color: '#6c7293' }}>
                  Conecta tu primer exchange para empezar a crear bots de trading
                </p>
                
                <button
                  onClick={handleAddExchange}
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
                  style={{
                    background: '#f7931a',
                    color: '#0a0e27'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e8841a';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 20px rgba(247, 147, 26, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f7931a';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Conectar mi primer exchange</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Add Exchange Modal */}
        <AddExchangeModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onExchangeAdded={handleExchangeAdded}
        />
      </div>
    </div>
  );
};

export default ExchangeManagement;