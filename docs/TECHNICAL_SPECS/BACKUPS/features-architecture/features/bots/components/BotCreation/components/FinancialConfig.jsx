import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const FinancialConfig = ({
  formData,
  onInputChange,
  baseCurrencies,
  baseCurrenciesLoading,
  selectedExchange,
  realTimeData,
  monetaryValues,
  defaultStake,
  defaultTakeProfit,
  defaultStopLoss
}) => {
  return (
    <div className="space-y-4">
      {/* Stake and Base Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Capital por Trade
          </label>
          <input
            type="number"
            name="stake"
            value={formData.stake || defaultStake}
            onChange={onInputChange}
            min="0.01"
            step="0.01"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-xs text-blue-400 mt-1">
            💰 Capital utilizado por cada operación del bot
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Moneda Base
          </label>
          <select
            name="base_currency"
            value={formData.base_currency || ''}
            onChange={onInputChange}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            disabled={baseCurrenciesLoading || !selectedExchange}
          >
            <option value="">Selecciona moneda base</option>
            {baseCurrenciesLoading ? (
              <option>Cargando monedas...</option>
            ) : !selectedExchange ? (
              <option>Selecciona un exchange primero</option>
            ) : baseCurrencies.length === 0 ? (
              <option>Error conectando a exchange</option>
            ) : (
              baseCurrencies.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Take Profit and Stop Loss */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Take Profit (%)
          </label>
          <input
            type="number"
            name="take_profit"
            value={formData.take_profit || defaultTakeProfit}
            onChange={onInputChange}
            min="0.1"
            step="0.1"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          {realTimeData && (
            <div className="flex items-center mt-1">
              <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
              <p className="text-green-400 text-xs">
                Ganancia objetivo: +${monetaryValues.tp.toFixed(2)} {formData.base_currency} por trade exitoso
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Stop Loss (%)
          </label>
          <input
            type="number"
            name="stop_loss"
            value={formData.stop_loss || defaultStopLoss}
            onChange={onInputChange}
            min="0.1"
            step="0.1"
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          {realTimeData && (
            <div className="flex items-center mt-1">
              <TrendingDown className="w-3 h-3 text-red-400 mr-1" />
              <p className="text-red-400 text-xs">
                Pérdida máxima: -${monetaryValues.sl.toFixed(2)} {formData.base_currency} por trade fallido
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialConfig;