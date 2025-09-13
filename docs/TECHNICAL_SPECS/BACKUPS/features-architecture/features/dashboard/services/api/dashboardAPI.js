/**
 * 📊 Dashboard API - Specialized API Calls Handler
 * EXTRACTED FROM: dashboardService.js (DL-081 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Dashboard API calls + authentication + error handling
 * LINES TARGET: ≤120 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

/**
 * Get authentication headers for API calls
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('intelibotx_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Generic API call handler with error management
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error fetching ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get complete dashboard summary
 */
export const getDashboardSummary = async () => {
  return await apiCall('/api/dashboard/summary');
};

/**
 * Get balance evolution data for charts
 */
export const getBalanceEvolution = async (days = 30, symbol = null) => {
  const params = new URLSearchParams();
  params.append('days', days.toString());
  if (symbol) params.append('symbol', symbol);
  
  return await apiCall(`/api/dashboard/balance-evolution?${params.toString()}`);
};

/**
 * Get individual bots performance data
 */
export const getBotsPerformance = async (days = 7) => {
  return await apiCall(`/api/dashboard/bots-performance?days=${days}`);
};

/**
 * Get symbols analysis data
 */
export const getSymbolsAnalysis = async (days = 7) => {
  return await apiCall(`/api/dashboard/symbols-analysis?days=${days}`);
};

export default {
  getDashboardSummary,
  getBalanceEvolution,
  getBotsPerformance,
  getSymbolsAnalysis
};