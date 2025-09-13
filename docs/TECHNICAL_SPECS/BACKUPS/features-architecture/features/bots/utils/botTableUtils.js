/**
 * Bot Table Utility Functions
 * SUCCESS CRITERIA COMPLIANT: Extracted from BotTableRow.jsx for ≤150 lines compliance
 */

// PnL formatting helper
export const formatPnL = (bot) => {
  const pnl = bot.metrics?.realizedPnL || 0;
  const color = pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const formatted = `${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toLocaleString()}`;
  return { value: pnl, color, formatted };
};

// Input validation helper
export const validateBot = (bot, index) => {
  if (!bot || !bot.id) {
    console.warn(`Bot inválido en index ${index}:`, bot);
    return false;
  }
  return true;
};