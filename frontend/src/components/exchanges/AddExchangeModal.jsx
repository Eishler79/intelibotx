import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AddExchangeModal = ({ isOpen, onClose, onExchangeAdded }) => {
  const { addExchange } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('');
  const [formData, setFormData] = useState({
    connection_name: '',
    api_key: '',
    api_secret: '',
    passphrase: '',
    is_testnet: true
  });
  const [error, setError] = useState('');

  const exchanges = [
    { name: 'binance', label: 'Binance', color: '#F0B90B' },
    { name: 'bybit', label: 'Bybit', color: '#FF6A00' },
    { name: 'okx', label: 'OKX', color: '#0052FF' },
    { name: 'kucoin', label: 'KuCoin', color: '#20D090' },
    { name: 'kraken', label: 'Kraken', color: '#5741D9' },
    { name: 'huobi', label: 'Huobi', color: '#2EABDC' }
  ];

  const handleExchangeSelect = (exchangeName) => {
    setSelectedExchange(exchangeName);
    setFormData(prev => ({
      ...prev,
      connection_name: prev.connection_name || `Mi ${exchangeName.charAt(0).toUpperCase() + exchangeName.slice(1)}`
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExchange) {
      setError('Por favor selecciona un exchange');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const exchangeData = {
        exchange_name: selectedExchange,
        ...formData
      };

      const result = await addExchange(exchangeData);
      
      if (result.success) {
        onExchangeAdded();
        setSelectedExchange('');
        setFormData({
          connection_name: '',
          api_key: '',
          api_secret: '',
          passphrase: '',
          is_testnet: true
        });
      } else {
        setError(result.error || 'Error al agregar exchange');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Agregar Exchange</h2>
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

          {/* Exchange Selection */}
          <div className="mb-6">
            <h3 className="text-white text-lg font-semibold mb-4">Selecciona un Exchange</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exchanges.map((exchange) => (
                <button
                  key={exchange.name}
                  onClick={() => handleExchangeSelect(exchange.name)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    selectedExchange === exchange.name
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Exchange Icon */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: `${exchange.color}20` }}>
                      {exchange.name === 'binance' && (
                        <svg className="w-8 h-8" style={{ color: exchange.color }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 15L10.91 8.26L12 2Z"/>
                        </svg>
                      )}
                      {exchange.name === 'bybit' && (
                        <div className="text-xl font-bold" style={{ color: exchange.color }}>B</div>
                      )}
                      {exchange.name === 'okx' && (
                        <div className="grid grid-cols-2 gap-1">
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: exchange.color }}></div>
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: exchange.color }}></div>
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: exchange.color }}></div>
                          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: exchange.color }}></div>
                        </div>
                      )}
                      {exchange.name === 'kucoin' && (
                        <div className="text-xl font-bold" style={{ color: exchange.color }}>K</div>
                      )}
                      {exchange.name === 'kraken' && (
                        <svg className="w-8 h-8" style={{ color: exchange.color }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                          <path d="M8 12l2-3h4l2 3-2 3h-4l-2-3z"/>
                        </svg>
                      )}
                      {exchange.name === 'huobi' && (
                        <div className="text-xl font-bold" style={{ color: exchange.color }}>H</div>
                      )}
                    </div>
                    
                    {/* Exchange Name */}
                    <div className="text-white font-medium text-center">{exchange.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Form */}
          {selectedExchange && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre de la Conexión
                </label>
                <input
                  type="text"
                  name="connection_name"
                  value={formData.connection_name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  placeholder={`Mi ${selectedExchange.charAt(0).toUpperCase() + selectedExchange.slice(1)}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono text-sm"
                  placeholder="Tu API Key del exchange"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  name="api_secret"
                  value={formData.api_secret}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono text-sm"
                  placeholder="Tu API Secret del exchange"
                  required
                />
              </div>

              {selectedExchange === 'okx' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Passphrase
                  </label>
                  <input
                    type="password"
                    name="passphrase"
                    value={formData.passphrase}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none font-mono text-sm"
                    placeholder="Passphrase para OKX"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_testnet"
                  id="is_testnet"
                  checked={formData.is_testnet}
                  onChange={handleInputChange}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="is_testnet" className="ml-2 text-sm text-gray-300">
                  Usar Testnet (Recomendado para pruebas)
                </label>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mt-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-yellow-400 font-medium text-sm">Seguridad</h4>
                    <p className="text-yellow-300/80 text-xs mt-1">
                      Tus API keys son encriptadas con AES-256 antes de guardarse. 
                      Asegúrate de configurar restricciones de IP en tu exchange.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
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
                  disabled={loading}
                >
                  {loading ? 'Conectando...' : 'Conectar Exchange'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExchangeModal;