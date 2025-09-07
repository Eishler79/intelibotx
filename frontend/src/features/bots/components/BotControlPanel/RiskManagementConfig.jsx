import React from 'react';
import { Label } from "@/components/ui/label";
import { Shield, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";

const RiskManagementConfig = ({ parameters, onParametersChange, currentPrice }) => {
  const handleParameterChange = (key, value) => {
    onParametersChange({ [key]: value });
  };

  const SliderInput = ({ label, value, min, max, step, suffix, onChange, icon: Icon }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-purple-400" />
          <Label className="text-sm font-medium">{label}</Label>
        </div>
        <span className="text-sm font-semibold text-purple-400">{value?.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
      />
    </div>
  );

  const takeProfit = parameters.takeProfit || 0;
  const stopLoss = parameters.stopLoss || 0;
  const stake = parameters.stake || 0;
  const leverage = parameters.leverage || 1;
  const riskRewardRatio = takeProfit > 0 && stopLoss > 0 ? (takeProfit / stopLoss).toFixed(2) : "0.00";
  const potentialGain = stake * leverage * (takeProfit / 100);
  const potentialLoss = stake * leverage * (stopLoss / 100);

  return (
    <div className="space-y-8">
      <div className="text-center border-b border-gray-700 pb-4">
        <h3 className="text-xl font-bold text-white mb-2">🛡️ Gestión de Riesgo</h3>
        <p className="text-gray-400 text-sm">Controla y optimiza tu exposición al riesgo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="Take Profit"
          value={takeProfit}
          min={0.1}
          max={10.0}
          step={0.1}
          suffix="%"
          onChange={(value) => handleParameterChange('takeProfit', value)}
          icon={TrendingUp}
        />

        <SliderInput
          label="Stop Loss"
          value={stopLoss}
          min={0.1}
          max={5.0}
          step={0.1}
          suffix="%"
          onChange={(value) => handleParameterChange('stopLoss', value)}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="Apalancamiento"
          value={leverage}
          min={1}
          max={20}
          step={1}
          suffix="x"
          onChange={(value) => handleParameterChange('leverage', value)}
          icon={Shield}
        />

        <SliderInput
          label="Max Drawdown"
          value={parameters.max_drawdown || 10}
          min={5}
          max={50}
          step={1}
          suffix="%"
          onChange={(value) => handleParameterChange('max_drawdown', value)}
          icon={AlertTriangle}
        />
      </div>

      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <DollarSign size={16} className="text-green-400" />
          Análisis de Riesgo
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Label className="text-xs text-gray-400">Ratio R/R</Label>
            <p className="text-blue-400 font-bold text-lg">{riskRewardRatio}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Ganancia</Label>
            <p className="text-green-400 font-bold text-lg">+${potentialGain.toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Pérdida</Label>
            <p className="text-red-400 font-bold text-lg">-${potentialLoss.toFixed(2)}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Riesgo</Label>
            <p className="text-orange-400 font-bold text-lg">{((potentialLoss / stake) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">💡 Consejos de Gestión</h4>
        <p className="text-gray-300 text-sm">
          • Ratio R/R óptimo: 2:1+ | Leverage moderado: 1-5x | DD: 10-20% | Cuidado con SL estrecho
        </p>
      </div>

      {currentPrice && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">📊 Precios Calculados</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Label className="text-xs text-gray-400">Actual</Label>
              <p className="text-white font-bold text-sm">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-400">TP</Label>
              <p className="text-green-400 font-bold text-sm">${(currentPrice * (1 + takeProfit / 100)).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-400">SL</Label>
              <p className="text-red-400 font-bold text-sm">${(currentPrice * (1 - stopLoss / 100)).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskManagementConfig;