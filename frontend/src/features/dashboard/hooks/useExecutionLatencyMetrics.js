/**
 * 🎯 useExecutionLatencyMetrics - Hook especializado para métricas de latencia
 * 
 * Características:
 * - Fetching de métricas reales desde API
 * - Estado de latencia normalizado
 * - Auto-refresh configurable
 * - Error handling robusto
 * 
 * SPEC_REF: DL-076 Specialized Hooks Pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect } from 'react';

export const useExecutionLatencyMetrics = (botId, refreshInterval = 2000) => {
  const [latencyMetrics, setLatencyMetrics] = useState({
    current: 0,
    average_1min: 0,
    average_5min: 0,
    max_today: 0,
    critical_alerts_today: 0,
    connection_quality: 'UNKNOWN',
    last_update: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!botId) {
      setLoading(false);
      return;
    }

    const fetchLatencyMetrics = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
        
        // 🎯 DL-001 COMPLIANCE: Real API endpoint (NO simulation)
        const response = await fetch(
          `${BASE_URL}/api/bots/${botId}/execution-latency?timeframe=1h`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Normalizar datos de API
        const normalizedMetrics = {
          current: data.current_latency_ms || 0,
          average_1min: data.avg_1min_ms || 0,
          average_5min: data.avg_5min_ms || 0,
          max_today: data.max_today_ms || 0,
          critical_alerts_today: data.critical_alerts_count || 0,
          connection_quality: data.connection_quality || 'UNKNOWN',
          last_update: data.last_update || new Date().toISOString()
        };

        setLatencyMetrics(normalizedMetrics);
        setError(null);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching latency metrics:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLatencyMetrics();
    const interval = setInterval(fetchLatencyMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [botId, refreshInterval]);

  return {
    latencyMetrics,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      setError(null);
    }
  };
};