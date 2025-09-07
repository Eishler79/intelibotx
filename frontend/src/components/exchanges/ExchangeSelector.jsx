import React from 'react';

const ExchangeSelector = ({ selectedExchange, onExchangeSelect }) => {
  const exchanges = [
    { name: 'binance', label: 'BINANCE', color: '#F0B90B', logo: '🟨' },
    { name: 'bybit', label: 'BYBIT', color: '#FF6A00', logo: 'BY' },
    { name: 'okx', label: 'OKX', color: '#0052FF', logo: '◼◼' },
    { name: 'kucoin', label: 'KUCOIN', color: '#20D090', logo: 'KC' },
    { name: 'kraken', label: 'KRAKEN', color: '#5741D9', logo: '🐙' },
    { name: 'coinbase', label: 'COINBASE', color: '#0052FF', logo: 'CB' }
  ];

  return (
    <div className="mb-6">
      <h3 className="text-white text-lg font-semibold mb-4">Selecciona un Exchange</h3>
      <div className="grid grid-cols-3 gap-4">
        {exchanges.map((exchange) => (
          <button
            key={exchange.name}
            onClick={() => onExchangeSelect(exchange.name)}
            className={`p-6 rounded-lg border transition-all duration-300 bg-gray-800/30 hover:bg-gray-700/50 ${
              selectedExchange === exchange.name
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            style={{ minHeight: '80px' }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-3">
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
              <span className="text-white font-bold text-sm uppercase tracking-wide">
                {exchange.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExchangeSelector;