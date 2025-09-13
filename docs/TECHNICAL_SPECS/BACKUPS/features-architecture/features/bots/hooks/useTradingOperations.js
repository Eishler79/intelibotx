import { useState, useCallback, useRef } from 'react';
import { useAuthDL008 } from "../../shared/hooks/useAuthDL008";
import { runSmartTrade, createTradingOperation } from '../../../services/api';

export const useTradingOperations = () => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();
  
  // Trading signals state management
  const [tradeSignals, setTradeSignals] = useState([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(false);
  const [signalsError, setSignalsError] = useState(null);
  const [lastSignalUpdate, setLastSignalUpdate] = useState(null);
  
  // Smart Scalper Pro execution state
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [tradingMetrics, setTradingMetrics] = useState({
    totalSignals: 0,
    successRate: 0,
    avgConfidence: 0,
    lastExecution: null
  });
  
  // Real-time updates ref for interval management
  const signalsInterval = useRef(null);
  const executionTimeout = useRef(null);

  // ✅ DL-001 COMPLIANT: Load real institutional signals from API
  const loadInstitutionalSignals = useCallback(async (symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']) => {
    if (isLoadingSignals) return;
    
    try {
      setIsLoadingSignals(true);
      setSignalsError(null);
      
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      const promises = symbols.map(async (symbol) => {
        try {
          // Real API call for institutional analysis
          const response = await authenticatedFetch(`${BASE_URL}/api/signals/institutional/${symbol}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`⚠️ API failed for ${symbol}, using fallback`);
            return getInstitutionalFallback(symbol);
          }

          const data = await response.json();
          return {
            symbol,
            signal: data.signal || 'HOLD',
            confidence: data.confidence || 50,
            price: data.current_price || 0,
            volume: data.volume || 0,
            timestamp: data.timestamp || new Date().toISOString(),
            analysis: data.analysis || {},
            source: 'API'
          };
        } catch (error) {
          console.warn(`⚠️ Error loading ${symbol}:`, error);
          return getInstitutionalFallback(symbol);
        }
      });

      const results = await Promise.all(promises);
      const validSignals = results.filter(signal => signal && signal.confidence > 55);
      
      setTradeSignals(validSignals);
      setLastSignalUpdate(new Date().toISOString());
      
      // Update trading metrics
      setTradingMetrics(prev => ({
        ...prev,
        totalSignals: validSignals.length,
        avgConfidence: validSignals.length > 0 
          ? (validSignals.reduce((sum, s) => sum + s.confidence, 0) / validSignals.length).toFixed(1)
          : 0,
        lastExecution: new Date().toISOString()
      }));

      console.log(`📈 Loaded ${validSignals.length} institutional signals`);
      return validSignals;
      
    } catch (error) {
      console.error('❌ Error loading institutional signals:', error);
      setSignalsError(error.message);
      
      // Fallback to institutional-style signals
      const fallbackSignals = symbols.map(symbol => getInstitutionalFallback(symbol));
      setTradeSignals(fallbackSignals);
      return fallbackSignals;
      
    } finally {
      setIsLoadingSignals(false);
    }
  }, [authenticatedFetch, isLoadingSignals]);

  // ❌ DL-001 VIOLATION REMOVED: No simulation data fallback
  const getInstitutionalFallback = useCallback((symbol) => {
    // Return error signal when API fails - no simulation
    console.error(`❌ No real data available for ${symbol} - API failure`);
    
    return {
      symbol,
      signal: 'HOLD', // Safe default - no trading without real data
      confidence: 0, // Zero confidence without real data
      price: 0,
      volume: 0,
      timestamp: new Date().toISOString(),
      analysis: {
        error: 'API_FAILURE',
        message: 'No real institutional data available',
        institutional_level: 'UNAVAILABLE',
        algorithm_type: 'ERROR_STATE'
      },
      source: 'ERROR_NO_SIMULATION'
    };
  }, []);

  // ✅ DL-001 COMPLIANT: Execute Smart Scalper Pro with real trading operations
  const executeSmartScalperPro = useCallback(async (bot) => {
    if (!bot || isExecutingTrade) return;
    
    try {
      setIsExecutingTrade(true);
      console.log(`🚀 Executing Smart Scalper Pro for ${bot.symbol}`);
      
      // Real Smart Scalper execution with institutional algorithms
      const tradeSignal = await runSmartTrade(bot.symbol, bot.strategy, {
        stake: bot.stake,
        riskPercentage: bot.risk_percentage || 1.0,
        takeProfit: bot.take_profit,
        stopLoss: bot.stop_loss,
        leverage: bot.leverage || 1,
        marketType: bot.market_type
      });
      
      if (tradeSignal?.signal && tradeSignal.signal !== 'HOLD') {
        console.log(`🎯 ${tradeSignal.signal} signal generated:`, tradeSignal);
        
        // Create persistent trading operation in database
        const tradingOp = await createTradingOperation({
          bot_id: bot.id,
          symbol: bot.symbol,
          side: tradeSignal.signal,
          quantity: tradeSignal.quantity || bot.stake,
          price: tradeSignal.entry_price || tradeSignal.current_price,
          take_profit: tradeSignal.take_profit,
          stop_loss: tradeSignal.stop_loss,
          strategy: bot.strategy,
          confidence: tradeSignal.confidence,
          analysis_data: tradeSignal.analysis || {}
        });
        
        console.log('💾 Trading operation persisted:', tradingOp);
        
        // Update execution history
        setExecutionHistory(prev => [{
          id: tradingOp.id || Date.now(),
          bot_id: bot.id,
          symbol: bot.symbol,
          signal: tradeSignal.signal,
          confidence: tradeSignal.confidence,
          timestamp: new Date().toISOString(),
          status: 'executed'
        }, ...prev.slice(0, 49)]); // Keep last 50 executions
        
        // Update success rate
        setTradingMetrics(prev => ({
          ...prev,
          successRate: (prev.successRate * 0.9 + (tradeSignal.confidence > 70 ? 10 : 0)).toFixed(1),
          lastExecution: new Date().toISOString()
        }));
        
        return {
          success: true,
          signal: tradeSignal,
          operation: tradingOp
        };
      }
      
      return {
        success: false,
        message: 'No trading signal generated',
        signal: tradeSignal
      };
      
    } catch (error) {
      console.error('❌ Error executing Smart Scalper Pro:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsExecutingTrade(false);
    }
  }, [isExecutingTrade]);

  // Start real-time signals monitoring
  const startSignalsMonitoring = useCallback((symbols, intervalMs = 30000) => {
    if (signalsInterval.current) {
      clearInterval(signalsInterval.current);
    }
    
    console.log(`📡 Starting real-time signals monitoring every ${intervalMs/1000}s`);
    
    // Initial load
    loadInstitutionalSignals(symbols);
    
    // Set up interval for continuous updates
    signalsInterval.current = setInterval(() => {
      loadInstitutionalSignals(symbols);
    }, intervalMs);
    
    return () => {
      if (signalsInterval.current) {
        clearInterval(signalsInterval.current);
        signalsInterval.current = null;
      }
    };
  }, [loadInstitutionalSignals]);

  // Stop signals monitoring
  const stopSignalsMonitoring = useCallback(() => {
    if (signalsInterval.current) {
      clearInterval(signalsInterval.current);
      signalsInterval.current = null;
      console.log('🛑 Stopped signals monitoring');
    }
  }, []);

  // Clear execution history
  const clearExecutionHistory = useCallback(() => {
    setExecutionHistory([]);
    setTradingMetrics(prev => ({
      ...prev,
      totalSignals: 0,
      successRate: 0,
      lastExecution: null
    }));
  }, []);

  // Filter signals by confidence threshold
  const getFilteredSignals = useCallback((minConfidence = 60) => {
    return tradeSignals.filter(signal => signal.confidence >= minConfidence);
  }, [tradeSignals]);

  // Get signals by symbol
  const getSignalsBySymbol = useCallback((symbol) => {
    return tradeSignals.filter(signal => signal.symbol === symbol);
  }, [tradeSignals]);

  // Manual signal refresh
  const refreshSignals = useCallback(async (symbols) => {
    console.log('🔄 Manually refreshing signals...');
    return await loadInstitutionalSignals(symbols);
  }, [loadInstitutionalSignals]);

  return {
    // State
    tradeSignals,
    isLoadingSignals,
    signalsError,
    lastSignalUpdate,
    isExecutingTrade,
    executionHistory,
    tradingMetrics,
    
    // Operations
    loadInstitutionalSignals,
    executeSmartScalperPro,
    refreshSignals,
    
    // Monitoring
    startSignalsMonitoring,
    stopSignalsMonitoring,
    
    // Utilities
    getFilteredSignals,
    getSignalsBySymbol,
    clearExecutionHistory,
    
    // Fallback
    getInstitutionalFallback
  };
};