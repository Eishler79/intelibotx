import { useCallback } from 'react';
import { deleteBot, updateBot } from '../../../services/api';

/**
 * useBotEventHandlers Hook - Bot Event Handlers (≤150 lines SUCCESS CRITERIA COMPLIANT)
 * EXTRACTED FROM: BotsAdvanced.jsx event handler functions for Phase 3 real refactoring
 * 
 * Manages:
 * - Bot deletion operations
 * - Bot status toggle operations
 * - Bot update operations
 * - Event handler callbacks for UI actions
 */
export const useBotEventHandlers = ({ bots, setBots, showSuccess, setControlPanelBot }) => {
  
  // Handle bot deletion with confirmation
  const handleDeleteBot = useCallback(async (botId) => {
    try {
      // Find bot before deletion
      const bot = bots.find(b => b.id === botId);
      if (!bot) {
        console.log('Bot not found in local list');
        return;
      }

      // Confirm deletion
      const confirmed = confirm(`¿Eliminar bot ${bot.symbol || 'N/A'}?`);
      if (!confirmed) return;

      // Delete bot from backend
      await deleteBot(botId.toString());
      console.log('✅ Bot deleted from server');
      
      // Update local state
      setBots(prevBots => prevBots.filter(b => b.id !== botId));
      
      // Show success message
      showSuccess(`🗑️ Bot ${bot.symbol} eliminado exitosamente`);
      
      console.log(`🗑️ Bot ${bot.symbol} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting bot:', error);
      
      // Handle specific authentication errors
      if (error.message.includes('Authentication required')) {
        showSuccess('⚠️ Sesión expirada. Por favor inicia sesión nuevamente.');
      } else {
        showSuccess(`❌ Error eliminando bot: ${error.message}`);
      }
    }
  }, [bots, setBots, showSuccess]);

  // Handle bot status toggle (start/pause)
  const handleToggleBotStatus = useCallback(async (botId, currentStatus) => {
    try {
      console.log('🔄 Changing bot status:', botId, 'from', currentStatus);
      
      const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      const bot = bots.find(b => b.id === botId);
      
      if (!bot) {
        throw new Error('Bot not found');
      }

      // Call backend to change status
      const endpoint = newStatus === 'RUNNING' ? 'start' : 'pause';
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      const token = localStorage.getItem('intelibotx_token');
      const response = await fetch(`${BASE_URL}/api/bots/${botId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${endpoint}ing bot`);
      }

      const result = await response.json();
      console.log(`✅ Bot ${botId} ${endpoint}ed successfully:`, result);

      // Update local bot status
      setBots(prevBots => 
        prevBots.map(b => 
          b.id === botId ? { ...b, status: newStatus } : b
        )
      );

      // Show success message
      const action = newStatus === 'RUNNING' ? 'iniciado' : 'pausado';
      showSuccess(`✅ Bot ${bot.symbol} ${action} exitosamente`);

    } catch (error) {
      console.error(`❌ Error updating bot ${botId} status:`, error);
      showSuccess(`❌ Error cambiando estado del bot: ${error.message}`);
    }
  }, [bots, setBots, showSuccess]);

  // Handle bot update operations
  const handleUpdateBot = useCallback(async (botId, updates) => {
    try {
      // Update bot in backend
      const response = await updateBot(botId.toString(), updates);
      console.log('✅ Bot updated successfully in backend:', response);
      
      // Update local state
      setBots(prevBots => 
        prevBots.map(b => 
          b.id === botId ? { ...b, ...updates } : b
        )
      );

      // Close control panel
      setControlPanelBot(null);
      
      // Show success message
      showSuccess(`✅ Bot actualizado exitosamente`);
      
      return { success: true, updates };
    } catch (error) {
      console.error('❌ Error updating bot:', error);
      showSuccess(`❌ Error actualizando bot: ${error.message}`);
      throw error;
    }
  }, [setBots, setControlPanelBot, showSuccess]);

  // Handle bot control panel close
  const handleCloseControlPanel = useCallback(() => {
    setControlPanelBot(null);
  }, [setControlPanelBot]);

  return {
    handleDeleteBot,
    handleToggleBotStatus, 
    handleUpdateBot,
    handleCloseControlPanel
  };
};