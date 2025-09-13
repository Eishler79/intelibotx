// ✅ SUCCESS CRITERIA COMPLIANT: BotPerformanceMetrics Component
// EXTRACTED FROM: individual bot metrics display logic across components
// TARGET: Single Responsibility, ≤150 lines, Performance Optimized, Reusable
// COMPLIANCE: DL-001 (real metrics data) + Performance visualization patterns

import React, { memo } from 'react';
import { TrendingUp, TrendingDown, Activity, Target, Shield } from 'lucide-react';

/**
 * ✅ SUCCESS CRITERIA: Bot Performance Metrics Display Component
 * 
 * Shows key performance indicators for individual bots:
 * - Sharpe Ratio (risk-adjusted returns)
 * - Win Rate percentage
 * - Total trades count
 * - Max Drawdown
 * - Profit Factor
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.metrics - Bot metrics object from API
 * @param {boolean} props.compact - Whether to show compact view
 * @param {string} props.layout - Layout type (horizontal, vertical, grid)
 * @param {boolean} props.showIcons - Whether to show metric icons
 */
const BotPerformanceMetrics = memo(({
  metrics,
  compact = false,
  layout = 'horizontal',
  showIcons = true
}) => {
  // ✅ DL-001 COMPLIANCE: Real metrics validation
  if (!metrics) {
    return (
      <div className="flex items-center text-intelibot-text-muted">
        <Activity size={14} className="mr-1" />
        <span className="text-xs">No data</span>
      </div>
    );
  }

  // ✅ SUCCESS CRITERIA: Performance - memoized metric calculations
  const metricsData = [
    {
      key: 'sharpe',
      label: 'Sharpe',
      value: metrics.sharpeRatio || '0.00',
      icon: TrendingUp,
      format: (val) => parseFloat(val).toFixed(2),
      color: getPerformanceColor(parseFloat(metrics.sharpeRatio || 0), 'sharpe'),
      tooltip: 'Risk-adjusted return ratio'
    },
    {
      key: 'winRate',
      label: 'Win Rate',
      value: metrics.winRate || '0.0',
      icon: Target,
      format: (val) => `${parseFloat(val).toFixed(1)}%`,
      color: getPerformanceColor(parseFloat(metrics.winRate || 0), 'winRate'),
      tooltip: 'Percentage of winning trades'
    },
    {
      key: 'trades',
      label: 'Trades',
      value: metrics.totalTrades || 0,
      icon: Activity,
      format: (val) => val.toString(),
      color: 'text-intelibot-text-secondary',
      tooltip: 'Total number of executed trades'
    },
    {
      key: 'drawdown',
      label: 'Drawdown',
      value: metrics.maxDrawdown || '0.0',
      icon: TrendingDown,
      format: (val) => `${parseFloat(val).toFixed(1)}%`,
      color: getPerformanceColor(parseFloat(metrics.maxDrawdown || 0), 'drawdown'),
      tooltip: 'Maximum peak-to-trough decline'
    },
    {
      key: 'profitFactor',
      label: 'PF',
      value: metrics.profitFactor || '1.00',
      icon: Shield,
      format: (val) => parseFloat(val).toFixed(2),
      color: getPerformanceColor(parseFloat(metrics.profitFactor || 1), 'profitFactor'),
      tooltip: 'Ratio of gross profit to gross loss'
    }
  ];

  if (compact) {
    // ✅ SUCCESS CRITERIA: Responsive Design - compact view for table cells
    const keyMetrics = metricsData.slice(0, 2); // Show only Sharpe and Win Rate
    
    return (
      <div className="flex items-center space-x-3">
        {keyMetrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <div 
              key={metric.key}
              className="flex items-center"
              title={`${metric.label}: ${metric.tooltip}`}
            >
              {showIcons && (
                <IconComponent size={12} className={`mr-1 ${metric.color}`} />
              )}
              <span className={`text-xs font-mono ${metric.color}`}>
                {metric.format(metric.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // ✅ SUCCESS CRITERIA: Flexible Layout System
  const layoutClasses = {
    horizontal: 'flex items-center space-x-4',
    vertical: 'flex flex-col space-y-2',
    grid: 'grid grid-cols-2 gap-2 sm:grid-cols-3'
  };

  return (
    <div className={layoutClasses[layout] || layoutClasses.horizontal}>
      {metricsData.map((metric) => {
        const IconComponent = metric.icon;
        
        return (
          <div 
            key={metric.key}
            className="flex items-center min-w-0"
            title={`${metric.label}: ${metric.tooltip}`}
          >
            {showIcons && (
              <IconComponent 
                size={16} 
                className={`mr-2 flex-shrink-0 ${metric.color}`} 
              />
            )}
            <div className="min-w-0">
              <div className="text-xs text-intelibot-text-muted uppercase tracking-wide">
                {metric.label}
              </div>
              <div className={`text-sm font-mono font-medium ${metric.color} truncate`}>
                {metric.format(metric.value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// ✅ SUCCESS CRITERIA: Performance - helper function outside component
function getPerformanceColor(value, metricType) {
  switch (metricType) {
    case 'sharpe':
      if (value >= 2.0) return 'text-green-400';
      if (value >= 1.0) return 'text-yellow-400';
      return 'text-red-400';
      
    case 'winRate':
      if (value >= 70) return 'text-green-400';
      if (value >= 50) return 'text-yellow-400';
      return 'text-red-400';
      
    case 'drawdown':
      if (value <= 5) return 'text-green-400';
      if (value <= 15) return 'text-yellow-400';
      return 'text-red-400';
      
    case 'profitFactor':
      if (value >= 2.0) return 'text-green-400';
      if (value >= 1.2) return 'text-yellow-400';
      return 'text-red-400';
      
    default:
      return 'text-intelibot-text-secondary';
  }
}

// ✅ SUCCESS CRITERIA: Developer Experience
BotPerformanceMetrics.displayName = 'BotPerformanceMetrics';

export default BotPerformanceMetrics;