import React from 'react';
import { AlertCircle, Plus, ExternalLink } from 'lucide-react';

const ExchangeSelectionStep = ({
  userExchanges = [],
  selectedExchange = null,
  onExchangeSelect,
  onExchangeAdd = null
}) => {
  const handleExchangeClick = (exchange) => {
    if (onExchangeSelect) {
      onExchangeSelect(exchange);
    }
  };

  const handleAddExchange = () => {
    if (onExchangeAdd) {
      onExchangeAdd();
    }
  };

  return (
    <div className="space-y-4">
      {/* Exchange Selection Header */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Exchange *
        </label>
        <p className="text-xs text-gray-400 mb-3">
          Selecciona el exchange donde ejecutarás las operaciones del bot
        </p>
      </div>

      {/* Exchange Grid */}
      {userExchanges && userExchanges.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {userExchanges.map((exchange) => (
            <button
              key={exchange.id}
              type="button"
              onClick={() => handleExchangeClick(exchange)}
              className={`p-2 rounded-lg border transition-all text-sm ${
                selectedExchange?.id === exchange.id
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
              }`}
            >
              <div className="font-semibold">{exchange.exchange_name.toUpperCase()}</div>
              <div className="text-xs text-gray-400">{exchange.connection_name}</div>
              
              {/* Status Indicator */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${exchange.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className={`text-xs ${exchange.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {exchange.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {selectedExchange?.id === exchange.id && <div className="text-blue-400">✓</div>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-2">
            No tienes exchanges configurados
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Necesitas configurar al menos un exchange para crear bots
          </p>
          
          {onExchangeAdd && (
            <button
              type="button"
              onClick={handleAddExchange}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Exchange
            </button>
          )}
          
          {!onExchangeAdd && (
            <p className="text-yellow-400 text-sm">
              Ve a <span className="font-semibold">Exchange Management</span> para agregar uno
            </p>
          )}
        </div>
      )}

      {/* Exchange Count Info */}
      {userExchanges && userExchanges.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{userExchanges.length} exchange{userExchanges.length !== 1 ? 's' : ''} disponible{userExchanges.length !== 1 ? 's' : ''}</span>
          
          {onExchangeAdd && (
            <button
              type="button"
              onClick={handleAddExchange}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3 h-3 mr-1" />
              Agregar más
            </button>
          )}
        </div>
      )}

      {/* Selected Exchange Info */}
      {selectedExchange && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-medium text-sm">Exchange Seleccionado</p>
              <p className="text-white font-semibold">{selectedExchange.exchange_name.toUpperCase()} - {selectedExchange.connection_name}</p>
            </div>
            
            <div className={`flex items-center space-x-1 ${selectedExchange.is_active ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${selectedExchange.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs font-medium">{selectedExchange.is_active ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
          
          {!selectedExchange.is_active && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Exchange desconectado. Verifica las credenciales.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExchangeSelectionStep;