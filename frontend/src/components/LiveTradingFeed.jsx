import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Zap
} from "lucide-react";

export default function LiveTradingFeed({ bots }) {
  const [trades, setTrades] = useState([]);
  const [activeBots, setActiveBots] = useState([]);

  useEffect(() => {
    const runningBots = bots.filter(bot => bot.status === 'RUNNING');
    setActiveBots(runningBots);

    // Simular trades en tiempo real para bots activos
    if (runningBots.length > 0) {
      const interval = setInterval(() => {
        if (Math.random() > 0.6) { // 40% chance de generar trade
          const randomBot = runningBots[Math.floor(Math.random() * runningBots.length)];
          const newTrade = generateMockTrade(randomBot);
          
          setTrades(prevTrades => {
            const newTrades = [newTrade, ...prevTrades.slice(0, 19)]; // Mantener últimos 20
            return newTrades;
          });
        }
      }, 15000); // Cada 15 segundos

      return () => clearInterval(interval);
    }
  }, [bots]);

  const generateMockTrade = (bot) => {
    const tradeTypes = ['BUY', 'SELL'];
    const signals = [
      'RSI Oversold Signal',
      'MACD Bullish Crossover', 
      'Support Level Bounce',
      'Breakout Detection',
      'Volume Spike Alert',
      'Bollinger Band Squeeze',
      'EMA Crossover Signal',
      'Fibonacci Retracement'
    ];

    const isProfit = Math.random() > 0.35; // 65% trades profitable
    const pnl = isProfit 
      ? Math.random() * 15 + 2    // +2 a +17 USDT
      : -(Math.random() * 8 + 1); // -1 a -9 USDT

    return {
      id: Date.now() + Math.random(),
      botId: bot.id,
      symbol: bot.symbol,
      strategy: bot.strategy,
      type: tradeTypes[Math.floor(Math.random() * tradeTypes.length)],
      signal: signals[Math.floor(Math.random() * signals.length)],
      pnl: pnl,
      timestamp: new Date(),
      price: (Math.random() * 10000 + 20000).toFixed(2), // Mock price
      quantity: (Math.random() * 0.1 + 0.001).toFixed(6)
    };
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getTotalPnL = () => {
    return trades.reduce((sum, trade) => sum + trade.pnl, 0);
  };

  const getWinRate = () => {
    if (trades.length === 0) return 0;
    const profitable = trades.filter(t => t.pnl > 0).length;
    return ((profitable / trades.length) * 100).toFixed(1);
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="text-green-400" size={20} />
            Trading en Vivo
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
            {activeBots.length > 0 && trades.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Esperando operaciones...</span>
                </div>
                <p className="text-sm">Los bots están analizando el mercado</p>
                <p className="text-xs mt-2 text-blue-400">💡 Abre la consola del navegador para ver análisis detallado</p>
              </div>
            )}
            {trades.length > 0 && (
              trades.map((trade) => (
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
                            trade.type === 'BUY' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                        >
                          {trade.type}
                        </Badge>
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
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(trade.timestamp)}
                    </div>
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