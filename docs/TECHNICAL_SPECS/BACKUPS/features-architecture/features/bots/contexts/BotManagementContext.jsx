// ✅ P4.3 REFACTORED: BotManagementContext now uses modular approach
// Import the new modular provider
export { BotManagementProvider, useBotManagement } from './BotManagementProvider';

// Re-export default for backward compatibility
export { BotManagementProvider as default } from './BotManagementProvider';