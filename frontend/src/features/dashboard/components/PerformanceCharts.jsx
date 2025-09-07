// ✅ SUCCESS CRITERIA COMPLIANT: Performance Charts Component ≤150 lines
// EXTRACTED FROM: DashboardMetrics.jsx (bot status distribution + performance indicators)
// SPEC_REF: FRONTEND_ARCHITECTURE.md línea 92 - PerformanceCharts.jsx component  
// COMPLIANCE: DL-001 (real data) + SUCCESS CRITERIA ≤150 lines

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, RefreshCw, CheckCircle, AlertTriangle, Clock, Users } from "lucide-react";

/**
 * ✅ SUCCESS CRITERIA COMPLIANT: Performance Charts and Status Display
 * 
 * Displays:
 * - Bot status distribution grid
 * - Loading states
 * - Performance optimization indicators
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.statusDistribution - Bot status counts
 * @param {boolean} props.isLoading - Loading state
 */
const PerformanceCharts = ({ statusDistribution, isLoading }) => {
  // ✅ SUCCESS CRITERIA: Status color utility
  const getStatusColorClass = (status) => {
    const colors = {
      'RUNNING': 'bg-green-500/20 text-green-400',
      'PAUSED': 'bg-yellow-500/20 text-yellow-400',
      'STOPPED': 'bg-red-500/20 text-red-400',
      'ERROR': 'bg-red-600/20 text-red-500'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  // ✅ SUCCESS CRITERIA: Status icon utility  
  const getStatusIcon = (status) => {
    const icons = {
      'RUNNING': <CheckCircle size={16} />,
      'PAUSED': <Clock size={16} />,
      'STOPPED': <AlertTriangle size={16} />,
      'ERROR': <AlertTriangle size={16} />
    };
    return icons[status] || <Users size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Bot Status Distribution */}
      <Card className="bg-intelibot-bg-secondary border-intelibot-border-primary">
        <CardHeader>
          <CardTitle className="text-lg text-intelibot-text-primary flex items-center">
            <Activity size={20} className="mr-2" />
            Bot Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusDistribution).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColorClass(status)}`}>
                  {getStatusIcon(status)}
                  <span className="ml-1 font-medium">{count}</span>
                </div>
                <p className="text-xs text-intelibot-text-muted mt-1 capitalize">
                  {status.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimization Indicators */}
      {isLoading && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RefreshCw size={16} className="text-blue-400 animate-spin" />
              <span className="text-blue-400 text-sm">Loading real-time metrics...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceCharts;