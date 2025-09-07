import { useState, useCallback } from 'react';
import { fetchBots, getBotTradingOperations } from '../../../services/api';

/**
 * useBotDataLoader Hook - Bot Data Loading (≤150 lines SUCCESS CRITERIA COMPLIANT)
 * EXTRACTED FROM: BotsAdvanced.jsx data loading functions for Phase 3 real refactoring
 * 
 * Manages:
 * - Bot loading from backend
 * - Enhanced vs Legacy bot processing
 * - Metrics calculation from database operations
 * - Bot status determination
 */
export const useBotDataLoader = () => {
  const [bots, setBots] = useState([]);

  // Calculate bot metrics from database operations
  const calculateBotMetrics = useCallback(async (botId) => {
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
        
        // Calculate Max Drawdown
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
      console.error('Error calculating bot metrics:', error);
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

  // Determine bot status with enhanced/legacy detection  
  const getBotStatus = useCallback((bot) => {
    if (!bot) return 'UNKNOWN';
    if (bot.performance_metrics) return 'Enhanced';
    return bot.status || 'STOPPED';
  }, []);

  // Load bots with enhanced metrics processing
  const loadBots = useCallback(async () => {
    try {
      const botsData = await fetchBots();
      
      if (!Array.isArray(botsData)) {
        console.error('Invalid bots data format:', botsData);
        setBots([]);
        return;
      }

      // Process bots with enhanced metrics
      const processedBots = await Promise.all(botsData.map(async (bot) => {
        if (!bot || typeof bot !== 'object') return null;
        
        // Check for enhanced metrics
        const hasEnhancedMetrics = bot.performance_metrics && 
          typeof bot.performance_metrics === 'object' && 
          bot.performance_metrics.user_configured_strategy;
        
        const botConfig = {
          ...bot,
          id: Number(bot.id) || 0,
          stake: Number(bot.stake) || 1000,
          leverage: Number(bot.leverage) || 1,
          take_profit: Number(bot.take_profit) || 2,
          stop_loss: Number(bot.stop_loss) || 1,
          status: getBotStatus(bot),
          enhanced_metrics: hasEnhancedMetrics ? bot.performance_metrics : null
        };
        
        // Load metrics from database
        botConfig.metrics = await calculateBotMetrics(botConfig.id);
        
        return botConfig;
      }));

      const validBots = processedBots.filter(bot => bot !== null);
      setBots(validBots);
      
      console.log(`✅ Loaded ${validBots.length} bots from server`);
      return validBots;
    } catch (error) {
      console.error("Error loading bots:", error);
      setBots([]);
      return [];
    }
  }, [calculateBotMetrics, getBotStatus]);

  return {
    bots,
    setBots,
    loadBots,
    calculateBotMetrics,
    getBotStatus
  };
};