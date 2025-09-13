/**
 * 🏛️ SmartScalperMetrics - Institutional Transparency Dashboard
 * 
 * SPEC_REF: DL-088 SmartScalperMetrics Institutional Transformation
 * COMPLIANCE: DL-002 (Institutional Only) + DL-076 (≤150 lines) + DL-008 (Auth Pattern)
 * 
 * RESPONSIBILITY: Main modal container + authentication + institutional algorithm orchestration
 * PHILOSOPHY: Bot Único Smart Scalper institutional transparency for user understanding
 * 
 * ALGORITHMS: INSTITUTIONAL ONLY - Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, Fair Value Gaps, Market Microstructure
 * NO RETAIL: Eliminated RSI, MACD, EMA references per DL-002 ALGORITHMIC POLICY
 * 
 * Eduard Guzmán - InteliBotX
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthDL008 } from '../shared/hooks/useAuthDL008';
import SmartScalperAnalysisPanel from '../features/dashboard/components/SmartScalperAnalysisPanel';
import SmartScalperPerformanceView from '../features/dashboard/components/SmartScalperPerformanceView';
import { Building, Activity, TrendingUp, Shield, X } from "lucide-react";

export default function SmartScalperMetrics({ bot, realTimeData, onClose }) {
  // ✅ DL-008: Authentication Pattern Hook
  const { authenticatedFetch } = useAuthDL008();
  
  const [institutionalMetrics, setInstitutionalMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [performanceData, setPerformanceData] = useState({});

  // 🏛️ DL-002 COMPLIANCE: Fetch ONLY institutional algorithm analysis
  useEffect(() => {
    const fetchInstitutionalAnalysis = async () => {
      if (!bot?.symbol) return;

      try {
        setLoading(true);
        setError(null);

        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
        const token = localStorage.getItem('intelibotx_token');

        // 🎯 PRIMARY: Smart Scalper Institutional Analysis
        const response = await fetch(`${BASE_URL}/api/run-smart-trade/${bot.symbol}?scalper_mode=true&quantity=0.001&execute_real=false`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          // 🏛️ DL-002 INSTITUTIONAL MAPPING: Only institutional algorithms
          if (data.analysis) {
            setAnalysisData({
              algorithm_selected: data.analysis.algorithm_selected,
              market_regime: data.analysis.market_regime,
              institutional_confidence: data.analysis.selection_confidence,
              wyckoff_phase: data.analysis.wyckoff_phase || 'ACCUMULATION',
              risk_assessment: data.analysis.risk_assessment?.overall_risk || 'LOW',
              top_algorithms: data.top_algorithms?.map(algo => ({
                algorithm: algo.algorithm,
                confidence: parseFloat(algo.confidence?.replace('%', '')) || 0,
                score: parseFloat(algo.score?.replace('%', '')) || 0
              })) || []
            });

            setInstitutionalMetrics({
              algorithm_used: data.analysis.algorithm_selected,
              confidence_level: data.analysis.selection_confidence,
              market_condition: data.analysis.market_regime,
              institutional_quality_score: data.analysis.institutional_quality_score || null
            });
          }
        } else {
          throw new Error(`API Error: ${response.status}`);
        }

        // 📊 Performance metrics from bot data
        setPerformanceData({
          totalTrades: bot.total_trades || 0,
          successfulTrades: bot.successful_trades || 0,
          winRate: bot.win_rate || 0,
          avgProfit: bot.avg_profit_per_trade || 0,
          currentStatus: bot.status || 'stopped'
        });

      } catch (err) {
        console.error('🚨 Institutional Analysis Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutionalAnalysis();
    
    // 🔄 REAL-TIME: Update every 15 seconds for institutional data freshness
    const interval = setInterval(fetchInstitutionalAnalysis, 15000);
    return () => clearInterval(interval);
  }, [bot?.symbol]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl bg-gray-900 border-gray-700 m-4">
          <CardContent className="p-8 text-center">
            <Activity className="animate-spin mx-auto mb-4 text-blue-400" size={48} />
            <h3 className="text-xl text-white">Loading Institutional Analysis...</h3>
            <p className="text-gray-400">Analyzing {bot?.symbol} with institutional algorithms</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] bg-gray-900 border-gray-700 m-4 overflow-hidden">
        <CardHeader className="border-b border-gray-700 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building className="text-blue-400" size={28} />
                <CardTitle className="text-2xl text-white">
                  Smart Scalper Institutional Analysis
                </CardTitle>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Bot Único Mode
                </Badge>
              </div>
              <p className="text-gray-400">
                {bot?.symbol} • {institutionalMetrics.algorithm_used || 'Institutional Algorithm Matrix'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="text-gray-400 hover:text-white" size={24} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* 🏛️ LEFT PANEL: Institutional Analysis */}
            <div>
              <SmartScalperAnalysisPanel 
                analysisData={analysisData}
                institutionalMetrics={institutionalMetrics}
                botSymbol={bot?.symbol}
                error={error}
              />
            </div>

            {/* 📊 RIGHT PANEL: Performance Metrics */}
            <div>
              <SmartScalperPerformanceView
                performanceData={performanceData}
                bot={bot}
                realTimeData={realTimeData}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}