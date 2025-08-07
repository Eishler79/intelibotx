import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AddExchangeModal = ({ onClose, onSuccess }) => {
  const { addExchange } = useAuth();
  const [selectedExchange, setSelectedExchange] = useState('');
  const [exchangeType, setExchangeType] = useState('testnet');
  const [displayName, setDisplayName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  
  const exchanges = [
    {
      id: 'binance',
      name: 'Binance',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#f7931a' }}>
          <svg className="w-8 h-8" style={{ color: '#0a0e27' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L13.09 8.26L22 9L13.09 15.74L12 22L10.91 15.74L2 15L10.91 8.26L12 2Z"/>
          </svg>
        </div>
      ),
      description: 'El exchange más grande del mundo',
      popular: true
    },
    {
      id: 'bybit',
      name: 'Bybit',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#1c1c1c' }}>
          <span className="text-white font-bold">BY</span>
        </div>
      ),
      description: 'Exchange especializado en derivatives'
    },
    {
      id: 'okx',
      name: 'OKX',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#000000' }}>
          <div className="grid grid-cols-2 gap-1">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
            <div className="w-2 h-2 bg-white rounded-sm"></div>
            <div className="w-2 h-2 bg-white rounded-sm"></div>
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
        </div>
      ),
      description: 'Exchange global con múltiples productos'
    },
    {
      id: 'kucoin',
      name: 'KuCoin',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#24ae8f' }}>
          <span className="text-white font-bold text-xs">KC</span>
        </div>
      ),
      description: 'People\'s Exchange con amplia variedad'
    },
    {
      id: 'mexc',
      name: 'MEXC',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#00b6ba' }}>
          <span className="text-white font-bold text-xs">MX</span>
        </div>
      ),
      description: 'Exchange con tokens innovadores'
    },
    {
      id: 'gate',
      name: 'Gate.io',
      icon: (
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: '#5c6ac4' }}>
          <span className="text-white font-bold text-xs">GT</span>
        </div>
      ),
      description: 'Exchange con trading avanzado'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedExchange || !displayName || !apiKey || !apiSecret) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    
    try {
      const result = await addExchange({
        exchange_name: selectedExchange,
        exchange_display_name: displayName,
        exchange_type: exchangeType,
        api_key: apiKey,
        api_secret: apiSecret
      });
      
      if (result.success) {
        onSuccess();
      } else {
        alert('Error al agregar exchange: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const ExchangeCard = ({ exchange, isSelected, onClick }) => (
    <div
      onClick={() => onClick(exchange.id)}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 relative ${
        isSelected ? 'border-orange-500' : 'border-gray-600'
      }`}
      style={{
        background: isSelected 
          ? 'linear-gradient(145deg, #1a1f3a 0%, #2a2f4a 100%)' 
          : 'linear-gradient(145deg, #0f1419 0%, #1a1f3a 100%)',
        boxShadow: isSelected 
          ? '0 4px 20px rgba(247, 147, 26, 0.2)' 
          : '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      {exchange.popular && (
        <div 
          className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full"
          style={{ background: '#f7931a', color: '#0a0e27' }}
        >
          POPULAR
        </div>
      )}
      
      <div className="flex flex-col items-center text-center space-y-3">
        {exchange.icon}
        <div>
          <h4 className="font-semibold text-white">{exchange.name}</h4>
          <p className="text-xs mt-1" style={{ color: '#b8bcc8' }}>
            {exchange.description}
          </p>
        </div>
      </div>
      
      {isSelected && (
        <div 
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: '#f7931a' }}
        >
          <svg className="w-4 h-4" style={{ color: '#0a0e27' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-4xl max-h-screen overflow-y-auto rounded-xl p-6"
        style={{
          background: 'linear-gradient(145deg, #0a0e27 0%, #1a1f3a 100%)',
          border: '1px solid #2a2f4a'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">🔗 Agregar Exchange</h2>
            <p style={{ color: '#b8bcc8' }}>
              Conecta tu exchange favorito para operar con bots
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exchange Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-4">
              Selecciona el Exchange
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exchanges.map(exchange => (
                <ExchangeCard
                  key={exchange.id}
                  exchange={exchange}
                  isSelected={selectedExchange === exchange.id}
                  onClick={setSelectedExchange}
                />
              ))}
            </div>
          </div>

          {/* Exchange Details Form */}
          {selectedExchange && (
            <div className="space-y-4">
              {/* Exchange Type */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tipo de Cuenta
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="testnet"
                      checked={exchangeType === 'testnet'}
                      onChange={(e) => setExchangeType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-green-400">🧪 Testnet (Recomendado)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="mainnet"
                      checked={exchangeType === 'mainnet'}
                      onChange={(e) => setExchangeType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-orange-400">💰 Mainnet (Dinero real)</span>
                  </label>
                </div>
                {exchangeType === 'mainnet' && (
                  <p className="text-red-400 text-sm mt-1">
                    ⚠️ Advertencia: Usarás dinero real. Úsalo bajo tu responsabilidad.
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre Personalizado
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={`Mi ${exchanges.find(e => e.id === selectedExchange)?.name} ${exchangeType}`}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white"
                  style={{ background: '#1a1f3a' }}
                  required
                />
              </div>

              {/* API Credentials */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Tu API Key del exchange"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white"
                  style={{ background: '#1a1f3a' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  API Secret
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Tu API Secret del exchange"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg text-white"
                  style={{ background: '#1a1f3a' }}
                  required
                />
              </div>

              {/* Security Note */}
              <div 
                className="p-4 rounded-lg border"
                style={{
                  background: 'rgba(0, 212, 170, 0.1)',
                  borderColor: 'rgba(0, 212, 170, 0.2)'
                }}
              >
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 mt-0.5" style={{ color: '#00d4aa' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  <div>
                    <h4 className="font-medium" style={{ color: '#00d4aa' }}>Seguridad Garantizada</h4>
                    <p className="text-sm" style={{ color: '#b8bcc8' }}>
                      Tus claves API se encriptan con AES-256 antes de guardarse. 
                      Solo tú podrás acceder a ellas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-medium transition-colors"
              style={{
                background: '#2a2f4a',
                color: '#b8bcc8',
                border: '1px solid #3a3f5a'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedExchange}
              className="px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
              style={{
                background: '#f7931a',
                color: '#0a0e27'
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Conectar Exchange</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExchangeModal;