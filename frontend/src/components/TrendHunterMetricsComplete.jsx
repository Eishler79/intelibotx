// TrendHunterMetricsComplete.jsx
// SPEC_REF: docs/TECHNICAL_SPECS/MODE_ARCHITECTURE_TECH/TREND_HUNTER_MODE_ARCHITECTURE.md
// DL-001: Real data only, no hardcode
// DL-008: Authentication centralization compliance
// DL-076: Specialized hooks pattern ≤150 lines

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useTrendHunterAPI } from '../features/dashboard/hooks/useTrendHunterAPI';
import InstitutionalChart from './InstitutionalChart';

const TrendHunterMetricsComplete = ({ bot, onClose }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const { fetchTrendHunterAnalysis, fetchTrendHunterMarketData } = useTrendHunterAPI();

  useEffect(() => {
    const fetchCompleteAnalysis = async (isInitialLoad = true) => {
      if (!bot?.symbol) return;

      console.log('🎯 DL-102: TrendHunter modal analysis starting', {
        symbol: bot.symbol,
        strategy: bot.strategy
      });

      if (isInitialLoad) setLoading(true);

      try {
        // Fetch TrendHunter analysis and market data
        const [analysisResult, priceResult] = await Promise.all([
          fetchTrendHunterAnalysis(bot.symbol, bot.interval || '4h'),
          fetchTrendHunterMarketData(bot.symbol, bot.market_type || 'FUTURES')
        ]);

        if (analysisResult.success) {
          setAnalysisData(analysisResult.data);
          console.log('✅ DL-102: TrendHunter analysis updated', {
            mode: analysisResult.data.mode,
            trend_strength: analysisResult.data.trend_strength
          });
        }

        if (priceResult.success) {
          setCurrentPrice(priceResult.data.price);
        }

      } catch (error) {
        console.error('❌ DL-102: TrendHunter analysis error', error);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    };

    fetchCompleteAnalysis();

    // Real-time updates every 30 seconds for trends
    const interval = setInterval(() => fetchCompleteAnalysis(false), 30000);
    return () => clearInterval(interval);
  }, [bot?.symbol, bot?.interval, bot?.market_type, fetchTrendHunterAnalysis, fetchTrendHunterMarketData]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
          <div className="flex items-center text-blue-300">
            <Activity className="animate-spin mr-3" size={24} />
            Loading TrendHunter Analysis...
          </div>
        </div>
      </div>
    );
  }

  console.log('🎯 DL-109: TrendHunter mode selection confirmed', {
    bot_strategy: bot?.strategy,
    mode_detected: analysisData?.mode,
    algorithms_active: analysisData ? Object.keys(analysisData.institutional_confirmations) : []
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-[95vw] max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <TrendingUp className="text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">TrendHunter Analysis</h2>
              <p className="text-gray-400 text-sm">
                {bot?.symbol} • Trend Strength: {(analysisData?.trend_strength * 100 || 0).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-white">
              ${currentPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

          {/* Chart Section */}
          <div className="mb-6">
            <div className="bg-gray-800 rounded-lg p-4 h-96">
              <InstitutionalChart
                symbol={bot?.symbol}
                interval={bot?.interval}
                data={analysisData?.chart_data || []}
                institutionalAnalysis={analysisData || {}}
                loading={false}
                strategy="TrendHunter"
              />
            </div>
          </div>

          {/* Core TrendHunter Algorithms */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

            {/* SMC Analysis */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center">
                <BarChart3 size={18} className="mr-2" />
                Smart Money Concepts
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">BOS Signals:</span>
                  <span className="text-blue-300">{analysisData?.smc_analysis?.break_of_structure?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Order Blocks:</span>
                  <span className="text-green-300">{analysisData?.smc_analysis?.order_blocks?.blocks?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Fair Value Gaps:</span>
                  <span className="text-purple-300">{analysisData?.smc_analysis?.fair_value_gaps?.gaps?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">SMC Score:</span>
                  <span className="text-white font-semibold">
                    {(analysisData?.smc_analysis?.smc_score * 100 || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Market Profile Analysis */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-3">Market Profile</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">POC Level:</span>
                  <span className="text-green-300">
                    ${analysisData?.market_profile_analysis?.point_of_control?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Value Area:</span>
                  <span className="text-blue-300">
                    ${analysisData?.market_profile_analysis?.value_area_high?.toFixed(2) || 'N/A'} -
                    ${analysisData?.market_profile_analysis?.value_area_low?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Profile Trend:</span>
                  <span className={`font-semibold ${
                    analysisData?.market_profile_analysis?.profile_trend === 'BULLISH' ? 'text-green-400' :
                    analysisData?.market_profile_analysis?.profile_trend === 'BEARISH' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {analysisData?.market_profile_analysis?.profile_trend || 'NEUTRAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* VSA Analysis */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Volume Spread Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">VSA Signals:</span>
                  <span className="text-purple-300">{analysisData?.vsa_analysis?.vsa_signals?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Volume Trend:</span>
                  <span className={`font-semibold ${
                    analysisData?.vsa_analysis?.volume_trend === 'INCREASING' ? 'text-green-400' :
                    analysisData?.vsa_analysis?.volume_trend === 'DECREASING' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {analysisData?.vsa_analysis?.volume_trend || 'NEUTRAL'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">VSA Score:</span>
                  <span className="text-white font-semibold">
                    {(analysisData?.vsa_analysis?.vsa_score * 100 || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Recommendation */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">TrendHunter Recommendation</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Action</div>
                <div className={`font-bold text-lg ${
                  analysisData?.recommendation?.action?.includes('BUY') ? 'text-green-400' :
                  analysisData?.recommendation?.action?.includes('SELL') ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {analysisData?.recommendation?.action || 'HOLD'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Confidence</div>
                <div className="font-bold text-lg text-blue-400">
                  {analysisData?.recommendation?.confidence || 'LOW'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Risk Level</div>
                <div className={`font-bold text-lg ${
                  analysisData?.recommendation?.risk_level === 'LOW' ? 'text-green-400' :
                  analysisData?.recommendation?.risk_level === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {analysisData?.recommendation?.risk_level || 'HIGH'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Trend Strength</div>
                <div className="font-bold text-lg text-white">
                  {(analysisData?.trend_strength * 100 || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendHunterMetricsComplete;