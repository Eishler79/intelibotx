import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sliders, Activity, AlertTriangle, DollarSign } from "lucide-react";

const AdvancedBotConfig = ({
  parameters,
  onParametersChange,
  marginTypes = [],
  marginTypesLoading = false
}) => {
  const handleParameterChange = (key, value) => {
    onParametersChange({ [key]: value });
  };

  const SwitchControl = ({ label, checked, onChange, icon: Icon, description }) => (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-purple-400" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Market Type and Leverage Configuration */}
      <div>
        {(parameters.market_type === 'FUTURES_USDT' || parameters.market_type === 'FUTURES_COIN' || parameters.market_type?.includes('FUTURES')) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Leverage (Apalancamiento)</Label>
              <input
                type="number"
                value={parameters.leverage || 1}
                onChange={(e) => handleParameterChange('leverage', parseInt(e.target.value))}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                min="1"
                max="125"
              />
              <p className="text-xs text-orange-400">
                ⚠️ Apalancamiento {parameters.leverage}x: Multiplica ganancias Y pérdidas
              </p>
            </div>

            {/* Margin Type - Solo para FUTURES */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Margen</Label>
              <select
                value={parameters.margin_type || 'CROSS'}
                onChange={(e) => handleParameterChange('margin_type', e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                {marginTypesLoading ? (
                  <option>Cargando tipos de margen...</option>
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
              <p className="text-xs text-gray-400">
                Cross = riesgo total | Isolated = riesgo limitado
              </p>
            </div>
          </div>
        )}

        {(parameters.market_type === 'SPOT' || !parameters.market_type?.includes('FUTURES')) && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mercado SPOT</Label>
            <div className="p-3 bg-gray-700 border border-gray-600 rounded-lg">
              <p className="text-white">1x - Sin Apalancamiento</p>
            </div>
            <p className="text-xs text-green-400">
              ✓ Menor riesgo: Solo puedes perder lo que inviertas
            </p>
          </div>
        )}
      </div>

      {/* Advanced Configuration Switches */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sliders className="text-blue-400" size={20} />
          Configuración Avanzada
        </h3>
        <div className="space-y-3">
          <SwitchControl
            label="Modo Adaptativo"
            checked={parameters.adaptiveMode}
            onChange={(checked) => handleParameterChange('adaptiveMode', checked)}
            icon={Activity}
            description="Adapta parámetros según condiciones de mercado"
          />
          <SwitchControl
            label="Filtro de Volatilidad"
            checked={parameters.marketConditionFilter}
            onChange={(checked) => handleParameterChange('marketConditionFilter', checked)}
            icon={AlertTriangle}
            description="Evita operar en condiciones de alta volatilidad"
          />
        </div>
      </div>

      {/* Market Information Panel */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
          <DollarSign size={16} />
          Configuración de Mercado Avanzada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-gray-400">Modo Adaptativo</Label>
            <p className="text-white font-medium">
              {parameters.adaptiveMode ? 'ACTIVADO' : 'DESACTIVADO'}
              {parameters.adaptiveMode && (
                <span className="text-green-400 text-xs ml-1">✓ Análisis dinámico</span>
              )}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-400">Filtro de Volatilidad</Label>
            <p className="text-white font-medium">
              {parameters.marketConditionFilter ? 'ACTIVADO' : 'DESACTIVADO'}
              {parameters.marketConditionFilter && (
                <span className="text-yellow-400 text-xs ml-1">⚠️ Protección activa</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedBotConfig;