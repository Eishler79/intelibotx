/**
 * useExecutionMetricsData - Execution Metrics Data Processor Hook
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Process execution quality + performance metrics + signal strength
 * LINES TARGET: ≤120 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized hooks pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback, useMemo } from 'react';

export const useExecutionMetricsData = () => {
  const [executionData, setExecutionData] = useState(null);

  // Process execution quality metrics from analysis data
  const processExecutionMetrics = useCallback((analysisData) => {
    if (!analysisData) {
      return {
        executionQuality: 'NO DATA',
        confidenceLevel: 0,
        riskScore: null,
        expectedPerformance: null,
        signalStrength: 'WEAK'
      };
    }

    // Calculate execution quality based on confidence
    const confidence = analysisData.confidence || 0;
    let executionQuality = 'LOW';
    if (confidence > 0.8) executionQuality = 'HIGH';
    else if (confidence > 0.6) executionQuality = 'MEDIUM';

    // Determine signal strength
    let signalStrength = 'WEAK';
    if (confidence > 0.8) signalStrength = 'STRONG';
    else if (confidence > 0.6) signalStrength = 'MODERATE';

    return {
      executionQuality,
      confidenceLevel: Math.round(confidence * 100),
      riskScore: analysisData.risk_score,
      expectedPerformance: analysisData.expected_performance,
      signalStrength
    };
  }, []);

  // Process signal strength and trading status
  const processSignalData = useCallback((analysisData, technicalData) => {
    const confidence = (analysisData?.confidence || 0) * 100;
    const signalType = analysisData?.algorithm_used && confidence > 60 ? 'BUY' : 'HOLD';
    const tradeStatus = confidence > 80 ? { status: '🟢 READY', action: 'EXECUTE TRADE' } :
                       confidence > 60 ? { status: '🟡 MONITORING', action: 'WAIT FOR CONFIRMATION' } :
                       { status: '🔴 SETUP', action: 'WAITING FOR ENTRY' };

    return {
      signal: {
        current: signalType,
        strength: confidence > 80 ? 'STRONG' : confidence > 60 ? 'MODERATE' : 'WEAK'
      },
      confidence: {
        current: confidence,
        level: confidence > 80 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW'
      },
      tradeStatus,
      technicalConfirmation: technicalData?.dataSource || 'UNKNOWN'
    };
  }, []);

  // Calculate execution latency metrics
  const calculateExecutionMetrics = useCallback((startTime, endTime, dataSource) => {
    if (!startTime || !endTime) {
      return { latency: null, dataQuality: 'UNKNOWN', executionSpeed: 'UNKNOWN' };
    }

    const latency = endTime - startTime;
    const executionSpeed = latency < 1000 ? 'FAST' : latency < 3000 ? 'MEDIUM' : 'SLOW';
    const dataQuality = dataSource === 'PRIMARY_AUTHENTICATED' ? 'HIGH' :
                       dataSource === 'ALTERNATIVE_PUBLIC' ? 'MEDIUM' :
                       dataSource?.includes('TIMEOUT') ? 'LOW' : 'UNKNOWN';

    return { latency, dataQuality, executionSpeed };
  }, []);

  // Process performance expectations
  const processPerformanceExpectations = useCallback((analysisData) => {
    if (!analysisData?.expected_performance) {
      return { winRate: null, confidenceLevel: null, riskReward: null, timeframe: null };
    }
    const perf = analysisData.expected_performance;
    return {
      winRate: perf.win_rate,
      confidenceLevel: perf.confidence_level,
      riskReward: perf.risk_reward || null,
      timeframe: perf.timeframe || '15-45min'
    };
  }, []);

  // Main processing function
  const processAnalysisData = useCallback((analysisData, technicalData, executionTime) => {
    if (!analysisData) {
      setExecutionData(null);
      return;
    }

    const executionMetrics = processExecutionMetrics(analysisData);
    const signalData = processSignalData(analysisData, technicalData);
    const performanceData = processPerformanceExpectations(analysisData);
    const executionQuality = calculateExecutionMetrics(
      executionTime?.start,
      executionTime?.end,
      analysisData.data_source
    );

    const processedData = {
      ...executionMetrics,
      ...signalData,
      performance: performanceData,
      execution: executionQuality,
      lastUpdated: new Date().toISOString(),
      dataSource: analysisData.data_source || 'unknown'
    };

    setExecutionData(processedData);
  }, [processExecutionMetrics, processSignalData, processPerformanceExpectations, calculateExecutionMetrics]);

  // Execution quality statistics
  const executionStats = useMemo(() => {
    if (!executionData) {
      return { overallQuality: 'NO DATA', reliabilityScore: 0, readinessLevel: 'NOT READY' };
    }

    const confidence = executionData.confidenceLevel;
    const dataQuality = executionData.execution?.dataQuality;
    const overallQuality = confidence > 80 && dataQuality === 'HIGH' ? 'EXCELLENT' :
                          confidence > 70 ? 'HIGH' : confidence > 50 ? 'MEDIUM' : 'LOW';
    const reliabilityScore = overallQuality === 'EXCELLENT' ? Math.min(95, confidence + 10) : confidence;
    const readinessLevel = confidence > 80 ? 'READY' : confidence > 60 ? 'MONITORING' : 'NOT READY';

    return { overallQuality, reliabilityScore, readinessLevel };
  }, [executionData]);

  return {
    executionData,
    processAnalysisData,
    executionStats,
    clearExecutionData: () => setExecutionData(null)
  };
};

export default useExecutionMetricsData;