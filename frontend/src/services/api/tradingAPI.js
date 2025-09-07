/**
 * 🔄 Trading API Layer - DL-008 Compliant API calls
 * 
 * RESPONSIBILITY: Pure API operations with proper authentication
 * EXTRACTED FROM: tradingOperationsService.js (lines 17-147)
 * 
 * ✅ DL-008: useAuthDL008 authentication pattern
 * ✅ DL-001: No hardcode values, real API endpoints only
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useAuthDL008 } from "../../shared/hooks/useAuthDL008";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

/**
 * Hook for authenticated trading API operations
 * ✅ DL-008 COMPLIANT: Uses centralized authentication pattern
 */
export const useTradingAPI = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();

  /**
   * Create new trading operation
   */
  const createTradingOperation = async (operationData) => {
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/bots/${operationData.bot_id}/trading-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(operationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error creating trading operation:', error);
      throw error;
    }
  };

  /**
   * Get bot trading operations with pagination
   */
  const getBotTradingOperations = async (botId, options = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.side) params.append('side', options.side);
      if (options.days) params.append('days', options.days);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/bots/${botId}/trading-operations?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error fetching bot trading operations:', error);
      throw error;
    }
  };

  /**
   * Get specific trading operation by ID
   */
  const getTradingOperation = async (tradeId) => {
    try {
      const response = await authenticatedFetch(`${BASE_URL}/api/trading-operations/${tradeId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error fetching trading operation:', error);
      throw error;
    }
  };

  /**
   * Get live trading feed
   */
  const getLiveTradingFeed = async (options = {}) => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.bot_ids) params.append('bot_ids', options.bot_ids);
      if (options.hours) params.append('hours', options.hours);

      const response = await authenticatedFetch(
        `${BASE_URL}/api/trading-feed/live?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Error fetching live trading feed:', error);
      throw error;
    }
  };

  return {
    createTradingOperation,
    getBotTradingOperations,
    getTradingOperation,
    getLiveTradingFeed
  };
};

export default useTradingAPI;