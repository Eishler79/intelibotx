import React from 'react';

const RiskRewardAnalysis = ({ takeProfit, stopLoss }) => {
  if (!takeProfit || !stopLoss) {
    return null;
  }

  const ratio = takeProfit / stopLoss;
  const winRateNeeded = (stopLoss / (takeProfit + stopLoss) * 100);
  
  const getRatingColor = (ratio) => {
    if (ratio >= 2) return 'text-green-400';
    if (ratio >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingText = (ratio) => {
    if (ratio >= 2) return 'Excelente';
    if (ratio >= 1.5) return 'Aceptable';
    return 'Mejorable';
  };

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
      <h4 className="text-purple-400 font-semibold mb-2">Análisis Riesgo/Recompensa</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-400">Ratio R:R</p>
          <p className={`font-medium ${getRatingColor(ratio)}`}>
            1:{ratio.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Win Rate Necesario</p>
          <p className="text-white font-medium">
            {winRateNeeded.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Clasificación</p>
          <p className={`font-medium ${getRatingColor(ratio)}`}>
            {getRatingText(ratio)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskRewardAnalysis;