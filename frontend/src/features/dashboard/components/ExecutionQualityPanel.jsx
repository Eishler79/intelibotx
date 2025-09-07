/**
 * ExecutionQualityPanel - Execution Quality & Performance Metrics Display Component
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Display execution quality + latency + performance expectations
 * LINES TARGET: ≤150 lines (SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized component pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gauge, Zap, Clock, Target } from "lucide-react";

const ExecutionQualityPanel = ({ executionData, executionStats }) => {
  if (!executionData) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            <Gauge className="mx-auto mb-2" size={24} />
            <p>No Execution Data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getQualityColor = (quality) => {
    const colors = {
      'EXCELLENT': 'text-green-400', 'HIGH': 'text-blue-400', 'MEDIUM': 'text-yellow-400',
      'LOW': 'text-orange-400'
    };
    return colors[quality] || 'text-gray-400';
  };

  const getSpeedColor = (speed) => {
    const colors = { 'FAST': 'text-green-400', 'MEDIUM': 'text-yellow-400', 'SLOW': 'text-red-400' };
    return colors[speed] || 'text-gray-400';
  };

  return (
    <div className="space-y-4">
      {/* Overall Execution Quality */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Gauge className="text-blue-400" size={18} />
              EXECUTION QUALITY
            </h3>
            <Badge className={`${
              {
                'EXCELLENT': 'bg-green-500/20 text-green-400',
                'HIGH': 'bg-blue-500/20 text-blue-400',
                'MEDIUM': 'bg-yellow-500/20 text-yellow-400'
              }[executionStats.overallQuality] || 'bg-red-500/20 text-red-400'
            }`}>
              {executionStats.overallQuality}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Overall Quality</p>
              <p className={`font-semibold ${getQualityColor(executionStats.overallQuality)}`}>
                {executionStats.overallQuality}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Reliability Score</p>
              <p className="text-purple-400 font-semibold">
                {executionStats.reliabilityScore}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">Readiness Level</p>
              <p className={`font-semibold ${
                { 'READY': 'text-green-400', 'MONITORING': 'text-yellow-400' }[executionStats.readinessLevel] || 'text-red-400'
              }`}>
                {executionStats.readinessLevel}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Confidence Level</p>
              <p className="text-blue-400 font-semibold">
                {executionData.confidenceLevel}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Metrics */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="text-yellow-400" size={18} />
            EXECUTION METRICS
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 flex items-center gap-1">
                <Clock size={14} />
                Execution Speed
              </p>
              <p className={`font-semibold ${getSpeedColor(executionData.execution?.executionSpeed)}`}>
                {executionData.execution?.executionSpeed || 'UNKNOWN'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Data Quality</p>
              <p className={`font-semibold ${
                { 'HIGH': 'text-green-400', 'MEDIUM': 'text-yellow-400', 'LOW': 'text-red-400' }[executionData.execution?.dataQuality] || 'text-gray-400'
              }`}>
                {executionData.execution?.dataQuality || 'UNKNOWN'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Latency</p>
              <p className="text-blue-400 font-semibold">
                {executionData.execution?.latency 
                  ? `${executionData.execution.latency}ms`
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Data Source</p>
              <p className="text-purple-400 font-semibold text-xs">
                {executionData.dataSource?.toUpperCase() || 'UNKNOWN'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Expectations */}
      {executionData.performance && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-4">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="text-green-400" size={18} />
              PERFORMANCE EXPECTATIONS
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Expected Win Rate', value: executionData.performance.winRate, color: 'text-green-400', suffix: '%' },
                { label: 'Confidence Level', value: executionData.performance.confidenceLevel, color: 'text-blue-400', suffix: '%' },
                { label: 'Risk/Reward', value: executionData.performance.riskReward, color: 'text-purple-400' },
                { label: 'Timeframe', value: executionData.performance.timeframe || '15-45min', color: 'text-yellow-400' }
              ].map(({ label, value, color, suffix }, index) => (
                <div key={index}>
                  <p className="text-gray-400">{label}</p>
                  <p className={`${color} font-semibold`}>
                    {value || 'N/A'}{value && suffix || ''}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExecutionQualityPanel;