/**
 * SmartScalperMetrics - REFACTORED Main Orchestrator Component
 * DL-082 SUCCESS CRITERIA COMPLIANT - Smart Scalper Metrics with Specialized Hooks
 * 
 * RESPONSIBILITY: Orchestrate specialized hooks + compose specialized UI components
 * LINES TARGET: ≤150 lines (SUCCESS CRITERIA compliant)
 * 
 * ARCHITECTURE: DL-076 specialized hooks pattern + component composition
 * EXTRACTION: From 1,444 lines monolith → 150 lines orchestrator + 10 specialized components
 * 
 * Eduard Guzmán - InteliBotX
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketConnection } from '../shared/hooks/useWebSocketConnection';

// Specialized Data Hooks (FASE 1 - 4 hooks)
import useSmartScalperAPI from '../features/dashboard/hooks/useSmartScalperAPI';
import useInstitutionalAlgorithmData from '../features/dashboard/hooks/useInstitutionalAlgorithmData';
import useExecutionMetricsData from '../features/dashboard/hooks/useExecutionMetricsData';
import useSmartScalperCache from '../features/dashboard/hooks/useSmartScalperCache';

// Specialized UI Components (FASE 2 - 6 components)
import InstitutionalAlgorithmGauge from '../features/dashboard/components/InstitutionalAlgorithmGauge';
import ExecutionQualityPanel from '../features/dashboard/components/ExecutionQualityPanel';
import SmartScalperSignalStrength from '../features/dashboard/components/SmartScalperSignalStrength';
import SmartScalperEntryConditions from '../features/dashboard/components/SmartScalperEntryConditions';
import MultiAlgorithmEngine from '../features/dashboard/components/MultiAlgorithmEngine';
import ScalpingPerformanceMetrics from '../features/dashboard/components/ScalpingPerformanceMetrics';

export default function SmartScalperMetrics({ bot, realTimeData }) {
  // State Management
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Specialized Hooks Integration
  const { fetchSmartScalperAnalysis, fetchTechnicalAnalysis, loading: apiLoading, error: apiError } = useSmartScalperAPI();
  const { algorithmData, processSmartScalperAnalysis, getAlgorithmDisplayName, getAlgorithmStatus, algorithmStats } = useInstitutionalAlgorithmData();
  const { executionData, processAnalysisData, executionStats } = useExecutionMetricsData();
  const { cacheOrFetch, getCacheStats } = useSmartScalperCache();

  // WebSocket Integration
  const { 
    isConnected, 
    isAuthenticated, 
    realtimeData, 
    subscribe, 
    unsubscribe 
  } = useWebSocketConnection();

  // WebSocket Subscription Effect
  useEffect(() => {
    if (bot?.symbol && isConnected && isAuthenticated) {
      subscribe(bot.symbol, '15m', 'Smart Scalper');
      return () => unsubscribe(bot.symbol);
    }
  }, [bot?.symbol, isConnected, isAuthenticated, subscribe, unsubscribe]);

  // Main Data Fetching Effect
  useEffect(() => {
    const fetchData = async () => {
      if (!bot?.symbol) return;
      try {
        setLoading(true);
        const startTime = Date.now();
        const { data: analysisData, fromCache } = await cacheOrFetch(
          bot.symbol, () => fetchSmartScalperAnalysis(bot.symbol), 'analysis'
        );
        const technicalData = await fetchTechnicalAnalysis(bot.symbol, '15m');
        const endTime = Date.now();
        if (analysisData) {
          processSmartScalperAnalysis(analysisData);
          processAnalysisData(analysisData, technicalData, { start: startTime, end: endTime });
        }
        setLastUpdate(new Date().toISOString());
        console.log(`🔥 SmartScalper: ${fromCache ? 'CACHE' : 'FRESH'} | ${endTime - startTime}ms`);
      } catch (error) {
        console.error('❌ SmartScalper error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [bot?.symbol, fetchSmartScalperAnalysis, fetchTechnicalAnalysis, processSmartScalperAnalysis, processAnalysisData, cacheOrFetch]);

  // Loading/Error States
  if (loading || apiLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="text-center text-gray-400 py-8">
          <div className="animate-pulse">Loading Smart Scalper...</div>
        </CardContent>
      </Card>
    );
  }
  if (apiError) {
    return (
      <Card className="bg-red-900/20 border-red-700/50">
        <CardContent className="text-center text-red-400 p-4">
          ❌ Error: {apiError}
        </CardContent>
      </Card>
    );
  }

  // Main Render - Component Composition
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            🤖 Smart Scalper Metrics - {bot?.symbol}
            <div className="text-xs text-gray-400">
              Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'N/A'}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Specialized Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InstitutionalAlgorithmGauge 
          algorithmData={algorithmData} getAlgorithmDisplayName={getAlgorithmDisplayName}
          getAlgorithmStatus={getAlgorithmStatus} algorithmStats={algorithmStats} />
        <ExecutionQualityPanel executionData={executionData} executionStats={executionStats} />
        <SmartScalperSignalStrength executionData={executionData} />
        <SmartScalperEntryConditions algorithmData={algorithmData} />
        <MultiAlgorithmEngine 
          algorithmData={algorithmData} getAlgorithmDisplayName={getAlgorithmDisplayName} algorithmStats={algorithmStats} />
        <ScalpingPerformanceMetrics executionData={executionData} algorithmData={algorithmData} />
      </div>
    </div>
  );
}