import React from 'react';

const MarketTypeSelector = ({
  formData,
  onInputChange,
  marketTypes,
  marketTypesLoading,
  selectedExchange,
  defaultValue,
  defaultLeverage,
  maxLeverageDefault = 125
}) => {
  const selectedType = marketTypes.find(type => type.value === formData.market_type);
  const maxLeverage = selectedType?.max_leverage || maxLeverageDefault;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tipo de Mercado {marketTypesLoading && <span className="text-blue-400 text-xs">(Cargando...)</span>}
        </label>
        <select
          name="market_type"
          value={formData.market_type || defaultValue}
          onChange={onInputChange}
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

      {/* Leverage - Only show if not SPOT */}
      {formData.market_type && formData.market_type !== 'SPOT' ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Apalancamiento
          </label>
          <input
            type="number"
            name="leverage"
            value={formData.leverage || defaultLeverage}
            onChange={onInputChange}
            min="1"
            max={maxLeverage.toString()}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
          />
          <p className="text-xs text-gray-400 mt-1">
            Max: {maxLeverage}x para {selectedType ? selectedType.label.split(' - ')[0] : 'este tipo'}
          </p>
          <p className="text-xs text-orange-400 mt-1">
            ⚠️ Apalancamiento {formData.leverage || defaultLeverage}x: Multiplica ganancias Y pérdidas
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Apalancamiento
          </label>
          <div className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400">
            1x (Sin apalancamiento)
          </div>
          <p className="text-xs text-green-400 mt-1">
            ✓ Menor riesgo: Solo puedes perder lo que inviertas
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketTypeSelector;