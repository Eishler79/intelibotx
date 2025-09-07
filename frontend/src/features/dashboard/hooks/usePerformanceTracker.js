import { useState, useRef, useCallback } from 'react';

/**
 * usePerformanceTracker - Performance Monitoring Hook
 * 
 * ✅ DL-001: Real performance tracking data
 * ✅ SUCCESS CRITERIA: ≤150 lines (70 lines)
 * ✅ SINGLE RESPONSIBILITY: Performance monitoring + statistics
 * 
 * Extracted from useDashboardMetrics.js lines 13-70
 */
export const usePerformanceTracker = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    totalApiCalls: 0,
    averageResponseTime: 0
  });

  const responseTimeTracker = useRef([]);

  // Track API call performance
  const trackApiCall = useCallback((startTime, wasFromCache = false) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    setPerformanceMetrics(prev => {
      const newCacheHits = wasFromCache ? prev.cacheHits + 1 : prev.cacheHits;
      const newCacheMisses = wasFromCache ? prev.cacheMisses : prev.cacheMisses + 1;
      const newTotalCalls = prev.totalApiCalls + 1;
      
      // Track response times for averaging
      responseTimeTracker.current.push(responseTime);
      if (responseTimeTracker.current.length > 100) {
        responseTimeTracker.current = responseTimeTracker.current.slice(-100);
      }
      
      const avgResponseTime = responseTimeTracker.current.length > 0
        ? responseTimeTracker.current.reduce((sum, time) => sum + time, 0) / responseTimeTracker.current.length
        : 0;
      
      return {
        cacheHits: newCacheHits,
        cacheMisses: newCacheMisses,
        totalApiCalls: newTotalCalls,
        averageResponseTime: Math.round(avgResponseTime)
      };
    });
  }, []);

  // Reset performance metrics
  const reset = useCallback(() => {
    setPerformanceMetrics({
      cacheHits: 0,
      cacheMisses: 0,
      totalApiCalls: 0,
      averageResponseTime: 0
    });
    responseTimeTracker.current = [];
  }, []);

  // Get cache efficiency percentage
  const getCacheEfficiency = useCallback(() => {
    return performanceMetrics.totalApiCalls > 0 
      ? (performanceMetrics.cacheHits / performanceMetrics.totalApiCalls * 100).toFixed(1)
      : '0.0';
  }, [performanceMetrics]);

  return {
    performanceMetrics,
    trackApiCall,
    reset,
    getCacheEfficiency
  };
};