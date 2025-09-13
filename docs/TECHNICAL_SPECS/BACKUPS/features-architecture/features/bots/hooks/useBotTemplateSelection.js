/**
 * 🎯 useBotTemplateSelection - Hook especializado para selección de templates Bot Único
 * 
 * Características:
 * - Estado de selección de template
 * - Lógica de aplicación de configuración inicial
 * - Validación de template selection
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState } from 'react';

export const useBotTemplateSelection = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const clearSelection = () => {
    setSelectedTemplate(null);
  };

  const applyTemplate = (onApply) => {
    if (selectedTemplate && onApply) {
      // Transform Bot Único template to expected format for backwards compatibility
      const compatibleTemplate = {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        icon: selectedTemplate.icon,
        // Map Bot Único initial_config to legacy config format for existing integrations
        config: {
          strategy: 'Bot Único Adaptativo', // Always Bot Único
          initial_capital_allocation: selectedTemplate.initial_config.initial_capital_allocation,
          risk_tolerance: selectedTemplate.initial_config.risk_tolerance,
          preferred_operational_modes: selectedTemplate.initial_config.preferred_modes,
          max_concurrent_trades: selectedTemplate.initial_config.max_concurrent_trades,
          // Legacy compatibility fields (will be ignored by Bot Único)
          take_profit: 'ADAPTIVE', 
          stop_loss: 'ADAPTIVE',
          leverage: 'DYNAMIC'
        },
        // Additional Bot Único metadata
        bot_unique_config: selectedTemplate.initial_config,
        performance_metrics: selectedTemplate.performance_metrics
      };
      
      onApply(compatibleTemplate);
      clearSelection();
    }
  };

  return {
    selectedTemplate,
    selectTemplate,
    clearSelection,
    applyTemplate
  };
};