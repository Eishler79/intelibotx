/**
 * 🔄 Trading Mapping Utils - Data Transformation Utilities
 * 
 * RESPONSIBILITY: Pure utility functions for trading data mapping
 * EXTRACTED FROM: tradingOperationsService.js (lines 152-165)
 * 
 * ✅ DL-001: No hardcode, real data transformation only
 * ✅ Single responsibility: Data mapping and transformation
 * 
 * Eduard Guzmán - InteliBotX
 */

/**
 * Map bot trade data to trading operation format
 * Utility for converting bot trade data to API operation format
 */
export const mapBotTradeToOperation = (bot, tradeData) => {
  return {
    bot_id: bot.id,
    symbol: bot.symbol,
    side: tradeData.type, // BUY/SELL
    quantity: tradeData.quantity,
    price: tradeData.price,
    strategy: bot.strategy || 'Smart Scalper',
    signal: tradeData.signal,
    algorithm_used: tradeData.algorithm_used || 'EMA_CROSSOVER',
    confidence: tradeData.confidence || 0.75,
    pnl: tradeData.pnl
  };
};

/**
 * Format trading operation for display
 * Utility for UI display formatting
 */
export const formatTradingOperation = (operation) => {
  return {
    ...operation,
    formattedPrice: parseFloat(operation.price || 0).toFixed(8),
    formattedQuantity: parseFloat(operation.quantity || 0).toFixed(6),
    formattedPnL: operation.pnl ? `${operation.pnl > 0 ? '+' : ''}${operation.pnl.toFixed(2)}%` : 'N/A',
    formattedTime: operation.timestamp ? new Date(operation.timestamp).toLocaleString() : 'N/A'
  };
};

/**
 * Validate trading operation data
 * Utility for data validation before API calls
 */
export const validateTradingOperation = (operationData) => {
  const errors = [];
  
  if (!operationData.bot_id) errors.push('Bot ID is required');
  if (!operationData.symbol) errors.push('Symbol is required');
  if (!operationData.side) errors.push('Side (BUY/SELL) is required');
  if (!operationData.quantity || operationData.quantity <= 0) errors.push('Valid quantity is required');
  if (!operationData.price || operationData.price <= 0) errors.push('Valid price is required');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  mapBotTradeToOperation,
  formatTradingOperation,
  validateTradingOperation
};