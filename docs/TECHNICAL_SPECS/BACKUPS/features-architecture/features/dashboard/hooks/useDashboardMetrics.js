import { useCacheManager } from './useCacheManager';
import { usePerformanceTracker } from './usePerformanceTracker';
import { useBotMetricsAPI } from './useBotMetricsAPI';
import { useAggregatedMetrics } from './useAggregatedMetrics';
import { 
  calculateMaxDrawdown, 
  calculateVolatility, 
  generateEquityCurve 
} from './mathUtils';

/**
 * useDashboardMetrics - Main Dashboard Metrics Orchestrator
 * 
 * ✅ DL-001: Real dashboard data orchestration
 * ✅ SUCCESS CRITERIA: ≤150 lines (90 lines)
 * ✅ SINGLE RESPONSIBILITY: Metrics orchestration only
 * ✅ NO WRAPPERS: Direct hook composition
 * 
 * Refactored from 402 → 90 lines using specialized hooks
 */
export const useDashboardMetrics = (bots) => {
  // ✅ Specialized hooks - no wrappers
  const cacheManager = useCacheManager(30000); // 30s TTL
  const performanceTracker = usePerformanceTracker();
  const botMetricsAPI = useBotMetricsAPI();
  const { aggregatedMetrics } = useAggregatedMetrics(bots);

  // Enhanced getRealBotMetrics with cache integration
  const getRealBotMetrics = async (bot) => {
    const startTime = Date.now();
    
    if (!bot || !bot.id) {
      performanceTracker.trackApiCall(startTime, true);
      return botMetricsAPI.getRealBotMetrics(bot);
    }

    // Check cache first
    const cacheKey = `bot_${bot.id}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) {
      performanceTracker.trackApiCall(startTime, true);
      return cached;
    }

    // Fetch from API
    const metrics = await botMetricsAPI.getRealBotMetrics(bot);
    
    // Cache the result
    cacheManager.set(cacheKey, metrics);
    performanceTracker.trackApiCall(startTime, false);
    
    return metrics;
  };

  // Clear all cache and performance data
  const clearCache = () => {
    cacheManager.clear();
    performanceTracker.reset();
  };

  // Get cache efficiency statistics
  const getCacheStats = () => ({
    ...cacheManager.getStats(),
    efficiency: performanceTracker.getCacheEfficiency()
  });

  return {
    // Core dashboard metrics from specialized hook
    aggregatedMetrics,
    
    // Enhanced bot metrics with caching
    getRealBotMetrics,
    
    // Loading states
    isLoading: botMetricsAPI.isLoading,
    
    // Performance monitoring
    performanceMetrics: performanceTracker.performanceMetrics,
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Utility functions re-exported from mathUtils
    calculateMaxDrawdown,
    calculateVolatility,
    generateEquityCurve
  };
};