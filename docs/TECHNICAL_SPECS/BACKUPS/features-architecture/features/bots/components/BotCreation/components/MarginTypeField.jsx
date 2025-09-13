import React from 'react';
import { BarChart2 } from 'lucide-react';

const MarginTypeField = ({ 
  formData, 
  onInputChange, 
  marginTypes, 
  marginTypesLoading, 
  selectedExchange 
}) => {
  return (
    <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
      <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-yellow-400" />
        Tipo de Margen
        <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Para trading con futuros: Cross o Isolated margin">ⓘ</span>
      </label>
      <select
        name="margin_type"
        value={formData.margin_type || ''}
        onChange={onInputChange}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
        disabled={formData.market_type === 'SPOT' || marginTypesLoading || !selectedExchange}
      >
        {marginTypesLoading ? (
          <option>Cargando tipos de margen...</option>
        ) : !selectedExchange ? (
          <option>Selecciona un exchange primero</option>
        ) : marginTypes.length === 0 ? (
          <option>Error cargando tipos de margen</option>
        ) : (
          marginTypes.map(type => (
            <option key={type.value} value={type.value} title={type.description}>
              {type.label} {type.recommended ? '⭐' : ''} - {type.description}
            </option>
          ))
        )}
      </select>
      <p className="text-xs text-gray-400 mt-2">
        Solo para Futures | Cross = riesgo total | Isolated = riesgo limitado
      </p>
    </div>
  );
};

export default MarginTypeField;