import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, DollarSign, Shield, Target } from "lucide-react";

const ValidationSummary = ({ bot, parameters, isUpdating, onUpdateParameters, onClose }) => {
  const validations = [
    {
      key: 'name',
      label: 'Nombre del Bot',
      value: parameters.name,
      isValid: parameters.name?.trim().length >= 3,
      message: parameters.name?.trim().length >= 3 ? 'Nombre válido' : 'Mínimo 3 caracteres'
    },
    {
      key: 'strategy',
      label: 'Estrategia',
      value: parameters.strategy,
      isValid: parameters.strategy?.trim().length > 0,
      message: parameters.strategy ? 'Estrategia seleccionada' : 'Selecciona una estrategia'
    },
    {
      key: 'stake',
      label: 'Capital',
      value: `$${parameters.stake} ${parameters.base_currency}`,
      isValid: parameters.stake >= (parameters.min_stake || 10),
      message: parameters.stake >= (parameters.min_stake || 10) ? 'Capital válido' : `Mínimo $${parameters.min_stake || 10}`
    },
    {
      key: 'risk',
      label: 'Gestión de Riesgo',
      value: `TP: ${parameters.takeProfit}% | SL: ${parameters.stopLoss}%`,
      isValid: (parameters.takeProfit || 0) > (parameters.stopLoss || 0),
      message: (parameters.takeProfit || 0) > (parameters.stopLoss || 0) 
        ? 'Ratio de riesgo válido' 
        : 'Take Profit debe ser mayor que Stop Loss'
    }
  ];

  const allValid = validations.every(v => v.isValid);
  const potentialGain = (((parameters.stake || 0) * (parameters.leverage || 1)) * (parameters.takeProfit || 0) / 100);
  const potentialLoss = (((parameters.stake || 0) * (parameters.leverage || 1)) * (parameters.stopLoss || 0) / 100);

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-gray-700 pb-4">
        <h3 className="text-xl font-bold text-white mb-2">📋 Resumen de Configuración</h3>
        <p className="text-gray-400 text-sm">Revisión final antes de aplicar los parámetros al bot</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {validations.map((validation) => (
          <div 
            key={validation.key} 
            className={`p-3 rounded-lg border ${
              validation.isValid 
                ? 'border-green-500/30 bg-green-500/5' 
                : 'border-red-500/30 bg-red-500/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {validation.isValid ? (
                <CheckCircle size={18} className="text-green-400" />
              ) : (
                <AlertCircle size={18} className="text-red-400" />
              )}
              <div className="flex-1">
                <Label className="text-white font-medium text-sm">{validation.label}</Label>
                <p className="text-gray-300 text-xs mt-1">{validation.value}</p>
                <p className={`text-xs mt-1 ${
                  validation.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {validation.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/30 rounded-lg">
        <div className="text-center">
          <Label className="text-xs text-gray-400 flex items-center gap-1 justify-center">
            <Target size={12} /> Ganancia Potencial
          </Label>
          <p className="text-green-400 font-bold text-lg">+${potentialGain.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <Label className="text-xs text-gray-400 flex items-center gap-1 justify-center">
            <Shield size={12} /> Pérdida Potencial
          </Label>
          <p className="text-red-400 font-bold text-lg">-${potentialLoss.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-gray-900/50 rounded-lg p-4">
        <Label className="text-white font-medium mb-3 flex items-center gap-2">
          <DollarSign size={16} /> Información del Bot
        </Label>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <Label className="text-xs text-gray-400">Capital Actual</Label>
            <p className="text-white font-medium text-xs">${(bot?.stake || 0).toLocaleString()} {parameters.base_currency}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Tipo</Label>
            <p className="text-white font-medium text-xs">{parameters.market_type || 'SPOT'} {parameters.leverage > 1 && ` (${parameters.leverage}x)`}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Estado</Label>
            <Badge variant={bot?.status === 'RUNNING' ? 'default' : 'secondary'} className="text-xs">{bot?.status || 'STOPPED'}</Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <Button 
          onClick={onUpdateParameters}
          disabled={isUpdating || !allValid}
          className={`flex-1 ${
            allValid 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {isUpdating ? "Actualizando..." : "💾 Guardar Parámetros"}
        </Button>
        <Button 
          variant="outline" 
          onClick={onClose}
          className="px-8 border-gray-600 hover:bg-gray-800"
        >
          Cancelar
        </Button>
      </div>

      {!allValid && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Completa todos los campos requeridos antes de guardar
          </p>
        </div>
      )}
    </div>
  );
};

export default ValidationSummary;