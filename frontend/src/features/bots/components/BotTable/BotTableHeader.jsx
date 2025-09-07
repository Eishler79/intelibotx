import React from 'react';

/**
 * @typedef {Object} SortConfig
 * @property {string|null} key - The key to sort by
 * @property {'asc'|'desc'} direction - The sort direction
 */

/**
 * @typedef {Object} BotTableHeaderProps
 * @property {SortConfig} sortConfig - Current sort configuration
 * @property {(key: string) => void} onSort - Handler for column sort clicks
 */

/**
 * BotTableHeader Component - Table header with sortable columns for bot data
 * 
 * @param {BotTableHeaderProps} props - Component props
 * @returns {JSX.Element} Table header element with sorting functionality
 */
const BotTableHeader = ({ sortConfig, onSort }) => {
  return (
    <thead className="bg-gray-800/30 border-b border-gray-700/50">
      <tr>
        <th 
          className="text-left px-6 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('symbol')}
        >
          Par / Estrategia
          {sortConfig.key === 'symbol' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th className="text-center px-4 py-4 font-medium text-gray-300">Estado</th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('stake')}
        >
          Capital
          {sortConfig.key === 'stake' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('metrics.sharpeRatio')}
        >
          PnL
          {sortConfig.key === 'pnl' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('metrics.sharpeRatio')}
        >
          Sharpe
          {sortConfig.key === 'metrics.sharpeRatio' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('metrics.winRate')}
        >
          Win Rate
          {sortConfig.key === 'metrics.winRate' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('metrics.totalTrades')}
        >
          Trades
          {sortConfig.key === 'metrics.totalTrades' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('takeProfit')}
        >
          TP/SL
          {sortConfig.key === 'takeProfit' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('metrics.maxDrawdown')}
        >
          Max DD
          {sortConfig.key === 'metrics.maxDrawdown' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th 
          className="text-right px-4 py-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
          onClick={() => onSort('enhanced_metrics.estimated_trades_per_day')}
        >
          Enhanced
          {sortConfig.key === 'enhanced_metrics.estimated_trades_per_day' && (
            <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
          )}
        </th>
        <th className="text-center px-4 py-4 font-medium text-gray-300">Acciones</th>
      </tr>
    </thead>
  );
};

export default BotTableHeader;