import React from 'react';

const ExchangeConnectionForm = ({ 
  selectedExchange, 
  formData, 
  loading, 
  error, 
  onInputChange, 
  onSubmit,
  onClose
}) => {
  if (!selectedExchange) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre de la Conexión
        </label>
        <input
          type="text"
          name="connection_name"
          value={formData.connection_name}
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
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
            onChange={onInputChange}
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
          onChange={onInputChange}
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

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

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
  );
};

export default ExchangeConnectionForm;