import React from 'react';
import { Target, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const RiskManagementSummary = ({ 
  formData, 
  realTimeData, 
  monetaryValues = { tp: 0, sl: 0 },
  defaultValues = { take_profit: 2.5, stop_loss: 1.5 }
}) => {
  const takeProfit = formData.take_profit || defaultValues.take_profit;
  const stopLoss = formData.stop_loss || defaultValues.stop_loss;
  const riskRewardRatio = (takeProfit / stopLoss).toFixed(2);
  const requiredWinRate = (stopLoss / (takeProfit + stopLoss) * 100).toFixed(1);

  const getRatioColor = (ratio) => {
    const numRatio = parseFloat(ratio);
    if (numRatio >= 2) return 'text-green-400';
    if (numRatio >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
      <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Gestión de Riesgo
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Take Profit</span>
          </div>
          <p className="text-green-400 font-semibold">{takeProfit}%</p>
          {realTimeData && (
            <p className="text-green-400 text-xs">
              +${monetaryValues.tp.toFixed(2)} {formData.base_currency}
            </p>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Stop Loss</span>
          </div>
          <p className="text-red-400 font-semibold">{stopLoss}%</p>
          {realTimeData && (
            <p className="text-red-400 text-xs">
              -${monetaryValues.sl.toFixed(2)} {formData.base_currency}
            </p>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Ratio R:R</span>
          </div>
          <p className={`font-semibold ${getRatioColor(riskRewardRatio)}`}>
            1:{riskRewardRatio}
          </p>
          <p className="text-gray-400 text-xs">
            Win rate: {requiredWinRate}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementSummary;