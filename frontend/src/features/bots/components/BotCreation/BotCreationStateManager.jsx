import { useState, useEffect } from 'react';
// DL-076 COMPLIANCE: Direct hooks, no wrapper context
import useAuthState from '../../../auth/hooks/useAuthState';
import useExchangeOperations from '../../../exchanges/hooks/useExchangeOperations';
import { useAuthDL008 } from "../../../../shared/hooks/useAuthDL008";
import { useRealTimeData, useExchangeBalance } from '../../../../shared/hooks/useRealTimeData';
import { calculateMonetaryValues } from '../../../../utils/botCalculations';

const useBotCreationState = (isOpen) => {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();
  // ✅ Direct hook composition - no wrapper context
  const { isAuthenticated } = useAuthState();
  const { userExchanges, loadUserExchanges } = useExchangeOperations();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Exchange', 'Configuración', 'Avanzado', 'Revisión'];
  
  // Core state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTCUSDT',
    exchange_id: null,
    base_currency: 'USDT',
    quote_currency: 'BTC',
    stake: 100,
    strategy: 'Smart Scalper',
    interval: '15m',
    take_profit: 2.5,
    stop_loss: 1.5,
    leverage: 1,
    market_type: 'SPOT',
    margin_type: 'ISOLATED'
  });
  
  // API data loading states
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [marketTypes, setMarketTypes] = useState([]);
  const [marketTypesLoading, setMarketTypesLoading] = useState(false);
  const [strategies, setStrategies] = useState([]);
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [baseCurrencies, setBaseCurrencies] = useState([]);
  const [baseCurrenciesLoading, setBaseCurrenciesLoading] = useState(false);
  const [intervals, setIntervals] = useState([]);
  const [intervalsLoading, setIntervalsLoading] = useState(false);
  const [marginTypes, setMarginTypes] = useState([]);
  const [marginTypesLoading, setMarginTypesLoading] = useState(false);
  
  // Real-time data
  const realTimeData = useRealTimeData(selectedExchange?.id, formData.symbol);
  const balanceData = useExchangeBalance(selectedExchange?.id);

  // Calculate monetary values
  const monetaryValues = realTimeData.currentPrice ? 
    calculateMonetaryValues(formData, realTimeData.currentPrice, balanceData.getBalance(formData.base_currency)) : 
    { tpValue: 0, slValue: 0, positionSize: 0 };

  // Load exchanges on open
  useEffect(() => {
    if (isOpen && isAuthenticated && (!userExchanges || userExchanges.length === 0)) {
      setLoading(true);
      loadUserExchanges()
        .then(() => setLoading(false))
        .catch((error) => {
          console.error('Error loading exchanges:', error);
          setError('Error cargando exchanges. Inténtalo de nuevo.');
          setLoading(false);
        });
    }
  }, [isOpen, isAuthenticated, userExchanges, loadUserExchanges]);

  // Set first exchange as default
  useEffect(() => {
    if (userExchanges?.length > 0 && !selectedExchange) {
      setSelectedExchange(userExchanges[0]);
      setFormData(prev => ({ ...prev, exchange_id: userExchanges[0].id }));
    }
  }, [userExchanges, selectedExchange]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setError('');
      setSelectedExchange(null);
      setShowAdvancedConfig(false);
      setFormData({
        name: '',
        symbol: 'BTCUSDT',
        exchange_id: null,
        base_currency: 'USDT',
        quote_currency: 'BTC',
        stake: 100,
        strategy: 'Smart Scalper',
        interval: '15m',
        take_profit: 2.5,
        stop_loss: 1.5,
        leverage: 1,
        market_type: 'SPOT',
        margin_type: 'ISOLATED'
      });
    }
  }, [isOpen]);

  return {
    // Authentication
    authenticatedFetch,
    userExchanges,
    isAuthenticated,
    loadUserExchanges,
    
    // Step management
    currentStep,
    setCurrentStep,
    steps,
    
    // Core state
    loading,
    setLoading,
    error,
    setError,
    selectedExchange,
    setSelectedExchange,
    showAdvancedConfig,
    setShowAdvancedConfig,
    
    // Form data
    formData,
    setFormData,
    
    // API data states
    availableSymbols,
    setAvailableSymbols,
    symbolsLoading,
    setSymbolsLoading,
    marketTypes,
    setMarketTypes,
    marketTypesLoading,
    setMarketTypesLoading,
    strategies,
    setStrategies,
    strategiesLoading,
    setStrategiesLoading,
    baseCurrencies,
    setBaseCurrencies,
    baseCurrenciesLoading,
    setBaseCurrenciesLoading,
    intervals,
    setIntervals,
    intervalsLoading,
    setIntervalsLoading,
    marginTypes,
    setMarginTypes,
    marginTypesLoading,
    setMarginTypesLoading,
    
    // Real-time data
    realTimeData,
    balanceData,
    monetaryValues
  };
};

export default useBotCreationState;