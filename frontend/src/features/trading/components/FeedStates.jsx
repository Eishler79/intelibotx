import React from "react";
import { Activity, RefreshCw } from "lucide-react";

/**
 * FeedStates - Feed Loading, Error and Empty States
 * 
 * ✅ DL-001: State management UI, no hardcode
 * ✅ SINGLE RESPONSIBILITY: Feed state display only
 * ✅ 50 lines extracted from LiveTradingFeed.jsx
 */
export const FeedStates = ({ liveFeed, onRefresh }) => {
  // Loading state
  if (liveFeed.loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Cargando operaciones...</span>
        </div>
        <p className="text-sm">Conectando con API persistente</p>
      </div>
    );
  }

  // Error state
  if (liveFeed.isError) {
    return (
      <div className="text-center py-8 text-red-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span>❌ Error cargando operaciones</span>
        </div>
        <p className="text-xs">{liveFeed.error}</p>
        <button 
          onClick={onRefresh}
          className="mt-2 px-3 py-1 bg-red-500/20 rounded text-xs hover:bg-red-500/30"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Empty state
  if (liveFeed.isEmpty) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>No hay operaciones recientes</span>
        </div>
        <p className="text-sm">Los bots están analizando el mercado</p>
        <p className="text-xs mt-2 text-blue-400">✅ Datos persisten entre sesiones</p>
      </div>
    );
  }

  return null;
};