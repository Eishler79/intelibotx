/**
 * useSmartScalperCache - Smart Scalper Cache Management Hook
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Cache management + data freshness + polling optimization
 * LINES TARGET: ≤120 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export const useSmartScalperCache = () => {
  const [cache, setCache] = useState(new Map());
  const [lastUpdate, setLastUpdate] = useState({});
  const cacheTimeouts = useRef(new Map());

  // Cache configuration
  const CACHE_CONFIG = {
    TTL: 30000,           // 30 seconds TTL for Smart Scalper data
    MAX_ENTRIES: 50,      // Maximum cache entries
    STALE_THRESHOLD: 15000 // 15 seconds before data considered stale
  };

  // Generate cache key
  const generateCacheKey = useCallback((symbol, type = 'analysis') => {
    return `${symbol}_${type}_smartscalper`;
  }, []);

  // Check if cached data is fresh
  const isCacheFresh = useCallback((symbol, type = 'analysis') => {
    const lastUpdateTime = lastUpdate[generateCacheKey(symbol, type)];
    return lastUpdateTime ? (Date.now() - lastUpdateTime) < CACHE_CONFIG.TTL : false;
  }, [generateCacheKey, lastUpdate]);

  // Check if cached data is stale (but not expired)
  const isCacheStale = useCallback((symbol, type = 'analysis') => {
    const lastUpdateTime = lastUpdate[generateCacheKey(symbol, type)];
    if (!lastUpdateTime) return true;
    const age = Date.now() - lastUpdateTime;
    return age > CACHE_CONFIG.STALE_THRESHOLD && age < CACHE_CONFIG.TTL;
  }, [generateCacheKey, lastUpdate]);

  // Get cached data
  const getCachedData = useCallback((symbol, type = 'analysis') => {
    return isCacheFresh(symbol, type) ? cache.get(generateCacheKey(symbol, type)) || null : null;
  }, [cache, generateCacheKey, isCacheFresh]);

  // Set cached data with TTL
  const setCachedData = useCallback((symbol, data, type = 'analysis') => {
    const key = generateCacheKey(symbol, type);
    
    if (cacheTimeouts.current.has(key)) {
      clearTimeout(cacheTimeouts.current.get(key));
    }
    
    setCache(prev => {
      const newCache = new Map(prev);
      if (newCache.size >= CACHE_CONFIG.MAX_ENTRIES) {
        newCache.delete(newCache.keys().next().value);
      }
      newCache.set(key, data);
      return newCache;
    });
    
    setLastUpdate(prev => ({ ...prev, [key]: Date.now() }));
    
    cacheTimeouts.current.set(key, setTimeout(() => {
      invalidateCache(symbol, type);
    }, CACHE_CONFIG.TTL));
  }, [generateCacheKey, invalidateCache]);

  // Invalidate specific cache entry
  const invalidateCache = useCallback((symbol, type = 'analysis') => {
    const key = generateCacheKey(symbol, type);
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
    
    setLastUpdate(prev => {
      // eslint-disable-next-line no-unused-vars
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    
    if (cacheTimeouts.current.has(key)) {
      clearTimeout(cacheTimeouts.current.get(key));
      cacheTimeouts.current.delete(key);
    }
  }, [generateCacheKey]);

  // Clear all cache
  const clearAllCache = useCallback(() => {
    setCache(new Map());
    setLastUpdate({});
    
    // Clear all timeouts
    cacheTimeouts.current.forEach(timeout => clearTimeout(timeout));
    cacheTimeouts.current.clear();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const totalEntries = cache.size;
    const now = Date.now();
    const { freshEntries, staleEntries } = Object.values(lastUpdate).reduce(
      (acc, timestamp) => {
        const age = now - timestamp;
        if (age < CACHE_CONFIG.STALE_THRESHOLD) acc.freshEntries++;
        else if (age < CACHE_CONFIG.TTL) acc.staleEntries++;
        return acc;
      },
      { freshEntries: 0, staleEntries: 0 }
    );
    
    return {
      totalEntries,
      freshEntries,
      staleEntries,
      hitRatio: freshEntries / Math.max(totalEntries, 1)
    };
  }, [cache.size, lastUpdate]);

  // Cache with fallback function
  const cacheOrFetch = useCallback(async (symbol, fetchFunction, type = 'analysis') => {
    const cachedData = getCachedData(symbol, type);
    if (cachedData) return { data: cachedData, fromCache: true, fresh: true };
    
    const staleData = cache.get(generateCacheKey(symbol, type));
    
    try {
      const freshData = await fetchFunction();
      if (freshData) {
        setCachedData(symbol, freshData, type);
        return { data: freshData, fromCache: false, fresh: true };
      }
      return staleData ? { data: staleData, fromCache: true, fresh: false } : 
                       { data: null, fromCache: false, fresh: false };
    } catch (error) {
      console.error('Cache fetch error:', error);
      return staleData ? { data: staleData, fromCache: true, fresh: false } : 
                       { data: null, fromCache: false, fresh: false, error };
    }
  }, [getCachedData, generateCacheKey, cache, setCachedData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheTimeouts.current.forEach(timeout => clearTimeout(timeout));
      cacheTimeouts.current.clear();
    };
  }, []);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    clearAllCache,
    isCacheFresh,
    isCacheStale,
    getCacheStats,
    cacheOrFetch
  };
};

export default useSmartScalperCache;