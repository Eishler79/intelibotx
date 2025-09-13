/**
 * 🏛️ SmartScalperAnalysisPanel - Institutional Algorithm Analysis Display
 * 
 * SPEC_REF: DL-088 SmartScalperMetrics Institutional Transformation
 * COMPLIANCE: DL-002 (INSTITUTIONAL ONLY) + DL-076 (≤150 lines)
 * 
 * RESPONSIBILITY: Core institutional algorithm analysis visualization
 * ALGORITHMS: Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, Fair Value Gaps, Market Microstructure
 * 
 * NO RETAIL ALGORITHMS: Zero RSI, MACD, EMA per DL-002 ALGORITHMIC POLICY
 * 
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  TrendingUp, 
  TrendingDown,
  Shield, 
  Target,
  Activity,
  Gauge,
  Award,
  AlertTriangle,
  CheckCircle 
} from "lucide-react";

export default function SmartScalperAnalysisPanel({ analysisData, institutionalMetrics, botSymbol, error }) {
  
  // 🏛️ DL-002 COMPLIANCE: Institutional algorithm display names
  const getInstitutionalAlgorithmDisplay = (algorithm) => {
    const institutionalNames = {
      'wyckoff_spring': 'Wyckoff Spring',
      'wyckoff_upthrust': 'Wyckoff Upthrust',
      'liquidity_grab_fade': 'Liquidity Grab Fade',
      'stop_hunt_reversal': 'Stop Hunt Reversal', 
      'order_block_retest': 'Order Block Retest',
      'fair_value_gap': 'Fair Value Gap',
      'market_microstructure': 'Market Microstructure',
      'institutional_order_flow': 'Institutional Order Flow',
      'volume_spread_analysis': 'Volume Spread Analysis',
      'smart_money_concepts': 'Smart Money Concepts'
    };
    
    return institutionalNames[algorithm] || algorithm || 'Institutional Algorithm Matrix';
  };

  // 🎯 Confidence level color coding
  const getConfidenceColor = (confidence) => {
    if (typeof confidence === 'string') {
      const numericConfidence = parseFloat(confidence.replace('%', ''));
      if (numericConfidence >= 80) return 'text-green-400';
      if (numericConfidence >= 60) return 'text-yellow-400';
      return 'text-red-400';
    }
    return 'text-gray-400';
  };

  // 🏛️ Wyckoff Phase color coding
  const getWyckoffPhaseColor = (phase) => {
    const phases = {
      'ACCUMULATION': 'bg-green-500/20 text-green-400 border-green-500/30',
      'MARKUP': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'DISTRIBUTION': 'bg-red-500/20 text-red-400 border-red-500/30',
      'MARKDOWN': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return phases[phase] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (error) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
          <h3 className="text-xl text-white mb-2">Analysis Error</h3>
          <p className="text-gray-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🏛️ MAIN ALGORITHM DISPLAY */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Building className="text-blue-400" size={24} />
            Institutional Algorithm Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Algorithm */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Selected Algorithm:</span>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {getInstitutionalAlgorithmDisplay(analysisData?.algorithm_selected)}
            </Badge>
          </div>

          {/* Confidence Level */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Confidence Level:</span>
            <span className={`font-bold ${getConfidenceColor(analysisData?.institutional_confidence)}`}>
              {analysisData?.institutional_confidence || 'Calculating...'}
            </span>
          </div>

          {/* Market Regime */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Market Regime:</span>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {analysisData?.market_regime || 'NORMAL'}
            </Badge>
          </div>

          {/* Wyckoff Phase */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Wyckoff Phase:</span>
            <Badge className={getWyckoffPhaseColor(analysisData?.wyckoff_phase)}>
              {analysisData?.wyckoff_phase || 'ACCUMULATION'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 TOP ALGORITHMS MATRIX */}
      {analysisData?.top_algorithms && analysisData.top_algorithms.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Award className="text-yellow-400" size={24} />
              Top Institutional Algorithms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysisData.top_algorithms.slice(0, 3).map((algo, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gray-600/50 text-gray-300 text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-white font-medium">
                      {getInstitutionalAlgorithmDisplay(algo.algorithm)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">
                      {algo.confidence}%
                    </span>
                    <CheckCircle className="text-green-400" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🛡️ RISK ASSESSMENT */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <Shield className="text-green-400" size={24} />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Overall Risk Level:</span>
            <Badge className={
              analysisData?.risk_assessment === 'LOW' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : analysisData?.risk_assessment === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }>
              {analysisData?.risk_assessment || 'LOW'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 📊 SYMBOL INFO */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="text-blue-400" size={20} />
              <span className="text-white font-medium">{botSymbol}</span>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Smart Scalper Mode
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}