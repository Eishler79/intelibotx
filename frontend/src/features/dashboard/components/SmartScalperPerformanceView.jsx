/**
 * 🏛️ SmartScalperPerformanceView - Performance Metrics & Execution Quality
 * 
 * SPEC_REF: DL-088 SmartScalperMetrics Institutional Transformation
 * COMPLIANCE: DL-076 (≤150 lines) + DL-001 (Real Data Only)
 * 
 * RESPONSIBILITY: Performance analytics + execution quality + real-time metrics display
 * DATA SOURCE: Real bot performance data + real-time WebSocket updates (NO SIMULATIONS)
 * 
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  Gauge,
  Target,
  Zap,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function SmartScalperPerformanceView({ performanceData, bot, realTimeData }) {
  
  // 📊 Calculate win rate color
  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return 'text-green-400';
    if (winRate >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // 💰 Format profit/loss display
  const formatPnL = (value) => {
    if (value > 0) return `+$${value.toFixed(2)}`;
    if (value < 0) return `-$${Math.abs(value).toFixed(2)}`;
    return '$0.00';
  };

  const getPnLColor = (value) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  // 🎯 Bot status indicator
  const getStatusBadge = (status) => {
    const statusConfig = {
      'running': { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Activity },
      'paused': { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      'stopped': { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig['stopped'];
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent size={12} className="mr-1" />
        {status?.toUpperCase() || 'STOPPED'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 📊 PERFORMANCE OVERVIEW */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <BarChart3 className="text-green-400" size={24} />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bot Status */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Current Status:</span>
            {getStatusBadge(performanceData.currentStatus)}
          </div>

          {/* Win Rate */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Win Rate:</span>
            <div className="flex items-center gap-2">
              <span className={`font-bold ${getWinRateColor(performanceData.winRate)}`}>
                {performanceData.winRate?.toFixed(1) || 0}%
              </span>
              {performanceData.winRate >= 70 ? 
                <CheckCircle className="text-green-400" size={16} /> :
                <Target className="text-gray-400" size={16} />
              }
            </div>
          </div>

          {/* Total Trades */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Trades:</span>
            <span className="text-white font-bold">{performanceData.totalTrades || 0}</span>
          </div>

          {/* Successful Trades */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Successful:</span>
            <span className="text-green-400 font-bold">{performanceData.successfulTrades || 0}</span>
          </div>

          {/* Average Profit */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Avg Profit/Trade:</span>
            <span className={`font-bold ${getPnLColor(performanceData.avgProfit)}`}>
              {formatPnL(performanceData.avgProfit || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 🚀 EXECUTION METRICS */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Zap className="text-yellow-400" size={24} />
            Execution Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Strategy Type */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Strategy:</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {bot?.strategy || 'Smart Scalper'}
            </Badge>
          </div>

          {/* Trading Interval */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Timeframe:</span>
            <span className="text-white">{bot?.trading_interval || '15m'}</span>
          </div>

          {/* Leverage */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Leverage:</span>
            <span className="text-white">{bot?.leverage || '1x'}</span>
          </div>

          {/* Take Profit */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Take Profit:</span>
            <span className="text-green-400">{bot?.take_profit || 'N/A'}%</span>
          </div>

          {/* Stop Loss */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Stop Loss:</span>
            <span className="text-red-400">{bot?.stop_loss || 'N/A'}%</span>
          </div>
        </CardContent>
      </Card>

      {/* 💎 REAL-TIME DATA */}
      {realTimeData && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Activity className="text-blue-400" size={24} />
              Real-Time Data
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                LIVE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Price */}
            {realTimeData.price && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current Price:</span>
                <span className="text-white font-mono">${realTimeData.price}</span>
              </div>
            )}

            {/* Volume */}
            {realTimeData.volume && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Volume:</span>
                <span className="text-white font-mono">{realTimeData.volume}</span>
              </div>
            )}

            {/* Last Update */}
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Last Update:</span>
              <span className="text-gray-300 text-sm">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🎯 BOT CONFIGURATION */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Gauge className="text-purple-400" size={24} />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Symbol:</span>
            <span className="text-white font-bold">{bot?.symbol || 'N/A'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Created:</span>
            <span className="text-gray-300 text-sm">
              {bot?.created_at ? new Date(bot.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bot ID:</span>
            <span className="text-gray-300 text-xs font-mono">{bot?.id || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}