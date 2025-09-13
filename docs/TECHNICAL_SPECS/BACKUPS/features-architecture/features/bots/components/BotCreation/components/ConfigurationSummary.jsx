import React from 'react';
import { CheckCircle } from 'lucide-react';

const ConfigurationSummary = ({ 
  formData, 
  selectedExchange,
  defaultValues = { symbol: 'BTCUSDT', market_type: 'SPOT', leverage: 1, stake: 100 }
}) => {
  const summaryItems = [
    { 
      label: 'Nombre del Bot',
      value: formData.name,
      display: formData.name ? `✓ ${formData.name}` : '✗ Requerido',
      status: formData.name ? 'valid' : 'invalid'
    },
    {
      label: 'Exchange',
      value: selectedExchange,
      display: selectedExchange ? `✓ ${selectedExchange.exchange_name.toUpperCase()}` : '✗ Requerido',
      status: selectedExchange ? 'valid' : 'invalid'
    },
    {
      label: 'Par de Trading',
      value: formData.symbol || defaultValues.symbol,
      display: formData.symbol || defaultValues.symbol,
      status: 'info'
    },
    {
      label: 'Tipo de Mercado',
      value: formData.market_type || defaultValues.market_type,
      display: formData.market_type || defaultValues.market_type,
      status: 'warning'
    },
    {
      label: 'Apalancamiento',
      value: formData.leverage || defaultValues.leverage,
      display: `${formData.leverage || defaultValues.leverage}x`,
      status: 'info'
    },
    {
      label: 'Estrategia',
      value: formData.strategy,
      display: formData.strategy ? `✓ ${formData.strategy}` : '○ Por defecto',
      status: formData.strategy ? 'valid' : 'warning'
    },
    {
      label: 'Capital por Trade',
      value: formData.stake || defaultValues.stake,
      display: `$${formData.stake || defaultValues.stake} ${formData.base_currency}`,
      status: 'info'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-400';
      case 'invalid': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-white';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
        <CheckCircle className="w-5 h-5" />
        Resumen de Configuración
      </h4>
      
      <div className="space-y-3">
        {summaryItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">{item.label}</span>
            <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
              {item.display}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigurationSummary;