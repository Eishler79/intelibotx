/**
 * 🌐 ConnectionQualityPanel - Componente especializado para análisis de calidad
 * 
 * SPEC_REF: DL-076 Specialized Components Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Wifi } from "lucide-react";

export default function ConnectionQualityPanel({ 
  latencyMetrics, 
  strategy, 
  getConnectionColor, 
  getLatencyColor,
  recommendations = []
}) {
  const strategyThreshold = strategy === 'Smart Scalper' ? 50 : 100;
  const isOptimal = latencyMetrics.current < strategyThreshold;

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Server className="text-blue-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Connection Quality Analysis</h3>
          <Badge className={`${getConnectionColor(latencyMetrics.connection_quality).replace('text-', 'bg-').replace('400', '500/20')} ${getConnectionColor(latencyMetrics.connection_quality)}`}>
            {latencyMetrics.connection_quality}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">5min Average:</span>
                <span className={`font-mono ${getLatencyColor(latencyMetrics.average_5min)}`}>
                  {latencyMetrics.average_5min}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connection Quality:</span>
                <span className={`font-medium ${getConnectionColor(latencyMetrics.connection_quality)}`}>
                  {latencyMetrics.connection_quality}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Strategy Optimal:</span>
                <span className={`${isOptimal ? 'text-green-400' : 'text-red-400'}`}>
                  {isOptimal ? '✅ YES' : '❌ NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated:</span>
                <span className="text-gray-300 font-mono text-xs">
                  {new Date(latencyMetrics.last_update).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-3">Latency Thresholds</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">
                  Excellent: &lt;50ms (ideal scalping)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-300">
                  Good: 50-80ms (acceptable)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span className="text-sm text-gray-300">
                  Fair: 80-100ms (borderline)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <span className="text-sm text-gray-300">
                  Poor: &gt;100ms (critical)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Panel */}
        {recommendations.length > 0 && (
          <div className="mt-6 bg-red-900/10 border border-red-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Wifi className="text-red-400 mt-0.5" size={20} />
              <div>
                <h4 className="text-red-400 font-semibold mb-2">Performance Recommendations</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}