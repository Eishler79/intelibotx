import React, { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, Activity, DollarSign, Users, Target, TrendingUp, TrendingDown } from "lucide-react";
import { useDashboardMetrics } from "../hooks/useDashboardMetrics";
import MetricCard from "./MetricCard";
import PerformanceCharts from "./PerformanceCharts";  
import PnLChart from "./PnLChart";
import { calculateSystemUptime, calculateRiskExposure, calculatePerformanceGrade, calculateStatusDistribution } from "../utils/dashboardUtils";
const DashboardMetrics = memo(({ bots, autoRefresh = true, refreshInterval = 30000, onMetricClick }) => {
  const { aggregatedMetrics, isLoading, performanceMetrics, cacheSize, cacheEfficiency, clearCache } = useDashboardMetrics(bots);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      if (cacheSize > 20) clearCache();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, cacheSize, clearCache]);

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      clearCache();
      setLastUpdate(new Date());
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      setRefreshError(error.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [clearCache]);

  const advancedMetrics = {
    totalPortfolioValue: parseFloat(aggregatedMetrics.totalVolume) + parseFloat(aggregatedMetrics.totalPnL),
    portfolioGrowth: parseFloat(aggregatedMetrics.totalVolume) > 0 
      ? ((parseFloat(aggregatedMetrics.totalPnL) / parseFloat(aggregatedMetrics.totalVolume)) * 100).toFixed(2) : '0.00',
    averageTradesPerBot: aggregatedMetrics.activeBots > 0 ? Math.round(aggregatedMetrics.totalTrades / aggregatedMetrics.activeBots) : 0,
    systemUptime: calculateSystemUptime(bots),
    riskExposure: calculateRiskExposure(bots),
    performanceGrade: calculatePerformanceGrade(aggregatedMetrics)
  };

  const statusDistribution = calculateStatusDistribution(bots);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-intelibot-text-primary">Portfolio Dashboard</h2>
          <p className="text-sm text-intelibot-text-muted mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()} • Cache: {cacheEfficiency}% efficiency
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {refreshError && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle size={12} className="mr-1" />Refresh Error
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            <Activity size={12} className="mr-1" />{performanceMetrics.totalApiCalls} API calls
          </Badge>
          <Button size="sm" variant="outline" onClick={handleManualRefresh} disabled={isRefreshing} className="text-xs">
            <RefreshCw size={14} className={`mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Portfolio" value={`$${advancedMetrics.totalPortfolioValue.toFixed(2)}`}
          subtitle={`${parseFloat(advancedMetrics.portfolioGrowth) >= 0 ? '+' : ''}${advancedMetrics.portfolioGrowth}% growth`}
          icon={DollarSign} iconColor="text-blue-400" bgColor="bg-blue-500/20" onClick={onMetricClick} metricKey="portfolio" />
        
        <MetricCard title="Realized PnL" value={`${parseFloat(aggregatedMetrics.totalPnL) >= 0 ? '+' : ''}$${aggregatedMetrics.totalPnL}`}
          subtitle={`Daily: ${parseFloat(aggregatedMetrics.dailyPnL) >= 0 ? '+' : ''}$${aggregatedMetrics.dailyPnL}`}
          icon={parseFloat(aggregatedMetrics.totalPnL) >= 0 ? TrendingUp : TrendingDown}
          iconColor={parseFloat(aggregatedMetrics.totalPnL) >= 0 ? "text-green-400" : "text-red-400"}
          valueColor={parseFloat(aggregatedMetrics.totalPnL) >= 0 ? "text-intelibot-success-green" : "text-intelibot-error-red"}
          bgColor={parseFloat(aggregatedMetrics.totalPnL) >= 0 ? "bg-green-500/20" : "bg-red-500/20"} onClick={onMetricClick} metricKey="pnl" />
        
        <MetricCard title="Active Bots" value={aggregatedMetrics.activeBots} subtitle={`${aggregatedMetrics.profitableBots} profitable`}
          icon={Users} iconColor="text-purple-400" bgColor="bg-purple-500/20" onClick={onMetricClick} metricKey="bots" />
        
        <MetricCard title="Performance" value={advancedMetrics.performanceGrade} subtitle={`Sharpe: ${aggregatedMetrics.avgSharpeRatio}`}
          icon={Target} iconColor="text-green-400" bgColor="bg-green-500/20" onClick={onMetricClick} metricKey="performance" />
      </div>

      <PnLChart aggregatedMetrics={aggregatedMetrics} advancedMetrics={advancedMetrics} />
      <PerformanceCharts statusDistribution={statusDistribution} isLoading={isLoading} />
    </div>
  );
});

export default DashboardMetrics;