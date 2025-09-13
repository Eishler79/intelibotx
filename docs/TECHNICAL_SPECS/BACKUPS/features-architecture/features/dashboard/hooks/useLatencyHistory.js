/**
 * 📊 useLatencyHistory - Hook especializado para historial de latencias
 * 
 * Características:
 * - Tracking temporal de latencias
 * - Datos para visualización
 * - Estadísticas derivadas
 * 
 * SPEC_REF: DL-076 Specialized Hooks Pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect } from 'react';

export const useLatencyHistory = (currentLatency, maxPoints = 50) => {
  const [latencyHistory, setLatencyHistory] = useState([]);

  useEffect(() => {
    if (currentLatency > 0) {
      setLatencyHistory(prev => {
        const newHistory = [...prev, {
          timestamp: Date.now(),
          latency: currentLatency
        }];
        return newHistory.slice(-maxPoints);
      });
    }
  }, [currentLatency, maxPoints]);

  // Estadísticas derivadas
  const stats = {
    min: latencyHistory.length > 0 ? Math.min(...latencyHistory.map(h => h.latency)) : 0,
    max: latencyHistory.length > 0 ? Math.max(...latencyHistory.map(h => h.latency)) : 0,
    average: latencyHistory.length > 0 ? 
      latencyHistory.reduce((acc, h) => acc + h.latency, 0) / latencyHistory.length : 0,
    total_points: latencyHistory.length
  };

  const clearHistory = () => {
    setLatencyHistory([]);
  };

  return {
    latencyHistory,
    stats,
    clearHistory
  };
};