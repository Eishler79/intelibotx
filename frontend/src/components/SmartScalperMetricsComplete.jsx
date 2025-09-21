/**
 * 🏛️ SmartScalperMetricsComplete - Institutional Analysis Modal
 * 
 * Rebuilt to provide dynamic institutional insights, timeframe selection
 * and real trading snapshots for Smart Scalper bots.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuthDL008 } from '../shared/hooks/useAuthDL008';
import { useSmartScalperAPI } from '../features/dashboard/hooks/useSmartScalperAPI';
import { getBotTradingOperations } from '@/services/api';
import InstitutionalChart from './InstitutionalChart';
import { Building, Activity, TrendingUp, TrendingDown, Shield, X, AlertCircle, CheckCircle, Compass, History } from "lucide-react";

const MODE_DETAILS = {
  SCALPING: {
    label: 'Smart Scalper',
    action: 'Follow micro targets with tight risk controls',
    badgeClass: 'bg-blue-500/20 text-blue-300'
  },
  TREND_FOLLOWING: {
    label: 'Trend Hunter',
    action: 'Ride dominant trend with progressive trailing',
    badgeClass: 'bg-green-500/20 text-green-300'
  },
  ANTI_MANIPULATION: {
    label: 'Anti-Manipulation',
    action: 'Fade traps, protect capital, size down',
    badgeClass: 'bg-red-500/20 text-red-300'
  },
  VOLATILITY_ADAPTIVE: {
    label: 'Volatility Adaptive',
    action: 'Time-box entries, dynamic sizing & targets',
    badgeClass: 'bg-yellow-500/20 text-yellow-300'
  },
  NEWS_SENTIMENT: {
    label: 'News Sentiment',
    action: 'Widen stops, trail fast after event spike',
    badgeClass: 'bg-purple-500/20 text-purple-300'
  }
};

const ALGORITHM_META = {
  wyckoff_method: { icon: '🏛️', label: 'Wyckoff Method' },
  order_blocks: { icon: '📦', label: 'Order Blocks' },
  liquidity_grabs: { icon: '🎯', label: 'Liquidity Grabs' },
  stop_hunting: { icon: '⚡', label: 'Stop Hunting' },
  fair_value_gaps: { icon: '📈', label: 'Fair Value Gaps' },
  market_microstructure: { icon: '🔬', label: 'Market Microstructure' },
  volume_spread_analysis: { icon: '📊', label: 'Volume Spread Analysis' },
  market_profile: { icon: '🗺️', label: 'Market Profile' },
  institutional_order_flow: { icon: '💧', label: 'Institutional Order Flow' },
  accumulation_distribution: { icon: '📦', label: 'Accumulation / Distribution' },
  smart_money_concepts: { icon: '💎', label: 'Smart Money Concepts' },
  composite_man: { icon: '🧠', label: 'Composite Man' }
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const biasBadge = (bias) => {
  switch ((bias || '').toUpperCase()) {
    case 'SMART_MONEY':
      return 'bg-green-500/20 text-green-300';
    case 'RETAIL_TRAP':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-gray-500/20 text-gray-200';
  }
};

const summarizeDetails = (details = {}) => {
  if (!details || typeof details !== 'object') return '—';
  const candidates = [
    details.market_expectation,
    details.dominant_direction,
    details.regime,
    details.grab_direction,
    details.hunt_direction,
    details.structure_type,
    details.order_flow_direction,
    details.flow_direction,
    details.market_phase,
    details.direction,
    details.smart_points && `Smart points: ${details.smart_points}`,
    details.confirmations && `Confirmations: ${details.confirmations}`
  ];
  return candidates.find(Boolean) || '—';
};

const formatFeatureValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Analizando';
  if (typeof value === 'number') return `${Math.round(value * 100)}%`;
  return String(value);
};

const formatOperation = (operation) => {
  if (!operation) return null;
  const executedAt = operation.executed_at || operation.created_at || operation.timestamp || null;
  const side = (operation.side || operation.action || 'N/A').toUpperCase();
  const price = operation.price || operation.execution_price || operation.entry_price || null;
  const pnl = operation.pnl ?? operation.profit ?? null;
  const reason = operation.reason || operation.notes || operation.signal_reason || '-';
  return {
    id: operation.id || `${executedAt || Date.now()}-${side}`,
    executedAt,
    side,
    price,
    pnl,
    reason
  };
};

// ✅ DL-100: Convertir timeframe del usuario a segundos para refresh dinámico
const convertTimeframeToSeconds = (timeframe) => {
  if (!timeframe || typeof timeframe !== 'string') return 15; // fallback 15s

  const timeframeMap = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400
  };

  return timeframeMap[timeframe] || 15; // fallback 15s si timeframe no reconocido
};

// ✅ DL-100: Formatear countdown para display legible
const formatCountdownDisplay = (seconds) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${hours}h${mins}m${secs}s`;
    return `${hours}h${secs}s`;
  } else if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m${secs}s`;
  } else {
    return `${seconds}s`;
  }
};

export default function SmartScalperMetricsComplete({ bot, botId, botSymbol, realTimeData = {}, onClose }) {
  const { authenticatedFetch } = useAuthDL008();
  const { fetchBotSpecificAnalysis } = useSmartScalperAPI();

  const normalizedSymbol = useMemo(() => botSymbol?.replace('/', '') || bot?.symbol?.replace('/', '') || '', [botSymbol, bot?.symbol]);

  const [analysisData, setAnalysisData] = useState(null);
  const [modeDecision, setModeDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ✅ DL-100: Countdown dinámico basado en timeframe del bot
  const userTimeframe = bot?.interval || '15m';
  const refreshIntervalSeconds = convertTimeframeToSeconds(userTimeframe);
  const [countdown, setCountdown] = useState(refreshIntervalSeconds);
  const [selectedTimeframe, setSelectedTimeframe] = useState(userTimeframe.replace(/\s+/g, ''));
  const [chartSeries, setChartSeries] = useState(Array.isArray(realTimeData?.[botSymbol]) ? realTimeData[botSymbol] : []);
  const [chartLoading, setChartLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [operations, setOperations] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [operationsError, setOperationsError] = useState(null);

  const timeframeOptions = useMemo(() => {
    const base = ['1m', '5m', '15m', '1h', '4h'];
    if (bot?.interval) base.unshift(bot.interval.replace(/\s+/g, ''));
    return Array.from(new Set(base));
  }, [bot?.interval]);

  useEffect(() => {
    if (bot?.interval) {
      setSelectedTimeframe(bot.interval.replace(/\s+/g, ''));
    }
  }, [bot?.interval]);

  useEffect(() => {
    if (Array.isArray(realTimeData?.[botSymbol])) {
      const series = realTimeData[botSymbol];
      setChartSeries(series);
      if (series.length > 0) {
        const latest = parseFloat(series[series.length - 1]?.price ?? series[series.length - 1]?.close ?? 0);
        const base = parseFloat(series[0]?.price ?? series[0]?.close ?? latest);
        setCurrentPrice(latest);
        setPriceChange(base ? ((latest - base) / base) * 100 : null);
      }
    }
  }, [realTimeData, botSymbol]);

  const loadChartData = useCallback(async () => {
    if (!normalizedSymbol) return;
    try {
      setChartLoading(true);
      const response = await authenticatedFetch(`/api/market-data/${normalizedSymbol}?timeframe=${selectedTimeframe}&limit=150&market_type=${bot?.market_type || 'SPOT'}`);
      if (response?.ok) {
        const result = await response.json();
        const klines = result?.data?.klines || [];
        const formatted = klines.map((k) => ({
          time: k.datetime,
          price: Number(k.close),
          open: Number(k.open),
          high: Number(k.high),
          low: Number(k.low),
          volume: Number(k.volume)
        }));
        setChartSeries(formatted);
        if (formatted.length > 0) {
          const lastPrice = formatted[formatted.length - 1].price;
          const firstPrice = formatted[0].price || lastPrice;
          setCurrentPrice(lastPrice);
          setPriceChange(firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : null);
        }
      }
    } catch (err) {
      console.error('Error loading institutional chart data:', err);
    } finally {
      setChartLoading(false);
      setCountdown(5);
    }
  }, [authenticatedFetch, normalizedSymbol, selectedTimeframe, bot?.market_type]);

  useEffect(() => {
    if (!normalizedSymbol) return;
    loadChartData();
    const interval = setInterval(loadChartData, refreshIntervalSeconds * 1000);  // ✅ DL-100: chart refresh = timeframe usuario
    return () => clearInterval(interval);
  }, [normalizedSymbol, loadChartData, refreshIntervalSeconds]);

  useEffect(() => {
    const fetchCompleteAnalysis = async (isInitialLoad = true) => {
      if (!botId || !botSymbol || !bot?.market_type) return;
      if (isInitialLoad) {
        setLoading(true);
        setModeDecision(null);
      }
      setError(null);
      try {
        const smartScalperData = await fetchBotSpecificAnalysis(botId, botSymbol, bot);
        if (smartScalperData) {
          setAnalysisData(smartScalperData);
          setModeDecision(smartScalperData.mode_decision || null);
          // ✅ DL-102: Frontend console logs for algorithm strategy boosting verification
          console.log('🎯 DL-102: STRATEGY ALGORITHM VERIFICATION', {
            bot_strategy: bot?.strategy,
            algorithm_selected: smartScalperData.algorithm_used,  // ✅ FIXED: Use mapped field name
            selection_confidence: smartScalperData.confidence,     // ✅ FIXED: Use mapped field name
            market_regime: smartScalperData.market_condition,      // ✅ FIXED: Use mapped field name
            strategy_boost_applied: bot?.strategy ? 'YES' : 'NO',
            // 🔍 DIAGNOSIS: Original raw backend data for comparison
            raw_analysis_exists: !!smartScalperData.analysis,
            data_source: smartScalperData.data_source
          });

          // ✅ DL-109: Frontend console logs for mode selection → algorithm integration verification
          console.log('🎯 DL-109: MODE SELECTION → ALGORITHM INTEGRATION VERIFICATION', {
            mode_decision: smartScalperData.mode_decision,
            algorithm_selected: smartScalperData.algorithm_used,
            mode_algorithm_coherence: `${smartScalperData.mode_decision} → ${smartScalperData.algorithm_used}`,
            integration_status: smartScalperData.mode_decision && smartScalperData.algorithm_used ? 'COHERENT' : 'CHECK_NEEDED',
            execution_order: 'Mode Selection → Algorithm Integration (DL-109 compliant)'
          });

          // 🎯 DETAILED ALGORITHM RANKING AND WEIGHTS IN TABLE FORMAT
          if (smartScalperData.all_algorithms_evaluated?.length > 0) {
            console.log('🏆 ALGORITHM_WEIGHT_ANALYSIS - TABLE FORMAT');
            console.table(smartScalperData.all_algorithms_evaluated.map((algo, index) => ({
              'Rank': index + 1,
              'Algorithm': algo.algorithm,
              'Score': `${algo.score}%`,
              'Confidence': `${algo.confidence}%`,
              'Selected': algo.algorithm === smartScalperData.algorithm_used ? '✅ YES' : '❌ No'
            })));

            console.log('📊 ALGORITHM_SELECTION_SUMMARY', {
              selected_algorithm: smartScalperData.algorithm_used,
              total_algorithms_analyzed: smartScalperData.all_algorithms_evaluated?.length,
              market_regime_detected: smartScalperData.market_condition,
              strategy_applied: bot?.strategy,
              top_3: smartScalperData.all_algorithms_evaluated?.slice(0, 3).map(a => a.algorithm)
            });
          }

          console.log('🎯 BOT_EXECUTION_ANALYSIS', {
            // 📊 Bot Configuration
            bot_id: botId,
            bot_status: bot?.status,
            bot_symbol: botSymbol,
            bot_strategy: bot?.strategy,
            execute_real_sent: bot?.status === 'RUNNING' ? 'true' : 'false',

            // 🚨 Signal Analysis
            signal_generated: smartScalperData.signals?.signal,
            signal_reason: smartScalperData.signals?.reason,
            signal_confidence: smartScalperData.signals?.confidence,
            multi_tf_signal: smartScalperData.signals?.multi_tf_signal,

            // 🤖 Algorithm Selection (DL-102)
            algorithm_selected: smartScalperData.analysis?.algorithm_selected,
            selection_confidence: smartScalperData.analysis?.selection_confidence,
            market_regime: smartScalperData.analysis?.market_regime,

            // 🏛️ Institutional Analysis
            smart_money_recommendation: smartScalperData.smart_money_recommendation,
            institutional_quality_score: smartScalperData.institutional_quality_score,
            institutional_confidence: smartScalperData.institutional_confidence_level,

            // 🚀 Execution Result
            order_execution_result: smartScalperData.order_execution,

            // ❓ Why No Trade?
            will_execute: `Signal=${smartScalperData.signals?.signal}, Bot=${bot?.status}, Execute=${bot?.status === 'RUNNING' ? 'YES' : 'NO'}`,
            execution_criteria: smartScalperData.signals?.signal === 'BUY' || smartScalperData.signals?.signal === 'SELL' ? 'CRITERIA_MET' : 'SIGNAL_NOT_BUY_OR_SELL',

            // 📈 Mode Decision
            mode_decision: smartScalperData.mode_decision,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('🚨 Complete Analysis Error:', err);
        setError(err.message || 'Error fetching institutional analysis');
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    fetchCompleteAnalysis(true);
    const interval = setInterval(() => fetchCompleteAnalysis(false), refreshIntervalSeconds * 1000);  // ✅ DL-100: usar timeframe del bot
    return () => clearInterval(interval);
  }, [botId, botSymbol, bot?.market_type, fetchBotSpecificAnalysis, selectedTimeframe, refreshIntervalSeconds]);

  const loadOperations = useCallback(async () => {
    if (!botId) return;
    try {
      setOperationsLoading(true);
      const response = await getBotTradingOperations(botId.toString(), { limit: 5 });
      setOperations(response?.operations || []);
      setOperationsError(null);
    } catch (err) {
      console.error('Error fetching recent operations:', err);
      setOperations([]);
      setOperationsError(err.message || 'Error cargando operaciones');
    } finally {
      setOperationsLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? refreshIntervalSeconds : prev - 1));
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [refreshIntervalSeconds]);

  // ✅ DL-100 TER: Detectar cambios en timeframe del bot y resetear countdown
  useEffect(() => {
    setCountdown(refreshIntervalSeconds);
    setSelectedTimeframe(userTimeframe.replace(/\s+/g, ''));
  }, [userTimeframe, refreshIntervalSeconds]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
        <Card className="w-96 bg-gray-800/95 border-gray-700 relative z-[10000]">
          <CardContent className="p-8 text-center">
            <Activity className="animate-spin mx-auto mb-4 text-blue-400" size={32} />
            <p className="text-white text-lg mb-2">Loading Institutional Analysis...</p>
            <p className="text-gray-400 text-sm">Analyzing {bot?.symbol} with institutional algorithms</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
        <Card className="w-96 bg-gray-800/95 border-red-700 relative z-[10000]">
          <CardHeader>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle size={24} />
              Analysis Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Retry
              </Button>
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMode = modeDecision?.selected || 'SCALPING';
  const modeInfo = MODE_DETAILS[activeMode] || MODE_DETAILS.SCALPING;
  const modeConfidence = modeDecision ? Math.round((modeDecision.confidence ?? 0) * 100) : null;
  const modeScores = Object.entries(modeDecision?.scores || {});
  const modeFeatures = Object.entries(modeDecision?.features || {});
  const confirmationEntries = Object.entries(analysisData?.institutional_confirmations_breakdown || {});
  const topAlgorithms = analysisData?.all_algorithms_evaluated?.slice(0, 3) || [];
  const manipulationAlerts = analysisData?.manipulation_alerts || analysisData?.signals?.manipulation_alerts || [];
  const consensusLabel = analysisData?.smart_money_recommendation || 'N/A';
  const consensusConfidence = analysisData?.expected_performance?.confidence_level || null;
  const datasetReason = analysisData?.signal_reason || null;
  const formattedOperations = operations.map(formatOperation).filter(Boolean);

  const priceChangeValue = typeof priceChange === 'number' ? priceChange : null;
  const priceBadgeClass = priceChangeValue === null
    ? 'bg-gray-500/20 text-gray-200'
    : priceChangeValue >= 0
      ? 'bg-green-500/20 text-green-400'
      : 'bg-red-500/20 text-red-400';
  const priceIcon = priceChangeValue === null
    ? null
    : priceChangeValue >= 0
      ? <TrendingUp size={14} />
      : <TrendingDown size={14} />;

  const handleTimeframeChange = (value) => {
    setSelectedTimeframe(value);
    setCountdown(5);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto relative z-[10000]">
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900 relative z-[10001]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Building className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Smart Scalper Institutional Analysis</h2>
              <div className="flex items-center gap-2 text-gray-400">
                <span>{bot?.symbol} • {analysisData?.wyckoff_phase || '—'}</span>
                <Badge className="bg-blue-500/20 text-blue-400">Bot Único Mode</Badge>
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-gray-700/50"
          >
            <X size={24} />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <Card className="bg-gray-800/50 border-gray-700/50 relative">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  📊 Institutional Market Analysis
                  <Badge className="bg-blue-500/20 text-blue-300">{bot?.strategy || 'Smart Scalper'}</Badge>
                </CardTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-300">
                  <span className="flex items-center gap-1 text-blue-300">
                    <Activity className="animate-pulse" size={16} />
                    {formatCountdownDisplay(countdown)} refresh
                  </span>
                  <Badge className="bg-slate-600/40 text-slate-200">{bot?.market_type || 'SPOT'}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`px-3 py-1 flex items-center gap-1 ${priceBadgeClass}`}>
                  {priceIcon}
                  {formatPercent(priceChangeValue)}
                </Badge>
                <div className="text-2xl font-semibold text-white">
                  {currentPrice ? `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                </div>
                <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
                  <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-gray-200 border-gray-600">
                    {timeframeOptions.map((tf) => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-96">
                {chartLoading && (
                  <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center z-10">
                    <Activity className="animate-spin text-blue-400" size={24} />
                  </div>
                )}
                <InstitutionalChart
                  symbol={normalizedSymbol}
                  interval={selectedTimeframe}
                  theme="dark"
                  data={chartSeries}
                  loading={chartLoading}
                  onTimeframeChange={handleTimeframeChange}
                  timeframeOptions={timeframeOptions}
                  institutionalAnalysis={{
                    risk_profile: bot?.risk_profile,
                    strategy: bot?.strategy,
                    market_type: bot?.market_type
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Compass size={18} className="text-blue-300" />
                  Intelligent Mode Selector
                  <Badge className={modeInfo.badgeClass}>{modeInfo.label}</Badge>
                  {modeConfidence !== null && (
                    <Badge className="bg-white/10 text-blue-200 border border-blue-400/30">
                      {modeConfidence}% confidence
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-300">
                  Recommended Action: <span className="text-blue-300 font-semibold">{modeInfo.action}</span>
                </div>
                {modeDecision?.remaining_duration !== undefined && (
                  <div className="text-xs text-gray-400">Min. remaining duration: {Math.ceil(modeDecision.remaining_duration)} bars</div>
                )}
                {modeScores.length > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Mode Scores</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                      {modeScores.map(([mode, score]) => {
                        const details = MODE_DETAILS[mode] || { label: mode };
                        return (
                          <div key={mode} className="bg-blue-500/10 border border-blue-500/20 rounded-md px-3 py-2">
                            <p className="text-xs text-blue-200 uppercase tracking-wide">{details.label || mode}</p>
                            <p className="text-lg font-semibold text-white">{Math.round(score * 100)}%</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Mode scores are still being calculated…</p>
                )}
                {modeFeatures.length > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Feature Snapshot</p>
                    <div className="flex flex-wrap gap-2">
                      {modeFeatures.map(([feature, value]) => (
                        <Badge key={feature} className="bg-blue-800/40 text-blue-200 border border-blue-500/30">
                          {feature}: {formatFeatureValue(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Feature extraction en progreso…</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="text-yellow-400" size={18} />
                  Smart Money Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3 text-sm text-gray-200">
                  <Badge className="bg-purple-500/20 text-purple-300">Consensus: {consensusLabel}</Badge>
                  {consensusConfidence && (
                    <Badge className="bg-blue-500/20 text-blue-300">Confidence: {consensusConfidence}</Badge>
                  )}
                  {datasetReason && (
                    <Badge className="bg-slate-600/30 text-slate-200">Signal: {datasetReason}</Badge>
                  )}
                </div>

                {topAlgorithms.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Top Institutional Algorithms</p>
                    <div className="space-y-2">
                      {topAlgorithms.map((algo, index) => (
                        <div key={`${algo.algorithm}-${index}`} className="flex items-center justify-between bg-gray-700/30 border border-gray-600/40 rounded px-3 py-2">
                          <span className="text-sm text-gray-200">#{index + 1} {algo.algorithm}</span>
                          <span className="text-green-400 font-semibold">{Math.round(algo.confidence)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {manipulationAlerts.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Manipulation Alerts</p>
                    <ul className="space-y-1 text-sm text-red-300">
                      {manipulationAlerts.slice(0, 3).map((alert, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <AlertCircle size={14} />
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                🧠 Institutional Algorithm Breakdown
                <Badge className="bg-purple-500/20 text-purple-400">12 algorithms</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {confirmationEntries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {confirmationEntries.map(([key, confirmation]) => {
                    const meta = ALGORITHM_META[key] || { icon: '📈', label: key.replace(/_/g, ' ') };
                    return (
                      <div key={key} className="bg-gray-700/40 border border-gray-600/40 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-lg">{meta.icon}</span>
                            <span className="font-semibold text-sm">{meta.label}</span>
                          </div>
                          <Badge className={biasBadge(confirmation.bias)}>{confirmation.bias || 'NEUTRAL'}</Badge>
                        </div>
                        <div className="text-2xl font-semibold text-white">{Math.round(confirmation.score || 0)}%</div>
                        <p className="text-xs text-gray-300">{summarizeDetails(confirmation.details)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Institutional confirmations will appear once the first analysis completes…</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <History size={18} className="text-blue-300" />
                Recent Operations Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {operationsLoading ? (
                <div className="flex items-center gap-2 text-blue-300 text-sm">
                  <Activity className="animate-spin" size={16} />
                  Loading operations…
                </div>
              ) : operationsError ? (
                <p className="text-sm text-red-300">{operationsError}</p>
              ) : formattedOperations.length > 0 ? (
                <div className="space-y-2">
                  {formattedOperations.map((operation) => (
                    <div key={operation.id} className="bg-gray-700/30 border border-gray-600/40 rounded-md px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm text-gray-200">{operation.executedAt ? new Date(operation.executedAt).toLocaleString() : '—'}</p>
                        <p className="text-xs text-gray-400">{operation.reason}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={operation.side === 'SELL' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}>{operation.side}</Badge>
                        <span className="text-sm text-gray-200">{operation.price ? `$${Number(operation.price).toFixed(2)}` : '—'}</span>
                        <span className={`text-sm font-semibold ${operation.pnl > 0 ? 'text-green-400' : operation.pnl < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                          {operation.pnl !== null && operation.pnl !== undefined ? `$${Number(operation.pnl).toFixed(2)}` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No recent operations recorded for this bot.</p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-400 text-center">
              📊 Institutional analysis combines Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, FVG, VSA,
              Market Profile, Order Flow, Accumulation/Distribution, SMC and Composite Man algorithms for Smart Scalper decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
