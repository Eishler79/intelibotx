/**
 * SmartScalperEntryConditions - Dynamic Entry Conditions Display Component
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Display algorithm-specific entry conditions + entry probability
 * LINES TARGET: ≤150 lines (SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: SCALPING_MODE.md conditions + GUARDRAILS.md P1-P9 + DL-076 pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock3, Target } from "lucide-react";

const SmartScalperEntryConditions = ({ algorithmData }) => {
  if (!algorithmData) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            <Target className="mx-auto mb-2" size={24} />
            <p>No Entry Conditions Data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { selectedAlgorithm, entryConditions } = algorithmData;

  // Algorithm-specific conditions mapping
  const getConditionsForAlgorithm = (algorithm) => {
    const algorithmConditions = {
      'wyckoff_spring': [
        { name: 'Spring Pattern Detection', key: 'spring_pattern', required: true },
        { name: 'Accumulation Phase', key: 'accumulation_phase', required: true },
        { name: 'Volume Absorption', key: 'volume_absorption', required: false },
        { name: 'Institutional Positioning', key: 'institutional_positioning', required: true },
        { name: 'Support Level Hold', key: 'support_level', required: true }
      ],
      'order_block_retest': [
        { name: 'Order Block Identified', key: 'order_block', required: true },
        { name: 'Retest Pattern', key: 'retest_pattern', required: true },
        { name: 'Volume Confirmation', key: 'volume_confirm', required: false },
        { name: 'Price Action Setup', key: 'price_action', required: true },
        { name: 'Institution Zone', key: 'institution_zone', required: true }
      ],
      'liquidity_grab_fade': [
        { name: 'Liquidity Grab Detected', key: 'liquidity_grab', required: true },
        { name: 'Stop Hunt Pattern', key: 'stop_hunt', required: true },
        { name: 'Fade Setup Ready', key: 'fade_setup', required: false },
        { name: 'Reversal Timing', key: 'reversal_timing', required: false },
        { name: 'Institution Flow Change', key: 'flow_change', required: true }
      ],
      'stop_hunt_reversal': [
        { name: 'Stop Hunt Detected', key: 'stop_hunt_detected', required: true },
        { name: 'Reversal Pattern', key: 'reversal_pattern', required: true },
        { name: 'Volume Spike', key: 'volume_spike', required: false },
        { name: 'Support/Resistance Break', key: 'sr_break', required: true }
      ],
      'fair_value_gap': [
        { name: 'Gap Identified', key: 'gap_identified', required: true },
        { name: 'Gap Fill Direction', key: 'gap_direction', required: true },
        { name: 'Price Approaching Gap', key: 'price_approach', required: true },
        { name: 'Volume Confirmation', key: 'volume_confirm', required: false }
      ],
      'market_microstructure': [
        { name: 'Order Flow Analysis', key: 'order_flow', required: true },
        { name: 'Bid/Ask Imbalance', key: 'bid_ask_imbalance', required: true },
        { name: 'Institutional Bias', key: 'institutional_bias', required: true },
        { name: 'Microstructure Edge', key: 'microstructure_edge', required: false }
      ]
    };
    
    return algorithmConditions[algorithm] || [
      { name: 'Algorithm Analysis', key: 'analysis', required: true },
      { name: 'Market Structure', key: 'structure', required: true },
      { name: 'Volume Pattern', key: 'volume', required: false },
      { name: 'Price Confirmation', key: 'price', required: true }
    ];
  };

  const algorithmConditions = getConditionsForAlgorithm(selectedAlgorithm);
  const metConditions = entryConditions?.length || 0;
  const totalConditions = algorithmConditions.length;
  const entryProbability = Math.round((metConditions / totalConditions) * 100);

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            🎯 {selectedAlgorithm?.toUpperCase().replace('_', ' ')} CONDITIONS
          </h3>
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
            // Check if condition is met using various matching patterns
            const isSet = entryConditions?.some(c => 
              c.toLowerCase().includes(condition.key.toLowerCase()) ||
              condition.key.toLowerCase().includes(c.toLowerCase()) ||
              c.toUpperCase() === condition.key.toUpperCase()
            ) || false;
            
            return (
              <div key={condition.key || index} className="flex items-center justify-between">
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

export default SmartScalperEntryConditions;