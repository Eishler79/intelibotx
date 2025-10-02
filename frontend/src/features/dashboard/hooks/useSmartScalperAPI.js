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

export const useSmartScalperAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';

  const mapSmartTradeResult = (payload, source) => {
    if (!payload || !payload.analysis) return null;

    const analysis = payload.analysis;
    const signals = payload.signals || {};

    return {
      algorithm_used: analysis.algorithm_selected,
      market_condition: analysis.market_regime,
      confidence: parseConfidence(analysis.selection_confidence),
      risk_score: analysis.risk_assessment?.overall_risk ?? null,
      wyckoff_phase: analysis.wyckoff_phase ?? null,
      conditions_met: Object.keys(signals.institutional_confirmations || {}),
      institutional_confirmations: signals.institutional_confirmations || {},  // 🔍 BACKLOG#480: Pasar data completa con scores y bias
      expected_performance: {
        win_rate: analysis.institutional_quality_score ?? null,
        confidence_level: analysis.institutional_confidence_level ?? null
      },
      all_algorithms_evaluated: payload.top_algorithms?.map(algo => ({
        algorithm: algo.algorithm,
        confidence: parseFloat(algo.confidence?.replace('%', '')) || 0,
        score: parseFloat(algo.score?.replace('%', '')) || 0
      })) || [],
      institutional_confirmations_breakdown: analysis.institutional_confirmations_breakdown || {},
      smart_money_recommendation: analysis.smart_money_recommendation || signals.smart_money_recommendation || null,
      signal_reason: signals.reason || null,
      signals,
      data_source: source,
      mode_decision: analysis.mode_decision || payload.mode_decision || null,
      manipulation_alerts: signals.manipulation_alerts || []
    };
  };

  // 🚀 DL-092: Bot-specific analysis - MODAL ONLY SHOWS MARKET DATA
  const fetchBotSpecificAnalysis = useCallback(async (botId, botSymbol, bot = null) => {
    console.log('🔍 fetchBotSpecificAnalysis LLAMADO (MODAL VIEW ONLY):', {
      botId,
      botSymbol,
      bot_status: bot?.status,
      bot_market_type: bot?.market_type,
      BASE_URL
    });

    if (!botId || !botSymbol) return null;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('intelibotx_token');

      // 📊 MODAL FIX: Use market-data for viewing, NOT run-smart-trade
      // run-smart-trade only executes in background when bot is RUNNING
      // DL-103 FIX: Use path parameter, not query parameter
      const url = `${BASE_URL}/api/market-data/${botSymbol}`;
      console.log('🔍 Modal usando market-data (VIEW ONLY):', { url, hasToken: !!token });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      console.log('🔍 DESPUÉS de fetch - Respuesta:', {
        status: response?.status,
        ok: response?.ok,
        statusText: response?.statusText,
        headers: response?.headers
      });

      if (response && response.ok) {
        const data = await response.json();
        console.log('🔍 MARKET DATA recibida (modal view only):', data);

        // 📊 Process market-data response for modal visualization
        // This is VIEW ONLY - no trading execution
        return {
          execution_blocked: false,
          message: 'Market data for visualization',
          algorithm_used: 'MARKET_VIEW',
          market_condition: data.trend || 'NEUTRAL',
          price: data.price || 0,
          volume_24h: data.volume_24h || 0,
          price_change_24h: data.price_change_24h || 0,
          confidence: 0,
          signal: 'VIEW_ONLY',
          recommendation: 'Modal visualization mode',
          mode_decision: 'VISUALIZATION',
          klines: data.klines || [],
          orderbook: data.orderbook || {},
          recent_trades: data.recent_trades || []
        };
      }

      throw new Error(`Smart trade API failed: ${response?.status} ${response?.statusText}`);

    } catch (err) {
      console.error('❌ Bot-specific analysis error:', err);
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
    fetchBotSpecificAnalysis,            // Bot-specific analysis via Smart Trade endpoint
    fetchTechnicalAnalysis,
    loading,
    error,
    clearError: () => setError(null)
  };
};

export default useSmartScalperAPI;
