import { useMemo } from 'react';

/**
 * useTradingCalculations - Specialized Trading Metrics Calculations
 * 
 * ✅ DL-001: Pure calculations from real trade data, no hardcode
 * ✅ SINGLE RESPONSIBILITY: Trading metrics calculation only
 * ✅ 25 lines extracted from LiveTradingFeed.jsx
 */
export const useTradingCalculations = (feed = []) => {
  // Total PnL calculation
  const totalPnL = useMemo(() => {
    if (!Array.isArray(feed) || feed.length === 0) return 0;
    return feed.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
  }, [feed]);

  // Win rate calculation
  const winRate = useMemo(() => {
    if (!Array.isArray(feed) || feed.length === 0) return 0;
    const profitable = feed.filter(trade => (Number(trade.pnl) || 0) > 0).length;
    return Number(((profitable / feed.length) * 100).toFixed(1));
  }, [feed]);

  // Trade counts
  const tradeCounts = useMemo(() => {
    if (!Array.isArray(feed) || feed.length === 0) {
      return { total: 0, profitable: 0, losing: 0 };
    }
    
    const profitable = feed.filter(trade => (Number(trade.pnl) || 0) > 0).length;
    const losing = feed.filter(trade => (Number(trade.pnl) || 0) < 0).length;
    
    return {
      total: feed.length,
      profitable,
      losing
    };
  }, [feed]);

  // Average PnL per trade
  const averagePnL = useMemo(() => {
    if (!Array.isArray(feed) || feed.length === 0) return 0;
    return totalPnL / feed.length;
  }, [totalPnL, feed.length]);

  // Best and worst trades
  const tradeExtremes = useMemo(() => {
    if (!Array.isArray(feed) || feed.length === 0) {
      return { best: 0, worst: 0 };
    }
    
    const pnlValues = feed.map(trade => Number(trade.pnl) || 0);
    return {
      best: Math.max(...pnlValues),
      worst: Math.min(...pnlValues)
    };
  }, [feed]);

  return {
    // Core metrics
    totalPnL,
    winRate,
    averagePnL,
    
    // Trade counts
    ...tradeCounts,
    
    // Extremes
    ...tradeExtremes,
    
    // Utility functions
    isPositivePnL: totalPnL >= 0,
    hasRecentTrades: feed.length > 0,
    
    // Formatted values
    formattedPnL: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`,
    formattedWinRate: `${winRate}%`
  };
};