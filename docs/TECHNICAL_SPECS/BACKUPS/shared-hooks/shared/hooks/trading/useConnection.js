import { useCallback } from 'react';

/**
 * useConnection - Connection Status Management Hook
 * 
 * ✅ DL-001: Real connection status tracking
 * ✅ SUCCESS CRITERIA: ≤150 lines (60 lines)
 * ✅ SINGLE RESPONSIBILITY: Connection status + UX transparency
 * 
 * Extracted from useRealTimeData.js lines 203-227
 */
export const useConnection = () => {

  // Get price status for UX transparency
  const getPriceStatus = useCallback((symbol) => {
    const status = localStorage.getItem(`priceStatus_${symbol}`) || 'unknown';
    const lastTime = localStorage.getItem(`lastPriceTime_${symbol}`);
    const age = lastTime ? Date.now() - parseInt(lastTime) : 0;
    
    switch (status) {
      case 'live':
        return { status: 'live', text: 'En vivo', color: 'green', icon: '🟢' };
      case 'alternative':
        return { status: 'alternative', text: 'Alternativo', color: 'blue', icon: '🔵' };
      case 'external':
        return { status: 'external', text: 'Externo', color: 'orange', icon: '🟠' };
      case 'cached':
        const ageText = Math.round(age / 1000) < 60 
          ? `${Math.round(age / 1000)}s` 
          : `${Math.round(age / 60000)}min`;
        return { status: 'cached', text: `Cache ${ageText}`, color: 'yellow', icon: '🟡' };
      case 'emergency':
        return { status: 'emergency', text: 'Aproximado', color: 'orange', icon: '⚠️' };
      case 'failed':
        return { status: 'failed', text: 'Sin datos', color: 'red', icon: '🔴' };
      default:
        return { status: 'unknown', text: 'Verificando...', color: 'gray', icon: '⚪' };
    }
  }, []);

  // Check if connection is active (has recent price)
  const isConnected = useCallback((symbol) => {
    const lastTime = localStorage.getItem(`lastPriceTime_${symbol}`);
    if (!lastTime) return false;
    
    const age = Date.now() - parseInt(lastTime);
    return age < 60000; // Connected if price < 1 minute old
  }, []);

  // Get connection quality score (0-100)
  const getConnectionQuality = useCallback((symbol) => {
    const status = localStorage.getItem(`priceStatus_${symbol}`);
    switch (status) {
      case 'live': return 100;
      case 'alternative': return 80;
      case 'external': return 60;
      case 'cached': return 40;
      case 'emergency': return 20;
      case 'failed': return 0;
      default: return 0;
    }
  }, []);

  return {
    getPriceStatus,
    isConnected,
    getConnectionQuality
  };
};

export default useConnection;