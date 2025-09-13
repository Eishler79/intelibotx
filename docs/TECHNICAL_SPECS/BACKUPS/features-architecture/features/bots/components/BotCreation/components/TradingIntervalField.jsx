import React from 'react';
import { Activity } from 'lucide-react';

const TradingIntervalField = ({ 
  formData, 
  onInputChange, 
  intervals, 
  intervalsLoading, 
  selectedExchange 
}) => {
  return (
    <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
      <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-400" />
        Intervalo de Trading
        <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Timeframe para análisis técnico del bot">ⓘ</span>
      </label>
      <select
        name="interval"
        value={formData.interval || ''}
        onChange={onInputChange}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        disabled={intervalsLoading || !selectedExchange}
      >
        {intervalsLoading ? (
          <option>Cargando intervalos...</option>
        ) : !selectedExchange ? (
          <option>Selecciona un exchange primero</option>
        ) : intervals.length === 0 ? (
          <option>Error cargando intervalos</option>
        ) : (
          intervals.map(interval => (
            <option key={interval.value} value={interval.value}>
              {interval.label} {interval.recommended ? '⭐' : ''}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default TradingIntervalField;