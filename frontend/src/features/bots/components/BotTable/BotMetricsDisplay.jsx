import React from 'react';

/**
 * @typedef {Object} EnhancedMetrics
 * @property {number} estimated_trades_per_day - Estimated trades per day
 * @property {number} risk_adjusted_return - Risk adjusted return percentage
 * @property {number} user_risk_percentage - User configured risk percentage
 */

/**
 * @typedef {Object} BotMetricsDisplayProps
 * @property {Object} bot - Bot object containing metrics data
 * @property {EnhancedMetrics} [bot.enhanced_metrics] - Enhanced metrics data (optional)
 */

/**
 * BotMetricsDisplay Component - Conditional rendering of Enhanced vs Legacy metrics
 * 
 * @param {BotMetricsDisplayProps} props - Component props
 * @returns {JSX.Element} Enhanced metrics display or Legacy text
 */
const BotMetricsDisplay = ({ bot }) => {
  if (bot.enhanced_metrics) {
    return (
      <>
        <div className="font-semibold text-purple-400">
          {bot.enhanced_metrics.estimated_trades_per_day || 0} trades/day
        </div>
        <div className="text-xs text-green-400">
          {bot.enhanced_metrics.risk_adjusted_return > 0 ? '+' : ''}{bot.enhanced_metrics.risk_adjusted_return?.toFixed(2) || '0.00'}% adj
        </div>
        <div className="text-xs text-gray-400">
          Risk: {bot.enhanced_metrics.user_risk_percentage?.toFixed(1) || '0.0'}%
        </div>
      </>
    );
  }

  return (
    <div className="text-xs text-gray-500">Legacy</div>
  );
};

export default BotMetricsDisplay;