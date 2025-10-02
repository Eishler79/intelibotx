import { useCallback, useRef } from 'react';
import { useAuthDL008 } from "../../../shared/hooks/useAuthDL008";
import { 
  createTradingOperation, 
  getBotTradingOperations,
  runSmartTrade 
} from '../../../services/api';
import { useBotCrud } from './useBotCrud';
import { useBotStatus } from './useBotStatus';

/**
 * useBotOperations Hook - Main Bot Operations Orchestrator
 * 
 * Refactored for SUCCESS CRITERIA compliance (≤150 lines)
 * Coordinates bot operations using specialized hooks
 * 
 * ✅ DL-001: Real API data only
 * ✅ DL-008: JWT authentication pattern
 * ✅ SUCCESS CRITERIA: ≤150 lines (orchestrator pattern)
 */
export const useBotOperations = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();
  
  // Specialized hooks for bot operations
  const botCrud = useBotCrud();
  const botStatus = useBotStatus();
  
  // Bot trading intervals management
  const botIntervals = useRef({});

  // Start bot trading with Smart Scalper AI
  const startBotTrading = useCallback(async (botId, bot) => {
    if (!bot) return;

    console.log(`🤖 Iniciando Smart Scalper Pro para ${bot.symbol} - ${bot.strategy}`);

    // Conversión directa de bot.interval a milliseconds - sin fallbacks
    const intervalToMs = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000
    };

    const frequency = intervalToMs[bot.interval];

    if (!frequency) {
      console.error(`❌ ERROR: Invalid bot interval: ${bot.interval}`);
      throw new Error(`Bot interval '${bot.interval}' is not supported`);
      // NO continuar, NO crear interval
      return;
    }

    // Determine scalperMode based on strategy (same as BotsAdvanced)
    const scalperModeMap = {
      'Smart Scalper': true,
      'Trend Hunter': false,
      'Manipulation Detector': true,
      'News Sentiment': false,
      'Volatility Master': true
    };

    const strategyConfig = {
      frequency: frequency,
      scalperMode: scalperModeMap[bot.strategy] !== undefined ? scalperModeMap[bot.strategy] : true,
      confidence: 0.70 // Default confidence level
    };
    
    // Clear any existing interval
    if (botIntervals.current[botId]) {
      clearInterval(botIntervals.current[botId]);
    }

    // Extract trade analysis logic to reusable function (DRY principle)
    const executeTradeAnalysis = async () => {
      try {
        const analysisResult = await runSmartTrade(bot.symbol, strategyConfig.scalperMode);

        // ✅ SPEC_REF: backend/routes/bots.py:225-234 - Handle execution_blocked response
        if (analysisResult?.execution_blocked) {
          console.log(`⏸️ Trade execution blocked for ${bot.symbol}:`, {
            reason: analysisResult.reason,
            score: analysisResult.score,
            threshold: analysisResult.threshold,
            recommendation: analysisResult.recommendation,
            message: analysisResult.message
          });
          return; // Skip trade creation when institutional quality < threshold
        }

        // ✅ SPEC_REF: backend/routes/bots.py:320-322 - Access signal from signals object
        const signal = analysisResult?.signals?.signal;

        if (signal && signal !== 'HOLD') {
          console.log(`🎯 ${signal} signal generated:`, analysisResult);

          // Create persistent trading operation in database
          try {
            // ✅ DL-001: Validate required fields from backend, NO hardcode fallbacks
            if (!analysisResult.quantity) {
              throw new Error('Backend did not provide quantity');
            }
            if (!analysisResult.current_price) {
              throw new Error('Backend did not provide current_price');
            }
            if (!analysisResult.signals?.confidence) {
              throw new Error('Backend did not provide confidence');
            }

            const tradingOp = await createTradingOperation({
              bot_id: bot.id,
              symbol: bot.symbol,
              side: signal,
              quantity: analysisResult.quantity,
              price: analysisResult.current_price,
              take_profit: bot.take_profit,
              stop_loss: bot.stop_loss,
              strategy: bot.strategy,
              confidence: analysisResult.signals.confidence,
              analysis_data: analysisResult.analysis || {}
            });

            console.log('💾 Trading operation persisted:', tradingOp);

          } catch (error) {
            console.error('❌ Error creating persistent operation:', error);
          }
        } else {
          console.log(`⏸️ HOLD signal for ${bot.symbol} - no action taken`);
        }

      } catch (error) {
        console.error('❌ Error in Smart Scalper analysis:', error);
      }
    };

    // 1. Execute immediately on RUNNING status (user requirement)
    console.log(`⚡ Ejecutando análisis inmediato para ${bot.symbol}`);
    await executeTradeAnalysis();

    // 2. Then execute at regular intervals based on bot.interval from backend
    console.log(`⏰ Programando análisis cada ${bot.interval} (${strategyConfig.frequency}ms)`);
    const interval = setInterval(executeTradeAnalysis, strategyConfig.frequency);

    botIntervals.current[botId] = interval;
    window.botIntervals = window.botIntervals || {};
    window.botIntervals[botId] = interval;
  }, []);

  // Stop bot trading
  const stopBotTrading = useCallback((botId) => {
    console.log(`🛑 Stopping AI engine for bot ${botId}`);
    
    if (botIntervals.current[botId]) {
      clearInterval(botIntervals.current[botId]);
      delete botIntervals.current[botId];
    }
    
    if (window.botIntervals?.[botId]) {
      clearInterval(window.botIntervals[botId]);
      delete window.botIntervals[botId];
    }
  }, []);

  // Update bot metrics from database
  const updateBotMetricsFromDB = useCallback(async (botId) => {
    try {
      const operations = await getBotTradingOperations(botId.toString(), { limit: 100 });
      
      if (operations?.length > 0) {
        const profitable = operations.filter(op => op.pnl > 0);
        const totalPnL = operations.reduce((sum, op) => sum + (op.pnl || 0), 0);
        const winRate = (profitable.length / operations.length) * 100;
        
        return {
          totalTrades: operations.length,
          totalWins: profitable.length,
          totalLosses: operations.length - profitable.length,
          winRate: winRate.toFixed(1),
          realizedPnL: totalPnL.toFixed(2),
          sharpeRatio: (winRate / 100 * 2).toFixed(2) // Simplified calculation
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error updating metrics from DB:', error);
      return null;
    }
  }, []);

  return {
    // CRUD operations
    ...botCrud,
    
    // Status management  
    ...botStatus,
    
    // Trading operations
    startBotTrading,
    stopBotTrading,
    updateBotMetricsFromDB,
    
    // Refs
    botIntervals
  };
};

export default useBotOperations;