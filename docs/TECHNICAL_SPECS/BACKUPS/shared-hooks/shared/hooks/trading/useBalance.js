import { useState, useCallback } from 'react';
// DL-076 COMPLIANCE: Direct hooks, no wrapper context
import useAuthenticatedFetch from '../../../features/auth/hooks/useAuthenticatedFetch';

/**
 * useBalance - Balance Management Hook
 * 
 * ✅ DL-001: Real exchange data only
 * ✅ SUCCESS CRITERIA: ≤150 lines (80 lines)
 * ✅ SINGLE RESPONSIBILITY: Balance fetching + management
 * ✅ DL-008: JWT authentication pattern
 * 
 * Extracted from useRealTimeData.js lines 260-413
 */
export const useBalance = (exchangeId) => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // ✅ Direct hook composition - no wrapper context
  const { authenticatedFetch } = useAuthenticatedFetch();

  // Fetch balance from real exchange
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
      console.error(`❌ No real balance data available for exchange ${exchangeId}`);
      setBalances({}); // ✅ DL-001: No mock data - empty state only
    } finally {
      setLoading(false);
    }
  }, [exchangeId, authenticatedFetch]);

  // Get balance for specific currency
  const getBalanceForCurrency = useCallback((currency) => {
    if (!balances || typeof balances !== 'object') return 0;
    return parseFloat(balances[currency] || balances[currency?.toLowerCase()] || 0);
  }, [balances]);

  // Get total number of currencies with balance
  const getTotalBalances = useCallback(() => {
    return Object.keys(balances).length;
  }, [balances]);

  // Check if has sufficient balance for trade
  const hasSufficientBalance = useCallback((currency, requiredAmount) => {
    const available = getBalanceForCurrency(currency);
    return available >= parseFloat(requiredAmount || 0);
  }, [getBalanceForCurrency]);

  return {
    balances,
    loading,
    error,
    fetchBalances,
    getBalanceForCurrency,
    getTotalBalances,
    hasSufficientBalance
  };
};

export default useBalance;