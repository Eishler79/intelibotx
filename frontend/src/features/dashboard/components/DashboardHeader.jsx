import React from "react";
import { RefreshCw, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * DashboardHeader - Dashboard Header with Controls
 * 
 * ✅ DL-001: No hardcode - all data from props
 * ✅ SUCCESS CRITERIA: ≤150 lines (80 lines)
 * ✅ FEATURE STRUCTURE: dashboard/components/
 * 
 * Extracted from Dashboard.jsx:180-239
 */
const DashboardHeader = ({ 
  userExchanges = [],
  selectedPeriod, 
  onPeriodChange, 
  onRefresh, 
  isRefreshing = false 
}) => {
  const hasExchanges = userExchanges && userExchanges.length > 0;

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-white">Panel de Control</h1>
        
        {/* Exchange Status Indicators - DL-001 Compliance */}
        {hasExchanges && userExchanges.length > 0 && (
          <div className="flex items-center gap-2">
            {userExchanges.slice(0, 3).map((exchange) => (
              <div 
                key={exchange.id} 
                className="exchange-status flex items-center gap-2 bg-white/5 backdrop-blur-lg px-3 py-1.5 rounded-lg border border-white/10"
                title={`${exchange.exchange_name.toUpperCase()} - ${exchange.connection_name}`}
              >
                <div className="exchange-icon w-5 h-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded flex items-center justify-center">
                  <span className="text-black text-xs font-bold">
                    {exchange.exchange_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="exchange-name text-xs text-gray-300 font-medium hidden sm:inline">
                  {exchange.exchange_name.toUpperCase()}
                </span>
                <div className={`exchange-status-dot w-2 h-2 rounded-full ${
                  exchange.status === 'active' 
                    ? 'bg-green-400 shadow-sm shadow-green-400/50' 
                    : exchange.status === 'error'
                    ? 'bg-red-400 shadow-sm shadow-red-400/50'
                    : 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
                }`} />
              </div>
            ))}
            {userExchanges.length > 3 && (
              <div className="text-xs text-gray-400 px-2">
                +{userExchanges.length - 3} más
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex gap-4">
        {/* Period Filter */}
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              size="sm"
              variant={selectedPeriod === days ? "default" : "outline"}
              onClick={() => onPeriodChange(days)}
              className="text-xs"
            >
              {days}d
            </Button>
          ))}
        </div>
        
        {/* Refresh Button */}
        <Button size="sm" variant="outline" onClick={onRefresh}>
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;