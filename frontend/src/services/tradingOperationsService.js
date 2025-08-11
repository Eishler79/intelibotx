/**
 * 🔄 Trading Operations Service - API calls for persistent trading data
 * 
 * Reemplaza la lógica de memoria (bot.liveTradeHistory) con llamadas API persistentes
 * Resuelve el problema de datos que se pierden al cambiar página/logout
 * 
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

/**
 * Crear nueva operación de trading (reemplaza lógica de memoria)
 */
export const createTradingOperation = async (operationData) => {
  try {
    const token = localStorage.getItem('intelibotx_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}/api/bots/${operationData.bot_id}/trading-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(operationData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('❌ Error creating trading operation:', error);
    throw error;
  }
};

/**
 * Obtener operaciones de trading de un bot (reemplaza bot.liveTradeHistory)
 */
export const getBotTradingOperations = async (botId, options = {}) => {
  try {
    const token = localStorage.getItem('intelibotx_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Construir query parameters
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.side) params.append('side', options.side);
    if (options.days) params.append('days', options.days);

    const response = await fetch(`${BASE_URL}/api/bots/${botId}/trading-operations?${params.toString()}`, {
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
    console.error('❌ Error fetching bot trading operations:', error);
    throw error;
  }
};

/**
 * Obtener operación específica por ID (nueva funcionalidad)
 */
export const getTradingOperation = async (tradeId) => {
  try {
    const token = localStorage.getItem('intelibotx_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${BASE_URL}/api/trading-operations/${tradeId}`, {
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
    console.error('❌ Error fetching trading operation:', error);
    throw error;
  }
};

/**
 * Obtener feed en vivo de trading (reemplaza LiveTradingFeed logic)
 */
export const getLiveTradingFeed = async (options = {}) => {
  try {
    const token = localStorage.getItem('intelibotx_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Construir query parameters
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.bot_ids) params.append('bot_ids', options.bot_ids);
    if (options.hours) params.append('hours', options.hours);

    const response = await fetch(`${BASE_URL}/api/trading-feed/live?${params.toString()}`, {
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
    console.error('❌ Error fetching live trading feed:', error);
    throw error;
  }
};

/**
 * Utilidad para mapear datos del bot a formato de operación
 */
export const mapBotTradeToOperation = (bot, tradeData) => {
  return {
    bot_id: bot.id,
    symbol: bot.symbol,
    side: tradeData.type, // BUY/SELL
    quantity: tradeData.quantity,
    price: tradeData.price,
    strategy: bot.strategy || 'Smart Scalper',
    signal: tradeData.signal,
    algorithm_used: tradeData.algorithm_used || 'EMA_CROSSOVER',
    confidence: tradeData.confidence || 0.75,
    pnl: tradeData.pnl
  };
};

/**
 * Hook personalizado para trading operations
 */
export const useTradingOperations = (botId, options = {}) => {
  const [operations, setOperations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [pagination, setPagination] = React.useState({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    has_next: false,
    has_prev: false
  });

  const fetchOperations = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getBotTradingOperations(botId, options);
      
      if (result.success) {
        setOperations(result.operations);
        setPagination(result.pagination);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch operations');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useTradingOperations:', err);
    } finally {
      setLoading(false);
    }
  }, [botId, JSON.stringify(options)]);

  React.useEffect(() => {
    if (botId) {
      fetchOperations();
    }
  }, [fetchOperations]);

  return {
    operations,
    loading,
    error,
    pagination,
    refetch: fetchOperations
  };
};

/**
 * Hook para live trading feed con paginación
 */
export const useLiveTradingFeed = (options = {}) => {
  const [feed, setFeed] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);

  const fetchFeed = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await getLiveTradingFeed(options);
      
      if (result.success) {
        setFeed(result.feed || []);
        setTotalCount(result.pagination?.total_count || 0);
        setTotalPages(result.pagination?.total_pages || 0);
        setCurrentPage(result.pagination?.current_page || 1);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch feed');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useLiveTradingFeed:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(options)]);

  React.useEffect(() => {
    fetchFeed();
    
    // Auto-refresh cada 30 segundos solo si no estamos paginando
    const interval = setInterval(fetchFeed, 30000);
    
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return {
    feed,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    refetch: fetchFeed
  };
};

export default {
  createTradingOperation,
  getBotTradingOperations,
  getTradingOperation,
  getLiveTradingFeed,
  mapBotTradeToOperation,
  useTradingOperations,
  useLiveTradingFeed
};