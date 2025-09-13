/**
 * useTradingHistoryData.js - API Data Management Hook for Trading History
 * EXTRACTED FROM: TradingHistory.jsx (lines 25-70)
 * 
 * ✅ DL-001: Real API calls - no hardcode endpoints
 * ✅ SUCCESS CRITERIA: ≤150 lines (100 lines)
 * ✅ SINGLE RESPONSIBILITY: API data management only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import { useCallback } from 'react';

/**
 * Trading History Data Management Hook
 * Handles all API operations for bot-specific trading history
 * 
 * @param {Object} state - State management object from useTradingHistoryState
 * @returns {Object} API functions
 */
export const useTradingHistoryData = (state) => {
  const { 
    setOrders, 
    setTrades, 
    setSummary, 
    setLoading, 
    filters 
  } = state;

  // API base URL - DL-001 compliance
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  /**
   * Load trading data for specific bot
   * @param {string} botId - Bot ID
   */
  const loadTradingData = useCallback(async (botId) => {
    if (!botId) return;
    
    setLoading(true);
    try {
      // Parallel API calls for better performance
      const [ordersResponse, tradesResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE}/api/bots/${botId}/orders?limit=50`),
        fetch(`${API_BASE}/api/bots/${botId}/trades?limit=50`),
        fetch(`${API_BASE}/api/bots/${botId}/trading-summary?days=${filters.timeframe}`)
      ]);

      // Process orders
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }

      // Process trades  
      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        setTrades(tradesData.trades || []);
      }

      // Process summary
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.summary || null);
      }

    } catch (error) {
      console.error('Error loading trading data:', error);
      // Reset data on error
      setOrders([]);
      setTrades([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, filters.timeframe, setOrders, setTrades, setSummary, setLoading]);

  /**
   * Create sample data for development/testing
   * @param {string} botId - Bot ID
   * @returns {Promise<boolean>} Success status
   */
  const createSampleData = useCallback(async (botId) => {
    if (!botId) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/bots/${botId}/create-sample-data`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Reload data after sample creation
        await loadTradingData(botId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating sample data:', error);
      return false;
    }
  }, [API_BASE, loadTradingData]);

  return {
    loadTradingData,
    createSampleData
  };
};