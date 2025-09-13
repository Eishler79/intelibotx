import { useState, useRef } from 'react';

export const useRealTimeState = () => {
  // Real-time data state
  const [data, setData] = useState({
    currentPrice: null,
    balance: null,
    symbolInfo: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Price cache management  
  const [priceCache, setPriceCache] = useState(new Map());
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Intervals management
  const updateInterval = useRef(null);
  const priceInterval = useRef(null);

  // Real-time price state
  const [price, setPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);

  // Cleanup function
  const cleanupIntervals = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
    if (priceInterval.current) {
      clearInterval(priceInterval.current);
      priceInterval.current = null;
    }
  };

  return {
    // State
    data,
    setData,
    priceCache,
    setPriceCache,
    balances,
    setBalances,
    loading,
    setLoading,
    error,
    setError,
    price,
    setPrice,
    priceLoading,
    setPriceLoading,
    priceError,
    setPriceError,
    lastPriceUpdate,
    setLastPriceUpdate,
    
    // Intervals
    updateInterval,
    priceInterval,
    cleanupIntervals
  };
};