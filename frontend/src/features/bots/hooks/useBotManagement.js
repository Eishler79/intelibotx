import { useState, useEffect, useCallback } from 'react';
import { useBotState } from './useBotState';
import { useBotCrud } from './useBotCrud';
import { useBotStatus } from './useBotStatus';
import { useBotOperations } from './useBotOperations';
import { useBotMetrics } from './useBotMetrics';
import { useBotMarketData } from './useBotMarketData';

/**
 * useBotManagement - Hook consolidado para toda la lógica
 * SUCCESS CRITERIA: Centraliza toda la lógica de BotsModular
 */
export const useBotManagement = () => {
  // Estado local
  const botState = useBotState();
  const { bots, setBots, loading, setLoading, error, setError,
    showCreateModal, setShowCreateModal, controlPanelBot, setControlPanelBot,
    showTemplates, setShowTemplates, selectedTemplate, setSelectedTemplate,
    activeTab, setActiveTab, selectedBotId, setSelectedBotId,
    successMessage, setSuccessMessage } = botState;

  // Hooks de operaciones
  const { fetchBots, createBot, updateBot, deleteBotOperation } = useBotCrud();
  const { toggleBotStatus } = useBotStatus();
  const { startBotTrading, stopBotTrading } = useBotOperations();
  const { loadRealBotMetrics, getRealBotMetrics } = useBotMetrics();
  const { fetchMarketData } = useBotMarketData();

  // Estado adicional
  const [dynamicMetrics, setDynamicMetrics] = useState({
    totalPnL: 0, activeBots: 0, avgSharpe: 0, avgWinRate: 0
  });
  const [realTimeData, setRealTimeData] = useState({});
  const [selectedBot, setSelectedBot] = useState(null);

  // Update selectedBot with metrics when selected
  const handleSelectBot = useCallback(async (bot) => {
    setSelectedBot(bot);
    if (bot && bot.id) {
      const metrics = await getRealBotMetrics(bot);
      setSelectedBot(prev => ({...prev, metrics}));
    }
  }, [getRealBotMetrics]);

  // Cargar bots al montar - ✅ DL-008: Verify auth before fetching
  useEffect(() => {
    const loadBots = async () => {
      setLoading(true);
      try {
        // ✅ P1: VERIFICATION - Check if user is authenticated before API call
        const token = localStorage.getItem('intelibotx_token');
        if (!token) {
          console.warn('⚠️ No authentication token found - skipping bot fetch');
          setBots([]);
          setLoading(false);
          return;
        }

        const botsData = await fetchBots();

        // ✅ SPEC_REF: BotsAdvanced.jsx:677-683 - Map performance_metrics to enhanced_metrics for persistence
        const processedBots = botsData.map(bot => ({
          ...bot,
          takeProfit: bot.take_profit,
          stopLoss: bot.stop_loss,
          riskPercentage: bot.risk_percentage,
          marketType: bot.market_type,
          bot_exchange_id: bot.exchange_id,
          enhanced_metrics: bot.performance_metrics ? {
            user_configured_strategy: bot.performance_metrics.user_configured_strategy,
            user_stake_amount: bot.performance_metrics.user_stake_amount,
            user_risk_percentage: bot.performance_metrics.user_risk_percentage,
            estimated_trades_per_day: bot.performance_metrics.estimated_trades_per_day,
            risk_adjusted_return: bot.performance_metrics.risk_adjusted_return,
            algorithm_analysis: bot.performance_metrics.algorithm_analysis,
            total_return_percentage: bot.performance_metrics.total_return_percentage,
            monthly_return_percentage: bot.performance_metrics.monthly_return_percentage,
            win_rate: bot.performance_metrics.win_rate,
            average_trade_duration: bot.performance_metrics.average_trade_duration,
            sharpe_ratio: bot.performance_metrics.sharpe_ratio,
            max_drawdown: bot.performance_metrics.max_drawdown,
            profit_factor: bot.performance_metrics.profit_factor,
            trades_count: bot.performance_metrics.trades_count
          } : null
        }));

        setBots(processedBots);

        // ✅ SPEC_REF: BotsAdvanced.jsx:714-720 - DL-093: Restart RUNNING bots on page load
        processedBots.forEach(bot => {
          if (bot.status === 'RUNNING') {
            console.log(`🔄 Reiniciando bot ${bot.id} (${bot.symbol}) que estaba en RUNNING`);
            startBotTrading(bot.id, bot);
          }
        });
      } catch (err) {
        console.error('❌ Error loading bots:', err);
        setError(err.message);
        // ✅ P3: ERROR HANDLING - Don't crash, just show empty state
        setBots([]);
      } finally {
        setLoading(false);
      }
    };
    loadBots();
  }, []);

  // Calcular métricas dinámicas
  useEffect(() => {
    if (bots.length > 0) {
      const runningBots = bots.filter(b => b.status === 'RUNNING');
      const allActiveBots = bots.filter(b => b.metrics?.totalTrades > 0 || b.status === 'RUNNING');
      const totalPnL = allActiveBots.reduce((sum, bot) => sum + Number(bot.metrics?.realizedPnL || 0), 0);
      const avgWinRate = allActiveBots.length > 0
        ? allActiveBots.reduce((sum, bot) => sum + Number(bot.metrics?.winRate || 0), 0) / allActiveBots.length : 0;
      const avgSharpe = allActiveBots.length > 0
        ? allActiveBots.reduce((sum, bot) => sum + Number(bot.metrics?.sharpeRatio || 0), 0) / allActiveBots.length : 0;

      setDynamicMetrics({
        totalPnL: totalPnL.toFixed(2),
        activeBots: runningBots.length,
        avgSharpe: avgSharpe.toFixed(2),
        avgWinRate: avgWinRate.toFixed(1)
      });
    }
  }, [bots]);

  // Cargar market data
  useEffect(() => {
    if (selectedBot) {
      const loadMarketData = async () => {
        try {
          const data = await fetchMarketData(selectedBot.symbol, '15m', 100, selectedBot.market_type);
          setRealTimeData(prev => ({ ...prev, [selectedBot.symbol]: data }));
        } catch (error) {
          console.error('Error loading market data:', error);
        }
      };
      loadMarketData();
    }
  }, [selectedBot, fetchMarketData]);

  // Handlers
  const handleDeleteBot = async (id) => {
    try {
      await deleteBotOperation(id, bots);
      setBots(prev => prev.filter(b => b.id !== id));
      setSuccessMessage('Bot eliminado exitosamente');
    } catch (err) {
      console.error('Error deleting bot:', err);
      setError(err.message);
    }
  };

  const handleToggleBotStatus = async (id, status) => {
    try {
      const result = await toggleBotStatus(id, status, bots);
      if (result.success) {
        setBots(prev => prev.map(b => b.id === id ? {...b, status: result.newStatus} : b));
        if (result.newStatus === 'RUNNING') {
          const bot = bots.find(b => b.id === id);
          startBotTrading(id, bot);
        } else {
          stopBotTrading(id);
        }
      }
    } catch (err) {
      console.error('Error toggling bot status:', err);
      setError(err.message);
    }
  };

  const handleUpdateBot = async (id, updates) => {
    try {
      const response = await updateBot(id, updates);
      // ✅ FIX: Extraer bot del response (backend retorna {bot: {...}, message: "..."})
      const updatedBot = response.bot || response;

      setBots(prev => prev.map(b => b.id === id ? updatedBot : b));
      setSuccessMessage('Bot actualizado exitosamente');
      // ✅ FIX: Auto-hide mensaje después de 3 segundos (SPEC_REF: BotsAdvanced.jsx:929)
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating bot:', err);
      setError(err.message);
    }
  };

  const handleCreateBot = async (serverResponse) => {
    try {
      // ✅ SPEC_REF: BotsAdvanced.jsx:324 - Extract bot from server response
      // ✅ ROOT CAUSE FIX: Process server response directly, NO second API call
      // PROBLEM WAS: Calling createBot(serverResponse) tried to send response as request → 500 error
      const botData = serverResponse.bot || serverResponse;

      // ✅ DL-001: Use backend data directly, no hardcode
      // ✅ SPEC_REF: BotsAdvanced.jsx:670 - Explicit snake_case to camelCase conversion for UI compatibility
      const botConfig = {
        ...botData,
        takeProfit: botData.take_profit,
        stopLoss: botData.stop_loss,
        riskPercentage: botData.risk_percentage,
        marketType: botData.market_type,  // ← Conversion for ProfessionalBotsTable.jsx:231
        bot_exchange_id: botData.exchange_id,
        status: 'STOPPED'
      };

      // ✅ Load REAL metrics from backend
      botConfig.metrics = await getRealBotMetrics(botConfig);

      // ✅ Map performance_metrics to enhanced_metrics (BotsAdvanced.jsx:338-354)
      if (botData.performance_metrics) {
        botConfig.enhanced_metrics = {
          user_configured_strategy: botData.performance_metrics.user_configured_strategy,
          user_stake_amount: botData.performance_metrics.user_stake_amount,
          user_risk_percentage: botData.performance_metrics.user_risk_percentage,
          estimated_trades_per_day: botData.performance_metrics.estimated_trades_per_day,
          risk_adjusted_return: botData.performance_metrics.risk_adjusted_return,
          algorithm_analysis: botData.performance_metrics.algorithm_analysis,
          total_return_percentage: botData.performance_metrics.total_return_percentage,
          monthly_return_percentage: botData.performance_metrics.monthly_return_percentage,
          win_rate: botData.performance_metrics.win_rate,
          average_trade_duration: botData.performance_metrics.average_trade_duration,
          sharpe_ratio: botData.performance_metrics.sharpe_ratio,
          max_drawdown: botData.performance_metrics.max_drawdown,
          profit_factor: botData.performance_metrics.profit_factor,
          trades_count: botData.performance_metrics.trades_count
        };
      }

      setBots(prev => [...prev, botConfig]);
      setShowCreateModal(false);
      setSuccessMessage(`✅ ${botData.name || 'Bot Enhanced'} creado exitosamente`);
      // ✅ SPEC_REF: BotsAdvanced.jsx:363 - Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error processing bot creation:', err);
      setError(err.message);
    }
  };

  return {
    // Estado
    bots, loading, error, successMessage, activeTab, selectedBotId, selectedBot,
    showCreateModal, controlPanelBot, showTemplates, selectedTemplate,
    dynamicMetrics, realTimeData,

    // Setters
    setActiveTab, setSelectedBotId, setSelectedBot: handleSelectBot, setShowCreateModal,
    setControlPanelBot, setShowTemplates, setSelectedTemplate, setSuccessMessage,

    // Handlers
    handleDeleteBot, handleToggleBotStatus, handleUpdateBot, handleCreateBot,

    // Métodos
    getRealBotMetrics
  };
};

export default useBotManagement;