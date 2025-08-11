import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Zap,
  RefreshCw
} from "lucide-react";
import { useLiveTradingFeed } from "../services/tradingOperationsService";

export default function LiveTradingFeed({ bots }) {
  const [activeBots, setActiveBots] = useState([]);
  
  // 🔄 NUEVA API: Reemplaza lógica de memoria por API persistente
  const runningBotIds = bots.filter(bot => bot.status === 'RUNNING').map(bot => bot.id).join(',');
  const { feed, loading, error, refetch } = useLiveTradingFeed({
    limit: 50,
    bot_ids: runningBotIds || undefined,
    hours: 24
  });

  useEffect(() => {
    const runningBots = bots.filter(bot => bot.status === 'RUNNING');
    setActiveBots(runningBots);
  }, [bots]);

  // ✅ BENEFICIO: Los trades ahora persisten entre sesiones

  const getTotalPnL = () => {
    return feed.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  };

  const getWinRate = () => {
    if (feed.length === 0) return 0;
    const profitable = feed.filter(t => t.pnl > 0).length;
    return ((profitable / feed.length) * 100).toFixed(1);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-green-400" size={20} />
            Trading en Vivo
            {loading && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Zap size={12} className="mr-1" />
              {activeBots.length} Activos
            </Badge>
            <div className="text-right">
              <div className={`text-sm font-semibold ${
                getTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {getTotalPnL() >= 0 ? '+' : ''}${getTotalPnL().toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Win: {getWinRate()}%</div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeBots.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Activity size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay bots activos</p>
            <p className="text-sm">Inicia un bot para ver las operaciones en tiempo real</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            
            {/* 🔄 Estado de carga */}
            {loading && (
              <div className="text-center py-8 text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cargando operaciones...</span>
                </div>
                <p className="text-sm">Conectando con API persistente</p>
              </div>
            )}

            {/* 🚨 Estado de error */}
            {error && !loading && (
              <div className="text-center py-8 text-red-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span>❌ Error cargando operaciones</span>
                </div>
                <p className="text-xs">{error}</p>
                <button 
                  onClick={refetch}
                  className="mt-2 px-3 py-1 bg-red-500/20 rounded text-xs hover:bg-red-500/30"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* ✅ Datos de API persistente */}
            {!loading && !error && feed.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>No hay operaciones recientes</span>
                </div>
                <p className="text-sm">Los bots están analizando el mercado</p>
                <p className="text-xs mt-2 text-blue-400">✅ Datos persisten entre sesiones</p>
              </div>
            )}

            {!loading && !error && feed.length > 0 && (
              feed.map((trade) => (
                <div 
                  key={trade.id}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      trade.pnl >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-sm">{trade.symbol}</span>
                        <Badge 
                          className={`text-xs px-2 py-0 ${
                            trade.side === 'BUY' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {trade.side}
                        </Badge>
                        {trade.algorithm_used && (
                          <span className="text-xs text-yellow-400 px-1 py-0 bg-yellow-400/10 rounded">
                            {trade.algorithm_used}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {trade.signal} • {trade.strategy}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold text-sm ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${Number(trade.pnl || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {trade.time_ago}
                    </div>
                    {trade.confidence && (
                      <div className="text-xs text-blue-400">
                        {(trade.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}