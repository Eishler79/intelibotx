/**
 * InstitutionalAlgorithmGauge - Institutional Algorithm Matrix Display Component
 * EXTRACTED FROM: SmartScalperMetrics.jsx (DL-082 - SUCCESS CRITERIA compliance)
 * 
 * RESPONSIBILITY: Display 6 institutional algorithms + algorithm selection gauge
 * LINES TARGET: ≤150 lines (SUCCESS CRITERIA compliant)
 * 
 * SPEC_REF: SCALPING_MODE.md algorithms + GUARDRAILS.md P1-P9 + DL-076 pattern
 * Eduard Guzmán - InteliBotX
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Activity } from "lucide-react";

const InstitutionalAlgorithmGauge = ({ 
  algorithmData, 
  getAlgorithmDisplayName, 
  getAlgorithmStatus,
  algorithmStats 
}) => {
  if (!algorithmData) {
    return (
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="text-center text-gray-400">
            <Activity className="mx-auto mb-2" size={24} />
            <p>No Algorithm Data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { selectedAlgorithm, algorithmMatrix, algorithmConfidence } = algorithmData;

  return (
    <div className="space-y-4">
      {/* Selected Algorithm Header */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              🏛️ SELECTED ALGORITHM
              <Award className="text-green-400" size={16} />
            </h3>
            <Badge className="bg-green-500/20 text-green-400">
              ACTIVE
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Algorithm</p>
              <p className="text-blue-400 font-semibold">
                {getAlgorithmDisplayName(selectedAlgorithm)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Confidence</p>
              <p className="text-green-400 font-semibold">
                {algorithmConfidence ? `${algorithmConfidence}%` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm Matrix */}
      <Card className="bg-gray-800/50 border-gray-700/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">
              🏛️ INSTITUTIONAL ALGORITHM MATRIX
            </h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-400" size={16} />
              <span className="text-blue-400 text-sm font-semibold">
                {algorithmStats.activeAlgorithms}/{algorithmStats.totalAlgorithms}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {algorithmMatrix.map((algo, index) => {
              const status = getAlgorithmStatus(algo.algorithm, algo.confidence);
              
              return (
                <Card 
                  key={algo.algorithm || index}
                  className={`bg-gray-800/30 border-gray-700/50 ${
                    algo.isActive ? 'ring-2 ring-green-400/50 bg-green-900/10' : ''
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-400 font-semibold truncate">
                          {getAlgorithmDisplayName(algo.algorithm)}
                        </span>
                        {algo.isActive && <Award className="text-green-400" size={12} />}
                      </div>
                      
                      <div>
                        <p className={`text-lg font-bold ${status.color}`}>
                          {algo.confidence !== null && algo.confidence !== undefined 
                            ? `${algo.confidence}%` 
                            : 'N/A'}
                        </p>
                        <Badge className={`text-xs ${status.bg} ${status.color}`}>
                          {status.text}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Algorithm Statistics */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-400">Avg Confidence</p>
                <p className="text-blue-400 font-semibold">
                  {algorithmStats.averageConfidence}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">High Confidence</p>
                <p className="text-green-400 font-semibold">
                  {algorithmStats.highConfidenceCount}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-400">Active Status</p>
                <p className="text-purple-400 font-semibold">
                  {algorithmStats.activeAlgorithms > 0 ? 'RUNNING' : 'STANDBY'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionalAlgorithmGauge;