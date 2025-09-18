/**
 * useSmartScalperAPI - Smart Scalper API Calls Specialist Hook
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Smart Scalper API orchestration + multi-layer failover
 * LINES TARGET: ≤120 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback } from 'react';
import { useAuthDL008 } from '../../../shared/hooks/useAuthDL008';

export const useSmartScalperAPI = () => {
  const { authenticatedFetch } = useAuthDL008();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

  // 🚀 DL-092: NEW Bot-specific analysis using REAL institutional algorithms
  const fetchBotSpecificAnalysis = useCallback(async (botId) => {
    if (!botId) return null;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('intelibotx_token');

      // NEW: Bot-specific institutional analysis API
      const response = await fetch(`${BASE_URL}/api/bot-technical-analysis/${botId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          // Map REAL institutional data to frontend format
          return {
            algorithm_used: data.analysis.selected_algorithm,
            market_condition: data.analysis.wyckoff_phase,
            confidence: data.analysis.algorithm_confidence * 100, // Convert to percentage
            risk_score: data.analysis.manipulation_risk,
            wyckoff_phase: data.analysis.wyckoff_phase,
            order_blocks: data.analysis.order_blocks?.length || 0,
            liquidity_grabs: data.analysis.liquidity_grabs ? 1 : 0,
            stop_hunting: data.analysis.stop_hunting || 0,
            fair_value_gaps: data.analysis.fair_value_gaps?.length || 0,
            conditions_met: data.analysis.algorithm_reasons || [],
            expected_performance: {
              win_rate: data.analysis.algorithm_score || null,
              confidence_level: data.analysis.algorithm_confidence || null
            },
            // Bot-specific context
            bot_context: {
              strategy: data.bot_context?.strategy,
              risk_percentage: data.bot_context?.risk_percentage,
              leverage: data.bot_context?.leverage,
              market_type: data.bot_context?.market_type
            },
            // Risk-adjusted signals using bot parameters
            risk_adjusted_signal: data.analysis.risk_adjusted_signal,
            data_source: 'bot_specific_real_algorithms',
            compliance: data.compliance
          };
        }
      }

      throw new Error('Bot-specific analysis API failed');

    } catch (err) {
      console.error('❌ Bot-specific analysis error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch, BASE_URL]);

  // 🔄 BACKWARDS COMPATIBILITY: Keep existing generic function
  const fetchSmartScalperAnalysis = useCallback(async (botSymbol) => {
    if (!botSymbol) return null;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('intelibotx_token');

      // Legacy: Generic Smart Scalper API call (for backward compatibility)
      const response = await fetch(`${BASE_URL}/api/run-smart-trade/${botSymbol}?scalper_mode=true&quantity=0.001&execute_real=false`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (response && response.ok) {
        const data = await response.json();
        if (data.analysis) {
          return {
            algorithm_used: data.analysis.algorithm_selected,
            market_condition: data.analysis.market_regime,
            confidence: parseConfidence(data.analysis.selection_confidence),
            risk_score: data.analysis.risk_assessment?.overall_risk || null,
            wyckoff_phase: data.analysis.wyckoff_phase ?? null,
            conditions_met: Object.keys(data.signals?.institutional_confirmations || {}),
            expected_performance: {
              win_rate: data.analysis?.institutional_quality_score || null,
              confidence_level: data.analysis?.institutional_confidence_level || null
            },
            all_algorithms_evaluated: data.top_algorithms?.map(algo => ({
              algorithm: algo.algorithm,
              confidence: parseFloat(algo.confidence?.replace('%', '')) || 0,
              score: parseFloat(algo.score?.replace('%', '')) || 0
            })) || [],
            data_source: 'backend_api_primary'
          };
        }
      }
      
      throw new Error('Smart Scalper API failed');
      
    } catch (err) {
      console.error('❌ Smart Scalper API Error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [BASE_URL]);

  const fetchTechnicalAnalysis = useCallback(async (botSymbol, timeframe = '15m') => {
    if (!botSymbol) return null;
    
    try {
      const token = localStorage.getItem('intelibotx_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      // Multi-layer failover system
      let response = null;
      let dataSource = 'UNKNOWN';

      // Layer 1: Primary authenticated endpoint
      if (token) {
        try {
          response = await Promise.race([
            fetch(`${BASE_URL}/api/user/technical-analysis`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                symbol: botSymbol,
                timeframe,
                strategy: 'Smart Scalper'
              })
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Primary timeout')), 3000))
          ]);
          dataSource = response.ok ? 'PRIMARY_AUTHENTICATED' : 'PRIMARY_FAILED';
        } catch (error) {
          dataSource = 'PRIMARY_TIMEOUT';
        }
      }

      // Layer 2: Public endpoint fallback
      if (!response || !response.ok) {
        try {
          response = await Promise.race([
            fetch(`${BASE_URL}/api/real-indicators/${botSymbol}?timeframe=${timeframe}`),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Alternative timeout')), 2000))
          ]);
          dataSource = response.ok ? 'ALTERNATIVE_PUBLIC' : 'ALTERNATIVE_FAILED';
        } catch (error) {
          dataSource = 'ALTERNATIVE_TIMEOUT';
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            data: data.data,
            dataSource
          };
        }
      }

      return { data: null, dataSource };

    } catch (error) {
      console.error('❌ Technical Analysis Error:', error);
      return { data: null, dataSource: 'ERROR' };
    }
  }, [BASE_URL]);

  // Helper function
  const parseConfidence = (confStr) => {
    if (!confStr || typeof confStr !== 'string') return null;
    const confNum = parseFloat(confStr.replace('%', ''));
    return isNaN(confNum) ? null : confNum / 100;
  };

  return {
    fetchSmartScalperAnalysis,           // Legacy: Generic symbol-based analysis
    fetchBotSpecificAnalysis,            // NEW: Bot-specific institutional analysis
    fetchTechnicalAnalysis,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export default useSmartScalperAPI;
