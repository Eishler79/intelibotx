// ✅ DL-040 Phase 4: Bot Creation Form Logic Hook
// EXTRACTED FROM: components/EnhancedBotCreationModal.jsx (Core form state management)
// RISK LEVEL: 15% - Complex form state with API integrations

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAuthDL008 } from '../../../hooks/useAuthDL008';

/**
 * Bot Creation Form Logic Hook
 * 
 * Manages complex form state for bot creation including:
 * - Dynamic API data loading (strategies, currencies, intervals, etc.)
 * - Exchange integration and validation
 * - Real-time market data integration
 * - Form validation and error handling
 * 
 * Extracted from EnhancedBotCreationModal to improve separation of concerns
 * and enable better testing and reusability.
 * 
 * @param {Object} selectedTemplate - Pre-selected template configuration
 * @returns {Object} Form state, handlers, and API data
 */
export function useBotCreationForm(selectedTemplate = null) {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();
  const { userExchanges, isAuthenticated, loadUserExchanges } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [marketTypes, setMarketTypes] = useState([]);
  const [marketTypesLoading, setMarketTypesLoading] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // DL-001 COMPLIANCE: Dynamic data loading states
  const [strategies, setStrategies] = useState([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [baseCurrencies, setBaseCurrencies] = useState([]);
  const [baseCurrenciesLoading, setBaseCurrenciesLoading] = useState(false);
  const [intervals, setIntervals] = useState([]);
  const [intervalsLoading, setIntervalsLoading] = useState(false);
  const [marginTypes, setMarginTypes] = useState([]);
  const [marginTypesLoading, setMarginTypesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTCUSDT',
    exchange_id: null,
    base_currency: '', // DL-001: Will be loaded dynamically
    quote_currency: 'BTC',
    stake: 100,
    strategy: '', // DL-001: Will be loaded dynamically
    interval: '', // DL-001: Will be loaded dynamically
    take_profit: 2.5,
    stop_loss: 1.5,
    risk_percentage: 1.0,
    market_type: 'SPOT',
    leverage: 1,
    margin_type: 'CROSS',
    // Advanced parameters
    dca_levels: 3,
    entry_order_type: 'MARKET',
    exit_order_type: 'MARKET',
    tp_order_type: 'LIMIT',
    sl_order_type: 'STOP_MARKET',
    trailing_stop: false,
    max_open_positions: 3,
    cooldown_minutes: 30,
    market_condition_filter: true,
    volatility_threshold: 0.8
  });

  // Initialize form with template data
  useEffect(() => {
    if (selectedTemplate) {
      console.log('📋 Template cargado en formulario:', selectedTemplate);
      setFormData(prev => ({
        ...prev,
        name: selectedTemplate.name || '',
        symbol: selectedTemplate.symbol || prev.symbol,
        strategy: selectedTemplate.strategy || '',
        stake: selectedTemplate.stake || prev.stake,
        take_profit: selectedTemplate.take_profit || prev.take_profit,
        stop_loss: selectedTemplate.stop_loss || prev.stop_loss,
        risk_percentage: selectedTemplate.risk_percentage || prev.risk_percentage,
        market_type: selectedTemplate.market_type || prev.market_type,
        leverage: selectedTemplate.leverage || prev.leverage
      }));
    }
  }, [selectedTemplate]);

  // Load user exchanges on mount
  useEffect(() => {
    if (isAuthenticated && userExchanges.length === 0) {
      loadUserExchanges();
    }
  }, [isAuthenticated, userExchanges.length]);

  // Auto-select first exchange
  useEffect(() => {
    if (userExchanges.length > 0 && !selectedExchange) {
      setSelectedExchange(userExchanges[0]);
      setFormData(prev => ({ ...prev, exchange_id: userExchanges[0].id }));
    }
  }, [userExchanges, selectedExchange]);

  // Load exchange-specific data when exchange is selected
  useEffect(() => {
    if (selectedExchange) {
      loadStrategies(selectedExchange.id);
      loadBaseCurrencies(selectedExchange.id);
      loadTradingIntervals(selectedExchange.id);
      loadMarginTypes(selectedExchange.id);
      loadAvailableSymbols(selectedExchange.id);
      loadMarketTypes(selectedExchange.id);
    }
  }, [selectedExchange]);

  // API loading functions
  const loadStrategies = async (exchangeId) => {
    setStrategiesLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/strategies`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.strategies) {
          setStrategies(data.strategies);
          // Auto-select first strategy if none selected
          if (!formData.strategy && data.strategies.length > 0) {
            setFormData(prev => ({ ...prev, strategy: data.strategies[0].value }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setStrategiesLoading(false);
    }
  };

  const loadBaseCurrencies = async (exchangeId) => {
    setBaseCurrenciesLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/base-currencies`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.base_currencies) {
          setBaseCurrencies(data.base_currencies);
          // Auto-select first base currency if none selected
          if (!formData.base_currency && data.base_currencies.length > 0) {
            setFormData(prev => ({ ...prev, base_currency: data.base_currencies[0].value }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading base currencies:', error);
    } finally {
      setBaseCurrenciesLoading(false);
    }
  };

  const loadTradingIntervals = async (exchangeId) => {
    setIntervalsLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/trading-intervals`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.intervals) {
          setIntervals(data.intervals);
          // Auto-select recommended interval if none selected
          const recommended = data.intervals.find(i => i.recommended);
          if (!formData.interval && recommended) {
            setFormData(prev => ({ ...prev, interval: recommended.value }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading intervals:', error);
    } finally {
      setIntervalsLoading(false);
    }
  };

  const loadMarginTypes = async (exchangeId) => {
    setMarginTypesLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/margin-types`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.margin_types) {
          setMarginTypes(data.margin_types);
        }
      }
    } catch (error) {
      console.error('Error loading margin types:', error);
    } finally {
      setMarginTypesLoading(false);
    }
  };

  const loadAvailableSymbols = async (exchangeId) => {
    setSymbolsLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/symbols`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.symbols) {
          setAvailableSymbols(data.symbols);
        }
      }
    } catch (error) {
      console.error('Error loading symbols:', error);
    } finally {
      setSymbolsLoading(false);
    }
  };

  const loadMarketTypes = async (exchangeId) => {
    setMarketTypesLoading(true);
    try {
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/market-types`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.market_types) {
          setMarketTypes(data.market_types);
        }
      }
    } catch (error) {
      console.error('Error loading market types:', error);
    } finally {
      setMarketTypesLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleExchangeChange = (exchange) => {
    setSelectedExchange(exchange);
    setFormData(prev => ({
      ...prev,
      exchange_id: exchange.id
    }));
  };

  // Validation
  const validateForm = () => {
    if (!formData.name.trim()) return 'El nombre del bot es requerido';
    if (!formData.symbol.trim()) return 'El símbolo es requerido';
    if (!formData.strategy) return 'La estrategia es requerida';
    if (!formData.exchange_id) return 'El exchange es requerido';
    if (formData.stake <= 0) return 'El stake debe ser mayor a 0';
    if (formData.take_profit <= 0) return 'Take profit debe ser mayor a 0';
    if (formData.stop_loss <= 0) return 'Stop loss debe ser mayor a 0';
    if (formData.risk_percentage <= 0 || formData.risk_percentage > 100) {
      return 'El porcentaje de riesgo debe estar entre 0.1 y 100';
    }
    return null;
  };

  return {
    // Form state
    formData,
    setFormData,
    handleInputChange,
    
    // Loading states
    loading,
    setLoading,
    error,
    setError,
    
    // Exchange data
    selectedExchange,
    handleExchangeChange,
    userExchanges,
    
    // API data
    strategies,
    strategiesLoading,
    baseCurrencies,
    baseCurrenciesLoading,
    intervals,
    intervalsLoading,
    marginTypes,
    marginTypesLoading,
    availableSymbols,
    symbolsLoading,
    marketTypes,
    marketTypesLoading,
    
    // Real-time data
    realTimeData,
    setRealTimeData,
    
    // UI state
    showAdvancedConfig,
    setShowAdvancedConfig,
    
    // Validation
    validateForm,
    
    // Authentication
    authenticatedFetch,
    isAuthenticated
  };
}