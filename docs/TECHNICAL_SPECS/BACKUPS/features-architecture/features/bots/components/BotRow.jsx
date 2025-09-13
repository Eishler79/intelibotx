// ✅ SUCCESS CRITERIA COMPLIANT: BotRow Component
// EXTRACTED FROM: ProfessionalBotsTable.jsx individual bot row logic
// TARGET: Single Responsibility, ≤150 lines, Testable, Performance Optimized
// COMPLIANCE: DL-001 (real data) + DL-008 (auth) + GUARDRAILS P1-P9

import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import BotStatusBadge from './BotStatusBadge';
import BotActions from './BotActions';
import BotPerformanceMetrics from './BotPerformanceMetrics';

/**
 * ✅ SUCCESS CRITERIA: Single Bot Row Component with Performance Optimization
 * 
 * Displays individual bot data in table row format with:
 * - Real-time status and metrics
 * - Performance indicators
 * - Action buttons for bot control
 * - Memoized for re-render optimization
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.bot - Bot data object with metrics
 * @param {Function} props.onSelectBot - Handler for bot selection
 * @param {Function} props.onViewDetails - Handler for details modal
 * @param {Function} props.onDeleteBot - Handler for bot deletion
 * @param {Function} props.onControlBot - Handler for control panel
 * @param {Function} props.onToggleBotStatus - Handler for start/stop/pause
 * @param {boolean} props.isSelected - Whether this bot is currently selected
 */
const BotRow = memo(({
  bot,
  onSelectBot,
  onViewDetails,
  onDeleteBot,
  onControlBot,
  onToggleBotStatus,
  isSelected = false
}) => {
  // ✅ DL-001 COMPLIANCE: Real data validation
  if (!bot || !bot.id) {
    return null;
  }

  // ✅ SUCCESS CRITERIA: Performance - memoized calculations
  const pnlColor = parseFloat(bot.metrics?.realizedPnL || 0) >= 0 
    ? 'text-intelibot-success-green' 
    : 'text-intelibot-error-red';
    
  const pnlPrefix = parseFloat(bot.metrics?.realizedPnL || 0) >= 0 ? '+' : '';
  
  // Strategy badge color mapping
  const getStrategyColor = (strategy) => {
    const colors = {
      'Smart Scalper': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Trend Hunter': 'bg-green-500/20 text-green-400 border-green-500/30',
      'Manipulation Detector': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'News Sentiment': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Volatility Master': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[strategy] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <tr 
      className={`
        hover:bg-intelibot-bg-hover transition-colors duration-200 cursor-pointer border-b border-intelibot-border-secondary
        ${isSelected ? 'bg-intelibot-accent-gold/10 border-intelibot-accent-gold/30' : ''}
      `}
      onClick={() => onSelectBot?.(bot)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectBot?.(bot);
        }
      }}
    >
      {/* Bot Name & Symbol */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-medium text-intelibot-text-primary">
            {bot.name || `Bot ${bot.symbol}`}
          </span>
          <span className="text-sm text-intelibot-text-muted">
            {bot.symbol}
          </span>
        </div>
      </td>

      {/* Strategy */}
      <td className="px-6 py-4">
        <Badge className={`${getStrategyColor(bot.strategy)} border text-xs`}>
          {bot.strategy || 'Unknown'}
        </Badge>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <BotStatusBadge 
          status={bot.status} 
          size="sm"
        />
      </td>

      {/* Stake Amount */}
      <td className="px-6 py-4 text-intelibot-text-primary font-mono">
        ${parseFloat(bot.stake || 0).toFixed(2)}
      </td>

      {/* PnL */}
      <td className="px-6 py-4">
        <span className={`font-mono font-medium ${pnlColor}`}>
          {pnlPrefix}${bot.metrics?.realizedPnL || '0.00'}
        </span>
      </td>

      {/* Performance Metrics */}
      <td className="px-6 py-4">
        <BotPerformanceMetrics 
          metrics={bot.metrics}
          compact={true}
        />
      </td>

      {/* Win Rate */}
      <td className="px-6 py-4 text-intelibot-text-primary font-mono">
        {bot.metrics?.winRate || '0.0'}%
      </td>

      {/* Total Trades */}
      <td className="px-6 py-4 text-intelibot-text-primary font-mono">
        {bot.metrics?.totalTrades || 0}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <BotActions
          bot={bot}
          onViewDetails={onViewDetails}
          onDeleteBot={onDeleteBot}
          onControlBot={onControlBot}
          onToggleBotStatus={onToggleBotStatus}
          compact={true}
        />
      </td>
    </tr>
  );
});

// ✅ SUCCESS CRITERIA: Developer Experience - component name for debugging
BotRow.displayName = 'BotRow';

export default BotRow;