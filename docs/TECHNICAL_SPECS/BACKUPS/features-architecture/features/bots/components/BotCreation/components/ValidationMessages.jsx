import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const ValidationMessages = ({ 
  formData, 
  selectedExchange, 
  userExchanges = [], 
  loading, 
  canSubmit 
}) => {
  if (loading) return null;

  const validationErrors = [];
  
  if (!formData.name) validationErrors.push('• Nombre del bot es requerido');
  if (!selectedExchange) validationErrors.push('• Selecciona un exchange');
  if (!formData.take_profit) validationErrors.push('• Configure Take Profit');
  if (!formData.stop_loss) validationErrors.push('• Configure Stop Loss');
  if (userExchanges.length === 0) validationErrors.push('• No hay exchanges configurados');

  if (canSubmit) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-medium text-sm">
            ✅ Configuración completa - Listo para crear bot
          </span>
        </div>
      </div>
    );
  }

  if (validationErrors.length > 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 font-medium text-sm">Configuración Incompleta</span>
        </div>
        
        <div className="space-y-1 text-xs">
          {validationErrors.map((error, index) => (
            <p key={index} className="text-red-400">{error}</p>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default ValidationMessages;