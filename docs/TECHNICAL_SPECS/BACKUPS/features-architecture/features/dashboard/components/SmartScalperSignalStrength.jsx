/**
 * SmartScalperSignalStrength - Signal Strength & Trading Status Display Component
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Display current signal strength + trading status + action recommendations
 * LINES TARGET: ≤150 lines (SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: GUARDRAILS.md P1-P9 + DL-076 specialized component pattern
 * Eduard Guzmán - InteliBotX
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertCircle } from "lucide-react";

const SmartScalperSignalStrength = ({ executionData }) => {
  if (!executionData?.signal || !executionData?.confidence) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            <Activity className="mx-auto mb-2" size={24} />
            <p>No Signal Data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { signal, confidence, tradeStatus } = executionData;

  const getSignalColor = () => {
    if (signal.current === 'BUY') return 'text-green-400';
    if (signal.current === 'SELL') return 'text-red-400';
    return 'text-gray-400';
  };

  const getStrengthColor = () => {
    if (signal.strength === 'STRONG') return 'text-green-400';
    if (signal.strength === 'MODERATE') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceColor = () => {
    if (confidence.level === 'HIGH') return 'text-green-400';
    if (confidence.level === 'MEDIUM') return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getStatusIcon = () => {
    if (tradeStatus.status.includes('🟢')) return '🟢';
    if (tradeStatus.status.includes('🟡')) return '🟡';
    return '🔴';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            📊 SIGNAL STRENGTH
            <TrendingUp className="text-blue-400" size={16} />
          </h3>
          <Badge className={`${
            signal.strength === 'STRONG' ? 'bg-green-500/20 text-green-400' :
            signal.strength === 'MODERATE' ? 'bg-blue-500/20 text-blue-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {signal.strength}
          </Badge>
        </div>
        
        {/* Signal Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Current Signal</p>
              <p className={`text-xl font-bold ${getSignalColor()}`}>
                {signal.current}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Signal Strength</p>
              <p className={`font-semibold ${getStrengthColor()}`}>
                {signal.strength}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Confidence</p>
              <p className={`font-semibold ${getConfidenceColor()}`}>
                {confidence.current}%
              </p>
            </div>
            <div>
              <p className="text-gray-400">Confidence Level</p>
              <p className={`font-semibold ${getConfidenceColor()}`}>
                {confidence.level}
              </p>
            </div>
          </div>

          {/* Trading Status */}
          <div className="bg-gray-700/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <AlertCircle size={14} />
                TRADING STATUS:
              </span>
              <span className="text-white font-semibold flex items-center gap-1">
                {getStatusIcon()}
                {tradeStatus.status.replace(/[🟢🟡🔴]/g, '').trim()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                RECOMMENDED ACTION:
              </span>
              <span className="text-blue-400 font-semibold text-sm">
                {tradeStatus.action}
              </span>
            </div>

            {/* Entry Quality Indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-600">
              <span className="text-gray-400 text-sm">
                ENTRY QUALITY:
              </span>
              <span className={`font-semibold text-sm ${
                confidence.current > 80 ? 'text-green-400' :
                confidence.current > 60 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {confidence.current > 80 ? 'HIGH QUALITY' :
                 confidence.current > 60 ? 'MEDIUM QUALITY' :
                 'LOW QUALITY'}
              </span>
            </div>
          </div>

          {/* Technical Confirmation */}
          {executionData.technicalConfirmation && (
            <div className="text-xs text-gray-500 text-center">
              Technical Confirmation: {executionData.technicalConfirmation}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartScalperSignalStrength;