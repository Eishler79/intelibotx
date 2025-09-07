/**
 * 🚨 LatencyAlertCard - Componente especializado para alertas críticas
 * 
 * SPEC_REF: DL-076 Specialized Components Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export default function LatencyAlertCard({ alertActive, latency, onDismiss }) {
  if (!alertActive) return null;
  
  return (
    <div className="mb-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-center gap-3 animate-pulse">
      <AlertTriangle className="text-red-400 animate-bounce" size={24} />
      <div className="flex-1">
        <p className="text-red-400 font-bold">🚨 CRITICAL LATENCY ALERT</p>
        <p className="text-gray-300 text-sm">
          Execution time: {latency}ms exceeds scalping threshold (100ms)
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Check internet connection and server status
        </p>
      </div>
      <Badge className="bg-red-500/20 text-red-400">
        URGENT
      </Badge>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}