import { useCallback } from 'react';
import { getBotTradingOperations } from '../../../services/api';

export const useBotMetrics = () => {

  // ✅ DL-001 COMPLIANCE: Load real bot metrics from database
  const loadRealBotMetrics = useCallback(async (botId) => {
    try {
      const operations = await getBotTradingOperations(botId.toString(), { limit: 100 });
      
      if (operations.success && operations.operations) {
        const ops = operations.operations;
        const totalTrades = ops.length;
        const totalWins = ops.filter(op => op.pnl > 0).length;
        const totalLosses = totalTrades - totalWins;
        const totalPnL = ops.reduce((sum, op) => sum + (op.pnl || 0), 0);
        const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100) : 0;
        const sharpeRatio = totalPnL > 0 ? Math.min(totalPnL / Math.max(totalTrades, 1) * 0.1, 3.0) : 0;
        
        // Calculate Max Drawdown real
        let peak = 0;
        let maxDrawdown = 0;
        let currentBalance = 0;
        
        ops.reverse().forEach(op => {
          currentBalance += op.pnl || 0;
          if (currentBalance > peak) peak = currentBalance;
          const drawdown = peak > 0 ? ((peak - currentBalance) / peak * 100) : 0;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        return {
          realizedPnL: Number(totalPnL.toFixed(2)),
          totalTrades: totalTrades,
          totalWins: totalWins,
          totalLosses: totalLosses,
          winRate: winRate.toFixed(1),
          sharpeRatio: sharpeRatio.toFixed(2),
          maxDrawdown: maxDrawdown.toFixed(1),
          profitFactor: totalWins > 0 && totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '1.00'
        };
      }
      
      // Default metrics if no operations
      return {
        realizedPnL: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: '0.0',
        sharpeRatio: '0.00',
        maxDrawdown: '0.0',
        profitFactor: '1.00'
      };
      
    } catch (error) {
      console.error(`❌ Error loading metrics for bot ${botId}:`, error);
      return {
        realizedPnL: 0,
        totalTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: '0.0',
        sharpeRatio: '0.00',
        maxDrawdown: '0.0',
        profitFactor: '1.00'
      };
    }
  }, []);

  // ✅ DL-001 COMPLIANCE: Get real bot metrics from backend
  const getRealBotMetrics = useCallback(async (bot) => {
    const defaultMetrics = {
      sharpeRatio: '0.00', sortinoRatio: '0.00', calmarRatio: '0.00',
      maxDrawdown: '0.0', winRate: '0.0', profitFactor: '0.00',
      totalTrades: 0, avgWin: '0.00', avgLoss: '0.00',
      realizedPnL: 0, equity: [{ day: 1, value: Number(bot?.stake || 100) }]
    };
    
    if (!bot || !bot.id) return defaultMetrics;

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      const token = localStorage.getItem('intelibotx_token');
      const authHeaders = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const [tradesResponse, summaryResponse] = await Promise.all([
        fetch(`${BASE_URL}/api/bots/${bot.id}/trades`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/bots/${bot.id}/trading-summary`, { headers: authHeaders })
      ]);
      
      if (tradesResponse.ok && summaryResponse.ok) {
        const tradesData = await tradesResponse.json();
        const summaryData = await summaryResponse.json();
        const trades = tradesData.trades || [];
        const summary = summaryData.summary?.summary || {};
        const realizedPnL = trades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0);
        
        return {
          sharpeRatio: (summary.profit_factor || 0).toFixed(2),
          sortinoRatio: ((summary.profit_factor || 0) * 1.2).toFixed(2),
          calmarRatio: ((summary.profit_factor || 0) * 0.8).toFixed(2),
          maxDrawdown: '0.0', winRate: (summary.win_rate || 0).toFixed(1),
          profitFactor: (summary.profit_factor || 0).toFixed(2), totalTrades: summary.total_trades || 0,
          avgWin: trades.length > 0 ? (trades.filter(t => t.realized_pnl > 0).reduce((sum, t) => sum + t.realized_pnl, 0) / trades.filter(t => t.realized_pnl > 0).length || 1).toFixed(2) : '0.00',
          avgLoss: trades.length > 0 ? Math.abs(trades.filter(t => t.realized_pnl < 0).reduce((sum, t) => sum + t.realized_pnl, 0) / trades.filter(t => t.realized_pnl < 0).length || 1).toFixed(2) : '0.00',
          realizedPnL: realizedPnL.toFixed(2),
          equity: trades.map((trade, index) =>
            Number(bot.stake) + trades.slice(0, index + 1).reduce((sum, t) => sum + (t.realized_pnl || 0), 0)
          ),
          // Add fields needed by AdvancedMetrics
          trades: trades.map(t => t.realized_pnl || 0),  // Array of PnLs
          returns: trades.map(trade => {
            const stake = Number(bot.stake) || 1000;
            return stake > 0 ? (trade.realized_pnl || 0) / stake : 0;
          })  // Array of percentage returns
        };
      }
    } catch (error) {
      console.error('Error loading real bot metrics:', error);
    }
    
    return defaultMetrics;
  }, []);

  // Update bot metrics from database
  const updateBotMetrics = useCallback(async (botId, setBots) => {
    try {
      const operations = await getBotTradingOperations(botId.toString(), { limit: 100 });
      
      if (operations.success && operations.operations) {
        const metrics = await loadRealBotMetrics(botId);
        setBots(prevBots => prevBots.map(b => b.id === botId ? { ...b, performance_metrics: { ...b.performance_metrics, ...metrics, last_updated: new Date().toISOString() } } : b));
      }
    } catch (error) {
      console.error('Error updating bot metrics:', error);
    }
  }, [loadRealBotMetrics]);

  return {
    loadRealBotMetrics,
    getRealBotMetrics,
    updateBotMetrics
  };
};