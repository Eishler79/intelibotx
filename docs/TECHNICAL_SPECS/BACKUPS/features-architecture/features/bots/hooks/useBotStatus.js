import { useCallback } from 'react';
import { useAuthDL008 } from "../../shared/hooks/useAuthDL008";

/**
 * useBotStatus Hook - Bot Status Management
 * 
 * Extracted from useBotOperations.js for SUCCESS CRITERIA compliance
 * Handles bot status toggle operations (RUNNING/PAUSED)
 * 
 * ✅ DL-001: Real API data only
 * ✅ DL-008: JWT authentication pattern
 * ✅ SUCCESS CRITERIA: ≤150 lines
 */
export const useBotStatus = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { getAuthHeaders } = useAuthDL008();

  // Toggle bot status with backend synchronization
  const toggleBotStatus = useCallback(async (botId, currentStatus, bots = []) => {
    try {
      const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      const bot = bots.find(b => b.id === botId);
      
      if (!bot) {
        throw new Error('Bot not found');
      }

      // Call backend to change real status
      const endpoint = newStatus === 'RUNNING' ? 'start' : 'pause';
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      const response = await fetch(`${BASE_URL}/api/bots/${botId}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} bot`);
      }

      const result = await response.json();
      
      if (newStatus === 'RUNNING') {
        console.log(`🚀 ${result.message}`);
      } else {
        console.log(`⏸️ ${result.message}`);
      }

      return { success: true, newStatus, message: result.message };
      
    } catch (error) {
      console.error(`❌ Error changing bot status:`, error);
      throw error;
    }
  }, [getAuthHeaders]);

  // Get bot status display info
  const getBotStatusInfo = useCallback((bot) => {
    if (!bot) return { status: 'UNKNOWN', color: 'gray' };

    const status = bot.status || 'PAUSED';
    
    const statusInfo = {
      'RUNNING': { status: 'RUNNING', color: 'green', icon: '🟢' },
      'PAUSED': { status: 'PAUSED', color: 'yellow', icon: '🟡' },
      'STOPPED': { status: 'STOPPED', color: 'red', icon: '🔴' },
      'ERROR': { status: 'ERROR', color: 'red', icon: '❌' }
    };

    return statusInfo[status] || statusInfo['PAUSED'];
  }, []);

  // Check if bot can be toggled
  const canToggleStatus = useCallback((bot) => {
    if (!bot) return false;
    
    // Bot can be toggled if not in error state
    return bot.status !== 'ERROR';
  }, []);

  return {
    toggleBotStatus,
    getBotStatusInfo,
    canToggleStatus
  };
};

export default useBotStatus;