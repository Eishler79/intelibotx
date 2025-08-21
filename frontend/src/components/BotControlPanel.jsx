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
  const [parameters, setParameters] = useState({});
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // Efecto para cargar los datos reales del bot cuando se abre el modal
  useEffect(() => {
    if (bot) {
      console.log('🔍 Cargando datos del bot:', bot);
      console.log('🔍 Campos específicos - name:', bot.name, 'leverage:', bot.leverage, 'market_type:', bot.market_type);
      setParameters({
        // Parámetros básicos del bot creado (DATOS REALES)
        name: bot.name || `Bot ${bot.symbol}` || 'Bot',
        symbol: bot.symbol || 'BTCUSDT',
        strategy: bot.strategy || 'Smart Scalper',
        interval: bot.interval || '15m',
        stake: Number(bot.stake) || 100,
        base_currency: bot.base_currency || 'USDT',
        market_type: bot.market_type || bot.marketType || 'SPOT',
        leverage: Number(bot.leverage) || 1,
        
        // Parámetros de riesgo (DATOS REALES)
        takeProfit: Number(bot.take_profit || bot.takeProfit) || 2.5,
        stopLoss: Number(bot.stop_loss || bot.stopLoss) || 1.5,
        riskPercentage: Number(bot.risk_percentage || bot.riskPercentage) || 1.0,
        
        // Parámetros avanzados de órdenes
        dca_levels: Number(bot.dca_levels) || 3,
        entry_order_type: bot.entry_order_type || 'MARKET',
        exit_order_type: bot.exit_order_type || 'MARKET',
        tp_order_type: bot.tp_order_type || 'LIMIT',
        sl_order_type: bot.sl_order_type || 'STOP_MARKET',
        trailing_stop: bot.trailing_stop || false,
        
        // Parámetros operacionales
        maxOpenPositions: bot.max_open_positions || 3,
        cooldownMinutes: bot.cooldown_minutes || 30,
        marketConditionFilter: bot.market_condition_filter !== false,
        volatilityThreshold: bot.volatility_threshold || 0.8,
      });
    }
  }, [bot]);

  // ✅ Efecto para cargar precio actual del bot symbol
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (!bot?.symbol) return;
      
      setLoadingPrice(true);
      try {
        // Usar misma API que EnhancedBotCreationModal para consistency
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${bot.symbol}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentPrice(parseFloat(data.price));
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        setCurrentPrice(null);
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchCurrentPrice();
    
    // ✅ Auto-refresh precio cada 2 segundos según requerimiento usuario
    const priceInterval = setInterval(fetchCurrentPrice, 2000);
    
    return () => clearInterval(priceInterval);
  }, [bot?.symbol]);

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
                Configurar Bot - {parameters.name || bot?.name || bot?.symbol}
              </CardTitle>
              <p className="text-gray-400 mt-1">
                Edita todos los parámetros de tu bot y ve el impacto monetario en tiempo real
              </p>
              {/* DEBUG INFO - Remover en producción */}
              <div className="text-xs text-yellow-400 mt-1">
                Debug: Market={parameters.market_type} | Leverage={parameters.leverage} | TP={parameters.takeProfit} | SL={parameters.stopLoss}
              </div>
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
          {/* Configuración Básica del Bot */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-blue-400" size={20} />
              Configuración Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nombre del Bot</Label>
                <input
                  type="text"
                  value={parameters.name}
                  onChange={(e) => handleParameterChange('name', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Nombre personalizado del bot"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estrategia</Label>
                <select
                  value={parameters.strategy}
                  onChange={(e) => handleParameterChange('strategy', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="Smart Scalper">Smart Scalper - IA Multi-timeframe</option>
                  <option value="Trend Hunter">Trend Hunter - Detección de Tendencias IA</option>
                  <option value="Manipulation Detector">Manipulation Detector - Anti-Whales IA</option>
                  <option value="News Sentiment">News Sentiment - IA + Análisis de Noticias</option>
                  <option value="Volatility Master">Volatility Master - IA Adaptativa</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Capital (Stake)</Label>
                <input
                  type="number"
                  value={parameters.stake}
                  onChange={(e) => handleParameterChange('stake', parseFloat(e.target.value))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min="0.01"
                  step="0.01"
                />
              </div>
              
              {(parameters.market_type === 'FUTURES_USDT' || parameters.market_type === 'FUTURES_COIN' || parameters.market_type?.includes('FUTURES')) && (
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
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timeframe</Label>
                <select
                  value={parameters.interval}
                  onChange={(e) => handleParameterChange('interval', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="1m">1 minuto</option>
                  <option value="5m">5 minutos</option>
                  <option value="15m">15 minutos</option>
                  <option value="30m">30 minutos</option>
                  <option value="1h">1 hora</option>
                  <option value="4h">4 horas</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  📈 Intervalo de tiempo para análisis técnico del bot
                </p>
              </div>
            </div>
            
            {/* Información del Exchange y Market Type */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                <DollarSign size={16} />
                Configuración de Mercado Actual
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-400">Exchange</Label>
                  <p className="text-white font-medium">
                    {bot?.exchange_name || 'BINANCE'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Tipo de Mercado</Label>
                  <p className="text-white font-medium">
                    {parameters.market_type === 'FUTURES_USDT' ? 'FUTURES USDT' :
                     parameters.market_type === 'FUTURES_COIN' ? 'FUTURES COIN' :
                     parameters.market_type === 'SPOT' ? 'SPOT' : 
                     (parameters.market_type || 'SPOT')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Apalancamiento</Label>
                  <p className="text-white font-medium">
                    {parameters.leverage || 1}x
                    {(parameters.market_type === 'SPOT' || !parameters.market_type?.includes('FUTURES')) && (
                      <span className="text-gray-400 text-xs ml-1">(No aplica en SPOT)</span>
                    )}
                    {parameters.market_type?.includes('FUTURES') && parameters.leverage > 1 && (
                      <span className="text-yellow-400 text-xs ml-1">(Activo)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado del Bot - Datos Reales */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-green-400" size={20} />
              Estado del Bot - Tiempo Real
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                <Activity className="mx-auto mb-2 text-green-400" size={20} />
                <p className="text-xs text-gray-400">Estado</p>
                <Badge className={`mt-1 ${
                  bot?.status === 'RUNNING' ? 'bg-green-500/20 text-green-400' :
                  bot?.status === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {bot?.status || 'STOPPED'}
                </Badge>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                <DollarSign className="mx-auto mb-2 text-green-400" size={20} />
                <p className="text-xs text-gray-400">Capital Asignado</p>
                <p className="font-semibold text-green-400">
                  ${(bot?.stake || 0).toLocaleString()} {parameters.base_currency}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {parameters.leverage || 1}x leverage
                </p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                <Target className="mx-auto mb-2 text-orange-400" size={20} />
                <p className="text-xs text-gray-400">Precio de Entrada</p>
                <p className="font-semibold text-orange-400">
                  {bot?.min_entry_price && bot.min_entry_price > 0 ? (
                    `$${bot.min_entry_price.toLocaleString()} USDT`
                  ) : (
                    <span className="text-red-400">No capturado</span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {bot?.min_entry_price ? 'Al crear bot' : '⚠️ Error captura'}
                </p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                <TrendingUp className="mx-auto mb-2 text-blue-400" size={20} />
                <p className="text-xs text-gray-400">Precio Mercado {bot?.symbol}</p>
                <p className="font-semibold text-blue-400">
                  {loadingPrice ? (
                    'Cargando...'
                  ) : currentPrice ? (
                    `$${currentPrice.toLocaleString()} USDT`
                  ) : (
                    'Sin datos'
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentPrice ? '🟢 En vivo 2s' : 'Error API'}
                </p>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg text-center">
                <Target className="mx-auto mb-2 text-purple-400" size={20} />
                <p className="text-xs text-gray-400">Creado</p>
                <p className="font-semibold text-purple-400">
                  {bot?.created_at ? new Date(bot.created_at).toLocaleDateString('es-ES') : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Fecha inicio
                </p>
              </div>
            </div>
          </div>

          {/* Controles de Riesgo */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="text-red-400" size={20} />
                Risk Management
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                🎯 <strong>Gestión de riesgo:</strong> Controla cuánto puedes ganar o perder en cada operación. 
                Los valores se calculan dinámicamente sobre tu capital actual.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
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
                <p className="text-xs text-green-400">
                  ≈ +${(((parameters.stake || 0) * (parameters.leverage || 1)) * (parameters.takeProfit || 0) / 100).toFixed(2)} {parameters.base_currency || 'USDT'} por operación
                  {(parameters.leverage || 1) > 1 && (
                    <span className="text-yellow-400 ml-1">({parameters.leverage}x leverage aplicado)</span>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
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
                <p className="text-xs text-red-400">
                  ≈ -${(((parameters.stake || 0) * (parameters.leverage || 1)) * (parameters.stopLoss || 0) / 100).toFixed(2)} {parameters.base_currency || 'USDT'} por operación
                  {(parameters.leverage || 1) > 1 && (
                    <span className="text-yellow-400 ml-1">({parameters.leverage}x leverage aplicado)</span>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
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
                <p className="text-xs text-yellow-400">
                  🎯 Porcentaje máximo del capital en riesgo por operación
                </p>
              </div>
              
              <div className="space-y-2">
                <SliderInput
                  label="Capital por Trade"
                  value={parameters.stake}
                  min={10}
                  max={5000}
                  step={10}
                  suffix={` ${parameters.base_currency}`}
                  onChange={(value) => handleParameterChange('stake', value)}
                  icon={DollarSign}
                />
                <p className="text-xs text-blue-400">
                  💰 Capital utilizado por cada operación del bot
                </p>
              </div>
            </div>
          </div>

          {/* Configuración de Órdenes */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="text-orange-400" size={20} />
              Gestión de Órdenes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Orden Entrada</Label>
                <select
                  value={parameters.entry_order_type}
                  onChange={(e) => handleParameterChange('entry_order_type', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="MARKET">MARKET - Ejecución inmediata</option>
                  <option value="LIMIT">LIMIT - Precio específico</option>
                  <option value="STOP_LIMIT">STOP LIMIT - Con activación</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Orden Salida</Label>
                <select
                  value={parameters.exit_order_type}
                  onChange={(e) => handleParameterChange('exit_order_type', e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="MARKET">MARKET - Ejecución inmediata</option>
                  <option value="LIMIT">LIMIT - Precio específico</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Niveles DCA (Dollar Cost Average)</Label>
                <input
                  type="number"
                  value={parameters.dca_levels}
                  onChange={(e) => handleParameterChange('dca_levels', parseInt(e.target.value))}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  min="1"
                  max="10"
                />
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-purple-400 font-medium mb-1">
                    🤖 <strong>DCA en la IA del Bot:</strong>
                  </p>
                  <p className="text-xs text-gray-300 mb-2">
                    Cuando el precio va <strong>en contra</strong> de tu posición inicial, la IA del bot 
                    <strong>compra más a precios más bajos</strong> (promediando el costo).
                  </p>
                  <p className="text-xs text-yellow-400 mb-1">
                    📊 <strong>Ejemplo con {parameters.dca_levels} niveles:</strong>
                  </p>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• <strong>Nivel 1:</strong> Compra inicial a $100 (${parameters.stake})</li>
                    <li>• <strong>Nivel 2:</strong> Si baja a $95, compra más (${(parameters.stake * 1.2).toFixed(0)})</li>
                    {parameters.dca_levels >= 3 && (
                      <li>• <strong>Nivel 3:</strong> Si baja a $90, compra más (${(parameters.stake * 1.5).toFixed(0)})</li>
                    )}
                    {parameters.dca_levels >= 4 && (
                      <li className="text-gray-400">• ... y así hasta {parameters.dca_levels} niveles</li>
                    )}
                  </ul>
                  <p className="text-xs text-green-400 mt-2">
                    🎯 <strong>Resultado:</strong> Precio promedio más bajo = Mayor ganancia cuando se recupere
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Trailing Stop
                  <div className={`w-3 h-3 rounded-full ${
                    parameters.trailing_stop ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                </Label>
                <select
                  value={parameters.trailing_stop ? 'true' : 'false'}
                  onChange={(e) => handleParameterChange('trailing_stop', e.target.value === 'true')}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="false">Desactivado</option>
                  <option value="true">Activado</option>
                </select>
                <p className="text-xs text-gray-400">
                  🎯 Stop loss que sigue el precio favorable
                </p>
              </div>
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
              <div className="space-y-2">
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
                <p className="text-xs text-purple-400 mt-1">
                  🎯 Máximo número de posiciones abiertas simultáneamente por el bot
                </p>
              </div>
              <div className="space-y-2">
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
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                  <p className="text-xs text-blue-400 font-medium mb-1">
                    ⏱️ <strong>Cooldown explicado:</strong>
                  </p>
                  <p className="text-xs text-gray-300">
                    Tiempo de espera entre operaciones para evitar overtrading. 
                    Si está en <strong>{parameters.cooldownMinutes} minutos</strong>, el bot esperará ese tiempo 
                    antes de hacer la siguiente operación, protegiendo tu capital de operaciones impulsivas.
                  </p>
                  <p className="text-xs text-yellow-400 mt-1">
                    💰 <strong>Impacto monetario:</strong> Menos operaciones = menor riesgo pero menor frecuencia de ganancias
                  </p>
                </div>
              </div>
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