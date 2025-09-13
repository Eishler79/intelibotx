import React, { createContext, useContext, useEffect } from 'react';
import { useBotState } from '../../features/bots/hooks/useBotState';
import { useBotOperations } from '../../features/bots/hooks/useBotOperations';
import { useBotMetrics } from '../../features/bots/hooks/useBotMetrics';

const BotManagementContext = createContext(null);

export const useBotManagement = () => {
  const context = useContext(BotManagementContext);
  if (!context) {
    throw new Error('useBotManagement must be used within a BotManagementProvider');
  }
  return context;
};

export const BotManagementProvider = ({ children }) => {
  // Modular hooks
  const botState = useBotState();
  const botOperations = useBotOperations();
  const botMetrics = useBotMetrics();

  // Destructure state
  const {
    bots, setBots, selectedBot, setSelectedBot, loading, setLoading, error, setError,
    showCreateModal, setShowCreateModal, showControlPanel, setShowControlPanel,
    controlPanelBot, setControlPanelBot, showTemplates, setShowTemplates,
    selectedTemplate, setSelectedTemplate, activeTab, setActiveTab,
    selectedBotId, setSelectedBotId, successMessage, setSuccessMessage,
    botIntervals
  } = botState;

  // Wrapped operations with state
  const wrappedFetchBots = async () => {
    return botOperations.fetchBots(selectedBotId, setBots, setLoading, setError);
  };

  const wrappedCreateBot = async (botData) => {
    return botOperations.createBot(botData, setBots, setShowCreateModal, setSuccessMessage, setLoading, setError);
  };

  const wrappedUpdateBot = async (botId, updates) => {
    return botOperations.updateBot(botId, updates, setBots, setError);
  };

  const wrappedDeleteBot = async (botId) => {
    return botOperations.deleteBot(botId, bots, setBots, selectedBotId, setSelectedBotId, setSelectedBot, controlPanelBot, setControlPanelBot, setShowControlPanel, setError);
  };

  const wrappedToggleBotStatus = async (botId, newStatus) => {
    return botOperations.toggleBotStatus(botId, newStatus, bots, setBots, setError);
  };

  const wrappedUpdateBotMetrics = async (botId) => {
    return botMetrics.updateBotMetrics(botId, setBots);
  };

  // Load initial data
  useEffect(() => {
    wrappedFetchBots();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Context value with interface as specified
  const contextValue = {
    // State
    bots,
    selectedBot,
    loading,
    error,

    // Actions
    fetchBots: wrappedFetchBots,
    createBot: wrappedCreateBot,
    updateBot: wrappedUpdateBot,
    deleteBot: wrappedDeleteBot,
    toggleBotStatus: wrappedToggleBotStatus,

    // UI State
    showCreateModal,
    showControlPanel,
    setShowCreateModal,
    setShowControlPanel,

    // Extended State (from BotsAdvanced.jsx)
    controlPanelBot,
    setControlPanelBot,
    showTemplates,
    setShowTemplates,
    selectedTemplate,
    setSelectedTemplate,
    activeTab,
    setActiveTab,
    selectedBotId,
    setSelectedBotId,
    successMessage,
    setSuccessMessage,

    // Metrics Management
    loadRealBotMetrics: botMetrics.loadRealBotMetrics,
    getRealBotMetrics: botMetrics.getRealBotMetrics,
    updateBotMetrics: wrappedUpdateBotMetrics,
    botIntervals
  };

  return (
    <BotManagementContext.Provider value={contextValue}>
      {children}
    </BotManagementContext.Provider>
  );
};