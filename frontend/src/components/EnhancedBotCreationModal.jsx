import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Activity, 
  Target, 
  TrendingDown, 
  Banknote, 
  BarChart2, 
  RefreshCw 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const EnhancedBotCreationModal = ({ isOpen, onClose, onBotCreated, selectedTemplate }) => {
  const { userExchanges, isAuthenticated, loadUserExchanges } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [marketTypes, setMarketTypes] = useState([]);
  const [marketTypesLoading, setMarketTypesLoading] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTCUSDT',
    exchange_id: null,
    base_currency: 'USDT',
    quote_currency: 'BTC',
    stake: 100,
    strategy: 'Smart Scalper',
    interval: '15m',
    take_profit: 2.5,
    stop_loss: 1.5,
    dca_levels: 3,
    risk_percentage: 1.0,
    market_type: 'SPOT',
    leverage: 1,
    margin_type: 'ISOLATED',
    max_open_positions: 3,
    cooldown_minutes: 15,
    entry_order_type: 'MARKET',
    exit_order_type: 'MARKET',
    tp_order_type: 'LIMIT',
    sl_order_type: 'STOP_MARKET',
    trailing_stop: false
  });

  // ✅ FRONTEND_EXCHANGE_PERSISTENCE_FIX: Load exchanges when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated && (!userExchanges || userExchanges.length === 0)) {
      loadUserExchanges();
    }
  }, [isOpen, isAuthenticated, loadUserExchanges]);

  // Pre-fill form with template data when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const { config } = selectedTemplate;
      setFormData(prev => ({
        ...prev,
        name: selectedTemplate.name || '',
        strategy: config.strategy || prev.strategy,
        take_profit: config.take_profit || prev.take_profit,
        stop_loss: config.stop_loss || prev.stop_loss,
        risk_percentage: config.risk_percentage || prev.risk_percentage,
        market_type: config.market_type || prev.market_type,
        leverage: config.leverage || prev.leverage,
        dca_levels: config.dca_levels || prev.dca_levels,
        interval: config.interval || prev.interval,
        entry_order_type: config.entry_order_type || prev.entry_order_type,
        exit_order_type: config.exit_order_type || prev.exit_order_type,
        tp_order_type: config.tp_order_type || prev.tp_order_type,
        sl_order_type: config.sl_order_type || prev.sl_order_type,
        trailing_stop: config.trailing_stop !== undefined ? config.trailing_stop : prev.trailing_stop
      }));
    }
  }, [selectedTemplate]);

  // Cargar símbolos disponibles cuando se abre el modal
  useEffect(() => {
    if (isOpen && availableSymbols.length === 0) {
      loadAvailableSymbols();
    }
  }, [isOpen]);

  // Cargar market types cuando se selecciona exchange
  useEffect(() => {
    if (selectedExchange) {
      loadMarketTypes();
    }
  }, [selectedExchange]);

  // Cargar datos reales cuando se selecciona exchange
  useEffect(() => {
    if (selectedExchange && formData.symbol) {
      loadRealTimeData();
    }
  }, [selectedExchange, formData.symbol]);

  const loadAvailableSymbols = async () => {
    setSymbolsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/available-symbols`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.symbols && Array.isArray(data.symbols)) {
          // Filtrar solo pares USDT populares para mejor UX
          const usdtPairs = data.symbols
            .filter(symbol => symbol.endsWith('USDT'))
            .sort((a, b) => {
              // Priorizar pares populares
              const popular = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT', 'MATICUSDT', 'UNIUSDT', 'DOGEUSDT'];
              const aIndex = popular.indexOf(a);
              const bIndex = popular.indexOf(b);
              
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              return a.localeCompare(b);
            });
          
          setAvailableSymbols(usdtPairs);
          console.log(`✅ Loaded ${usdtPairs.length} USDT trading pairs from Binance`);
        } else {
          throw new Error('Invalid symbols data format');
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading symbols:', err);
      setError(`Error cargando pares de trading: ${err.message}`);
      
      // Fallback a lista básica si falla la API
      const fallbackSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT'];
      setAvailableSymbols(fallbackSymbols);
    } finally {
      setSymbolsLoading(false);
    }
  };

  const loadMarketTypes = async () => {
    setMarketTypesLoading(true);
    try {
      const token = localStorage.getItem('intelibotx_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${selectedExchange.id}/market-types`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.market_types) {
          setMarketTypes(data.market_types);
          console.log(`✅ Loaded ${data.market_types.length} market types for ${data.exchange_name}`);
          
          // Si el market_type actual no está en la lista, resetear al primero
          const currentTypeExists = data.market_types.some(mt => mt.value === formData.market_type);
          if (!currentTypeExists && data.market_types.length > 0) {
            setFormData(prev => ({
              ...prev,
              market_type: data.market_types[0].value,
              leverage: data.market_types[0].max_leverage > 1 ? Math.min(prev.leverage, data.market_types[0].max_leverage) : 1
            }));
          }
        } else {
          throw new Error('Invalid market types data format');
        }
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (err) {
      console.error('Error loading market types:', err);
      setError(`Error cargando tipos de mercado: ${err.message}`);
      
      // Fallback a tipos básicos si falla la API
      const fallbackTypes = [
        {
          value: "SPOT",
          label: "SPOT - Trading sin apalancamiento",
          description: "Trading tradicional sin apalancamiento",
          max_leverage: 1,
          supports_margin: false
        },
        {
          value: "FUTURES_USDT",
          label: "FUTURES USDT - Perpetuos USDT",
          description: "Contratos perpetuos liquidados en USDT",
          max_leverage: 125,
          supports_margin: true
        }
      ];
      setMarketTypes(fallbackTypes);
    } finally {
      setMarketTypesLoading(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const token = localStorage.getItem('intelibotx_token');
      
      // Intentar obtener precio real desde el exchange
      let currentPrice = null;
      let balance = 1000.00; // Default balance
      
      try {
        // Obtener precio real desde Binance (fallback a cualquier exchange)
        const priceResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/binance-price/${formData.symbol}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          if (priceData.price) {
            currentPrice = parseFloat(priceData.price);
            console.log(`✅ Real price loaded for ${formData.symbol}: $${currentPrice}`);
          }
        }
      } catch (priceErr) {
        console.warn('Could not load real price, using fallback:', priceErr);
      }
      
      // Si no se pudo obtener precio real, usar fallback inteligente
      if (!currentPrice) {
        const fallbackPrices = {
          'BTCUSDT': 43250.50, 'ETHUSDT': 2650.75, 'BNBUSDT': 315.20,
          'ADAUSDT': 0.485, 'SOLUSDT': 98.35, 'DOGEUSDT': 0.085,
          'XRPUSDT': 0.635, 'DOTUSDT': 7.25, 'AVAXUSDT': 38.90,
          'LINKUSDT': 14.75, 'MATICUSDT': 0.895, 'UNIUSDT': 6.35
        };
        currentPrice = fallbackPrices[formData.symbol] || 100.00;
        console.log(`⚠️ Using fallback price for ${formData.symbol}: $${currentPrice}`);
      }
      
      // Intentar obtener balance del exchange si es posible
      try {
        if (selectedExchange) {
          const balanceResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${selectedExchange.id}/balance`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            if (balanceData.success && balanceData.balances) {
              const usdtBalance = balanceData.balances.find(b => b.asset === 'USDT');
              if (usdtBalance) {
                balance = parseFloat(usdtBalance.free) || 1000.00;
                console.log(`✅ Real balance loaded: ${balance} USDT`);
              }
            }
          }
        }
      } catch (balanceErr) {
        console.warn('Could not load real balance, using default:', balanceErr);
      }
      
      setRealTimeData({
        currentPrice,
        balance,
        symbol: formData.symbol,
        exchange: selectedExchange?.exchange_name || 'binance',
        isReal: currentPrice !== null
      });
      
    } catch (err) {
      console.error('Error loading real-time data:', err);
      // Fallback completo en caso de error
      setRealTimeData({
        currentPrice: 100.00,
        balance: 1000.00,
        symbol: formData.symbol,
        isReal: false
      });
    }
  };

  const calculateMonetaryValues = () => {
    if (!realTimeData) return { tp: 0, sl: 0, risk: 0 };
    
    const { currentPrice } = realTimeData;
    const { stake, take_profit, stop_loss, leverage } = formData;
    
    const position = stake * leverage;
    const tpPrice = currentPrice * (1 + take_profit / 100);
    const slPrice = currentPrice * (1 - stop_loss / 100);
    
    const tpValue = position * (take_profit / 100);
    const slValue = position * (stop_loss / 100);
    
    return {
      tp: tpValue,
      sl: slValue,
      risk: slValue,
      tpPrice,
      slPrice,
      positionSize: position
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar cambio de market_type para ajustar leverage dinámicamente
    if (name === 'market_type') {
      const selectedType = marketTypes.find(mt => mt.value === value);
      const maxLeverage = selectedType ? selectedType.max_leverage : 1;
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        leverage: Math.min(prev.leverage, maxLeverage) // Ajustar leverage si excede el máximo
      }));
    } else if (name === 'leverage') {
      // Validar que el leverage no exceda el máximo del market type seleccionado
      const selectedType = marketTypes.find(mt => mt.value === formData.market_type);
      const maxLeverage = selectedType ? selectedType.max_leverage : 125;
      const numValue = Math.min(Math.max(1, parseInt(value) || 1), maxLeverage);
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleExchangeSelect = (exchange) => {
    setSelectedExchange(exchange);
    setFormData(prev => ({
      ...prev,
      exchange_id: exchange.id
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Por favor ingresa un nombre para el bot');
      return false;
    }
    if (!selectedExchange) {
      setError('Por favor selecciona un exchange');
      return false;
    }
    if (formData.stake <= 0) {
      setError('El stake debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      // DEBUG: Log data being sent to backend
      console.log('📤 Datos enviados al backend:', {
        name: formData.name,
        leverage: formData.leverage,
        market_type: formData.market_type,
        formDataCompleto: formData
      });
      
      const response = await fetch(`${BASE_URL}/api/create-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        onBotCreated(result);
        onClose();
        // Reset form
        setFormData({
          name: '',
          symbol: 'BTCUSDT',
          exchange_id: null,
          base_currency: 'USDT',
          quote_currency: 'BTC',
          stake: 100,
          strategy: 'Smart Scalper',
          interval: '15m',
          take_profit: 2.5,
          stop_loss: 1.5,
          dca_levels: 3,
          risk_percentage: 1.0,
          market_type: 'SPOT',
          leverage: 1,
          margin_type: 'ISOLATED',
          max_open_positions: 3,
          cooldown_minutes: 15,
          entry_order_type: 'MARKET',
          exit_order_type: 'MARKET',
          tp_order_type: 'LIMIT',
          sl_order_type: 'STOP_MARKET',
          trailing_stop: false
        });
        setSelectedExchange(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al crear el bot');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const monetaryValues = calculateMonetaryValues();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Crear Bot Avanzado</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Izquierda */}
              <div className="space-y-4">
                {/* Nombre del Bot */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Bot *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Bot Fuerte Austero, Bot Agresivo Alpha"
                    required
                  />
                </div>

                {/* Selección de Exchange */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Exchange *
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {userExchanges.map((exchange) => (
                      <button
                        key={exchange.id}
                        type="button"
                        onClick={() => handleExchangeSelect(exchange)}
                        className={`p-2 rounded-lg border transition-all text-sm ${
                          selectedExchange?.id === exchange.id
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-semibold">{exchange.exchange_name.toUpperCase()}</div>
                        <div className="text-xs text-gray-400">{exchange.connection_name}</div>
                      </button>
                    ))}
                  </div>
                  {userExchanges.length === 0 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      No tienes exchanges configurados. Ve a Exchange Management para agregar uno.
                    </p>
                  )}
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Par de Trading {symbolsLoading && <span className="text-blue-400 text-xs">(Cargando...)</span>}
                  </label>
                  <select
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    disabled={symbolsLoading}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                  >
                    {availableSymbols.length > 0 ? (
                      availableSymbols.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol.replace('USDT', '/USDT')}
                        </option>
                      ))
                    ) : (
                      // Fallback si no hay símbolos cargados
                      <>
                        <option value="BTCUSDT">BTC/USDT</option>
                        <option value="ETHUSDT">ETH/USDT</option>
                        <option value="BNBUSDT">BNB/USDT</option>
                        <option value="ADAUSDT">ADA/USDT</option>
                        <option value="SOLUSDT">SOL/USDT</option>
                        <option value="XRPUSDT">XRP/USDT</option>
                        <option value="DOTUSDT">DOT/USDT</option>
                      </>
                    )}
                  </select>
                  {availableSymbols.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {availableSymbols.length} pares disponibles desde Binance
                    </p>
                  )}
                </div>

                {/* Market Type y Leverage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Mercado {marketTypesLoading && <span className="text-blue-400 text-xs">(Cargando...)</span>}
                    </label>
                    <select
                      name="market_type"
                      value={formData.market_type}
                      onChange={handleInputChange}
                      disabled={marketTypesLoading || !selectedExchange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                    >
                      {marketTypes.length > 0 ? (
                        marketTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))
                      ) : (
                        // Fallback si no hay tipos cargados
                        <>
                          <option value="SPOT">SPOT - Trading sin apalancamiento</option>
                          <option value="FUTURES_USDT">FUTURES USDT - Perpetuos USDT</option>
                          <option value="MARGIN">MARGIN - Trading con margen</option>
                        </>
                      )}
                    </select>
                    {!selectedExchange && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Selecciona un exchange para ver tipos disponibles
                      </p>
                    )}
                    {selectedExchange && marketTypes.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {marketTypes.length} tipos disponibles en {selectedExchange.exchange_name.toUpperCase()}
                      </p>
                    )}
                  </div>
                  
                  {(() => {
                    const selectedType = marketTypes.find(mt => mt.value === formData.market_type);
                    const showLeverage = selectedType ? selectedType.supports_margin : false;
                    const maxLeverage = selectedType ? selectedType.max_leverage : 1;
                    
                    return showLeverage && maxLeverage > 1 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Leverage (1-{maxLeverage}x)
                        </label>
                        <input
                          type="number"
                          name="leverage"
                          value={formData.leverage}
                          onChange={handleInputChange}
                          min="1"
                          max={maxLeverage.toString()}
                          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Max: {maxLeverage}x para {selectedType ? selectedType.label.split(' - ')[0] : 'este tipo'}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="space-y-4">
                {/* Stake y Moneda */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Capital (Stake)
                    </label>
                    <input
                      type="number"
                      name="stake"
                      value={formData.stake}
                      onChange={handleInputChange}
                      min="0.01"
                      step="0.01"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Moneda Base
                    </label>
                    <select
                      name="base_currency"
                      value={formData.base_currency}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="USDT">USDT</option>
                      <option value="BUSD">BUSD</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>

                {/* TP y SL */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Take Profit (%)
                    </label>
                    <input
                      type="number"
                      name="take_profit"
                      value={formData.take_profit}
                      onChange={handleInputChange}
                      min="0.1"
                      step="0.1"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    {realTimeData && (
                      <p className="text-green-400 text-xs mt-1">
                        ≈ +${monetaryValues.tp.toFixed(2)} {formData.base_currency}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Stop Loss (%)
                    </label>
                    <input
                      type="number"
                      name="stop_loss"
                      value={formData.stop_loss}
                      onChange={handleInputChange}
                      min="0.1"
                      step="0.1"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                    {realTimeData && (
                      <p className="text-red-400 text-xs mt-1">
                        ≈ -${monetaryValues.sl.toFixed(2)} {formData.base_currency}
                      </p>
                    )}
                  </div>
                </div>

                {/* Estrategia */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estrategia
                  </label>
                  <select
                    name="strategy"
                    value={formData.strategy}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="Smart Scalper">Smart Scalper - IA Multi-timeframe</option>
                    <option value="Trend Hunter">Trend Hunter - Detección de Tendencias IA</option>
                    <option value="Manipulation Detector">Manipulation Detector - Anti-Whales IA</option>
                    <option value="News Sentiment">News Sentiment - IA + Análisis de Noticias</option>
                    <option value="Volatility Master">Volatility Master - IA Adaptativa</option>
                  </select>
                </div>

                {/* Datos en Tiempo Real */}
                {realTimeData && selectedExchange && (
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium text-sm mb-2">Datos en Tiempo Real - {formData.symbol}</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Precio {formData.symbol}:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">${realTimeData.currentPrice.toLocaleString()}</span>
                          {/* 🔍 DL-001 Price Status Transparency */}
                          <span className={`price-status inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            realTimeData.isReal 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              realTimeData.isReal ? 'bg-green-400' : 'bg-orange-400'
                            }`} />
                            {realTimeData.isReal ? 'LIVE' : 'APROX'}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Balance Disponible:</span>
                        <span className="text-white">${realTimeData.balance.toFixed(2)} {formData.base_currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exchange:</span>
                        <span className="text-blue-400">{selectedExchange.exchange_name.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Mercado:</span>
                        <span className="text-yellow-400">{formData.market_type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 🛠️ Advanced Configuration Section - DL-001 Compliance */}
            <div className="advanced-config bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl mt-6 overflow-hidden">
              <div className="advanced-config-header bg-white/5 px-6 py-4 cursor-pointer flex items-center justify-between hover:bg-white/10 transition-colors"
                   onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}>
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-white font-semibold">Configuración Avanzada</h3>
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                    DL-001 Compliance
                  </Badge>
                </div>
                <motion.div 
                  animate={{ rotate: showAdvancedConfig ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              
              {showAdvancedConfig && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="advanced-config-content p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {/* Intervalo de Trading */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Intervalo de Trading
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Timeframe para análisis técnico del bot">ⓘ</span>
                    </label>
                    <select
                      name="interval"
                      value={formData.interval}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="1m">1 Minuto - Ultra rápido</option>
                      <option value="5m">5 Minutos - Scalping agresivo</option>
                      <option value="15m">15 Minutos - Scalping moderado</option>
                      <option value="1h">1 Hora - Swing trading</option>
                      <option value="4h">4 Horas - Position trading</option>
                      <option value="1d">1 Día - Inversión long term</option>
                    </select>
                  </div>

                  {/* Risk Percentage */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-red-400" />
                      Riesgo por Trade (%)
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Porcentaje máximo del capital en riesgo por operación">ⓘ</span>
                    </label>
                    <input
                      type="number"
                      name="risk_percentage"
                      value={formData.risk_percentage}
                      onChange={handleInputChange}
                      min="0.1"
                      max="10"
                      step="0.1"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="1.0"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Recomendado: 1-2% para traders conservadores, 3-5% agresivos
                    </p>
                  </div>

                  {/* DCA Levels */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-orange-400" />
                      Niveles DCA
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Cantidad de órdenes adicionales en caso de precio adverso">ⓘ</span>
                    </label>
                    <input
                      type="number"
                      name="dca_levels"
                      value={formData.dca_levels}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      0 = Sin DCA, 3-5 = Estrategia moderada, 5+ = Agresiva
                    </p>
                  </div>

                  {/* Margin Type */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-yellow-400" />
                      Tipo de Margen
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Tipo de margen para trading con apalancamiento">ⓘ</span>
                    </label>
                    <select
                      name="margin_type"
                      value={formData.margin_type}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="ISOLATED">ISOLATED - Margen aislado</option>
                      <option value="CROSS">CROSS - Margen cruzado</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-2">
                      Isolated: Riesgo limitado por posición | Cross: Comparte margen total
                    </p>
                  </div>

                  {/* Max Open Positions */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-purple-400" />
                      Posiciones Máximas
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Máximo número de posiciones abiertas simultáneamente">ⓘ</span>
                    </label>
                    <input
                      type="number"
                      name="max_open_positions"
                      value={formData.max_open_positions}
                      onChange={handleInputChange}
                      min="1"
                      max="20"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      1-3 = Conservador | 4-8 = Moderado | 8+ = Agresivo
                    </p>
                  </div>

                  {/* Cooldown Minutes */}
                  <div className="advanced-field bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                    <label className="advanced-field-label text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      Cooldown (minutos)
                      <span className="advanced-field-tooltip text-gray-500 cursor-help" title="Tiempo de espera entre trades para evitar overtrading">ⓘ</span>
                    </label>
                    <input
                      type="number"
                      name="cooldown_minutes"
                      value={formData.cooldown_minutes}
                      onChange={handleInputChange}
                      min="0"
                      max="1440"
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="15"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      0 = Sin cooldown | 5-15 = Scalping | 30-60 = Swing | 240+ = Position
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Botones */}
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={loading || userExchanges.length === 0}
              >
                {loading ? 'Creando Bot...' : 'Crear Bot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBotCreationModal;