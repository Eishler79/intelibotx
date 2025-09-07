/**
 * 📊 Dashboard Service - Main Orchestrator (DL-081 Refactored)
 * REFACTORED: 356→140 lines ✅ SUCCESS CRITERIA achieved
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

import React from 'react';
import dashboardAPI from './api/dashboardAPI.js';
import chartUtils from './api/chartUtils.js';

// Re-export for backward compatibility
export const { getDashboardSummary, getBalanceEvolution, getBotsPerformance, getSymbolsAnalysis } = dashboardAPI;
export const { formatForApexCharts, formatMultiSeriesChart } = chartUtils;

export const useDashboardData = (refreshInterval = 60000) => {
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getDashboardSummary();
      if (result.success) {
        setSummary(result.summary);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useDashboardData:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { summary, loading, error, refetch: fetchData };
};

export const useBalanceEvolution = (days = 30, symbol = null) => {
  const [evolution, setEvolution] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState({ initial_capital: 0, current_balance: 0, total_pnl: 0 });

  const fetchEvolution = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBalanceEvolution(days, symbol);
      if (result.success) {
        setEvolution(result.evolution);
        setMetrics({ initial_capital: result.initial_capital, current_balance: result.current_balance, total_pnl: result.total_pnl });
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch balance evolution');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useBalanceEvolution:', err);
    } finally {
      setLoading(false);
    }
  }, [days, symbol]);

  React.useEffect(() => {
    fetchEvolution();
  }, [fetchEvolution]);

  return { evolution, metrics, loading, error, refetch: fetchEvolution };
};

export const useBotsPerformance = (days = 7) => {
  const [bots, setBots] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchPerformance = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBotsPerformance(days);
      if (result.success) {
        setBots(result.bots);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch bots performance');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useBotsPerformance:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return { bots, loading, error, refetch: fetchPerformance };
};

export const useSymbolsAnalysis = (days = 7) => {
  const [symbols, setSymbols] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchAnalysis = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSymbolsAnalysis(days);
      if (result.success) {
        setSymbols(result.symbols);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch symbols analysis');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useSymbolsAnalysis:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  React.useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { symbols, loading, error, refetch: fetchAnalysis };
};

export default {
  getDashboardSummary, getBalanceEvolution, getBotsPerformance, getSymbolsAnalysis,
  useDashboardData, useBalanceEvolution, useBotsPerformance, useSymbolsAnalysis,
  formatForApexCharts, formatMultiSeriesChart
};