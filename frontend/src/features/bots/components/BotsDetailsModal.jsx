import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InstitutionalChart from '../../../components/InstitutionalChart';
import SmartScalperMetricsComplete from '../../../components/SmartScalperMetricsComplete';
import AdvancedMetrics from '../../../components/AdvancedMetrics';

/**
 * BotsDetailsModal - Modal de detalles del bot
 * Extraído de BotsModular.jsx líneas 273-326
 * SUCCESS CRITERIA: Componente especializado
 */
export default function BotsDetailsModal({
  selectedBot,
  realTimeData,
  getRealBotMetrics,
  onClose
}) {
  // Load real metrics when bot is selected
  useEffect(() => {
    const loadMetrics = async () => {
      if (selectedBot && selectedBot.id && getRealBotMetrics) {
        const metrics = await getRealBotMetrics(selectedBot);
        // Metrics will be available in next render
        if (metrics && metrics.trades) {
          selectedBot.metrics = metrics;
        }
      }
    };
    loadMetrics();
  }, [selectedBot?.id, getRealBotMetrics]);

  if (!selectedBot) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="bg-gray-900 border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              {selectedBot.symbol} - {selectedBot.strategy}
            </CardTitle>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Institutional Chart */}
          <div className="rounded-lg overflow-hidden" style={{ height: "450px" }}>
            <InstitutionalChart
              symbol={selectedBot.symbol.replace("/", "")}
              interval="15m"
              theme="dark"
              data={realTimeData[selectedBot.symbol] || []}
              institutionalAnalysis={{
                risk_profile: selectedBot.risk_profile,
                strategy: selectedBot.strategy,
                market_type: selectedBot.market_type
              }}
            />
          </div>

          {/* Métricas Específicas por Estrategia */}
          {selectedBot.strategy === 'Smart Scalper' ? (
            <SmartScalperMetricsComplete
              bot={selectedBot}
              botId={selectedBot.id}
              botSymbol={selectedBot.symbol}
              realTimeData={realTimeData}
              onClose={onClose}
            />
          ) : (
            <AdvancedMetrics
              bot={selectedBot}
              equityData={selectedBot.metrics?.equity || []}
              tradeHistory={selectedBot.metrics?.trades || []}
              onRefresh={() => getRealBotMetrics(selectedBot)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}