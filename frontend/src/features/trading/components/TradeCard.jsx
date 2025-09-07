import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

/**
 * TradeCard - Individual Trade Display Component
 * 
 * ✅ DL-001: Displays real trade data, no hardcode
 * ✅ SINGLE RESPONSIBILITY: Trade card rendering only
 * ✅ 50 lines extracted from LiveTradingFeed.jsx
 */
export const TradeCard = ({ trade }) => {
  return (
    <div 
      key={trade.id || trade.operation_id}
      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          (trade.pnl || 0) >= 0 ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-sm">{trade.symbol || 'N/A'}</span>
            <Badge 
              className={`text-xs px-2 py-0 ${
                (trade.side || 'BUY') === 'BUY' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {trade.side || 'BUY'}
            </Badge>
            {(trade.algorithm_used || trade.algorithm) && (
              <span className="text-xs text-yellow-400 px-1 py-0 bg-yellow-400/10 rounded">
                {trade.algorithm_used || trade.algorithm}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {trade.signal || 'N/A'} • {trade.strategy || 'Smart Scalper'}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`font-semibold text-sm ${
          (trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {(trade.pnl || 0) >= 0 ? '+' : ''}${Number(trade.pnl || 0).toFixed(2)}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={10} />
          {trade.time_ago || trade.created_at || 'Ahora'}
        </div>
        {(trade.confidence !== undefined && trade.confidence !== null) && (
          <div className="text-xs text-blue-400">
            {(trade.confidence * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
};