import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Sliders, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Activity,
  Target
} from "lucide-react";

export default function BotControlPanel({ bot, onUpdateBot, onClose }) {
  const [parameters, setParameters] = useState({
    takeProfit: bot?.take_profit || 2.5,
    stopLoss: bot?.stop_loss || 1.5,
    riskPercentage: bot?.risk_percentage || 1.0,
    positionSize: bot?.position_size || 100,
    trailingStopEnabled: bot?.trailing_stop_enabled || false,
    adaptiveMode: bot?.adaptive_mode || true,
    maxOpenPositions: bot?.max_open_positions || 3,
    cooldownMinutes: bot?.cooldown_minutes || 30,
    marketConditionFilter: bot?.market_condition_filter || true,
    volatilityThreshold: bot?.volatility_threshold || 0.8,
  });

  const [isUpdating, setIsUpdating] = useState(false);

  const handleParameterChange = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleUpdateParameters = async () => {
    setIsUpdating(true);
    try {
      await onUpdateBot(bot.id, parameters);
      console.log("✅ Parámetros actualizados exitosamente");
    } catch (error) {
      console.error("❌ Error actualizando parámetros:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const SliderInput = ({ label, value, min, max, step, suffix, onChange, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Icon size={16} className="text-blue-400" />
          {label}
        </Label>
        <span className="text-sm font-semibold text-green-400">
          {value}{suffix}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
          }}
        />
      </div>
    </div>
  );

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-900 border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="text-blue-400" size={24} />
                Control Panel - {bot?.symbol}
              </CardTitle>
              <p className="text-gray-400 mt-1">Ajuste dinámico de parámetros en tiempo real</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estado del Bot */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <Activity className="mx-auto mb-2 text-green-400" size={20} />
              <p className="text-xs text-gray-400">Estado</p>
              <Badge className="mt-1 bg-green-500/20 text-green-400">
                {bot?.status || 'RUNNING'}
              </Badge>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <DollarSign className="mx-auto mb-2 text-blue-400" size={20} />
              <p className="text-xs text-gray-400">Balance</p>
              <p className="font-semibold text-blue-400">${bot?.balance || '1,200'}</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <TrendingUp className="mx-auto mb-2 text-purple-400" size={20} />
              <p className="text-xs text-gray-400">PnL Hoy</p>
              <p className="font-semibold text-purple-400">+$45.30</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <Target className="mx-auto mb-2 text-yellow-400" size={20} />
              <p className="text-xs text-gray-400">Trades</p>
              <p className="font-semibold text-yellow-400">12</p>
            </div>
          </div>

          {/* Controles de Riesgo */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="text-red-400" size={20} />
              Risk Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderInput
                label="Take Profit"
                value={parameters.takeProfit}
                min={0.5}
                max={10}
                step={0.1}
                suffix="%"
                onChange={(value) => handleParameterChange('takeProfit', value)}
                icon={TrendingUp}
              />
              <SliderInput
                label="Stop Loss"
                value={parameters.stopLoss}
                min={0.5}
                max={5}
                step={0.1}
                suffix="%"
                onChange={(value) => handleParameterChange('stopLoss', value)}
                icon={AlertTriangle}
              />
              <SliderInput
                label="Risk per Trade"
                value={parameters.riskPercentage}
                min={0.1}
                max={5}
                step={0.1}
                suffix="%"
                onChange={(value) => handleParameterChange('riskPercentage', value)}
                icon={Shield}
              />
              <SliderInput
                label="Position Size"
                value={parameters.positionSize}
                min={10}
                max={1000}
                step={10}
                suffix="$"
                onChange={(value) => handleParameterChange('positionSize', value)}
                icon={DollarSign}
              />
            </div>
          </div>

          {/* Configuraciones Avanzadas */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sliders className="text-blue-400" size={20} />
              Configuración Avanzada
            </h3>
            <div className="space-y-3">
              <SwitchControl
                label="Trailing Stop"
                checked={parameters.trailingStopEnabled}
                onChange={(checked) => handleParameterChange('trailingStopEnabled', checked)}
                icon={Target}
                description="Ajusta automáticamente el stop loss siguiendo el precio"
              />
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

          {/* Controles Operacionales */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Controles Operacionales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SliderInput
                label="Max Posiciones Abiertas"
                value={parameters.maxOpenPositions}
                min={1}
                max={10}
                step={1}
                suffix=""
                onChange={(value) => handleParameterChange('maxOpenPositions', value)}
                icon={Activity}
              />
              <SliderInput
                label="Cooldown (minutos)"
                value={parameters.cooldownMinutes}
                min={5}
                max={120}
                step={5}
                suffix="m"
                onChange={(value) => handleParameterChange('cooldownMinutes', value)}
                icon={Settings}
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4 pt-4 border-t border-gray-700">
            <Button 
              onClick={handleUpdateParameters}
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
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
        </CardContent>
      </Card>
    </div>
  );
}