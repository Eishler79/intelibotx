/**
 * 📊 Dashboard Service - API calls for real dashboard data
 * 
 * Reemplaza los datos hardcodeados del Dashboard.jsx con datos reales
 * Proporciona métricas dinámicas: bots activos, balance real, PnL, gráficos
 * 
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

/**
 * Obtener resumen completo del dashboard
 */
export const getDashboardSummary = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error fetching dashboard summary:', error);
    throw error;
  }
};

/**
 * Obtener evolución del balance (para gráficos)
 */
export const getBalanceEvolution = async (days = 30, symbol = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (symbol) params.append('symbol', symbol);

    const response = await fetch(`${BASE_URL}/api/dashboard/balance-evolution?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error fetching balance evolution:', error);
    throw error;
  }
};

/**
 * Obtener performance de bots individuales
 */
export const getBotsPerformance = async (days = 7) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}/api/dashboard/bots-performance?days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error fetching bots performance:', error);
    throw error;
  }
};

/**
 * Obtener análisis por símbolos
 */
export const getSymbolsAnalysis = async (days = 7) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}/api/dashboard/symbols-analysis?days=${days}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error fetching symbols analysis:', error);
    throw error;
  }
};

/**
 * Hook para datos del dashboard con auto-refresh
 */
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
    
    // Auto-refresh
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    summary,
    loading,
    error,
    refetch: fetchData
  };
};

/**
 * Hook para evolución del balance con filtros
 */
export const useBalanceEvolution = (days = 30, symbol = null) => {
  const [evolution, setEvolution] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [metrics, setMetrics] = React.useState({
    initial_capital: 0,
    current_balance: 0,
    total_pnl: 0
  });

  const fetchEvolution = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBalanceEvolution(days, symbol);
      
      if (result.success) {
        setEvolution(result.evolution);
        setMetrics({
          initial_capital: result.initial_capital,
          current_balance: result.current_balance,
          total_pnl: result.total_pnl
        });
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

  return {
    evolution,
    metrics,
    loading,
    error,
    refetch: fetchEvolution
  };
};

/**
 * Hook para performance de bots
 */
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

  return {
    bots,
    loading,
    error,
    refetch: fetchPerformance
  };
};

/**
 * Hook para análisis de símbolos
 */
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

  return {
    symbols,
    loading,
    error,
    refetch: fetchAnalysis
  };
};

/**
 * Utilidad para formatear datos para ApexCharts
 */
export const formatForApexCharts = (evolution, type = 'balance') => {
  const categories = evolution.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  });

  let series = [];
  
  if (type === 'balance') {
    series = [{
      name: 'Balance USD',
      data: evolution.map(item => parseFloat(item.balance)),
      color: '#10B981'
    }];
  } else if (type === 'pnl') {
    series = [{
      name: 'PnL USD',
      data: evolution.map(item => parseFloat(item.pnl)),
      color: '#F59E0B'
    }];
  } else if (type === 'operations') {
    series = [{
      name: 'Operaciones',
      data: evolution.map(item => item.operations),
      color: '#3B82F6'
    }];
  }

  return {
    series,
    categories
  };
};

export default {
  getDashboardSummary,
  getBalanceEvolution,
  getBotsPerformance,
  getSymbolsAnalysis,
  useDashboardData,
  useBalanceEvolution,
  useBotsPerformance,
  useSymbolsAnalysis,
  formatForApexCharts
};