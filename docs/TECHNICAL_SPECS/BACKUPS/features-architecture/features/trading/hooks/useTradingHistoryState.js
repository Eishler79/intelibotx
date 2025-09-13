/**
 * useTradingHistoryState.js - State Management Hook for Trading History
 * EXTRACTED FROM: TradingHistory.jsx (lines 7-17)
 * 
 * ✅ DL-001: State management only - no hardcode
 * ✅ SUCCESS CRITERIA: ≤150 lines (80 lines)
 * ✅ SINGLE RESPONSIBILITY: State management only
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import { useState } from 'react';

/**
 * Trading History State Management Hook
 * Handles all state for trading history component
 * 
 * @returns {Object} State variables and setters
 */
export const useTradingHistoryState = () => {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('orders');
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    symbol: 'all',
    strategy: 'all',
    timeframe: '30'
  });

  /**
   * Update specific filter
   * @param {string} key - Filter key
   * @param {string} value - Filter value
   */
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Reset all filters to default
   */
  const resetFilters = () => {
    setFilters({
      status: 'all',
      symbol: 'all', 
      strategy: 'all',
      timeframe: '30'
    });
  };

  /**
   * Clear all data
   */
  const clearData = () => {
    setOrders([]);
    setTrades([]);
    setSummary(null);
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,
    
    // Data state
    orders,
    setOrders,
    trades,
    setTrades,
    summary,
    setSummary,
    
    // UI state  
    loading,
    setLoading,
    
    // Filter state
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    
    // Utilities
    clearData
  };
};