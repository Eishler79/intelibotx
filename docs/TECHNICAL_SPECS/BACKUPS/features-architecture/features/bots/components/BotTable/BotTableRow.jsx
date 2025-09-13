import React from 'react';
import BotStatusBadge from "./BotStatusBadge";
import BotMetricsDisplay from "./BotMetricsDisplay";
import BotActionButtons from "./BotActionButtons";
import { formatPnL, validateBot } from "../../utils/botTableUtils";

/**
 * @typedef {Object} BotTableRowProps
 * @property {any} bot - Bot object containing all bot data and metrics
 * @property {number} index - Row index for zebra pattern styling
 * @property {(id: number) => void} [onSelectBot] - Handler for trading history button
 * @property {(bot: any) => void} [onViewDetails] - Handler for view details button
 * @property {(id: number) => void} [onDeleteBot] - Handler for delete button
 * @property {(bot: any) => void} [onControlBot] - Handler for settings button
 * @property {(id: number, status: string) => void} [onToggleBotStatus] - Handler for toggle status button
 */

/**
 * BotTableRow Component - Single bot row rendering with 10 columns
 * 
 * @param {BotTableRowProps} props - Component props
 * @returns {JSX.Element} Table row with bot data and action buttons
 */
const BotTableRow = ({
  bot,
  index,
  onSelectBot,
  onViewDetails,
  onDeleteBot,
  onControlBot,
  onToggleBotStatus
}) => {
  // Input validation with console warning
  if (!validateBot(bot, index)) {
    return null;
  }

  const pnl = formatPnL(bot);

  return (
    <tr 
      key={bot.id} 
      className={`border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors ${
        index % 2 === 0 ? 'bg-gray-800/10' : 'bg-transparent'
      }`}
    >
      {/* Symbol / Strategy */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
            {(bot.symbol || 'N/A').slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-white">{bot.symbol || 'N/A'}</div>
            <div className="text-xs text-gray-400">{bot.strategy || 'Sin Estrategia'}</div>
            <div className="text-xs text-purple-400">
              {(bot.marketType || 'spot').toUpperCase()}
            </div>
          </div>
        </div>
      </td>

      {/* Status using BotStatusBadge */}
      <td className="px-4 py-4 text-center">
        <div className="flex justify-center">
          <BotStatusBadge status={bot.status} />
        </div>
      </td>

      {/* Capital */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-white">${bot.stake?.toLocaleString() || '0'}</div>
        <div className="text-xs text-gray-400">USDT</div>
      </td>

      {/* PnL with color coding */}
      <td className="px-4 py-4 text-right">
        <div className={`font-semibold ${pnl.color}`}>
          {pnl.formatted}
        </div>
        <div className="text-xs text-gray-400">
          {pnl.value >= 0 ? '+' : ''}{bot.stake > 0 ? ((pnl.value / bot.stake) * 100).toFixed(2) : '0.00'}%
        </div>
      </td>

      {/* Sharpe Ratio */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-green-400">
          {bot.metrics?.sharpeRatio || '0.00'}
        </div>
        <div className="text-xs text-gray-400">Ratio</div>
      </td>

      {/* Win Rate with color */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-blue-400">
          {bot.metrics?.winRate || '0'}%
        </div>
        <div className="text-xs text-gray-400">Win</div>
      </td>

      {/* Total Trades */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-white">
          {bot.metrics?.totalTrades || 0}
        </div>
        <div className="text-xs text-gray-400">Total</div>
      </td>

      {/* TP/SL with percentage display */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-green-400">
          +{bot.take_profit || bot.takeProfit || 0}%
        </div>
        <div className="text-xs text-red-400">
          -{bot.stop_loss || bot.stopLoss || 0}%
        </div>
        <div className="text-xs text-gray-400">
          ${((bot.stake || 0) * ((bot.take_profit || bot.takeProfit || 0) / 100) * (bot.leverage || 1)).toFixed(2)}
        </div>
      </td>

      {/* Max DD with color coding */}
      <td className="px-4 py-4 text-right">
        <div className="font-semibold text-red-400">
          -{bot.metrics?.maxDrawdown || '0'}%
        </div>
        <div className="text-xs text-gray-400">DD</div>
      </td>

      {/* Enhanced/Legacy using BotMetricsDisplay */}
      <td className="px-4 py-4 text-right">
        <BotMetricsDisplay bot={bot} />
      </td>

      {/* Actions using BotActionButtons */}
      <td className="px-4 py-4">
        <BotActionButtons
          bot={bot}
          onToggleBotStatus={onToggleBotStatus}
          onViewDetails={onViewDetails}
          onSelectBot={onSelectBot}
          onControlBot={onControlBot}
          onDeleteBot={onDeleteBot}
        />
      </td>
    </tr>
  );
};

export default BotTableRow;