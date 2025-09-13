import React from 'react';

const ValidationSummary = ({ formData, selectedExchange }) => {
  const validationItems = [
    {
      label: 'Nombre del Bot',
      status: formData.name ? 'valid' : 'invalid',
      text: formData.name ? '✓ Configurado' : '✗ Requerido'
    },
    {
      label: 'Exchange Seleccionado',
      status: selectedExchange ? 'valid' : 'invalid',
      text: selectedExchange ? '✓ Configurado' : '✗ Requerido'
    },
    {
      label: 'Estrategia',
      status: formData.strategy ? 'valid' : 'optional',
      text: formData.strategy ? '✓ Seleccionada' : '○ Opcional'
    },
    {
      label: 'Gestión de Riesgo',
      status: (formData.take_profit && formData.stop_loss) ? 'valid' : 'invalid',
      text: (formData.take_profit && formData.stop_loss) ? '✓ Configurada' : '✗ Requerida'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid': return 'text-green-400';
      case 'invalid': return 'text-red-400';
      case 'optional': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <h4 className="text-blue-400 font-semibold mb-2">Configuración Básica</h4>
      <div className="space-y-2">
        {validationItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">{item.label}</span>
            <span className={`text-xs ${getStatusColor(item.status)}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationSummary;