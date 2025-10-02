import { useCallback } from 'react';
import { useAuthDL008 } from "../../../shared/hooks/useAuthDL008";
import { deleteBot } from '../../../services/api';

/**
 * useBotCrud Hook - Bot CRUD Operations
 * 
 * Extracted from useBotOperations.js for SUCCESS CRITERIA compliance
 * Handles bot creation and deletion operations
 * 
 * ✅ DL-001: Real API data only
 * ✅ DL-008: JWT authentication pattern
 * ✅ SUCCESS CRITERIA: ≤150 lines
 */
export const useBotCrud = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();

  // ✅ DL-008 COMPLIANT: Create bot with authentication
  const createBot = useCallback(async (botData) => {
    try {
      // 🔍 DEBUG: Log para identificar si useBotCrud se ejecuta
      console.log('🔍 USE-BOT-CRUD DEBUG:');
      console.log('📝 Bot data received:', botData);
      console.log('📝 Token available:', !!localStorage.getItem('intelibotx_token'));

      // ✅ DL-001: Real API endpoint, no hardcode
      // Agregar campo dca_levels que espera el backend
      const botDataWithDefaults = {
        ...botData,
        dca_levels: botData.dca_levels || 0
      };

      const response = await authenticatedFetch('/api/create-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(botDataWithDefaults)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error creating bot');
      }

      const newBot = await response.json();

      // Enhanced bot configuration
      const botConfig = {
        id: newBot.id,
        name: newBot.name,
        symbol: newBot.symbol,
        strategy: newBot.strategy,
        stake: newBot.stake,
        take_profit: newBot.take_profit,
        stop_loss: newBot.stop_loss,
        takeProfit: newBot.take_profit,
        stopLoss: newBot.stop_loss,
        riskPercentage: newBot.risk_percentage,
        exchange_id: newBot.exchange_id,
        risk_percentage: newBot.risk_percentage,
        marketType: newBot.market_type,
        market_type: newBot.market_type,
        leverage: newBot.leverage || 1,
        margin_type: newBot.margin_type || 'ISOLATED',
        interval: newBot.interval,
        base_currency: newBot.base_currency,
        quote_currency: newBot.quote_currency,
        dca_levels: newBot.dca_levels,
        cooldown_minutes: newBot.cooldown_minutes,
        max_open_positions: newBot.max_open_positions,
        entry_order_type: newBot.entry_order_type,
        exit_order_type: newBot.exit_order_type,
        tp_order_type: newBot.tp_order_type,
        sl_order_type: newBot.sl_order_type,
        trailing_stop: newBot.trailing_stop,
        status: 'PAUSED',
        enhanced_metrics: newBot.performance_metrics ? {
          user_configured_strategy: newBot.performance_metrics.user_configured_strategy,
          user_stake_amount: newBot.performance_metrics.user_stake_amount,
          user_risk_percentage: newBot.performance_metrics.user_risk_percentage,
          estimated_trades_per_day: newBot.performance_metrics.estimated_trades_per_day,
          risk_adjusted_return: newBot.performance_metrics.risk_adjusted_return
        } : null
      };

      return botConfig;
    } catch (error) {
      console.error('❌ Error creating bot:', error);
      throw error;
    }
  }, [authenticatedFetch]);

  // ✅ DL-008 COMPLIANT: Delete bot with authentication
  // ✅ SPEC_REF: BotsAdvanced.jsx.backup-dl122:389 - No validate result.success, backend only returns {message, bot_id}
  const deleteBotOperation = useCallback(async (botId, bots = []) => {
    try {
      const bot = bots.find(b => b.id === botId);
      if (!bot) {
        throw new Error('Bot not found');
      }

      // ✅ DL-017 COMPLIANT: Use deleteBot() function with authentication
      // Backend returns: {message: "🗑️ Bot X eliminado exitosamente", bot_id: N}
      // If no error thrown, deletion was successful (Status 200 OK)
      const result = await deleteBot(botId.toString());
      console.log(`✅ Bot ${bot.name} (${bot.symbol}) deleted successfully:`, result.message);

      return { success: true, botId, message: result.message };
    } catch (error) {
      console.error('❌ Error deleting bot:', error);
      throw error;
    }
  }, []);

  // ✅ DL-001 COMPLIANT: Fetch all bots with authentication
  const fetchBots = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/bots');

      if (!response.ok) {
        throw new Error('Failed to fetch bots');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching bots:', error);
      throw error;
    }
  }, [authenticatedFetch]);

  // ✅ DL-001 COMPLIANT: Update bot with authentication
  const updateBot = useCallback(async (botId, updates) => {
    try {
      const response = await authenticatedFetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error updating bot');
      }

      const updatedBot = await response.json();
      console.log(`✅ Bot ${updatedBot.name} updated successfully`);
      return updatedBot;
    } catch (error) {
      console.error('❌ Error updating bot:', error);
      throw error;
    }
  }, [authenticatedFetch]);

  return {
    createBot,
    deleteBotOperation,
    fetchBots,
    updateBot
  };
};

export default useBotCrud;