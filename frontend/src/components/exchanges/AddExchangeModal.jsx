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
    { name: 'binance', label: 'BINANCE', color: '#F0B90B', logo: '🟨' },
    { name: 'bybit', label: 'BYBIT', color: '#FF6A00', logo: 'BY' },
    { name: 'okx', label: 'OKX', color: '#0052FF', logo: '◼◼' },
    { name: 'kucoin', label: 'KUCOIN', color: '#20D090', logo: 'KC' },
    { name: 'kraken', label: 'KRAKEN', color: '#5741D9', logo: '🐙' },
    { name: 'coinbase', label: 'COINBASE', color: '#0052FF', logo: 'CB' }
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
            <div className="grid grid-cols-3 gap-4">
              {exchanges.map((exchange) => (
                <button
                  key={exchange.name}
                  onClick={() => handleExchangeSelect(exchange.name)}
                  className={`p-6 rounded-lg border transition-all duration-300 bg-gray-800/30 hover:bg-gray-700/50 ${
                    selectedExchange === exchange.name
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  style={{ minHeight: '80px' }}
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    {/* Exchange Icon */}
                    <div className="w-10 h-10 flex items-center justify-center">
                      {exchange.name === 'binance' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#F0B90B">
                          <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 15L10.91 8.26L12 2Z"/>
                        </svg>
                      )}
                      {exchange.name === 'bybit' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#FF6A00">
                          <rect x="2" y="2" width="8" height="8" rx="2"/>
                          <rect x="14" y="2" width="8" height="8" rx="2"/>
                          <rect x="2" y="14" width="8" height="8" rx="2"/>
                          <rect x="14" y="14" width="8" height="8" rx="2"/>
                        </svg>
                      )}
                      {exchange.name === 'okx' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                          <rect x="2" y="2" width="6" height="6" rx="1"/>
                          <rect x="9" y="2" width="6" height="6" rx="1"/>
                          <rect x="16" y="2" width="6" height="6" rx="1"/>
                          <rect x="2" y="9" width="6" height="6" rx="1"/>
                          <rect x="9" y="9" width="6" height="6" rx="1"/>
                          <rect x="16" y="9" width="6" height="6" rx="1"/>
                          <rect x="2" y="16" width="6" height="6" rx="1"/>
                          <rect x="9" y="16" width="6" height="6" rx="1"/>
                          <rect x="16" y="16" width="6" height="6" rx="1"/>
                        </svg>
                      )}
                      {exchange.name === 'kucoin' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#20D090">
                          <path d="M12 2L22 7V17L12 22L2 17V7L12 2Z"/>
                          <path d="M8 9L12 7L16 9V15L12 17L8 15V9Z" fill="white"/>
                        </svg>
                      )}
                      {exchange.name === 'kraken' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#5741D9">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M8 12L10 8H14L16 12L14 16H10L8 12Z" fill="white"/>
                        </svg>
                      )}
                      {exchange.name === 'coinbase' && (
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#0052FF">
                          <circle cx="12" cy="12" r="10"/>
                          <rect x="8" y="8" width="8" height="8" rx="2" fill="white"/>
                        </svg>
                      )}
                    </div>
                    
                    {/* Exchange Name */}
                    <span className="text-white font-bold text-sm uppercase tracking-wide">
                      {exchange.label}
                    </span>
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