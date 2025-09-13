import React from 'react';
import { Label } from "@/components/ui/label";
import { Settings, DollarSign } from "lucide-react";

const BasicBotConfig = ({
  bot,
  parameters,
  onParametersChange,
  currentPrice,
  strategies,
  intervals,
  baseCurrencies,
  strategiesLoading = false,
  intervalsLoading = false,
  baseCurrenciesLoading = false,
  loadingPrice = false
}) => {
  const handleParameterChange = (key, value) => {
    onParametersChange({ [key]: value });
  };

  const InputField = ({ label, type = "text", value, onChange, placeholder, options, loading }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
        >
          <option value="">{loading ? "Cargando..." : `Seleccionar ${label}`}</option>
          {options?.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="text-blue-400" size={20} />
          Configuración Básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Nombre del Bot"
            value={parameters.name || ''}
            onChange={(value) => handleParameterChange('name', value)}
            placeholder="Ej: BTC Smart Scalper"
          />

          <InputField
            label="Estrategia"
            type="select"
            value={parameters.strategy || ''}
            onChange={(value) => handleParameterChange('strategy', value)}
            options={strategies}
            loading={strategiesLoading}
          />

          <InputField
            label="Intervalo"
            type="select"
            value={parameters.interval || ''}
            onChange={(value) => handleParameterChange('interval', value)}
            options={intervals}
            loading={intervalsLoading}
          />
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-green-400" size={18} />
          Configuración Financiera
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Capital (USDT)"
            type="number"
            value={parameters.stake || ''}
            onChange={(value) => handleParameterChange('stake', parseFloat(value) || 0)}
            placeholder="1000"
          />

          <InputField
            label="Take Profit (%)"
            type="number"
            value={parameters.takeProfit || ''}
            onChange={(value) => handleParameterChange('takeProfit', parseFloat(value) || 0)}
            placeholder="2.5"
          />
          <InputField
            label="Stop Loss (%)"
            type="number"
            value={parameters.stopLoss || ''}
            onChange={(value) => handleParameterChange('stopLoss', parseFloat(value) || 0)}
            placeholder="1.5"
          />
        </div>
      </div>

      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3">📊 Información del Bot</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <Label className="text-xs text-gray-400">Símbolo</Label>
            <p className="text-white font-medium text-sm">{bot?.symbol || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Exchange</Label>
            <p className="text-white font-medium text-sm">{bot?.exchange || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Precio Actual</Label>
            <p className="text-white font-medium text-sm">{loadingPrice ? "..." : `$${currentPrice?.toFixed(2) || '0.00'}`}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Estado</Label>
            <p className={`font-medium text-sm ${bot?.status === 'RUNNING' ? 'text-green-400' : 'text-gray-400'}`}>
              {bot?.status || 'STOPPED'} {bot?.status === 'RUNNING' && <span className="text-yellow-400 text-xs ml-1">(Activo)</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">💡 Consejos de Configuración</h4>
        <p className="text-gray-300 text-sm">
          • Nombres descriptivos | Capital proporcional al riesgo | TP: 2-5% | SL: 1-3%
        </p>
      </div>
    </div>
  );
};

export default BasicBotConfig;