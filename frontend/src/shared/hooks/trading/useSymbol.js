import { useState, useCallback } from 'react';
// DL-076 COMPLIANCE: Direct hooks, no wrapper context
import useAuthenticatedFetch from '../../../features/auth/hooks/useAuthenticatedFetch';

/**
 * useSymbol - Symbol Information & Validation Hook
 * 
 * ✅ DL-001: Real exchange symbol data
 * ✅ SUCCESS CRITERIA: ≤150 lines (70 lines)
 * ✅ SINGLE RESPONSIBILITY: Symbol validation + precision limits
 * ✅ DL-008: JWT authentication pattern
 * 
 * Extracted from useRealTimeData.js lines 271-294
 */
export const useSymbol = (exchangeId, symbol) => {
  const [symbolInfo, setSymbolInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // ✅ Direct hook composition - no wrapper context
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Fetch symbol information from exchange
  const fetchSymbolInfo = useCallback(async () => {
    if (!exchangeId || !symbol) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/exchanges/${exchangeId}/symbol-info/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setSymbolInfo(data);
        setError(null);
      } else {
        throw new Error('Error fetching symbol info');
      }
    } catch (err) {
      setError(err.message);
      setSymbolInfo(null);
    } finally {
      setLoading(false);
    }
  }, [exchangeId, symbol, authenticatedFetch]);

  // Check if symbol is available for trading
  const isSymbolAvailable = useCallback(() => {
    if (!symbolInfo) return true; // Assume available if no info
    return symbolInfo.status === 'TRADING' || symbolInfo.active;
  }, [symbolInfo]);

  // Get precision limits for the symbol
  const getPrecisionLimits = useCallback(() => {
    if (symbolInfo) {
      return {
        price: symbolInfo.pricePrecision || 8,
        quantity: symbolInfo.quantityPrecision || 8,
        minQuantity: parseFloat(symbolInfo.minQuantity || 0),
        minNotional: parseFloat(symbolInfo.minNotional || 0)
      };
    }
    
    // Default values when no symbol info available
    return {
      price: 8,
      quantity: 8,
      minQuantity: 0.001,
      minNotional: 10
    };
  }, [symbolInfo]);

  return {
    symbolInfo,
    loading,
    error,
    fetchSymbolInfo,
    isSymbolAvailable,
    getPrecisionLimits
  };
};

export default useSymbol;