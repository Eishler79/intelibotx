import React from 'react';

const SymbolSelector = ({
  formData,
  onInputChange,
  availableSymbols,
  symbolsLoading,
  defaultValue
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Par de Trading {symbolsLoading && <span className="text-blue-400 text-xs">(Cargando...)</span>}
      </label>
      <select
        name="symbol"
        value={formData.symbol || defaultValue}
        onChange={onInputChange}
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
      {availableSymbols.length === 0 && !symbolsLoading && (
        <p className="text-xs text-yellow-400 mt-1">
          ⚠️ Usando pares por defecto - Verifica conexión del exchange
        </p>
      )}
    </div>
  );
};

export default SymbolSelector;