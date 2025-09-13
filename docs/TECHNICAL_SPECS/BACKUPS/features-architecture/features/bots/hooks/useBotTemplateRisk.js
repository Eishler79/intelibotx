/**
 * 📊 useBotTemplateRisk - Hook especializado para análisis de riesgo Bot Único templates
 * 
 * Características:
 * - Cálculo de niveles de riesgo para Bot Único
 * - Colores y badges dinámicos
 * - Risk assessment basado en configuración inicial
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

export const useBotTemplateRisk = () => {
  
  const getRiskLevel = (template) => {
    if (!template?.initial_config) {
      return { level: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }

    const { risk_tolerance, initial_capital_allocation, max_concurrent_trades } = template.initial_config;
    
    // Bot Único risk calculation based on initial configuration
    let riskScore = 0;
    
    // Risk tolerance factor
    if (risk_tolerance === 'LOW') riskScore += 1;
    else if (risk_tolerance === 'MEDIUM') riskScore += 2;
    else if (risk_tolerance === 'HIGH') riskScore += 3;
    
    // Capital allocation factor
    if (initial_capital_allocation <= 0.5) riskScore += 1;
    else if (initial_capital_allocation <= 0.8) riskScore += 2;
    else riskScore += 3;
    
    // Concurrent trades factor
    if (max_concurrent_trades <= 2) riskScore += 1;
    else if (max_concurrent_trades <= 5) riskScore += 2;
    else riskScore += 3;

    // Calculate final risk level (scale 3-9)
    if (riskScore <= 4) {
      return { 
        level: 'Bajo', 
        color: 'text-green-400', 
        bg: 'bg-green-500/20',
        description: 'Configuración conservadora, Bot Único adaptará según mercado'
      };
    } else if (riskScore <= 6) {
      return { 
        level: 'Medio', 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20',
        description: 'Configuración balanceada, Bot Único usará todos los modos'
      };
    } else {
      return { 
        level: 'Alto', 
        color: 'text-red-400', 
        bg: 'bg-red-500/20',
        description: 'Configuración agresiva, Bot Único priorizará oportunidades institucionales'
      };
    }
  };

  const getOperationalModesDisplay = (preferredModes) => {
    if (!preferredModes || preferredModes.length === 0) {
      return 'Todos los modos';
    }
    
    const modeNames = {
      'SCALPING_MODE': 'Scalping',
      'TREND_FOLLOWING_MODE': 'Tendencias',
      'ANTI_MANIPULATION_MODE': 'Anti-Manipulación',
      'NEWS_SENTIMENT_MODE': 'Noticias',
      'VOLATILITY_ADAPTIVE_MODE': 'Volatilidad'
    };
    
    if (preferredModes.includes('ALL_MODES') || preferredModes.length >= 4) {
      return 'Todos los modos';
    }
    
    return preferredModes.map(mode => modeNames[mode] || mode).join(', ');
  };

  return {
    getRiskLevel,
    getOperationalModesDisplay
  };
};