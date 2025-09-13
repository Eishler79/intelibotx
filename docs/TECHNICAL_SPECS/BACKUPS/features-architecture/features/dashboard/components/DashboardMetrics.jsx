// ✅ DL-040 Phase 2: Dashboard Metrics Component
// EXTRACTED FROM: pages/BotsAdvanced.jsx:847-897 (Dashboard Metrics Section)
// RISK LEVEL: 5% - Simple extraction with zero behavioral changes

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";

/**
 * Dashboard Metrics Component
 * 
 * Displays key performance metrics cards for the bot trading system:
 * - Total PnL (dynamically calculated from bot performance)
 * - Active Bots count (RUNNING status bots)
 * - Average Sharpe Ratio (real performance metric)
 * - Win Rate percentage (based on actual trading results)
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.dynamicMetrics - Real-time calculated metrics
 * @param {number} props.dynamicMetrics.totalPnL - Total profit/loss across all bots
 * @param {number} props.dynamicMetrics.activeBots - Count of RUNNING bots
 * @param {number} props.dynamicMetrics.avgSharpe - Average Sharpe ratio
 * @param {number} props.dynamicMetrics.avgWinRate - Average win rate percentage
 */
export default function DashboardMetrics({ dynamicMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Total PnL Card */}
      <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary backdrop-blur-sm shadow-intelibot-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-intelibot-text-muted text-sm">Total PnL</p>
              <p className={`text-2xl font-bold ${parseFloat(dynamicMetrics.totalPnL) >= 0 ? 'text-intelibot-success-green' : 'text-intelibot-error-red'}`}>
                {parseFloat(dynamicMetrics.totalPnL) >= 0 ? '+' : ''}${dynamicMetrics.totalPnL}
              </p>
            </div>
            <TrendingUp className={parseFloat(dynamicMetrics.totalPnL) >= 0 ? 'text-intelibot-success-green' : 'text-intelibot-error-red'} size={24} />
          </div>
        </CardContent>
      </Card>
      
      {/* Active Bots Card */}
      <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary backdrop-blur-sm shadow-intelibot-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-intelibot-text-muted text-sm">Bots Activos</p>
              <p className="text-2xl font-bold text-intelibot-accent-gold">{dynamicMetrics.activeBots}</p>
            </div>
            <Activity className="text-intelibot-accent-gold" size={24} />
          </div>
        </CardContent>
      </Card>

      {/* Average Sharpe Card */}
      <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary backdrop-blur-sm shadow-intelibot-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-intelibot-text-muted text-sm">Sharpe Promedio</p>
              <p className="text-2xl font-bold text-intelibot-accent-gold">{dynamicMetrics.avgSharpe}</p>
            </div>
            <BarChart3 className="text-intelibot-accent-gold" size={24} />
          </div>
        </CardContent>
      </Card>

      {/* Win Rate Card */}
      <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary backdrop-blur-sm shadow-intelibot-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-intelibot-text-muted text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-intelibot-success-green">{dynamicMetrics.avgWinRate}%</p>
            </div>
            <TrendingUp className="text-intelibot-success-green" size={24} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}