import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock3, Award } from "lucide-react";

// 🎯 DYNAMIC ENTRY CONDITIONS COMPONENT (DL-027)
const DynamicEntryConditions = ({ algorithm, conditions = [] }) => {
  const getConditionsForAlgorithm = (algorithm) => {
    const algorithmConditions = {
      'wyckoff_spring': [
        { name: 'Spring Pattern Detection', key: 'spring_pattern', required: true },
        { name: 'Accumulation Phase', key: 'accumulation_phase', required: true },
        { name: 'Volume Absorption', key: 'volume_absorption', required: false },
        { name: 'Institutional Positioning', key: 'institutional_positioning', required: true },
        { name: 'Support Level Hold', key: 'support_level', required: true }
      ],
      'liquidity_grab_fade': [
        { name: 'Liquidity Grab Detected', key: 'liquidity_grab', required: true },
        { name: 'Stop Hunt Pattern', key: 'stop_hunt', required: true },
        { name: 'Fade Setup Ready', key: 'fade_setup', required: false },
        { name: 'Reversal Timing', key: 'reversal_timing', required: false },
        { name: 'Institution Flow Change', key: 'flow_change', required: true }
      ],
      'order_block_retest': [
        { name: 'Order Block Identified', key: 'order_block', required: true },
        { name: 'Retest Pattern', key: 'retest_pattern', required: true },
        { name: 'Volume Confirmation', key: 'volume_confirm', required: false },
        { name: 'Price Action Setup', key: 'price_action', required: true },
        { name: 'Institution Zone', key: 'institution_zone', required: true }
      ]
    };
    
    return algorithmConditions[algorithm] || [
      { name: 'Algorithm Analysis', key: 'analysis', required: true },
      { name: 'Market Structure', key: 'structure', required: true },
      { name: 'Volume Pattern', key: 'volume', required: false },
      { name: 'Price Confirmation', key: 'price', required: true }
    ];
  };

  const algorithmConditions = getConditionsForAlgorithm(algorithm);
  const metConditions = conditions.length;
  const totalConditions = algorithmConditions.length;
  const entryProbability = Math.round((metConditions / totalConditions) * 100);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">
            🎯 {algorithm?.toUpperCase().replace('_', ' ')} CONDITIONS
          </h4>
          <Badge className={`text-xs ${
            entryProbability > 80 ? 'bg-green-500/20 text-green-400' :
            entryProbability > 60 ? 'bg-blue-500/20 text-blue-400' : 
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {metConditions}/{totalConditions} MET
          </Badge>
        </div>

        <div className="space-y-3">
          {algorithmConditions.map((condition, index) => {
            const isSet = Math.random() > 0.4; // TODO: Replace with real condition status
            return (
              <div key={condition.key} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{condition.name}:</span>
                <div className="flex items-center gap-2">
                  {isSet ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : condition.required ? (
                    <XCircle className="text-red-400" size={16} />
                  ) : (
                    <Clock3 className="text-yellow-400" size={16} />
                  )}
                  <span className={`text-xs ${
                    isSet ? 'text-green-400' : condition.required ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {isSet ? 'YES' : condition.required ? 'NO' : 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">ENTRY PROBABILITY:</span>
            <span className={`text-sm font-bold ${
              entryProbability > 75 ? 'text-green-400' : 
              entryProbability > 50 ? 'text-blue-400' : 'text-yellow-400'
            }`}>
              {entryProbability}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 📊 CURRENT SIGNAL STRENGTH COMPONENT (DL-027)
const CurrentSignalStrength = ({ signal, confidence }) => {
  const signalType = signal?.current || 'HOLD';
  const signalConfidence = confidence?.current || 0;
  const signalStrength = signalConfidence > 80 ? 'STRONG' : signalConfidence > 60 ? 'MODERATE' : 'WEAK';

  const getSignalColor = () => {
    if (signalType === 'BUY') return 'text-green-400';
    if (signalType === 'SELL') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTradeStatus = () => {
    if (signalConfidence > 80) return { status: '🟢 READY', action: 'EXECUTE TRADE' };
    if (signalConfidence > 60) return { status: '🟡 MONITORING', action: 'WAIT FOR CONFIRMATION' };
    return { status: '🔴 SETUP', action: 'WAITING FOR ENTRY' };
  };

  const tradeStatus = getTradeStatus();

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-4">
        <h4 className="text-lg font-semibold text-white mb-4">📊 CURRENT SIGNAL STRENGTH</h4>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Signal</p>
              <p className={`text-xl font-bold ${getSignalColor()}`}>
                {signalType}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Strength</p>
              <p className="text-blue-400 font-semibold">{signalStrength}</p>
            </div>
            <div>
              <p className="text-gray-400">Confidence</p>
              <p className="text-purple-400 font-semibold">{signalConfidence}%</p>
            </div>
            <div>
              <p className="text-gray-400">Entry Quality</p>
              <p className="text-yellow-400 font-semibold">
                {signalConfidence > 80 ? 'HIGH' : signalConfidence > 60 ? 'MEDIUM' : 'LOW'}
              </p>
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">TRADE STATUS:</span>
              <span className="text-white text-sm font-semibold">{tradeStatus.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">ACTION:</span>
              <span className="text-blue-400 text-sm font-semibold">{tradeStatus.action}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 🏛️ ALGORITHM MATRIX CARD COMPONENT (DL-027)
const AlgorithmMatrixCard = ({ algorithm, confidence, isActive }) => {
  const getAlgorithmDisplayName = (algorithm) => {
    const displayNames = {
      'wyckoff_spring': 'Wyckoff',
      'order_block_retest': 'Order Block',
      'liquidity_grab_fade': 'Liquidity',
      'stop_hunt_reversal': 'Stop Hunt',
      'fair_value_gap': 'Fair Value',
      'volume_breakout': 'Volume',
      'ma_alignment': 'MA Align',
      'higher_high_formation': 'Higher High'
    };
    return displayNames[algorithm] || algorithm;
  };

  const getStatus = () => {
    if (isActive) return { text: 'ACTIVE', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (confidence > 70) return { text: 'READY', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (confidence > 50) return { text: 'MONITORING', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (confidence > 30) return { text: 'STANDBY', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    return { text: 'INACTIVE', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const status = getStatus();
  const confidenceLevel = confidence > 70 ? 'HIGH' : confidence > 50 ? 'MEDIUM' : 'LOW';

  return (
    <Card className={`bg-gray-800/50 border-gray-700/50 ${isActive ? 'ring-2 ring-green-400/50' : ''}`}>
      <CardContent className="p-3">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-400">
              {getAlgorithmDisplayName(algorithm)}
            </span>
            {isActive && <Award className="text-green-400" size={12} />}
          </div>
          
          <div>
            <p className={`text-lg font-bold ${status.color}`}>
              {confidence}%
            </p>
            <Badge className={`text-xs ${status.bg} ${status.color}`}>
              {status.text}
            </Badge>
          </div>
          
          <p className="text-xs text-gray-500">{confidenceLevel}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export { DynamicEntryConditions, CurrentSignalStrength, AlgorithmMatrixCard };