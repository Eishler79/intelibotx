// ✅ DL-040 Phase 5: Bots Context Provider
// EXTRACTED FROM: pages/BotsAdvanced.jsx (Bots state management)
// RISK LEVEL: 10% - Shared state management extraction

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { getBotTradingOperations, createTradingOperation, runSmartTrade, fetchBots, deleteBot, updateBot } from '../../services/api';
import { useAuthDL008 } from '../../hooks/useAuthDL008';

/**
 * Bots Context
 * 
 * Provides centralized state management for bot-related operations:
 * - Bots list management (CRUD operations)
 * - Bot metrics and performance data
 * - Trading operations management
 * - Real-time bot execution control
 * 
 * This context extracts the complex bot state management from BotsAdvanced.jsx
 * to enable sharing across multiple components and better separation of concerns.
 */

const BotsContext = createContext(null);

export function useBotsContext() {
  const context = useContext(BotsContext);
  if (!context) {
    throw new Error('useBotsContext must be used within a BotsProvider');
  }
  return context;
}

export function BotsProvider({ children }) {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch, getAuthHeaders } = useAuthDL008();
  
  // Core bot state
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [controlPanelBot, setControlPanelBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBotId, setSelectedBotId] = useState(null);
  
  // 📊 Ref para manejar intervals de trading bots
  const botIntervals = useRef({});

  // 📊 Función para cargar métricas iniciales desde base de datos
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
        
        // Calcular Max Drawdown real
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
      
      // Métricas por defecto si no hay operaciones
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
      console.error(`❌ Error cargando métricas para bot ${botId}:`, error);
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

  // Calcular métricas dinámicas basadas en bots reales
  const calculateDynamicMetrics = useCallback(() => {
    if (bots.length === 0) {
      return {
        totalPnL: 0,
        activeBots: 0,
        avgSharpe: 0,
        avgWinRate: 0
      };
    }

    const runningBots = bots.filter(b => b.status === 'RUNNING');
    const allActiveBots = bots.filter(b => b.metrics?.totalTrades > 0 || b.status === 'RUNNING');
    
    const totalPnL = allActiveBots.reduce((sum, bot) => {
      const botPnL = Number(bot.metrics?.realizedPnL || 0);
      return sum + botPnL;
    }, 0);
    
    const avgWinRate = allActiveBots.length > 0 ? allActiveBots.reduce((sum, bot) => {
      const botTrades = Number(bot.metrics?.totalTrades || 0);
      const botWinRate = botTrades > 0 ? Number(bot.metrics?.winRate || 0) : 0;
      return sum + botWinRate;
    }, 0) / allActiveBots.length : 0;
    
    const avgSharpe = allActiveBots.length > 0 ? allActiveBots.reduce((sum, bot) => {
      const botSharpe = Number(bot.metrics?.sharpeRatio || 0);
      return sum + botSharpe;
    }, 0) / allActiveBots.length : 0;

    return {
      totalPnL: Number(totalPnL.toFixed(2)),
      activeBots: runningBots.length,
      avgSharpe: Number(avgSharpe.toFixed(2)),
      avgWinRate: Number(avgWinRate.toFixed(1))
    };
  }, [bots]);

  // Load bots from API
  const loadBots = useCallback(async () => {
    try {
      const botsData = await fetchBots();
      
      const processedBots = await Promise.all(botsData.map(async (bot) => {
        const hasEnhancedMetrics = bot.performance_metrics;
        
        const botConfig = {
          id: bot.id,
          name: bot.name,
          symbol: bot.symbol,
          strategy: bot.strategy,
          stake: bot.stake,
          take_profit: bot.take_profit,
          stop_loss: bot.stop_loss,
          takeProfit: bot.take_profit,
          stopLoss: bot.stop_loss,
          riskPercentage: bot.risk_percentage,
          exchange_id: bot.exchange_id,
          risk_percentage: bot.risk_percentage,
          marketType: bot.market_type,
          market_type: bot.market_type,
          leverage: bot.leverage || 1,
          margin_type: bot.margin_type || 'ISOLATED',
          interval: bot.interval,
          base_currency: bot.base_currency,
          quote_currency: bot.quote_currency,
          dca_levels: bot.dca_levels,
          cooldown_minutes: bot.cooldown_minutes,
          max_open_positions: bot.max_open_positions,
          entry_order_type: bot.entry_order_type,
          exit_order_type: bot.exit_order_type,
          tp_order_type: bot.tp_order_type,
          sl_order_type: bot.sl_order_type,
          trailing_stop: bot.trailing_stop,
          status: getBotStatus(bot),
          enhanced_metrics: hasEnhancedMetrics ? {
            user_configured_strategy: bot.performance_metrics.user_configured_strategy,
            user_stake_amount: bot.performance_metrics.user_stake_amount,
            user_risk_percentage: bot.performance_metrics.user_risk_percentage,
            estimated_trades_per_day: bot.performance_metrics.estimated_trades_per_day,
            risk_adjusted_return: bot.performance_metrics.risk_adjusted_return
          } : null
        };
        
        if (hasEnhancedMetrics) {
          const basicMetrics = await loadRealBotMetrics(botConfig.id);
          botConfig.metrics = {
            ...basicMetrics,
            enhanced_trades_per_day: bot.performance_metrics.estimated_trades_per_day,
            enhanced_risk_return: bot.performance_metrics.risk_adjusted_return,
            user_strategy: bot.performance_metrics.user_configured_strategy,
            user_stake: bot.performance_metrics.user_stake_amount,
            user_risk: bot.performance_metrics.user_risk_percentage
          };
        } else {
          botConfig.metrics = await loadRealBotMetrics(botConfig.id);
        }
        
        return botConfig;
      }));
        
      setBots(processedBots);
      
      if (processedBots.length > 0 && !selectedBotId) {
        setSelectedBotId(processedBots[0].id);
      }
      
      console.log(`✅ Cargados ${botsData.length} bots desde el servidor`);
    } catch (error) {
      console.error("Error loading bots:", error);
      setBots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBotId, loadRealBotMetrics]);

  // Helper function for bot status
  const getBotStatus = (bot) => {
    const statuses = ['RUNNING', 'PAUSED', 'STOPPED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  // Bot CRUD operations
  const addBot = useCallback((newBot) => {
    setBots(prev => [...prev, newBot]);
  }, []);

  const updateBotInList = useCallback(async (botId, params) => {
    try {
      const response = await updateBot(botId.toString(), params);
      console.log('✅ Bot actualizado exitosamente en backend:', response);
      
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, ...params } : bot
        )
      );
      
      return response;
    } catch (error) {
      console.error('❌ Error actualizando bot:', error);
      throw error;
    }
  }, []);

  const removeBotFromList = useCallback(async (botId) => {
    try {
      const bot = bots.find(b => b.id === botId);
      if (!bot) {
        console.log('Bot no encontrado en la lista local');
        return;
      }
      
      const result = await deleteBot(botId.toString());
      console.log('✅ Bot eliminado del servidor:', result.message);
      
      setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
      
      if (selectedBotId === botId) {
        const remainingBots = bots.filter(bot => bot.id !== botId);
        setSelectedBotId(remainingBots.length > 0 ? remainingBots[0].id : null);
      }
      
      if (window.botIntervals && window.botIntervals[botId]) {
        clearInterval(window.botIntervals[botId]);
        delete window.botIntervals[botId];
      }
      
      console.log(`🗑️ Bot ${bot.symbol} eliminado con DL-017 compliance`);
    } catch (error) {
      console.error('❌ Error eliminando bot:', error);
      throw error;
    }
  }, [bots, selectedBotId]);

  // Trading operations
  const toggleBotStatus = useCallback(async (botId, currentStatus) => {
    try {
      console.log('🔄 Cambiando estado bot:', botId, 'de', currentStatus);
      
      const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      const bot = bots.find(b => b.id === botId);
      
      if (!bot) {
        throw new Error('Bot no encontrado');
      }
      
      // Actualizar estado visualmente primero
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, status: newStatus } : bot
        )
      );

      // Llamar al backend para cambiar estado real
      const endpoint = newStatus === 'RUNNING' ? 'start' : 'pause';
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      const response = await fetch(`${BASE_URL}/api/bots/${botId}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        
        if (newStatus === 'RUNNING') {
          console.log(`🚀 ${result.message}`);
          startBotTrading(botId, bot);
        } else {
          console.log(`⏸️ ${result.message}`);
          stopBotTrading(botId);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error cambiando estado del bot:`, error);
      
      // Revertir cambio si hay error
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, status: currentStatus } : bot
        )
      );
      
      throw error;
    }
  }, [bots, getAuthHeaders]);

  // Trading execution methods
  const startBotTrading = useCallback(async (botId, bot) => {
    if (!bot) {
      bot = bots.find(b => b.id === botId);
      if (!bot) return;
    }
    
    console.log(`🤖 Iniciando Smart Scalper Pro para ${bot.symbol} - ${bot.strategy}`);
    
    const strategies = {
      'Smart Scalper': { frequency: 45000, scalperMode: true },
      'Trend Hunter': { frequency: 120000, scalperMode: false },
      'Manipulation Detector': { frequency: 180000, scalperMode: true },
      'News Sentiment': { frequency: 300000, scalperMode: false },
      'Volatility Master': { frequency: 60000, scalperMode: true }
    };
    
    const strategyConfig = strategies[bot.strategy] || strategies['Smart Scalper'];
    
    const interval = setInterval(async () => {
      try {
        const analysisResult = await runSmartTrade(bot.symbol, strategyConfig.scalperMode);
        
        if (analysisResult && analysisResult.signals && analysisResult.signals.signal !== 'HOLD') {
          const signal = analysisResult.signals.signal;
          const algorithm = analysisResult.analysis?.algorithm_selected || 'smart_scalper';
          const confidence = parseFloat(analysisResult.signals?.confidence || 0.75);
          
          const currentPrice = analysisResult.current_price || 50000;
          const stake = Number(bot.stake) || 1000;
          const risk = Number(bot.risk_percentage) || 1;
          const quantity = Number(((stake * risk / 100) / currentPrice).toFixed(6));
          
          const isWin = Math.random() < confidence;
          const basePnl = stake * (risk / 100);
          const pnl = isWin ? 
            basePnl * (0.5 + confidence * 0.5) : 
            -basePnl * (0.2 + (1 - confidence) * 0.3);
          
          const operationData = {
            bot_id: botId,
            symbol: bot.symbol,
            side: signal,
            quantity: quantity,
            price: currentPrice,
            strategy: bot.strategy,
            signal: analysisResult.signals?.reason || algorithm,
            algorithm_used: algorithm,
            confidence: confidence,
            pnl: Number(pnl.toFixed(2))
          };
          
          try {
            await createTradingOperation(operationData);
            console.log(`✅ Operación ${signal} creada para ${bot.symbol}: PnL $${pnl.toFixed(2)}`);
            await updateBotMetricsFromDB(botId);
          } catch (error) {
            console.error('❌ Error creando operación persistente:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error en análisis Smart Scalper:', error);
      }
    }, strategyConfig.frequency);
    
    botIntervals.current[botId] = interval;
  }, [bots]);

  const stopBotTrading = useCallback((botId) => {
    const bot = bots.find(b => b.id === botId);
    console.log(`🛑 Deteniendo motor IA para ${bot?.symbol}`);
    
    if (botIntervals.current[botId]) {
      clearInterval(botIntervals.current[botId]);
      delete botIntervals.current[botId];
    }
  }, [bots]);

  // Update bot metrics from database
  const updateBotMetricsFromDB = useCallback(async (botId) => {
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
        
        let peak = 0;
        let maxDrawdown = 0;
        let currentBalance = 0;
        
        ops.reverse().forEach(op => {
          currentBalance += op.pnl || 0;
          if (currentBalance > peak) peak = currentBalance;
          const drawdown = peak > 0 ? ((peak - currentBalance) / peak * 100) : 0;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        setBots(prevBots => 
          prevBots.map(b => {
            if (b.id === botId) {
              return {
                ...b,
                metrics: {
                  realizedPnL: Number(totalPnL.toFixed(2)),
                  totalTrades: totalTrades,
                  totalWins: totalWins,
                  totalLosses: totalLosses,
                  winRate: winRate.toFixed(1),
                  sharpeRatio: sharpeRatio.toFixed(2),
                  maxDrawdown: maxDrawdown.toFixed(1),
                  profitFactor: totalWins > 0 && totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '1.00'
                }
              };
            }
            return b;
          })
        );
      }
    } catch (error) {
      console.error('❌ Error actualizando métricas desde DB:', error);
    }
  }, []);

  const contextValue = {
    // State
    bots,
    setBots,
    selectedBot,
    setSelectedBot,
    controlPanelBot,
    setControlPanelBot,
    loading,
    setLoading,
    selectedBotId,
    setSelectedBotId,
    
    // Computed values
    dynamicMetrics: calculateDynamicMetrics(),
    
    // Actions
    loadBots,
    addBot,
    updateBotInList,
    removeBotFromList,
    toggleBotStatus,
    startBotTrading,
    stopBotTrading,
    loadRealBotMetrics,
    updateBotMetricsFromDB,
    
    // Refs
    botIntervals
  };

  return (
    <BotsContext.Provider value={contextValue}>
      {children}
    </BotsContext.Provider>
  );
}