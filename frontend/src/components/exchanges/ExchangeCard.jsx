import React, { useState } from 'react';

const ExchangeCard = ({ exchange, onTest, onDelete, isTesting }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getExchangeColor = (exchangeName) => {
    const colors = {
      'binance': '#F0B90B',
      'bybit': '#FF6A00',
      'okx': '#0052FF',
      'kucoin': '#20D090',
      'kraken': '#5741D9',
      'huobi': '#2EABDC'
    };
    return colors[exchangeName.toLowerCase()] || '#6B7280';
  };

  const handleTest = () => {
    if (!isTesting) {
      onTest(exchange.id);
    }
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar la conexión "${exchange.connection_name}"?`)) {
      onDelete(exchange.id);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getExchangeColor(exchange.exchange_name) }}
          />
          <div>
            <h3 className="text-white font-semibold text-lg">
              {exchange.connection_name}
            </h3>
            <p className="text-gray-400 text-sm capitalize">
              {exchange.exchange_name} • {exchange.is_testnet ? 'Testnet' : 'Mainnet'}
            </p>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full ${getStatusColor(exchange.status)}`}
          />
          <span className="text-sm text-gray-300 capitalize">
            {exchange.status}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {exchange.error_message && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{exchange.error_message}</p>
        </div>
      )}

      {/* Permissions */}
      {exchange.permissions && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {exchange.permissions.can_trade && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                Trading
              </span>
            )}
            {exchange.permissions.can_withdraw && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                Withdraw
              </span>
            )}
            {exchange.permissions.can_deposit && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                Deposit
              </span>
            )}
          </div>
        </div>
      )}

      {/* Last Test */}
      {exchange.last_test_at && (
        <div className="mb-4 text-gray-400 text-sm">
          Última prueba: {new Date(exchange.last_test_at).toLocaleString()}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
        >
          {isTesting ? 'Probando...' : 'Probar Conexión'}
        </button>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="py-2 px-3 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
        >
          {showDetails ? 'Menos' : 'Detalles'}
        </button>
        
        <button
          onClick={handleDelete}
          className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
        >
          Eliminar
        </button>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
              <span className="text-white">{exchange.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Exchange:</span>
              <span className="text-white capitalize">{exchange.exchange_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Modo:</span>
              <span className="text-white">
                {exchange.is_testnet ? 'Testnet' : 'Mainnet'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Creado:</span>
              <span className="text-white">
                {new Date(exchange.created_at).toLocaleDateString()}
              </span>
            </div>
            {exchange.permissions && (
              <div className="mt-3">
                <span className="text-gray-400 text-xs block mb-2">Permisos:</span>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Trading:</span>
                    <span className={exchange.permissions.can_trade ? 'text-green-400' : 'text-red-400'}>
                      {exchange.permissions.can_trade ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retiros:</span>
                    <span className={exchange.permissions.can_withdraw ? 'text-green-400' : 'text-red-400'}>
                      {exchange.permissions.can_withdraw ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depósitos:</span>
                    <span className={exchange.permissions.can_deposit ? 'text-green-400' : 'text-red-400'}>
                      {exchange.permissions.can_deposit ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeCard;