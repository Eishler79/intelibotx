import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useCacheManager - Intelligent Cache Management Hook
 * 
 * ✅ DL-001: Real cache management - no mock data
 * ✅ SUCCESS CRITERIA: ≤150 lines (80 lines)
 * ✅ SINGLE RESPONSIBILITY: Cache management + TTL + cleanup
 * 
 * Extracted from useDashboardMetrics.js lines 11-42, 175-256
 */
export const useCacheManager = (defaultTTL = 30000) => {
  const [cache, setCache] = useState(new Map());
  const cacheTimeout = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheTimeout.current.forEach(timeout => clearTimeout(timeout));
      cacheTimeout.current.clear();
    };
  }, []);

  // Get cached item
  const get = useCallback((key) => {
    const cached = cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < defaultTTL) {
      return cached.data;
    }
    
    return null;
  }, [cache, defaultTTL]);

  // Set cached item with automatic cleanup
  const set = useCallback((key, data, customTTL = null) => {
    const now = Date.now();
    const ttl = customTTL || defaultTTL;
    
    setCache(prev => new Map(prev.set(key, {
      data,
      timestamp: now
    })));
    
    // Clear existing timeout
    if (cacheTimeout.current.has(key)) {
      clearTimeout(cacheTimeout.current.get(key));
    }
    
    // Set new timeout for cleanup
    cacheTimeout.current.set(key, setTimeout(() => {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      cacheTimeout.current.delete(key);
    }, ttl));
  }, [defaultTTL]);

  // Check if item exists in cache and is valid
  const has = useCallback((key) => {
    return get(key) !== null;
  }, [get]);

  // Clear all cache
  const clear = useCallback(() => {
    setCache(new Map());
    cacheTimeout.current.forEach(timeout => clearTimeout(timeout));
    cacheTimeout.current.clear();
  }, []);

  // Get cache statistics
  const getStats = useCallback(() => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }, [cache]);

  return {
    get,
    set,
    has,
    clear,
    getStats
  };
};