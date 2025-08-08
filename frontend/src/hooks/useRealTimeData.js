import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para manejar datos en tiempo real desde exchanges
 * Obtiene precios, balances y límites del exchange seleccionado
 */
export const useRealTimeData = (exchangeId, symbol) => {
  const { authenticatedFetch } = useAuth();
  const [data, setData] = useState({
    currentPrice: null,
    balance: null,
    leverageLimits: { min: 1, max: 20 },
    symbolInfo: null,
    loading: false,
    error: null
  });

  const [updateInterval, setUpdateInterval] = useState(null);

  // Fetch datos desde el exchange
  const fetchRealTimeData = useCallback(async () => {
    if (!exchangeId || !symbol) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Obtener precio actual del símbolo
      const priceResponse = await authenticatedFetch(`/api/exchanges/${exchangeId}/ticker/${symbol}`);
      let currentPrice = null;
      
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        currentPrice = parseFloat(priceData.price || priceData.last || 0);
      }

      // Obtener balance de la cuenta
      const balanceResponse = await authenticatedFetch(`/api/exchanges/${exchangeId}/balance`);
      let balanceData = null;
      
      if (balanceResponse.ok) {
        balanceData = await balanceResponse.json();
      }

      // Obtener información del símbolo (límites, precisión, etc.)
      const symbolResponse = await authenticatedFetch(`/api/exchanges/${exchangeId}/symbol-info/${symbol}`);
      let symbolInfo = null;
      
      if (symbolResponse.ok) {
        symbolInfo = await symbolResponse.json();
      }

      setData(prev => ({
        ...prev,
        currentPrice,
        balance: balanceData,
        symbolInfo,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Error fetching real-time data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error obteniendo datos del exchange'
      }));
      
      // Fallback con datos mock para desarrollo
      setData(prev => ({
        ...prev,
        currentPrice: getMockPrice(symbol),
        balance: { USDT: 1000.00, BTC: 0.023, ETH: 0.5 },
        leverageLimits: { min: 1, max: 125 },
        loading: false
      }));
    }
  }, [exchangeId, symbol, authenticatedFetch]);

  // Función para obtener precio mock durante desarrollo
  const getMockPrice = (symbol) => {
    const mockPrices = {
      'BTCUSDT': 43250.50,
      'ETHUSDT': 2650.75,
      'ADAUSDT': 0.4523,
      'SOLUSDT': 98.45,
      'DOTUSDT': 7.234
    };
    return mockPrices[symbol] || 1.0;
  };

  // Inicializar y manejar actualizaciones periódicas
  useEffect(() => {
    if (exchangeId && symbol) {
      // Fetch inicial
      fetchRealTimeData();

      // Actualizar cada 30 segundos
      const interval = setInterval(fetchRealTimeData, 30000);
      setUpdateInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
    };
  }, [exchangeId, symbol, fetchRealTimeData]);

  // Función para actualizar manualmente
  const refresh = useCallback(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // Función para obtener balance de una moneda específica
  const getBalanceForCurrency = useCallback((currency) => {
    if (!data.balance) return 0;
    
    if (typeof data.balance === 'object') {
      return parseFloat(data.balance[currency] || data.balance[currency?.toLowerCase()] || 0);
    }
    
    return 0;
  }, [data.balance]);

  // Función para validar si el símbolo está disponible en el exchange
  const isSymbolAvailable = useCallback(() => {
    if (!data.symbolInfo) return true; // Asumir disponible si no tenemos info
    return data.symbolInfo.status === 'TRADING' || data.symbolInfo.active;
  }, [data.symbolInfo]);

  // Función para obtener límites de precisión
  const getPrecisionLimits = useCallback(() => {
    if (data.symbolInfo) {
      return {
        price: data.symbolInfo.pricePrecision || 8,
        quantity: data.symbolInfo.quantityPrecision || 8,
        minQuantity: parseFloat(data.symbolInfo.minQuantity || 0),
        minNotional: parseFloat(data.symbolInfo.minNotional || 0)
      };
    }
    
    // Valores por defecto
    return {
      price: 8,
      quantity: 8,
      minQuantity: 0.001,
      minNotional: 10
    };
  }, [data.symbolInfo]);

  return {
    // Datos principales
    currentPrice: data.currentPrice,
    balance: data.balance,
    symbolInfo: data.symbolInfo,
    leverageLimits: data.leverageLimits,
    
    // Estados
    loading: data.loading,
    error: data.error,
    
    // Funciones helper
    refresh,
    getBalanceForCurrency,
    isSymbolAvailable,
    getPrecisionLimits,
    
    // Estado de conexión
    isConnected: !!data.currentPrice,
    lastUpdate: new Date()
  };
};

/**
 * Hook simplificado para obtener solo el precio de un símbolo
 */
export const useSymbolPrice = (exchangeId, symbol, updateInterval = 30000) => {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authenticatedFetch } = useAuth();

  const fetchPrice = useCallback(async () => {
    if (!exchangeId || !symbol) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/exchanges/${exchangeId}/ticker/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setPrice(parseFloat(data.price || data.last || 0));
        setError(null);
      } else {
        throw new Error('Error fetching price');
      }
    } catch (err) {
      setError(err.message);
      // Mock fallback
      const mockPrices = {
        'BTCUSDT': 43250.50,
        'ETHUSDT': 2650.75,
        'ADAUSDT': 0.4523
      };
      setPrice(mockPrices[symbol] || 1.0);
    } finally {
      setLoading(false);
    }
  }, [exchangeId, symbol, authenticatedFetch]);

  useEffect(() => {
    fetchPrice();
    
    if (updateInterval > 0) {
      const interval = setInterval(fetchPrice, updateInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPrice, updateInterval]);

  return { price, loading, error, refresh: fetchPrice };
};

/**
 * Hook para obtener balance de múltiples monedas
 */
export const useExchangeBalance = (exchangeId) => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authenticatedFetch } = useAuth();

  const fetchBalances = useCallback(async () => {
    if (!exchangeId) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(`/api/exchanges/${exchangeId}/balance`);
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
        setError(null);
      } else {
        throw new Error('Error fetching balance');
      }
    } catch (err) {
      setError(err.message);
      // Mock fallback
      setBalances({
        USDT: 1000.00,
        BTC: 0.023,
        ETH: 0.5,
        BNB: 2.5
      });
    } finally {
      setLoading(false);
    }
  }, [exchangeId, authenticatedFetch]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const getBalance = useCallback((currency) => {
    return parseFloat(balances[currency] || balances[currency?.toLowerCase()] || 0);
  }, [balances]);

  return {
    balances,
    loading,
    error,
    refresh: fetchBalances,
    getBalance,
    totalBalances: Object.keys(balances).length
  };
};