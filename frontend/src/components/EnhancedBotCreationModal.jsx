import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const EnhancedBotCreationModal = ({ isOpen, onClose, onBotCreated }) => {
  const { userExchanges, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);

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
    entry_order_type: 'MARKET',
    exit_order_type: 'MARKET',
    tp_order_type: 'LIMIT',
    sl_order_type: 'STOP_MARKET',
    trailing_stop: false
  });

  // Cargar datos reales cuando se selecciona exchange
  useEffect(() => {
    if (selectedExchange && formData.symbol) {
      loadRealTimeData();
    }
  }, [selectedExchange, formData.symbol]);

  const loadRealTimeData = async () => {
    try {
      // Aquí iría la lógica para cargar precio actual y balance
      // desde el exchange seleccionado usando la API
      console.log('Loading real-time data for:', {
        exchange: selectedExchange.exchange_name,
        symbol: formData.symbol
      });
      
      // Mock data por ahora - será reemplazado con datos reales
      setRealTimeData({
        currentPrice: 43250.50,
        balance: 1000.00,
        leverageLimits: { min: 1, max: 125 }
      });
    } catch (err) {
      console.error('Error loading real-time data:', err);
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
      const response = await fetch('/api/create-bot', {
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
                    Símbolo
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                {/* Market Type y Leverage */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Mercado
                    </label>
                    <select
                      name="market_type"
                      value={formData.market_type}
                      onChange={handleInputChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="SPOT">SPOT</option>
                      <option value="FUTURES_USDT">FUTURES USDT</option>
                      <option value="FUTURES_COIN">FUTURES COIN</option>
                    </select>
                  </div>
                  
                  {formData.market_type.includes('FUTURES') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Leverage
                      </label>
                      <input
                        type="number"
                        name="leverage"
                        value={formData.leverage}
                        onChange={handleInputChange}
                        min="1"
                        max="125"
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  )}
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
                    <option value="Smart Scalper">Smart Scalper</option>
                    <option value="Trend Hunter">Trend Hunter</option>
                    <option value="Grid Bot">Grid Bot</option>
                    <option value="DCA Bot">DCA Bot</option>
                  </select>
                </div>

                {/* Datos en Tiempo Real */}
                {realTimeData && selectedExchange && (
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium text-sm mb-2">Datos en Tiempo Real</h4>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Precio Actual:</span>
                        <span className="text-white">${realTimeData.currentPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Balance Disponible:</span>
                        <span className="text-white">${realTimeData.balance.toFixed(2)} {formData.base_currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Exchange:</span>
                        <span className="text-blue-400">{selectedExchange.exchange_name.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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