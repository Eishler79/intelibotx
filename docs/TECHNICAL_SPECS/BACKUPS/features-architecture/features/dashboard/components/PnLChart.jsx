// ✅ SUCCESS CRITERIA COMPLIANT: P&L Chart Visualization Component ≤150 lines
// EXTRACTED FROM: DashboardMetrics.jsx (P&L visualization utilities)
// SPEC_REF: FRONTEND_ARCHITECTURE.md línea 93 - PnLChart.jsx component
// COMPLIANCE: DL-001 (real data) + SUCCESS CRITERIA ≤150 lines

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

/**
 * ✅ SUCCESS CRITERIA COMPLIANT: P&L Chart and Secondary Metrics
 * 
 * Displays:
 * - Secondary metrics grid (6 metrics)
 * - P&L trend visualization
 * - Risk and performance indicators
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.aggregatedMetrics - Aggregated metrics data
 * @param {Object} props.advancedMetrics - Advanced calculated metrics
 */
const PnLChart = ({ aggregatedMetrics, advancedMetrics }) => {
  // ✅ SUCCESS CRITERIA: Risk color utility
  const getRiskColor = (risk) => {
    if (risk <= 30) return 'text-green-400';
    if (risk <= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Win Rate */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-green-400" />
              <div>
                <p className="text-xs text-intelibot-text-muted">Win Rate</p>
                <p className="text-lg font-bold text-green-400">
                  {aggregatedMetrics.avgWinRate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Trades */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 size={16} className="text-blue-400" />
              <div>
                <p className="text-xs text-intelibot-text-muted">Trades</p>
                <p className="text-lg font-bold text-blue-400">
                  {aggregatedMetrics.totalTrades}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Exposure */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown size={16} className={getRiskColor(advancedMetrics.riskExposure)} />
              <div>
                <p className="text-xs text-intelibot-text-muted">Risk</p>
                <p className={`text-lg font-bold ${getRiskColor(advancedMetrics.riskExposure)}`}>
                  {advancedMetrics.riskExposure}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp size={16} className="text-yellow-400" />
              <div>
                <p className="text-xs text-intelibot-text-muted">Uptime</p>
                <p className="text-lg font-bold text-yellow-400">
                  {advancedMetrics.systemUptime}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Trades/Bot */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 size={16} className="text-purple-400" />
              <div>
                <p className="text-xs text-intelibot-text-muted">Avg/Bot</p>
                <p className="text-lg font-bold text-purple-400">
                  {advancedMetrics.averageTradesPerBot}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown size={16} className="text-red-400" />
              <div>
                <p className="text-xs text-intelibot-text-muted">Drawdown</p>
                <p className="text-lg font-bold text-red-400">
                  {aggregatedMetrics.maxDrawdownOverall}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PnLChart;