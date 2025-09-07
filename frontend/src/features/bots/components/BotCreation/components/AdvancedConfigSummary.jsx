import React from 'react';
import { AlertCircle } from 'lucide-react';

const AdvancedConfigSummary = ({ formData }) => {
  const hasAdvancedConfig = formData.risk_percentage || 
                           formData.dca_levels || 
                           formData.max_open_positions || 
                           formData.cooldown_minutes;

  if (!hasAdvancedConfig) {
    return null;
  }

  const advancedItems = [
    {
      key: 'risk_percentage',
      label: 'Riesgo por Trade:',
      value: `${formData.risk_percentage}%`
    },
    {
      key: 'dca_levels',
      label: 'Niveles DCA:',
      value: formData.dca_levels
    },
    {
      key: 'max_open_positions',
      label: 'Posiciones Máx:',
      value: formData.max_open_positions
    },
    {
      key: 'cooldown_minutes',
      label: 'Cooldown:',
      value: `${formData.cooldown_minutes} min`
    }
  ].filter(item => formData[item.key]);

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
      <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Configuración Avanzada
      </h4>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        {advancedItems.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span className="text-gray-300">{item.label}</span>
            <span className="text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedConfigSummary;