import React from 'react';
import { Brain, Zap, Info } from 'lucide-react';

const StrategyTemplateSelector = ({
  formData = {},
  onInputChange,
  strategies = [],
  strategiesLoading = false,
  selectedExchange = null
}) => {
  const handleInputChange = (e) => {
    if (onInputChange) {
      onInputChange(e);
    }
  };

  // Find selected strategy details for display
  const selectedStrategy = strategies.find(s => s.value === formData.strategy);

  return (
    <div className="strategy-selector space-y-4">
      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          Estrategia de Trading
        </label>
        <select
          name="strategy"
          value={formData.strategy || ''}
          onChange={handleInputChange}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
          disabled={strategiesLoading}
        >
          <option value="">Selecciona una estrategia</option>
          {strategiesLoading ? (
            <option>Cargando estrategias...</option>
          ) : strategies.length === 0 ? (
            <option>No hay estrategias disponibles</option>
          ) : (
            strategies.map(strategy => (
              <option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </option>
            ))
          )}
        </select>
        
        {/* Status Messages */}
        {strategiesLoading ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
            <p className="text-purple-400 text-sm">Cargando estrategias institucionales...</p>
          </div>
        ) : !selectedExchange ? (
          <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
            <Info className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-400 text-sm">Selecciona un exchange para ver estrategias disponibles</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
            <Zap className="w-4 h-4 text-red-400" />
            <p className="text-red-400 text-sm">No se pudieron cargar las estrategias - Verifica conexión del exchange</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <Brain className="w-4 h-4 text-green-400" />
            <p className="text-green-400 text-sm">🧠 {strategies.length} estrategias institucionales disponibles</p>
          </div>
        )}
      </div>

      {/* Selected Strategy Details */}
      {selectedStrategy && (
        <div className="strategy-details bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Estrategia Seleccionada: {selectedStrategy.label}
          </h4>
          
          {selectedStrategy.description && (
            <p className="text-gray-300 text-sm mb-3">{selectedStrategy.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'type', label: 'Tipo', value: selectedStrategy.type, color: 'text-white' },
              { 
                key: 'risk_level', 
                label: 'Riesgo', 
                value: selectedStrategy.risk_level === 'LOW' ? 'Bajo' : selectedStrategy.risk_level === 'MEDIUM' ? 'Medio' : 'Alto',
                color: selectedStrategy.risk_level === 'LOW' ? 'text-green-400' : selectedStrategy.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
              },
              { key: 'timeframe', label: 'Timeframe', value: selectedStrategy.timeframe, color: 'text-white' },
              { key: 'win_rate', label: 'Win Rate', value: selectedStrategy.win_rate ? `${selectedStrategy.win_rate}%` : null, color: 'text-green-400' }
            ].filter(item => item.value).map(item => (
              <div key={item.key}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className={`font-medium ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          
          {/* Strategy Tags */}
          {selectedStrategy.tags && selectedStrategy.tags.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Características</p>
              <div className="flex flex-wrap gap-2">
                {selectedStrategy.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Strategy Information */}
      {!selectedStrategy && formData.strategy && (
        <div className="strategy-info bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            💡 Las estrategias institucionales utilizan algoritmos avanzados como Wyckoff, Smart Money Concepts, 
            Order Blocks y Volume Spread Analysis para detectar oportunidades que los traders retail no ven.
          </p>
        </div>
      )}
    </div>
  );
};

export default StrategyTemplateSelector;