import React from 'react';
import { 
  Zap, 
  Clock, 
  AlertCircle,
  Activity
} from "lucide-react";

// Specialized hooks
import { useExecutionLatencyMetrics } from '../features/dashboard/hooks/useExecutionLatencyMetrics';
import { useLatencyAlerts } from '../features/dashboard/hooks/useLatencyAlerts';
import { useLatencyHistory } from '../features/dashboard/hooks/useLatencyHistory';
import { useLatencyThresholds } from '../features/dashboard/hooks/useLatencyThresholds';

// Specialized components
import LatencyAlertCard from '../features/dashboard/components/LatencyAlertCard';
import LatencyMiniChart from '../features/dashboard/components/LatencyMiniChart';
import LatencyMetricCard from '../features/dashboard/components/LatencyMetricCard';
import ConnectionQualityPanel from '../features/dashboard/components/ConnectionQualityPanel';

/**
 * 🚀 ExecutionLatencyMonitor - Componente crítico para monitoreo de latencias en scalping
 * 
 * Características:
 * - Tracking en tiempo real de latencias de ejecución
 * - Alertas críticas cuando latencia > 100ms
 * - Historial de latencias para análisis
 * - Métricas de calidad de conexión
 * - Específico para estrategias de scalping
 * 
 * Eduard Guzmán - InteliBotX
 */
export default function ExecutionLatencyMonitor({ bot, strategy, refreshInterval = 2000 }) {
  // 🎯 Specialized hooks integration
  const { latencyMetrics, loading, error } = useExecutionLatencyMetrics(bot?.id, refreshInterval);
  const { alertActive, dismissAlert } = useLatencyAlerts(latencyMetrics.current);
  const { latencyHistory } = useLatencyHistory(latencyMetrics.current);
  const { getLatencyColor, getConnectionColor, getRecommendations } = useLatencyThresholds(strategy);






  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-800/50 rounded-lg h-32"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
          <p className="text-red-400">Error loading latency metrics: {error}</p>
        </div>
      </div>
    );
  }

  // Calculate badge data
  const getBadgeData = (current) => {
    if (current < 50) return { className: 'bg-green-500/20 text-green-400', text: 'EXCELLENT' };
    if (current < 100) return { className: 'bg-yellow-500/20 text-yellow-400', text: 'ACCEPTABLE' };
    return { className: 'bg-red-500/20 text-red-400', text: 'CRITICAL' };
  };

  const recommendations = getRecommendations(latencyMetrics.current);
  const strategyTarget = strategy === 'Smart Scalper' ? '50' : '100';

  return (
    <div className="space-y-4">
      {/* Critical Alert */}
      <LatencyAlertCard 
        alertActive={alertActive} 
        latency={latencyMetrics.current}
        onDismiss={dismissAlert}
      />
      
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LatencyMetricCard
          icon={Zap}
          title="Current Latency"
          value={latencyMetrics.current}
          color={getLatencyColor(latencyMetrics.current)}
          badge={getBadgeData(latencyMetrics.current)}
          subtitle={`Target: <${strategyTarget}ms`}
          isHighlighted={alertActive}
        />
        
        <LatencyMetricCard
          icon={Clock}
          title="1min Average"
          value={latencyMetrics.average_1min}
          color={getLatencyColor(latencyMetrics.average_1min)}
          subtitle="Rolling average"
        />
        
        <LatencyMetricCard
          icon={Activity}
          title="Max Today"
          value={latencyMetrics.max_today}
          color="text-red-400"
          subtitle="Peak latency"
        />
        
        <LatencyMetricCard
          icon={AlertCircle}
          title="Critical Alerts"
          value={latencyMetrics.critical_alerts_today}
          color={latencyMetrics.critical_alerts_today > 0 ? 'text-red-400' : 'text-gray-400'}
          subtitle="Today"
        />
      </div>

      {/* Connection Quality Panel */}
      <ConnectionQualityPanel
        latencyMetrics={latencyMetrics}
        strategy={strategy}
        getConnectionColor={getConnectionColor}
        getLatencyColor={getLatencyColor}
        recommendations={recommendations}
      />
      
      {/* Mini Chart */}
      <LatencyMiniChart latencyHistory={latencyHistory} />
    </div>
  );
}