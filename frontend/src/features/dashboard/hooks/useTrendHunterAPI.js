// useTrendHunterAPI.js
// SPEC_REF: docs/TECHNICAL_SPECS/MODE_ARCHITECTURE_TECH/TREND_HUNTER_MODE_ARCHITECTURE.md
// DL-001: Real data only, no hardcode
// DL-008: Authentication centralization compliance
// DL-076: Specialized hooks pattern ≤150 lines

import { useState, useCallback } from 'react';

export const useTrendHunterAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

  const fetchTrendHunterAnalysis = useCallback(async (symbol, interval = '4h') => {
    console.log('🎯 DL-102: TrendHunter API call initiated', { symbol, interval });

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('intelibotx_token');

      const response = await fetch(`${BASE_URL}/api/run-smart-trade/${symbol}?trend_hunter_mode=true&quantity=0.001&execute_real=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`TrendHunter API error: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ DL-102: TrendHunter analysis received', {
        symbol,
        mode: data.mode_decision,
        algorithms: Object.keys(data.institutional_confirmations || {}),
        trend_strength: data.trend_analysis?.trend_strength
      });

      return {
        success: true,
        data: transformTrendHunterResponse(data),
        raw: data
      };

    } catch (err) {
      console.error('❌ DL-102: TrendHunter API error', { symbol, error: err.message });
      setError(err.message);
      return {
        success: false,
        error: err.message,
        data: null
      };
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  const fetchTrendHunterMarketData = useCallback(async (symbol, market_type = 'FUTURES') => {
    console.log('🎯 DL-102: TrendHunter market data fetch', { symbol, market_type });

    try {
      const token = localStorage.getItem('intelibotx_token');

      const response = await fetch(`${BASE_URL}/api/market-data/${symbol}?market_type=${market_type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Market data error: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ DL-102: TrendHunter market data received', {
        symbol,
        price: data.price,
        change_24h: data.change_24h
      });

      return {
        success: true,
        data: data
      };

    } catch (err) {
      console.error('❌ DL-102: TrendHunter market data error', { symbol, error: err.message });
      setError(err.message);
      return {
        success: false,
        error: err.message,
        data: null
      };
    }
  }, [BASE_URL]);

  return {
    loading,
    error,
    fetchTrendHunterAnalysis,
    fetchTrendHunterMarketData
  };
};

// Transform backend response to frontend format
function transformTrendHunterResponse(backendData) {
  try {
    const {
      symbol,
      mode_decision,
      algorithm_decision,
      institutional_confirmations = {},
      trend_analysis = {},
      market_data = []
    } = backendData;

    // Transform SMC analysis
    const smcAnalysis = {
      break_of_structure: trend_analysis.smc_analysis?.break_of_structure || [],
      change_of_character: trend_analysis.smc_analysis?.change_of_character || [],
      order_blocks: trend_analysis.smc_analysis?.order_blocks || {},
      fair_value_gaps: trend_analysis.smc_analysis?.fair_value_gaps || {},
      smc_score: trend_analysis.smc_analysis?.smc_score || 0
    };

    // Transform Market Profile analysis
    const marketProfileAnalysis = {
      point_of_control: trend_analysis.market_profile_analysis?.point_of_control || 0,
      value_area_high: trend_analysis.market_profile_analysis?.value_area_high || 0,
      value_area_low: trend_analysis.market_profile_analysis?.value_area_low || 0,
      profile_trend: trend_analysis.market_profile_analysis?.profile_trend || 'NEUTRAL',
      market_profile_score: trend_analysis.market_profile_analysis?.market_profile_score || 0
    };

    // Transform VSA analysis
    const vsaAnalysis = {
      vsa_signals: trend_analysis.vsa_analysis?.vsa_signals || [],
      volume_trend: trend_analysis.vsa_analysis?.volume_trend || 'NEUTRAL',
      vsa_score: trend_analysis.vsa_analysis?.vsa_score || 0
    };

    // Transform institutional confirmations
    const transformedConfirmations = {
      smc_breakouts: institutional_confirmations.smc_breakouts || 0,
      order_block_retests: institutional_confirmations.order_block_retests || 0,
      value_area_position: institutional_confirmations.value_area_position || 'NEUTRAL',
      poc_alignment: institutional_confirmations.poc_alignment || 'MISALIGNED',
      volume_confirmation: institutional_confirmations.volume_confirmation || 'WEAK',
      vsa_signals_count: institutional_confirmations.vsa_signals_count || 0
    };

    // Transform chart data
    const chartData = Array.isArray(market_data) ? market_data.map(item => ({
      timestamp: item.timestamp,
      time: new Date(item.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      price: parseFloat(item.price || item.close || item.c || 0),
      volume: parseFloat(item.volume || item.v || 0),
      high: parseFloat(item.high || item.h || 0),
      low: parseFloat(item.low || item.l || 0),
      // TrendHunter specific overlays
      smc_levels: item.smc_levels,
      profile_levels: item.profile_levels,
      vsa_signals: item.vsa_signals
    })).filter(item => item.price > 0) : [];

    return {
      symbol,
      mode: mode_decision,
      algorithm: algorithm_decision,
      trend_strength: trend_analysis.trend_strength || 0,
      smc_analysis: smcAnalysis,
      market_profile_analysis: marketProfileAnalysis,
      vsa_analysis: vsaAnalysis,
      institutional_confirmations: transformedConfirmations,
      recommendation: trend_analysis.recommendation || {
        action: 'HOLD',
        confidence: 'LOW',
        risk_level: 'HIGH'
      },
      chart_data: chartData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ TrendHunter data transformation error:', error);
    return {
      symbol: backendData.symbol || '',
      mode: 'TREND_HUNTER',
      error: 'Data transformation failed',
      chart_data: []
    };
  }
}