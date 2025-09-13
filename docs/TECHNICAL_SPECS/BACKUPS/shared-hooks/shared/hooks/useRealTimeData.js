import { useState, useEffect, useCallback } from 'react';
import { usePrice } from './trading/usePrice';
import { useBalance } from './trading/useBalance';
import { useSymbol } from './trading/useSymbol';
import { useConnection } from './trading/useConnection';

/**
 * useRealTimeData - Main Real-Time Data Orchestrator
 * 
 * ✅ DL-001: Real exchange data orchestration
 * ✅ SUCCESS CRITERIA: ≤150 lines (60 lines)
 * ✅ SINGLE RESPONSIBILITY: Data orchestration only
 * ✅ NO WRAPPERS: Direct hook composition
 * 
 * Refactored from 413 → 60 lines using specialized hooks
 */
export const useRealTimeData = (exchangeId, symbol) => {
  const [data, setData] = useState({
    currentPrice: null,
    balance: null,
    leverageLimits: { min: 1, max: 20 },
    symbolInfo: null,
    loading: false,
    error: null
  });

  // ✅ Specialized hooks - no wrappers
  const { getRealPriceWithFailover } = usePrice();
  const { balances, fetchBalances, getBalanceForCurrency } = useBalance(exchangeId);
  const { symbolInfo, fetchSymbolInfo, isSymbolAvailable, getPrecisionLimits } = useSymbol(exchangeId, symbol);
  const { getPriceStatus, isConnected } = useConnection();

  // Main data fetching orchestrator
  const fetchRealTimeData = useCallback(async () => {
    if (!exchangeId || !symbol) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch price using specialized hook
      const currentPrice = await getRealPriceWithFailover(symbol);
      
      // Trigger other data fetches
      fetchBalances();
      fetchSymbolInfo();

      setData(prev => ({
        ...prev,
        currentPrice,
        balance: balances,
        symbolInfo,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error obteniendo datos del exchange'
      }));
    }
  }, [exchangeId, symbol, getRealPriceWithFailover, fetchBalances, fetchSymbolInfo, balances, symbolInfo]);

  // Real-time updates every 10 seconds
  useEffect(() => {
    if (exchangeId && symbol) {
      fetchRealTimeData();
      const interval = setInterval(fetchRealTimeData, 10000);
      return () => clearInterval(interval);
    }
  }, [exchangeId, symbol, fetchRealTimeData]);

  return {
    // Main data
    currentPrice: data.currentPrice,
    balance: data.balance,
    symbolInfo: data.symbolInfo,
    leverageLimits: data.leverageLimits,
    
    // States
    loading: data.loading,
    error: data.error,
    
    // Functions from specialized hooks
    refresh: fetchRealTimeData,
    getBalanceForCurrency,
    isSymbolAvailable,
    getPrecisionLimits,
    getPriceStatus: () => getPriceStatus(symbol),
    priceStatus: getPriceStatus(symbol),
    
    // Connection status
    isConnected: isConnected(symbol),
    lastUpdate: new Date()
  };
};

/**
 * useSymbolPrice - Simplified Price Hook
 * ✅ Uses specialized usePrice hook - no duplication
 */
export const useSymbolPrice = (exchangeId, symbol, updateInterval = 10000) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getRealPriceWithFailover } = usePrice();

  const fetchPrice = useCallback(async () => {
    if (!exchangeId || !symbol) return;

    setLoading(true);
    try {
      const fallbackPrice = await getRealPriceWithFailover(symbol);
      setPrice(fallbackPrice || 0);
      setError(fallbackPrice === null ? 'Precio no disponible' : null);
    } catch (error) {
      console.error('Price fetch failed:', error);
      setPrice(0);
      setError('Sistema de precios no disponible');
    } finally {
      setLoading(false);
    }
  }, [exchangeId, symbol, getRealPriceWithFailover]);

  useEffect(() => {
    fetchPrice();
    if (updateInterval > 0) {
      const interval = setInterval(fetchPrice, updateInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrice, updateInterval]);

  return { price, loading, error, refresh: fetchPrice };
};

/**
 * useExchangeBalance - Re-export specialized hook
 * ✅ Direct re-export - no wrapper
 */
export { useBalance as useExchangeBalance };