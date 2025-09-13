import { useState, useEffect, useCallback } from 'react';
import { getLiveTradingFeed } from '../services/api';

/**
 * useLiveFeed - Specialized Live Trading Feed Data Management
 * 
 * ✅ DL-001: Real API data management, no hardcode
 * ✅ DL-008: JWT authentication through getLiveTradingFeed API
 * ✅ SINGLE RESPONSIBILITY: Feed data management only
 * ✅ 65 lines extracted from LiveTradingFeed.jsx
 */
export const useLiveFeed = () => {
  // Feed data state
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load feed data function
  const loadFeedData = useCallback(async ({ 
    page, 
    limit, 
    bot_ids, 
    hours 
  }) => {
    if (!bot_ids || bot_ids.length === 0) {
      setFeed([]);
      return { success: true, data: { operations: [], total_count: 0 } };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getLiveTradingFeed({
        page,
        limit,
        bot_ids,
        hours
      });

      if (response.success) {
        setFeed(response.data?.operations || []);
        return response;
      } else {
        const errorMsg = 'Error cargando feed de trading';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
      const errorMsg = err.message || 'Error conectando con API';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh function
  const refetch = useCallback((params) => {
    return loadFeedData(params);
  }, [loadFeedData]);

  // Clear feed data
  const clearFeed = useCallback(() => {
    setFeed([]);
    setError(null);
  }, []);

  // Reset error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Data state
    feed,
    loading,
    error,

    // Actions
    loadFeedData,
    refetch,
    clearFeed,
    clearError,

    // Computed values
    hasFeed: feed.length > 0,
    isEmpty: feed.length === 0 && !loading && !error,
    isError: !!error && !loading
  };
};