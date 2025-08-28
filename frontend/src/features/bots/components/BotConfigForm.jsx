// ✅ DL-040 Phase 4: Bot Configuration Form Component
// EXTRACTED FROM: components/BotControlPanel.jsx (Core form logic)
// RISK LEVEL: 15% - Complex form state extraction with API integrations

import React, { useState, useEffect } from 'react';

/**
 * Bot Configuration Form Logic Hook
 * 
 * Manages bot parameter state and API integrations for modification form.
 * Handles dynamic data loading from exchange APIs and parameter validation.
 * 
 * This hook extracts the core form logic from BotControlPanel to improve
 * separation of concerns and enable better testing and reusability.
 * 
 * @param {Object} bot - Bot object with current configuration
 * @returns {Object} Form state and handlers
 */
export function useBotConfigForm(bot) {
  const [parameters, setParameters] = useState({});
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  
  // DL-001 COMPLIANCE: Dynamic data loading states for MODIFY
  const [strategies, setStrategies] = useState([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [baseCurrencies, setBaseCurrencies] = useState([]);
  const [baseCurrenciesLoading, setBaseCurrenciesLoading] = useState(false);
  const [intervals, setIntervals] = useState([]);
  const [intervalsLoading, setIntervalsLoading] = useState(false);
  const [marginTypes, setMarginTypes] = useState([]);
  const [marginTypesLoading, setMarginTypesLoading] = useState(false);

  // Initialize parameters from bot data
  useEffect(() => {
    if (bot) {
      console.log('🔍 Cargando datos del bot:', bot);
      console.log('🔍 Campos específicos - name:', bot.name, 'leverage:', bot.leverage, 'market_type:', bot.market_type);
      setParameters({
        // Parámetros básicos del bot creado (DATOS REALES)
        name: bot.name || `Bot ${bot.symbol}` || 'Bot',
        symbol: bot.symbol || 'BTCUSDT',
        strategy: bot.strategy || '', // DL-001: No hardcode fallback
        interval: bot.interval || '', // DL-001: No hardcode fallback
        stake: Number(bot.stake) || 100,
        base_currency: bot.base_currency || '', // DL-001: No hardcode fallback
        market_type: bot.market_type || bot.marketType || 'SPOT',
        leverage: Number(bot.leverage) || 1,
        margin_type: bot.margin_type || 'CROSS',
        
        // Parámetros de riesgo (DATOS REALES)
        takeProfit: Number(bot.take_profit || bot.takeProfit) || 2.5,
        stopLoss: Number(bot.stop_loss || bot.stopLoss) || 1.5,
        riskPercentage: Number(bot.risk_percentage || bot.riskPercentage) || 1.0,
        
        // Parámetros avanzados de órdenes
        dca_levels: Number(bot.dca_levels) || 3,
        entry_order_type: bot.entry_order_type || 'MARKET',
        exit_order_type: bot.exit_order_type || 'MARKET',
        tp_order_type: bot.tp_order_type || 'LIMIT',
        sl_order_type: bot.sl_order_type || 'STOP_MARKET',
        trailing_stop: bot.trailing_stop || false,
        
        // Parámetros operacionales
        maxOpenPositions: bot.max_open_positions || 3,
        cooldownMinutes: bot.cooldown_minutes || 30,
        marketConditionFilter: bot.market_condition_filter !== false,
        volatilityThreshold: bot.volatility_threshold || 0.8,
      });
    }
    
    // GUARDRAILS P6 DIAGNOSTIC: Log bot data structure
    console.log('🔍 DIAGNÓSTICO BOT CONTROL:', {
      bot_exists: !!bot,
      bot_exchange_id: bot?.exchange_id,
      bot_full_data: bot
    });
    
    // DL-001 COMPLIANCE: Load dynamic data when bot is loaded
    if (bot && bot.exchange_id) {
      console.log('✅ Loading APIs with exchange_id:', bot.exchange_id);
      loadStrategies(bot.exchange_id);
      loadBaseCurrencies(bot.exchange_id);
      loadTradingIntervals(bot.exchange_id);
      loadMarginTypes(bot.exchange_id);
    }
  }, [bot]);

  // API loading functions
  const loadStrategies = async (exchangeId) => {
    if (!exchangeId) return;
    
    setStrategiesLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/strategies`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.strategies) {
          setStrategies(data.strategies);
          console.log(`✅ Loaded ${data.strategies.length} strategies for MODIFY`);
        } else {
          console.log('⚠️ No strategies in response for MODIFY');
          setStrategies([]);
        }
      } else {
        console.log('❌ Error loading strategies for MODIFY:', response.status);
        setStrategies([]);
      }
    } catch (error) {
      console.error('❌ Error loading strategies for MODIFY:', error);
      setStrategies([]);
    } finally {
      setStrategiesLoading(false);
    }
  };

  const loadBaseCurrencies = async (exchangeId) => {
    if (!exchangeId) return;
    
    setBaseCurrenciesLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/base-currencies`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.base_currencies) {
          setBaseCurrencies(data.base_currencies);
          console.log(`✅ Loaded ${data.base_currencies.length} base currencies for MODIFY`);
        } else {
          console.log('⚠️ No base currencies in response for MODIFY');
          setBaseCurrencies([]);
        }
      } else {
        console.log('❌ Error loading base currencies for MODIFY:', response.status);
        setBaseCurrencies([]);
      }
    } catch (error) {
      console.error('❌ Error loading base currencies for MODIFY:', error);
      setBaseCurrencies([]);
    } finally {
      setBaseCurrenciesLoading(false);
    }
  };

  const loadTradingIntervals = async (exchangeId) => {
    if (!exchangeId) return;
    
    setIntervalsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/trading-intervals`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.intervals) {
          const intervalOptions = data.intervals
            .filter(interval => interval.recommended || ['5m', '15m', '1h', '4h', '1d'].includes(interval.value))
            .map(interval => ({
              value: interval.value,
              label: interval.label,
              recommended: interval.recommended
            }));
          
          setIntervals(intervalOptions);
          console.log(`✅ Loaded ${intervalOptions.length} trading intervals for MODIFY`);
        } else {
          console.log('⚠️ No intervals in response for MODIFY');
          setIntervals([]);
        }
      } else {
        console.log('❌ Error loading intervals for MODIFY:', response.status);
        setIntervals([]);
      }
    } catch (error) {
      console.error('❌ Error loading intervals for MODIFY:', error);
      setIntervals([]);
    } finally {
      setIntervalsLoading(false);
    }
  };

  const loadMarginTypes = async (exchangeId) => {
    if (!exchangeId) return;
    
    setMarginTypesLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/user/exchanges/${exchangeId}/margin-types`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.margin_types) {
          setMarginTypes(data.margin_types);
          console.log(`✅ Loaded ${data.margin_types.length} margin types for MODIFY`);
        } else {
          console.log('⚠️ No margin types in response for MODIFY');
          setMarginTypes([]);
        }
      } else {
        console.log('❌ Error loading margin types for MODIFY:', response.status);
        setMarginTypes([]);
      }
    } catch (error) {
      console.error('❌ Error loading margin types for MODIFY:', error);
      setMarginTypes([]);
    } finally {
      setMarginTypesLoading(false);
    }
  };

  // Parameter change handler
  const handleParameterChange = (field, value) => {
    setParameters(prev => ({
      ...prev,
      [field]: value
    }));
    
    console.log(`🔧 Parameter changed: ${field} = ${value}`);
  };

  // Price loading with interval
  useEffect(() => {
    const loadCurrentPrice = async () => {
      if (!parameters.symbol) return;
      
      setLoadingPrice(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/market/price/${parameters.symbol.replace('/', '')}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.price) {
            setCurrentPrice(Number(data.price));
          }
        }
      } catch (error) {
        console.error('❌ Error loading current price:', error);
      } finally {
        setLoadingPrice(false);
      }
    };

    if (parameters.symbol) {
      loadCurrentPrice();
      const priceInterval = setInterval(loadCurrentPrice, 30000);
      return () => clearInterval(priceInterval);
    }
  }, [parameters.symbol]);

  return {
    parameters,
    setParameters,
    handleParameterChange,
    currentPrice,
    loadingPrice,
    strategies,
    strategiesLoading,
    baseCurrencies,
    baseCurrenciesLoading,
    intervals,
    intervalsLoading,
    marginTypes,
    marginTypesLoading
  };
}