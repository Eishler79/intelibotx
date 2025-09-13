/**
 * 🚨 useLatencyAlerts - Hook especializado para alertas de latencia crítica
 * 
 * Características:
 * - Gestión de alertas automáticas
 * - Auto-dismiss temporal
 * - Notificaciones críticas
 * 
 * SPEC_REF: DL-076 Specialized Hooks Pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect } from 'react';

export const useLatencyAlerts = (currentLatency, threshold = 100) => {
  const [alertActive, setAlertActive] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);

  useEffect(() => {
    if (currentLatency > threshold) {
      const alertData = {
        timestamp: Date.now(),
        latency: currentLatency,
        severity: currentLatency > 150 ? 'CRITICAL' : 'WARNING'
      };

      setAlertActive(true);
      setAlertHistory(prev => [...prev, alertData].slice(-10)); // Last 10 alerts
      
      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        setAlertActive(false);
      }, 5000);

      return () => clearTimeout(dismissTimer);
    }
  }, [currentLatency, threshold]);

  const dismissAlert = () => {
    setAlertActive(false);
  };

  const clearAlertHistory = () => {
    setAlertHistory([]);
  };

  return {
    alertActive,
    alertHistory,
    dismissAlert,
    clearAlertHistory
  };
};