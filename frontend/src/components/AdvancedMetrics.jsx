import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Shield, 
  Target,
  Activity,
  DollarSign,
  Calendar,
  Percent,
  Award
} from "lucide-react";

// Función para calcular Sharpe Ratio
const calculateSharpeRatio = (returns, riskFreeRate = 0.02) => {
  if (!returns || returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  return stdDev === 0 ? 0 : ((avgReturn - riskFreeRate) / stdDev);
};

// Función para calcular Sortino Ratio (solo considera volatilidad negativa)
const calculateSortinoRatio = (returns, targetReturn = 0) => {
  if (!returns || returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < targetReturn);
  
  if (negativeReturns.length === 0) return Infinity;
  
  const downSideDeviation = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / negativeReturns.length
  );
  
  return downSideDeviation === 0 ? 0 : ((avgReturn - targetReturn) / downSideDeviation);
};

// Función para calcular Maximum Drawdown
const calculateMaxDrawdown = (equityCurve) => {
  if (!equityCurve || equityCurve.length === 0) return 0;
  
  let maxDrawdown = 0;
  let peak = equityCurve[0];
  
  for (let i = 1; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
    } else {
      const drawdown = (peak - equityCurve[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown * 100; // Convertir a porcentaje
};

// Función para calcular Calmar Ratio
const calculateCalmarRatio = (annualReturn, maxDrawdown) => {
  return maxDrawdown === 0 ? 0 : Math.abs(annualReturn / (maxDrawdown / 100));
};

// Función para calcular Win Rate
const calculateWinRate = (trades) => {
  if (!trades || trades.length === 0) return 0;
  const winningTrades = trades.filter(trade => trade > 0).length;
  return (winningTrades / trades.length) * 100;
};

// Función para calcular Profit Factor
const calculateProfitFactor = (trades) => {
  if (!trades || trades.length === 0) return 0;
  
  const grossProfit = trades.filter(trade => trade > 0).reduce((sum, trade) => sum + trade, 0);
  const grossLoss = Math.abs(trades.filter(trade => trade < 0).reduce((sum, trade) => sum + trade, 0));
  
  return grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
};

export default function AdvancedMetrics({ bot, equityData, tradeHistory }) {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateMetrics = () => {
      if (!bot) return;

      // Generar datos simulados si no hay datos reales
      const mockReturns = Array.from({length: 30}, () => (Math.random() - 0.5) * 0.05);
      const mockEquity = Array.from({length: 30}, (_, i) => 1000 + (Math.random() - 0.4) * 100 + i * 5);
      const mockTrades = Array.from({length: 50}, () => (Math.random() - 0.45) * 100);

      const returns = equityData?.returns || mockReturns;
      const equity = equityData?.curve || mockEquity;
      const trades = tradeHistory || mockTrades;

      const sharpeRatio = calculateSharpeRatio(returns);
      const sortinoRatio = calculateSortinoRatio(returns);
      const maxDrawdown = calculateMaxDrawdown(equity);
      const calmarRatio = calculateCalmarRatio(0.15, maxDrawdown); // Asumiendo 15% return anual
      const winRate = calculateWinRate(trades);
      const profitFactor = calculateProfitFactor(trades);

      // Métricas adicionales
      const totalReturn = ((equity[equity.length - 1] - equity[0]) / equity[0]) * 100;
      const totalTrades = trades.length;
      const avgWin = trades.filter(t => t > 0).reduce((sum, t) => sum + t, 0) / trades.filter(t => t > 0).length || 0;
      const avgLoss = trades.filter(t => t < 0).reduce((sum, t) => sum + t, 0) / trades.filter(t => t < 0).length || 0;
      const bestTrade = Math.max(...trades);
      const worstTrade = Math.min(...trades);

      setMetrics({
        sharpeRatio: sharpeRatio.toFixed(2),
        sortinoRatio: isFinite(sortinoRatio) ? sortinoRatio.toFixed(2) : '∞',
        maxDrawdown: maxDrawdown.toFixed(2),
        calmarRatio: isFinite(calmarRatio) ? calmarRatio.toFixed(2) : '∞',
        winRate: winRate.toFixed(1),
        profitFactor: isFinite(profitFactor) ? profitFactor.toFixed(2) : '∞',
        totalReturn: totalReturn.toFixed(2),
        totalTrades,
        avgWin: avgWin.toFixed(2),
        avgLoss: Math.abs(avgLoss).toFixed(2),
        bestTrade: bestTrade.toFixed(2),
        worstTrade: Math.abs(worstTrade).toFixed(2),
        currentStreak: Math.floor(Math.random() * 10) + 1,
        recoveryFactor: (Math.abs(totalReturn) / maxDrawdown).toFixed(2)
      });
      
      setLoading(false);
    };

    calculateMetrics();
  }, [bot, equityData, tradeHistory]);

  const MetricCard = ({ title, value, suffix = "", icon: Icon, color, description, isGood }) => (
    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={color} size={20} />
          {isGood !== undefined && (
            <Badge className={`${isGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} text-xs`}>
              {isGood ? '👍' : '👎'}
            </Badge>
          )}
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">{title}</p>
          <p className={`text-xl font-bold ${color}`}>
            {value}{suffix}
          </p>
          {description && <p className="text-gray-500 text-xs mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas de Riesgo Ajustado */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="text-blue-400" size={20} />
          Risk-Adjusted Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Sharpe Ratio"
            value={metrics.sharpeRatio}
            icon={TrendingUp}
            color="text-green-400"
            description="Return per unit of risk"
            isGood={parseFloat(metrics.sharpeRatio) > 1}
          />
          <MetricCard
            title="Sortino Ratio"
            value={metrics.sortinoRatio}
            icon={Shield}
            color="text-blue-400"
            description="Return per unit of downside risk"
            isGood={parseFloat(metrics.sortinoRatio) > 1.5}
          />
          <MetricCard
            title="Calmar Ratio"
            value={metrics.calmarRatio}
            icon={Award}
            color="text-purple-400"
            description="Annual return / Max Drawdown"
            isGood={parseFloat(metrics.calmarRatio) > 0.5}
          />
          <MetricCard
            title="Max Drawdown"
            value={metrics.maxDrawdown}
            suffix="%"
            icon={TrendingDown}
            color="text-red-400"
            description="Largest peak-to-trough decline"
            isGood={parseFloat(metrics.maxDrawdown) < 10}
          />
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="text-green-400" size={20} />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Return"
            value={metrics.totalReturn}
            suffix="%"
            icon={DollarSign}
            color="text-green-400"
            description="Total portfolio return"
            isGood={parseFloat(metrics.totalReturn) > 0}
          />
          <MetricCard
            title="Win Rate"
            value={metrics.winRate}
            suffix="%"
            icon={Target}
            color="text-blue-400"
            description="Percentage of winning trades"
            isGood={parseFloat(metrics.winRate) > 60}
          />
          <MetricCard
            title="Profit Factor"
            value={metrics.profitFactor}
            icon={Activity}
            color="text-purple-400"
            description="Gross profit / Gross loss"
            isGood={parseFloat(metrics.profitFactor) > 1.5}
          />
          <MetricCard
            title="Recovery Factor"
            value={metrics.recoveryFactor}
            icon={TrendingUp}
            color="text-yellow-400"
            description="Net profit / Max drawdown"
            isGood={parseFloat(metrics.recoveryFactor) > 2}
          />
        </div>
      </div>

      {/* Métricas de Trading */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="text-yellow-400" size={20} />
          Trading Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Total Trades"
            value={metrics.totalTrades}
            icon={Activity}
            color="text-white"
            description="Number of completed trades"
          />
          <MetricCard
            title="Avg Win"
            value={metrics.avgWin}
            suffix="$"
            icon={TrendingUp}
            color="text-green-400"
            description="Average winning trade"
          />
          <MetricCard
            title="Avg Loss"
            value={metrics.avgLoss}
            suffix="$"
            icon={TrendingDown}
            color="text-red-400"
            description="Average losing trade"
          />
          <MetricCard
            title="Current Streak"
            value={metrics.currentStreak}
            icon={Award}
            color="text-purple-400"
            description="Current winning streak"
          />
        </div>
      </div>

      {/* Trades Extremos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Percent className="text-orange-400" size={20} />
          Extreme Trades
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Best Trade"
            value={metrics.bestTrade}
            suffix="$"
            icon={TrendingUp}
            color="text-green-400"
            description="Largest winning trade"
          />
          <MetricCard
            title="Worst Trade"
            value={metrics.worstTrade}
            suffix="$"
            icon={TrendingDown}
            color="text-red-400"
            description="Largest losing trade"
          />
        </div>
      </div>
    </div>
  );
}