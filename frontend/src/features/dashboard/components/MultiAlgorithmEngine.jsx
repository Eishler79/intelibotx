/**
 * MultiAlgorithmEngine - Multi-Algorithm Selection & Execution Engine Component
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Display multi-algorithm consensus + algorithm selection engine
 * LINES TARGET: ≤130 lines (SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: SCALPING_MODE.md consensus logic + GUARDRAILS.md P1-P9 + DL-076 pattern
 * Eduard Guzmán - InteliBotX
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, Layers, CheckCircle2, AlertCircle } from "lucide-react";

const MultiAlgorithmEngine = ({ 
  algorithmData, 
  getAlgorithmDisplayName, 
  algorithmStats 
}) => {
  if (!algorithmData?.algorithmMatrix) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            <Cpu className="mx-auto mb-2" size={24} />
            <p>Multi-Algorithm Engine Offline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { selectedAlgorithm, algorithmMatrix, algorithmConfidence } = algorithmData;
  const consensus = algorithmMatrix.filter(algo => algo.confidence > 70);
  const consensusStrength = Math.round((consensus.length / algorithmMatrix.length) * 100);

  const getConsensusColor = () => {
    if (consensusStrength > 75) return 'text-green-400';
    if (consensusStrength > 50) return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getEngineStatus = () => {
    if (consensusStrength > 80) return { status: 'STRONG CONSENSUS', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (consensusStrength > 60) return { status: 'MODERATE CONSENSUS', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (consensusStrength > 40) return { status: 'WEAK CONSENSUS', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { status: 'NO CONSENSUS', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const engineStatus = getEngineStatus();

  return (
    <Card className="bg-gray-800/50 border-gray-700/50">
      <CardContent className="p-4">
        {/* Engine Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="text-purple-400" size={18} />
            MULTI-ALGORITHM ENGINE
          </h3>
          <Badge className={`${engineStatus.bg} ${engineStatus.color}`}>
            {engineStatus.status}
          </Badge>
        </div>

        {/* Consensus Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-400">Consensus Strength</p>
            <p className={`font-bold text-xl ${getConsensusColor()}`}>
              {consensusStrength}%
            </p>
          </div>
          <div>
            <p className="text-gray-400">Algorithms in Consensus</p>
            <p className="text-blue-400 font-semibold">
              {consensus.length}/{algorithmMatrix.length}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Selected Algorithm</p>
            <p className="text-green-400 font-semibold text-xs">
              {getAlgorithmDisplayName(selectedAlgorithm)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Selection Confidence</p>
            <p className="text-purple-400 font-semibold">
              {algorithmConfidence || 'N/A'}%
            </p>
          </div>
        </div>

        {/* Algorithm Consensus List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Layers size={14} />
            ALGORITHM CONSENSUS STATUS
          </div>
          
          {algorithmMatrix.slice(0, 4).map((algo, index) => {
            const inConsensus = algo.confidence > 70;
            const isSelected = algo.algorithm === selectedAlgorithm;
            
            return (
              <div key={algo.algorithm || index} className="flex items-center justify-between text-xs">
                <span className={`font-medium ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>
                  {getAlgorithmDisplayName(algo.algorithm)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-mono">
                    {algo.confidence || 'N/A'}%
                  </span>
                  {inConsensus ? <CheckCircle2 className="text-green-400" size={10} /> : <AlertCircle className="text-gray-500" size={10} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Engine Performance */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Status', value: consensusStrength > 70 ? 'OPTIMAL' : consensusStrength > 40 ? 'SUBOPTIMAL' : 'DEGRADED', color: consensusStrength > 70 ? 'text-green-400' : consensusStrength > 40 ? 'text-yellow-400' : 'text-red-400' },
              { label: 'High Conf', value: algorithmStats.highConfidenceCount, color: 'text-blue-400' },
              { label: 'Avg Perf', value: `${algorithmStats.averageConfidence}%`, color: 'text-purple-400' }
            ].map(({ label, value, color }, index) => (
              <div key={index} className="text-center">
                <p className="text-gray-400">{label}</p>
                <p className={`font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiAlgorithmEngine;