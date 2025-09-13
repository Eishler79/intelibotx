/**
 * 📊 LatencyMiniChart - Componente especializado para visualización de latencias
 * 
 * SPEC_REF: DL-076 Specialized Components Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';

export default function LatencyMiniChart({ latencyHistory, maxPoints = 20 }) {
  if (latencyHistory.length < 2) {
    return (
      <div className="mt-3">
        <p className="text-gray-400 text-xs mb-2">Insufficient data for chart</p>
        <div className="h-12 bg-gray-800/30 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Collecting data...</span>
        </div>
      </div>
    );
  }

  const displayData = latencyHistory.slice(-maxPoints);
  const max = Math.max(...displayData.map(h => h.latency));
  const min = Math.min(...displayData.map(h => h.latency));
  const range = max - min || 1;

  return (
    <div className="mt-3">
      <p className="text-gray-400 text-xs mb-2">
        Last {displayData.length} measurements (Range: {min.toFixed(1)}ms - {max.toFixed(1)}ms)
      </p>
      <div className="flex items-end gap-0.5 h-12 bg-gray-900/30 rounded p-1">
        {displayData.map((point, index) => {
          const height = ((point.latency - min) / range) * 100;
          const color = point.latency > 100 ? 'bg-red-400' : 
                       point.latency > 80 ? 'bg-yellow-400' : 
                       point.latency > 50 ? 'bg-blue-400' : 'bg-green-400';
          
          return (
            <div
              key={index}
              className={`${color} opacity-70 hover:opacity-100 transition-all cursor-pointer`}
              style={{
                height: `${Math.max(height, 10)}%`,
                width: `${100 / displayData.length}%`
              }}
              title={`${point.latency.toFixed(1)}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
            />
          );
        })}
      </div>
    </div>
  );
}