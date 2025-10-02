import { useCallback } from 'react';
import { useAuthDL008 } from '../../../shared/hooks/useAuthDL008';

/**
 * useBotMarketData Hook - Market Data Operations
 *
 * Handles fetching market data (OHLCV) for charts
 *
 * ✅ DL-001: Real API data only
 * ✅ DL-008: JWT authentication pattern
 * ✅ SUCCESS CRITERIA: ≤150 lines
 */
export const useBotMarketData = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();

  // ✅ DL-001 COMPLIANT: Fetch market data for symbol
  const fetchMarketData = useCallback(async (symbol, timeframe = '15m', limit = 100, marketType = 'SPOT') => {
    try {
      console.log(`📊 Fetching market data for ${symbol} - ${timeframe}`);

      // Build query parameters
      const params = new URLSearchParams({
        timeframe: timeframe,
        limit: limit.toString(),
        market_type: marketType
      });

      const response = await authenticatedFetch(`/api/market-data/${symbol}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status}`);
      }

      const result = await response.json();

      if (result?.success && result?.data?.klines) {
        console.log(`✅ Market data received for ${symbol}: ${result.data.klines.length} candles`);

        // Transform to chart format
        const chartData = result.data.klines
          .filter(item => item.timestamp && item.close)
          .map(item => ({
            timestamp: item.timestamp,
            price: parseFloat(item.close),
            close: parseFloat(item.close),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            volume: parseFloat(item.volume),
            // Additional fields for chart
            date: new Date(item.timestamp).toLocaleTimeString(),
            ohlc: [
              parseFloat(item.open),
              parseFloat(item.high),
              parseFloat(item.low),
              parseFloat(item.close)
            ]
          }));

        return chartData;
      }

      console.warn(`⚠️ No market data available for ${symbol}`);
      return [];

    } catch (error) {
      console.error(`❌ Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  }, [authenticatedFetch]);

  return {
    fetchMarketData
  };
};

export default useBotMarketData;