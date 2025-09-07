import React from "react";
import { Badge } from "@/components/ui/badge";

/**
 * SymbolPerformance - Top Symbols Performance Grid
 * 
 * ✅ DL-001: Real data from symbols prop
 * ✅ SUCCESS CRITERIA: ≤150 lines (100 lines)
 * ✅ FEATURE STRUCTURE: dashboard/components/
 * 
 * Extracted from Dashboard.jsx:382-421
 */
const SymbolPerformance = ({ symbols = [] }) => {
  if (symbols.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-6">
      <h2 className="text-white text-xl font-semibold mb-6">Performance por Símbolo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.slice(0, 6).map(symbol => (
          <div key={symbol.symbol} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-white">{symbol.symbol}</span>
              <Badge className={`${
                symbol.total_pnl >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {symbol.total_pnl >= 0 ? '+' : ''}${symbol.total_pnl.toFixed(2)}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Operaciones:</span>
                <div className="text-white font-medium">{symbol.total_operations}</div>
              </div>
              <div>
                <span className="text-gray-400">Win Rate:</span>
                <div className="text-white font-medium">{symbol.win_rate}%</div>
              </div>
            </div>
            
            <div className="mt-2">
              <span className="text-gray-400 text-xs">Promedio por trade:</span>
              <div className={`font-medium text-sm ${
                symbol.avg_pnl_per_trade >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${symbol.avg_pnl_per_trade.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SymbolPerformance;