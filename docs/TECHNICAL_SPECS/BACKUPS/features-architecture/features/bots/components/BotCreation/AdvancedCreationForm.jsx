import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import AdvancedConfigHeader from './components/AdvancedConfigHeader';
import TradingIntervalField from './components/TradingIntervalField';
import MarginTypeField from './components/MarginTypeField';

const AdvancedCreationForm = ({
  formData = {},
  onInputChange,
  showAdvancedConfig = false,
  onToggleAdvanced,
  intervals = [],
  intervalsLoading = false,
  marginTypes = [],
  marginTypesLoading = false,
  selectedExchange = null
}) => {
  const handleInputChange = (e) => {
    if (onInputChange) {
      onInputChange(e);
    }
  };

  return (
    <div className="advanced-config bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden">
      <AdvancedConfigHeader 
        showAdvancedConfig={showAdvancedConfig}
        onToggleAdvanced={onToggleAdvanced}
      />
      
      {showAdvancedConfig && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="advanced-config-content p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <TradingIntervalField 
            formData={formData}
            onInputChange={handleInputChange}
            intervals={intervals}
            intervalsLoading={intervalsLoading}
            selectedExchange={selectedExchange}
          />

          <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              Riesgo por Trade (%)
              <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Porcentaje máximo del capital en riesgo por operación">ⓘ</span>
            </label>
            <input
              type="number"
              name="risk_percentage"
              value={formData.risk_percentage || ''}
              onChange={handleInputChange}
              min="0.1"
              max="10"
              step="0.1"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="1.0"
            />
            <p className="text-xs text-gray-400 mt-2">
              Recomendado: 1-2% para traders conservadores, 3-5% agresivos
            </p>
          </div>

          <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-400" />
              Niveles DCA
              <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Número de niveles Dollar Cost Average para promedio de entrada">ⓘ</span>
            </label>
            <input
              type="number"
              name="dca_levels"
              value={formData.dca_levels || ''}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="3"
            />
            <p className="text-xs text-gray-400 mt-2">
              1 = Sin DCA | 2-3 = Conservador | 4-6 = Moderado | 7+ = Agresivo
            </p>
          </div>

          <MarginTypeField 
            formData={formData}
            onInputChange={handleInputChange}
            marginTypes={marginTypes}
            marginTypesLoading={marginTypesLoading}
            selectedExchange={selectedExchange}
          />

          <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              Posiciones Máximas
              <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Máximo número de posiciones abiertas simultáneamente">ⓘ</span>
            </label>
            <input
              type="number"
              name="max_open_positions"
              value={formData.max_open_positions || ''}
              onChange={handleInputChange}
              min="1"
              max="20"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="3"
            />
            <p className="text-xs text-gray-400 mt-2">
              1-3 = Conservador | 4-8 = Moderado | 8+ = Agresivo
            </p>
          </div>

          <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Cooldown (minutos)
              <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Tiempo de espera entre trades para evitar overtrading">ⓘ</span>
            </label>
            <input
              type="number"
              name="cooldown_minutes"
              value={formData.cooldown_minutes || ''}
              onChange={handleInputChange}
              min="0"
              max="1440"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              placeholder="15"
            />
            <p className="text-xs text-gray-400 mt-2">
              0 = Sin cooldown | 5-15 = Scalping | 30-60 = Swing | 240+ = Position
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdvancedCreationForm;