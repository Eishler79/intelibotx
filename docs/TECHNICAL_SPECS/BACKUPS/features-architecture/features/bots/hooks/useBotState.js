import { useState, useRef } from 'react';

export const useBotState = () => {
  // Core State Management
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State Management
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);

  // Additional State (from BotsAdvanced.jsx)
  const [controlPanelBot, setControlPanelBot] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Trading intervals management
  const botIntervals = useRef({});

  return {
    // State
    bots,
    setBots,
    selectedBot,
    setSelectedBot,
    loading,
    setLoading,
    error,
    setError,

    // UI State
    showCreateModal,
    setShowCreateModal,
    showControlPanel,
    setShowControlPanel,
    
    // Extended State
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
    
    // Intervals
    botIntervals
  };
};