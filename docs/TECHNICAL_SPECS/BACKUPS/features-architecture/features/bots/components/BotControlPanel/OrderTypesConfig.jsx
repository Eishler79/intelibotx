import React from 'react';
import { Label } from "@/components/ui/label";
import { Target, Settings, Activity } from "lucide-react";

const OrderTypesConfig = ({ parameters, onParametersChange }) => {
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
        <span className="text-sm font-semibold text-purple-400">{value?.toFixed(0)}{suffix}</span>
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

  const SelectInput = ({ label, value, options, onChange, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-blue-400" />
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );

  const orderTypes = [
    { value: 'market', label: 'Market - Ejecución inmediata' },
    { value: 'limit', label: 'Limit - Precio específico' },
    { value: 'stop_market', label: 'Stop Market - Activación por precio' },
    { value: 'stop_limit', label: 'Stop Limit - Combinado' },
    { value: 'trailing_stop', label: 'Trailing Stop - Seguimiento dinámico' }
  ];

  const timeframes = [
    { value: 'GTC', label: 'Good Till Canceled (GTC)' },
    { value: 'IOC', label: 'Immediate or Cancel (IOC)' },
    { value: 'FOK', label: 'Fill or Kill (FOK)' },
    { value: 'GTD', label: 'Good Till Date (GTD)' }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center border-b border-gray-700 pb-4">
        <h3 className="text-xl font-bold text-white mb-2">⚙️ Configuración de Órdenes</h3>
        <p className="text-gray-400 text-sm">Personaliza el comportamiento de entrada y salida</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Tipo de Orden de Entrada"
          value={parameters.entry_order_type || 'market'}
          options={orderTypes}
          onChange={(value) => handleParameterChange('entry_order_type', value)}
          icon={Target}
        />

        <SelectInput
          label="Tipo de Orden de Salida"
          value={parameters.exit_order_type || 'market'}
          options={orderTypes}
          onChange={(value) => handleParameterChange('exit_order_type', value)}
          icon={Settings}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectInput
          label="Validez de Órdenes"
          value={parameters.time_in_force || 'GTC'}
          options={timeframes}
          onChange={(value) => handleParameterChange('time_in_force', value)}
          icon={Activity}
        />

        <SliderInput
          label="Cooldown Entre Órdenes"
          value={parameters.cooldownMinutes || 5}
          min={1}
          max={60}
          step={1}
          suffix=" min"
          onChange={(value) => handleParameterChange('cooldownMinutes', value)}
          icon={Settings}
        />
      </div>

      <div className="bg-gray-900/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Target size={16} className="text-green-400" />
          Configuración Avanzada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderInput
            label="Slippage Máximo"
            value={parameters.max_slippage || 0.1}
            min={0.05}
            max={2.0}
            step={0.05}
            suffix="%"
            onChange={(value) => handleParameterChange('max_slippage', value)}
            icon={Activity}
          />

          <SliderInput
            label="Timeout de Orden"
            value={parameters.order_timeout || 30}
            min={5}
            max={300}
            step={5}
            suffix="s"
            onChange={(value) => handleParameterChange('order_timeout', value)}
            icon={Settings}
          />
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Consideraciones Importantes</h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Market: inmediato con slippage | Limit: precio exacto</li>
          <li>• Trailing: seguimiento automático | Cooldown: previene sobre-operación</li>
        </ul>
      </div>
    </div>
  );
};

export default OrderTypesConfig;