/**
 * 🔄 useLiveTradingFeedData - Specialized Live Trading Feed Hook
 * 
 * RESPONSIBILITY: Real-time feed data + auto-refresh management
 * EXTRACTED FROM: tradingOperationsService.js (lines 220-268)
 * 
 * ✅ DL-076: Specialized hooks pattern (no wrapper anti-pattern)
 * ✅ Single responsibility: Live trading feed with real-time updates
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback, useEffect } from 'react';
import { useTradingAPI } from '../../services/api/tradingAPI';

/**
 * Specialized hook for live trading feed with real-time auto-refresh
 */
export const useLiveTradingFeedData = (options = {}) => {
  // ✅ DL-076: Direct hook composition - no wrapper context  
  const { getLiveTradingFeed } = useTradingAPI();
  
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFeed = useCallback(async () => {
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
      console.error('❌ Error in useLiveTradingFeedData:', err);
    } finally {
      setLoading(false);
    }
  }, [getLiveTradingFeed, JSON.stringify(options)]);

  useEffect(() => {
    fetchFeed();
    
    // 🔥 REAL-TIME: Auto-refresh every 10 seconds for live trading feed
    const interval = setInterval(fetchFeed, 10000);
    
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

export default useLiveTradingFeedData;