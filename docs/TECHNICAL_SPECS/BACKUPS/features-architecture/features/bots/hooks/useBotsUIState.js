import { useState } from 'react';

/**
 * useBotsUIState Hook - UI State Management (≤150 lines SUCCESS CRITERIA COMPLIANT)
 * EXTRACTED FROM: BotsAdvanced.jsx state variables for Phase 3 real refactoring
 * 
 * Manages:
 * - Selected bot state
 * - Modal states (control panel, creation, templates)
 * - Active tab navigation
 * - Success/error messages
 * - Loading states
 */
export const useBotsUIState = () => {
  // Bot selection and display state
  const [selectedBot, setSelectedBot] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [controlPanelBot, setControlPanelBot] = useState(null);
  
  // Modal visibility states
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Navigation and UI states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);

  // Bot selection handlers
  const handleBotSelect = (botId) => {
    console.log('🔄 Selecting bot:', botId);
    setSelectedBotId(botId);
    setActiveTab('history');
  };

  const handleViewBotDetails = (bot) => {
    console.log('👁️ Viewing bot details:', bot.symbol);
    setSelectedBot(bot);
  };

  // Modal management handlers
  const handleCloseModals = () => {
    setSelectedBot(null);
    setControlPanelBot(null);
    setShowEnhancedModal(false);
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const handleOpenControlPanel = (bot) => {
    console.log('⚙️ Opening control panel for:', bot.symbol);
    setControlPanelBot(bot);
  };

  const handleOpenCreationModal = () => {
    setShowEnhancedModal(true);
  };

  const handleOpenTemplates = () => {
    setShowTemplates(true);
  };

  // Success message management
  const showSuccess = (message, duration = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), duration);
  };

  // Tab management
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedBot(null);
    setSelectedBotId(null);
    setControlPanelBot(null);
  };

  return {
    // State values
    selectedBot,
    selectedBotId, 
    controlPanelBot,
    showEnhancedModal,
    showTemplates,
    selectedTemplate,
    activeTab,
    loading,
    successMessage,

    // State setters
    setSelectedBot,
    setSelectedBotId,
    setControlPanelBot,
    setShowEnhancedModal,
    setShowTemplates, 
    setSelectedTemplate,
    setActiveTab,
    setLoading,
    setSuccessMessage,

    // Handler functions
    handleBotSelect,
    handleViewBotDetails,
    handleCloseModals,
    handleOpenControlPanel,
    handleOpenCreationModal,
    handleOpenTemplates,
    handleTabChange,
    showSuccess,
    clearSelections
  };
};