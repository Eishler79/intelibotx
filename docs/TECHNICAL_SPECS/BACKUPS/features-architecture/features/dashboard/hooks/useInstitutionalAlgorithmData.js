/**
 * useInstitutionalAlgorithmData - Institutional Algorithm Data Processor Hook
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Process 6 institutional algorithms data + algorithm selection logic
 * LINES TARGET: ≤120 lines (≤150 SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: SCALPING_MODE.md 6 algorithms + GUARDRAILS.md P1-P9 + DL-076 pattern
 * Eduard Guzmán - InteliBotX
 */

import { useState, useCallback, useMemo } from 'react';

export const useInstitutionalAlgorithmData = () => {
  const [algorithmData, setAlgorithmData] = useState(null);

  // Process Smart Scalper analysis data into institutional algorithms format
  const processInstitutionalAlgorithms = useCallback((smartScalperData) => {
    if (!smartScalperData?.all_algorithms_evaluated) {
      return {
        selectedAlgorithm: null,
        algorithmMatrix: [],
        algorithmConfidence: null,
        algorithmsEvaluated: []
      };
    }

    // Extract algorithm selection
    const selectedAlgorithm = smartScalperData.algorithm_used || 'wyckoff_spring';
    
    // Process algorithm matrix from backend data
    const algorithmMatrix = smartScalperData.all_algorithms_evaluated.map(algo => ({
      algorithm: algo.algorithm,
      confidence: parseFloat(algo.confidence) || 0,
      score: parseFloat(algo.score) || 0,
      isActive: algo.algorithm === selectedAlgorithm
    }));

    // Calculate overall confidence for selected algorithm
    const selectedAlgoData = algorithmMatrix.find(algo => algo.algorithm === selectedAlgorithm);
    const algorithmConfidence = selectedAlgoData?.confidence || 0;

    return {
      selectedAlgorithm,
      algorithmMatrix,
      algorithmConfidence,
      algorithmsEvaluated: smartScalperData.all_algorithms_evaluated
    };
  }, []);

  // Process entry conditions based on selected algorithm
  const processEntryConditions = useCallback((smartScalperData) => {
    if (!smartScalperData?.conditions_met) {
      return [];
    }

    // Convert backend conditions to frontend format
    return smartScalperData.conditions_met.map(condition => 
      condition.toLowerCase().replace(/_/g, ' ')
    );
  }, []);

  // Get algorithm display name for UI
  const getAlgorithmDisplayName = useCallback((algorithm) => {
    const displayNames = {
      'wyckoff_spring': 'Wyckoff Spring',
      'order_block_retest': 'Order Block Retest',
      'liquidity_grab_fade': 'Liquidity Grab Fade',
      'stop_hunt_reversal': 'Stop Hunt Reversal',
      'fair_value_gap': 'Fair Value Gap',
      'market_microstructure': 'Market Microstructure',
      'volume_breakout': 'Volume Breakout',
      'ma_alignment': 'MA Alignment'
    };
    return displayNames[algorithm] || algorithm?.replace(/_/g, ' ').toUpperCase();
  }, []);

  // Calculate algorithm matrix statistics
  const getAlgorithmStats = useMemo(() => {
    if (!algorithmData?.algorithmMatrix?.length) {
      return {
        totalAlgorithms: 0,
        activeAlgorithms: 0,
        averageConfidence: 0,
        highConfidenceCount: 0
      };
    }

    const matrix = algorithmData.algorithmMatrix;
    const activeCount = matrix.filter(algo => algo.isActive).length;
    const highConfidenceCount = matrix.filter(algo => algo.confidence > 70).length;
    const avgConfidence = matrix.reduce((sum, algo) => sum + algo.confidence, 0) / matrix.length;

    return {
      totalAlgorithms: matrix.length,
      activeAlgorithms: activeCount,
      averageConfidence: Math.round(avgConfidence),
      highConfidenceCount
    };
  }, [algorithmData]);

  // Main processing function
  const processSmartScalperAnalysis = useCallback((analysisData) => {
    if (!analysisData) {
      setAlgorithmData(null);
      return;
    }

    const processedData = {
      ...processInstitutionalAlgorithms(analysisData),
      entryConditions: processEntryConditions(analysisData),
      marketCondition: analysisData.market_condition || 'UNKNOWN',
      wyckoffPhase: analysisData.wyckoff_phase || 'ACCUMULATION',
      riskScore: analysisData.risk_score,
      dataSource: analysisData.data_source || 'unknown'
    };

    setAlgorithmData(processedData);
  }, [processInstitutionalAlgorithms, processEntryConditions]);

  // Algorithm-specific status determination
  const getAlgorithmStatus = useCallback((algorithm, confidence) => {
    if (!algorithm || confidence === null || confidence === undefined) {
      return { text: 'NO DATA', color: 'text-gray-500', bg: 'bg-gray-600/20' };
    }
    
    if (confidence > 80) {
      return { text: 'HIGH', color: 'text-green-400', bg: 'bg-green-500/20' };
    }
    if (confidence > 60) {
      return { text: 'MEDIUM', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    }
    if (confidence > 40) {
      return { text: 'LOW', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    }
    return { text: 'INACTIVE', color: 'text-red-400', bg: 'bg-red-500/20' };
  }, []);

  // Export all necessary data and functions
  return {
    algorithmData,
    processSmartScalperAnalysis,
    getAlgorithmDisplayName,
    getAlgorithmStatus,
    algorithmStats: getAlgorithmStats,
    clearAlgorithmData: () => setAlgorithmData(null)
  };
};

export default useInstitutionalAlgorithmData;