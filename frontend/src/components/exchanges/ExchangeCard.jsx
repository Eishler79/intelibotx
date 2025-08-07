import React from 'react';

const ExchangeCard = ({ exchange, onDelete, onTest, onEdit, isTesting }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#00d4aa';
      case 'error': return '#ff4757';
      case 'pending': return '#f7931a';
      default: return '#6c7293';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'error': return 'Error';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const getExchangeLogo = (exchangeName) => {
    // For now, return a simple icon. Later we can add actual logos
    switch (exchangeName?.toLowerCase()) {
      case 'binance':
        return (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#f7931a' }}>
            <svg className="w-8 h-8" style={{ color: '#0a0e27' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 15L10.91 8.26L12 2Z"/>
            </svg>
          </div>
        );
      case 'bybit':
        return (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#1c1c1c' }}>
            <span className="text-white font-bold">BY</span>
          </div>
        );
      case 'okx':
        return (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#000000' }}>
            <div className="grid grid-cols-2 gap-1">
              <div className="w-2 h-2 bg-white rounded-sm"></div>
              <div className="w-2 h-2 bg-white rounded-sm"></div>
              <div className="w-2 h-2 bg-white rounded-sm"></div>
              <div className="w-2 h-2 bg-white rounded-sm"></div>
            </div>
          </div>
        );
      case 'kucoin':
        return (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#24ae8f' }}>
            <span className="text-white font-bold text-xs">KC</span>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#2a2f4a' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div 
      className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg"
      style={{
        background: 'linear-gradient(145deg, #1a1f3a 0%, #2a2f4a 100%)',
        borderColor: '#2a2f4a',
        boxShadow: '0 4px 20px rgba(10, 14, 39, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#f7931a';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(10, 14, 39, 0.4), 0 4px 20px rgba(247, 147, 26, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a2f4a';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(10, 14, 39, 0.3)';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getExchangeLogo(exchange.exchange_name)}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {exchange.exchange_display_name}
            </h3>
            <p className="text-sm" style={{ color: '#b8bcc8' }}>
              {exchange.exchange_name?.toUpperCase()} • {exchange.exchange_type?.toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ background: getStatusColor(exchange.connection_status) }}
          />
          <span 
            className="text-xs font-medium"
            style={{ color: getStatusColor(exchange.connection_status) }}
          >
            {getStatusText(exchange.connection_status)}
          </span>
        </div>
      </div>

      {/* Permissions */}
      <div className="mb-6">
        <p className="text-xs font-medium mb-2" style={{ color: '#6c7293' }}>PERMISOS</p>
        <div className="flex flex-wrap gap-2">
          {exchange.has_spot_permission && (
            <span 
              className="px-2 py-1 text-xs rounded-full"
              style={{ 
                background: 'rgba(0, 212, 170, 0.1)', 
                color: '#00d4aa',
                border: '1px solid rgba(0, 212, 170, 0.2)' 
              }}
            >
              SPOT
            </span>
          )}
          {exchange.has_futures_permission && (
            <span 
              className="px-2 py-1 text-xs rounded-full"
              style={{ 
                background: 'rgba(247, 147, 26, 0.1)', 
                color: '#f7931a',
                border: '1px solid rgba(247, 147, 26, 0.2)' 
              }}
            >
              FUTURES
            </span>
          )}
          {exchange.has_margin_permission && (
            <span 
              className="px-2 py-1 text-xs rounded-full"
              style={{ 
                background: 'rgba(108, 114, 147, 0.1)', 
                color: '#6c7293',
                border: '1px solid rgba(108, 114, 147, 0.2)' 
              }}
            >
              MARGIN
            </span>
          )}
        </div>
      </div>

      {/* Last Test Date */}
      {exchange.last_test_date && (
        <div className="mb-6">
          <p className="text-xs" style={{ color: '#6c7293' }}>
            Última verificación: {new Date(exchange.last_test_date).toLocaleDateString('es-ES')}
          </p>
        </div>
      )}

      {/* Error Message */}
      {exchange.connection_status === 'error' && exchange.last_error_message && (
        <div 
          className="mb-6 p-3 rounded-lg border text-sm"
          style={{
            background: 'rgba(255, 71, 87, 0.1)',
            borderColor: 'rgba(255, 71, 87, 0.2)',
            color: '#ff4757'
          }}
        >
          {exchange.last_error_message}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={onTest}
          disabled={isTesting}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
          style={{
            background: 'rgba(0, 212, 170, 0.1)',
            color: '#00d4aa',
            border: '1px solid rgba(0, 212, 170, 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!isTesting) {
              e.target.style.background = 'rgba(0, 212, 170, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTesting) {
              e.target.style.background = 'rgba(0, 212, 170, 0.1)';
            }
          }}
        >
          {isTesting ? (
            <>
              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Probando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Probar
            </>
          )}
        </button>

        <button
          onClick={onEdit}
          className="py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
          style={{
            background: 'rgba(247, 147, 26, 0.1)',
            color: '#f7931a',
            border: '1px solid rgba(247, 147, 26, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(247, 147, 26, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(247, 147, 26, 0.1)';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={onDelete}
          className="py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300"
          style={{
            background: 'rgba(255, 71, 87, 0.1)',
            color: '#ff4757',
            border: '1px solid rgba(255, 71, 87, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 71, 87, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 71, 87, 0.1)';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ExchangeCard;