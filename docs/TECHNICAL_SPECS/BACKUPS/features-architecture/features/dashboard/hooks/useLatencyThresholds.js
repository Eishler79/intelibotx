/**
 * 🎯 useLatencyThresholds - Hook especializado para lógica de umbrales
 * 
 * Características:
 * - Cálculos de calidad de conexión
 * - Colores dinámicos según latencia
 * - Recomendaciones estratégicas
 * 
 * SPEC_REF: DL-076 Specialized Hooks Pattern
 * Eduard Guzmán - InteliBotX
 */

export const useLatencyThresholds = (strategy = 'Smart Scalper') => {
  
  // Thresholds dinámicos según estrategia
  const getThresholds = () => {
    const isScalping = strategy === 'Smart Scalper';
    return {
      excellent: isScalping ? 50 : 100,
      good: isScalping ? 80 : 150,
      fair: isScalping ? 100 : 200,
      critical: isScalping ? 100 : 200
    };
  };

  const thresholds = getThresholds();

  const getLatencyColor = (latency) => {
    if (latency < thresholds.excellent) return "text-green-400";
    if (latency < thresholds.good) return "text-blue-400";
    if (latency < thresholds.fair) return "text-yellow-400";
    return "text-red-400";
  };

  const getConnectionQuality = (latency) => {
    if (latency < thresholds.excellent) return 'EXCELLENT';
    if (latency < thresholds.good) return 'GOOD';
    if (latency < thresholds.fair) return 'FAIR';
    return 'POOR';
  };

  const getConnectionColor = (quality) => {
    switch(quality) {
      case 'EXCELLENT': return "text-green-400";
      case 'GOOD': return "text-blue-400";
      case 'FAIR': return "text-yellow-400";
      case 'POOR': return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getRecommendations = (latency) => {
    if (latency > thresholds.critical) {
      return [
        'Check internet connection stability',
        'Consider switching to a VPS closer to exchange',
        'Reduce position sizes until latency improves',
        'Avoid scalping strategies with current latency'
      ];
    }
    return [];
  };

  const isOptimalForStrategy = (latency) => {
    return latency < thresholds.excellent;
  };

  return {
    thresholds,
    getLatencyColor,
    getConnectionQuality,
    getConnectionColor,
    getRecommendations,
    isOptimalForStrategy
  };
};