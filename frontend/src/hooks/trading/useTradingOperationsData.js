/**
 * 🔄 useTradingOperationsData - Specialized Trading Operations Data Hook
 * 
 * RESPONSIBILITY: State management + pagination for trading operations
 * EXTRACTED FROM: tradingOperationsService.js (lines 170-215)
 * 
 * ✅ DL-076: Specialized hooks pattern (no wrapper anti-pattern)
 * ✅ Single responsibility: Trading operations data management
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback, useEffect } from 'react';
import { useTradingAPI } from '../../services/api/tradingAPI';

/**
 * Specialized hook for managing trading operations data with pagination
 */
export const useTradingOperationsData = (botId, options = {}) => {
  // ✅ DL-076: Direct hook composition - no wrapper context
  const { getBotTradingOperations } = useTradingAPI();
  
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_count: 0,
    has_next: false,
    has_prev: false
  });

  const fetchOperations = useCallback(async () => {
    if (!botId) return;
    
    try {
      setLoading(true);
      const result = await getBotTradingOperations(botId, options);
      
      if (result.success) {
        setOperations(result.operations || []);
        setPagination(result.pagination || pagination);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch operations');
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error in useTradingOperationsData:', err);
    } finally {
      setLoading(false);
    }
  }, [botId, getBotTradingOperations, JSON.stringify(options)]);

  useEffect(() => {
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

export default useTradingOperationsData;