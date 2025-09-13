import React from 'react';
import SymbolSelector from './components/SymbolSelector';
import MarketTypeSelector from './components/MarketTypeSelector';
import FinancialConfig from './components/FinancialConfig';
import RiskRewardAnalysis from './components/RiskRewardAnalysis';
import ValidationSummary from './components/ValidationSummary';

const BasicCreationFormOptimized = ({
  formData = {},
  onInputChange,
  availableSymbols = [],
  symbolsLoading = false,
  marketTypes = [],
  marketTypesLoading = false,
  baseCurrencies = [],
  baseCurrenciesLoading = false,
  strategies = [],
  strategiesLoading = false,
  selectedExchange = null,
  realTimeData = null,
  monetaryValues = { tp: 0, sl: 0 },
  defaultValues = { symbol: 'BTCUSDT', market_type: 'SPOT', leverage: 1, stake: 100, take_profit: 2.5, stop_loss: 1.5 }
}) => {
  const handleInputChange = (e) => {
    if (onInputChange) {
      onInputChange(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bot Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre del Bot *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={handleInputChange}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          placeholder="Ej: Bot Fuerte Austero, Bot Agresivo Alpha"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          💡 Usa nombres descriptivos para identificar fácilmente tus bots
        </p>
      </div>

      <SymbolSelector
        formData={formData}
        onInputChange={handleInputChange}
        availableSymbols={availableSymbols}
        symbolsLoading={symbolsLoading}
        defaultValue={defaultValues.symbol}
      />

      <MarketTypeSelector
        formData={formData}
        onInputChange={handleInputChange}
        marketTypes={marketTypes}
        marketTypesLoading={marketTypesLoading}
        selectedExchange={selectedExchange}
        defaultValue={defaultValues.market_type}
        defaultLeverage={defaultValues.leverage}
      />

      <FinancialConfig
        formData={formData}
        onInputChange={handleInputChange}
        baseCurrencies={baseCurrencies}
        baseCurrenciesLoading={baseCurrenciesLoading}
        selectedExchange={selectedExchange}
        realTimeData={realTimeData}
        monetaryValues={monetaryValues}
        defaultStake={defaultValues.stake}
        defaultTakeProfit={defaultValues.take_profit}
        defaultStopLoss={defaultValues.stop_loss}
      />

      {/* Strategy Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Estrategia
        </label>
        <select
          name="strategy"
          value={formData.strategy || ''}
          onChange={handleInputChange}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          disabled={strategiesLoading}
        >
          <option value="">Selecciona una estrategia</option>
          {strategiesLoading ? (
            <option>Cargando estrategias...</option>
          ) : strategies.length === 0 ? (
            <option>No hay estrategias disponibles</option>
          ) : (
            strategies.map(strategy => (
              <option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </option>
            ))
          )}
        </select>
        {strategies.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            🧠 {strategies.length} estrategias institucionales disponibles
          </p>
        )}
        {strategies.length === 0 && !strategiesLoading && (
          <p className="text-xs text-yellow-400 mt-1">
            ⚠️ No se pudieron cargar las estrategias - Verifica conexión
          </p>
        )}
      </div>

      <RiskRewardAnalysis
        takeProfit={formData.take_profit}
        stopLoss={formData.stop_loss}
      />

      <ValidationSummary
        formData={formData}
        selectedExchange={selectedExchange}
      />
    </div>
  );
};

export default BasicCreationFormOptimized;