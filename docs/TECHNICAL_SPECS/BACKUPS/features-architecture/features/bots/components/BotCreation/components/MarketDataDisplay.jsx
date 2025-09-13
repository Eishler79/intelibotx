import React from 'react';
import { DollarSign, Signal, BarChart3, Activity } from 'lucide-react';

const MarketDataDisplay = ({ realTimeData, formData, selectedExchange }) => {
  const marketDataItems = [
    {
      icon: DollarSign,
      label: `Precio ${formData.symbol}:`,
      value: realTimeData.currentPrice ? `$${realTimeData.currentPrice.toLocaleString()}` : 'Cargando...',
      className: 'text-white font-semibold'
    },
    {
      icon: DollarSign,
      label: 'Balance Disponible:',
      value: `$${realTimeData.balance?.toFixed(2) || '0.00'} ${formData.base_currency}`,
      className: 'text-white font-medium'
    },
    {
      icon: Signal,
      label: 'Exchange:',
      value: selectedExchange.exchange_name.toUpperCase(),
      className: 'text-blue-400 font-medium'
    },
    {
      icon: BarChart3,
      label: 'Mercado:',
      value: formData.market_type,
      className: 'text-yellow-400 font-medium'
    }
  ];

  const conditionalItems = [];
  
  if (realTimeData.priceChange) {
    conditionalItems.push({
      icon: Activity,
      label: 'Cambio 24h:',
      value: `${realTimeData.priceChange > 0 ? '+' : ''}${realTimeData.priceChange.toFixed(2)}%`,
      className: `font-medium ${realTimeData.priceChange > 0 ? 'text-green-400' : 'text-red-400'}`
    });
  }
  
  if (realTimeData.volume24h) {
    conditionalItems.push({
      icon: BarChart3,
      label: 'Volumen 24h:',
      value: `$${realTimeData.volume24h.toLocaleString()}`,
      className: 'text-white font-medium'
    });
  }

  return (
    <div className="space-y-3">
      {marketDataItems.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2">
            <item.icon className="w-3 h-3" />
            {item.label}
          </span>
          <div className="flex items-center gap-2">
            <span className={item.className}>
              {item.value}
            </span>
            {index === 0 && (
              <span className={`price-status inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                realTimeData.priceStatus?.status === 'live' ? 'bg-green-500/20 text-green-400' :
                realTimeData.priceStatus?.status === 'alternative' ? 'bg-blue-500/20 text-blue-400' :
                realTimeData.priceStatus?.status === 'external' ? 'bg-orange-500/20 text-orange-400' :
                realTimeData.priceStatus?.status === 'cached' ? 'bg-yellow-500/20 text-yellow-400' :
                realTimeData.priceStatus?.status === 'emergency' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  realTimeData.priceStatus?.status === 'live' ? 'bg-green-400' :
                  realTimeData.priceStatus?.status === 'alternative' ? 'bg-blue-400' :
                  realTimeData.priceStatus?.status === 'external' ? 'bg-orange-400' :
                  realTimeData.priceStatus?.status === 'cached' ? 'bg-yellow-400' :
                  realTimeData.priceStatus?.status === 'emergency' ? 'bg-red-400' :
                  'bg-gray-400'
                }`} />
                {realTimeData.priceStatus?.text || 'VERIFICANDO'}
              </span>
            )}
          </div>
        </div>
      ))}

      {conditionalItems.map((item, index) => (
        <div key={`conditional-${index}`} className="flex justify-between items-center">
          <span className="text-gray-400 flex items-center gap-2">
            <item.icon className="w-3 h-3" />
            {item.label}
          </span>
          <span className={item.className}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MarketDataDisplay;