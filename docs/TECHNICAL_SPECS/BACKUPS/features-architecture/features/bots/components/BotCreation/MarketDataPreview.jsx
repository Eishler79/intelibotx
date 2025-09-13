import React, { useState, useEffect } from 'react';
import { BarChart3, Clock } from 'lucide-react';
import MarketDataDisplay from './components/MarketDataDisplay';
import ConnectionStatus from './components/ConnectionStatus';

const MarketDataPreview = ({ 
  realTimeData, 
  formData = {}, 
  selectedExchange = null, 
  loadRealTimeData 
}) => {
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!realTimeData || !selectedExchange || !formData.symbol) return;
    
    const performRefresh = async () => {
      setIsRefreshing(true);
      await loadRealTimeData();
      setLastUpdate(new Date());
      setIsRefreshing(false);
    };
    
    const refreshInterval = setInterval(performRefresh, 5000);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 1 ? prev - 1 : 5);
    }, 1000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [realTimeData, selectedExchange, formData.symbol, loadRealTimeData]);

  if (!realTimeData || !selectedExchange) {
    return null;
  }

  return (
    <div className="market-data-preview bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-blue-400 font-medium text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Datos en Tiempo Real - {formData.symbol}
        </h4>
        
        <div className="flex items-center gap-1 text-xs">
          <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${
            isRefreshing ? 'border-blue-400 text-blue-400 animate-spin' : 'border-gray-500 text-gray-400'
          }`}>
            {isRefreshing ? '⟳' : countdown}
          </div>
          <span className="text-gray-500">auto</span>
        </div>
      </div>

      <MarketDataDisplay 
        realTimeData={realTimeData}
        formData={formData}
        selectedExchange={selectedExchange}
      />
        
      {lastUpdate && (
        <div className="flex justify-between items-center text-xs text-gray-500 pt-3 mt-3 border-t border-gray-600/30">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Última actualización:
          </span>
          <span>{lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}

      <ConnectionStatus realTimeData={realTimeData} />
    </div>
  );
};

export default MarketDataPreview;