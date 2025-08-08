/**
 * Servicio para manejo de templates y configuraciones personalizadas
 */

const STORAGE_KEY = 'intelibotx_custom_templates';

/**
 * Obtiene templates personalizados del usuario desde localStorage
 */
export const getCustomTemplates = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom templates:', error);
    return [];
  }
};

/**
 * Guarda un template personalizado
 */
export const saveCustomTemplate = (template) => {
  try {
    const existingTemplates = getCustomTemplates();
    
    const newTemplate = {
      id: `custom_${Date.now()}`,
      name: template.name || 'Mi Template',
      description: template.description || 'Configuración personalizada',
      icon: template.icon || '⚙️',
      isCustom: true,
      createdAt: new Date().toISOString(),
      config: template.config
    };

    const updatedTemplates = [...existingTemplates, newTemplate];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    
    return newTemplate;
  } catch (error) {
    console.error('Error saving custom template:', error);
    throw new Error('Error al guardar template personalizado');
  }
};

/**
 * Elimina un template personalizado
 */
export const deleteCustomTemplate = (templateId) => {
  try {
    const existingTemplates = getCustomTemplates();
    const updatedTemplates = existingTemplates.filter(t => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTemplates));
    return true;
  } catch (error) {
    console.error('Error deleting custom template:', error);
    return false;
  }
};

/**
 * Actualiza un template personalizado existente
 */
export const updateCustomTemplate = (templateId, updates) => {
  try {
    const existingTemplates = getCustomTemplates();
    const templateIndex = existingTemplates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      throw new Error('Template no encontrado');
    }

    existingTemplates[templateIndex] = {
      ...existingTemplates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingTemplates));
    return existingTemplates[templateIndex];
  } catch (error) {
    console.error('Error updating custom template:', error);
    throw new Error('Error al actualizar template');
  }
};

/**
 * Crea un template a partir de la configuración actual de un bot
 */
export const createTemplateFromBot = (botConfig, templateName, templateDescription) => {
  const config = {
    strategy: botConfig.strategy,
    take_profit: botConfig.take_profit,
    stop_loss: botConfig.stop_loss,
    risk_percentage: botConfig.risk_percentage,
    leverage: botConfig.leverage,
    market_type: botConfig.market_type,
    dca_levels: botConfig.dca_levels,
    interval: botConfig.interval,
    entry_order_type: botConfig.entry_order_type || 'MARKET',
    exit_order_type: botConfig.exit_order_type || 'MARKET',
    tp_order_type: botConfig.tp_order_type || 'LIMIT',
    sl_order_type: botConfig.sl_order_type || 'STOP_MARKET',
    trailing_stop: botConfig.trailing_stop || false,
    margin_type: botConfig.margin_type || 'ISOLATED'
  };

  return saveCustomTemplate({
    name: templateName,
    description: templateDescription,
    config: config
  });
};

/**
 * Exporta todas las configuraciones del usuario
 */
export const exportTemplates = () => {
  try {
    const templates = getCustomTemplates();
    const exportData = {
      templates: templates,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intelibotx_templates_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting templates:', error);
    return false;
  }
};

/**
 * Importa configuraciones desde archivo
 */
export const importTemplates = (fileContent) => {
  try {
    const importData = JSON.parse(fileContent);
    
    if (!importData.templates || !Array.isArray(importData.templates)) {
      throw new Error('Formato de archivo inválido');
    }

    const existingTemplates = getCustomTemplates();
    const newTemplates = importData.templates.map(template => ({
      ...template,
      id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      importedAt: new Date().toISOString()
    }));

    const mergedTemplates = [...existingTemplates, ...newTemplates];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedTemplates));
    
    return newTemplates.length;
  } catch (error) {
    console.error('Error importing templates:', error);
    throw new Error('Error al importar templates. Verifica el formato del archivo.');
  }
};

/**
 * Obtiene sugerencias de configuración basadas en historial
 */
export const getConfigSuggestions = (currentConfig) => {
  // Esta función analizaría el historial de bots exitosos
  // y sugeriría mejoras a la configuración actual
  
  const suggestions = [];
  
  // Sugerencia básica de R:R ratio
  const rrRatio = currentConfig.take_profit / currentConfig.stop_loss;
  if (rrRatio < 1.5) {
    suggestions.push({
      type: 'warning',
      message: 'Considera aumentar tu R:R ratio a al menos 1.5:1 para mejor rentabilidad a largo plazo.',
      suggestion: `Aumentar TP a ${(currentConfig.stop_loss * 1.5).toFixed(1)}%`
    });
  }
  
  // Sugerencia de riesgo
  if (currentConfig.risk_percentage > 2.0) {
    suggestions.push({
      type: 'danger',
      message: 'Riesgo por operación muy alto. Se recomienda no arriesgar más del 2% por trade.',
      suggestion: 'Reducir riesgo a 1.5% o menos'
    });
  }
  
  // Sugerencia de leverage
  if (currentConfig.leverage > 10 && currentConfig.market_type.includes('FUTURES')) {
    suggestions.push({
      type: 'warning',
      message: 'Leverage alto aumenta el riesgo significativamente.',
      suggestion: 'Considera usar leverage menor a 5x para mejor control de riesgo'
    });
  }
  
  return suggestions;
};

/**
 * Calcula métricas de un template
 */
export const calculateTemplateMetrics = (template) => {
  const { config } = template;
  
  const rrRatio = config.take_profit / config.stop_loss;
  const breakEvenWinRate = (1 / (1 + rrRatio)) * 100;
  
  let riskLevel = 'Bajo';
  if (config.risk_percentage > 1.5) riskLevel = 'Alto';
  else if (config.risk_percentage > 1.0) riskLevel = 'Medio';
  
  let complexityLevel = 'Básico';
  if (config.dca_levels > 3 && config.leverage > 1) complexityLevel = 'Avanzado';
  else if (config.dca_levels > 2 || config.leverage > 1) complexityLevel = 'Intermedio';
  
  return {
    rrRatio: rrRatio.toFixed(2),
    breakEvenWinRate: breakEvenWinRate.toFixed(1),
    riskLevel,
    complexityLevel,
    potentialReturn: config.take_profit,
    maxLoss: config.stop_loss
  };
};

/**
 * Valida la configuración de un template
 */
export const validateTemplateConfig = (config) => {
  const errors = [];
  
  if (!config.take_profit || config.take_profit <= 0) {
    errors.push('Take Profit debe ser mayor a 0');
  }
  
  if (!config.stop_loss || config.stop_loss <= 0) {
    errors.push('Stop Loss debe ser mayor a 0');
  }
  
  if (config.take_profit <= config.stop_loss) {
    errors.push('Take Profit debe ser mayor que Stop Loss');
  }
  
  if (!config.strategy) {
    errors.push('Debe seleccionar una estrategia');
  }
  
  if (config.leverage && (config.leverage < 1 || config.leverage > 125)) {
    errors.push('Leverage debe estar entre 1x y 125x');
  }
  
  if (config.risk_percentage && (config.risk_percentage < 0.1 || config.risk_percentage > 10)) {
    errors.push('Porcentaje de riesgo debe estar entre 0.1% y 10%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};