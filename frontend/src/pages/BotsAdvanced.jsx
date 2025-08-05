import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchBots } from "@/services/api";
import TradingViewWidget from "@/components/TradingViewWidget";
import BotControlPanel from "@/components/BotControlPanel";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3,
  Settings,
  Play,
  Pause,
  Square,
  AlertTriangle
} from "lucide-react";

export default function BotsAdvanced() {
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [controlPanelBot, setControlPanelBot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock advanced metrics - En producción vendrían del backend
  const getAdvancedMetrics = (bot) => ({
    sharpeRatio: (Math.random() * 2 + 0.5).toFixed(2),
    sortinoRatio: (Math.random() * 2.5 + 0.8).toFixed(2),
    calmarRatio: (Math.random() * 1.5 + 0.3).toFixed(2),
    maxDrawdown: (Math.random() * 15 + 2).toFixed(1),
    winRate: (Math.random() * 40 + 50).toFixed(1),
    profitFactor: (Math.random() * 1.5 + 1.2).toFixed(2),
    totalTrades: Math.floor(Math.random() * 500 + 100),
    avgWin: (Math.random() * 2 + 0.5).toFixed(2),
    avgLoss: (Math.random() * 1.5 + 0.3).toFixed(2),
    equity: Array.from({length: 30}, (_, i) => ({
      day: i + 1,
      value: 10000 + (Math.random() - 0.5) * 2000 + i * 50
    }))
  });

  const getBotStatus = (bot) => {
    const statuses = ['RUNNING', 'PAUSED', 'STOPPED', 'ERROR'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'RUNNING': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PAUSED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'STOPPED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'ERROR': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'RUNNING': return <Play size={12} />;
      case 'PAUSED': return <Pause size={12} />;
      case 'STOPPED': return <Square size={12} />;
      case 'ERROR': return <AlertTriangle size={12} />;
      default: return <Square size={12} />;
    }
  };

  const handleUpdateBot = async (botId, parameters) => {
    try {
      // Aquí se haría la llamada al API
      console.log(`Actualizando bot ${botId} con parámetros:`, parameters);
      // En producción: await updateBot(botId, parameters);
      
      // Actualizar el estado local
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, ...parameters } : bot
        )
      );
      
      setControlPanelBot(null);
    } catch (error) {
      console.error("Error actualizando bot:", error);
    }
  };

  useEffect(() => {
    const loadBots = async () => {
      try {
        const response = await fetchBots();
        setBots(response.map(bot => ({
          ...bot,
          status: getBotStatus(bot),
          metrics: getAdvancedMetrics(bot)
        })));
      } catch (error) {
        console.error("Error loading bots:", error);
        // Fallback con datos de ejemplo
        setBots([
          {
            id: 1,
            symbol: "BTCUSDT",
            strategy: "Smart Scalper",
            stake: 1000,
            status: "RUNNING",
            metrics: getAdvancedMetrics({})
          },
          {
            id: 2,
            symbol: "ETHUSDT", 
            strategy: "Trend Hunter",
            stake: 500,
            status: "PAUSED",
            metrics: getAdvancedMetrics({})
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadBots();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0F1C] text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F1C] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🤖 InteliBots AI
            </h1>
            <p className="text-gray-400 mt-2">Dashboard avanzado superior a 3Commas</p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            + Crear Bot IA
          </Button>
        </div>

        {/* Métricas Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total PnL</p>
                  <p className="text-2xl font-bold text-green-400">+$12,847</p>
                </div>
                <TrendingUp className="text-green-400" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Bots Activos</p>
                  <p className="text-2xl font-bold text-blue-400">{bots.filter(b => b.status === 'RUNNING').length}</p>
                </div>
                <Activity className="text-blue-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sharpe Promedio</p>
                  <p className="text-2xl font-bold text-yellow-400">2.31</p>
                </div>
                <BarChart3 className="text-yellow-400" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <p className="text-2xl font-bold text-purple-400">73.2%</p>
                </div>
                <TrendingUp className="text-purple-400" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Bots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Card 
              key={bot.id} 
              className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedBot(bot)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold">{bot.symbol}</CardTitle>
                    <p className="text-gray-400 text-sm">{bot.strategy}</p>
                  </div>
                  <Badge className={`${getStatusColor(bot.status)} flex items-center gap-1`}>
                    {getStatusIcon(bot.status)}
                    {bot.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Métricas Principales */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-gray-400">Sharpe Ratio</p>
                    <p className="font-semibold text-green-400">{bot.metrics.sharpeRatio}</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-gray-400">Win Rate</p>
                    <p className="font-semibold text-blue-400">{bot.metrics.winRate}%</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-gray-400">Max DD</p>
                    <p className="font-semibold text-red-400">{bot.metrics.maxDrawdown}%</p>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-gray-400">Trades</p>
                    <p className="font-semibold text-purple-400">{bot.metrics.totalTrades}</p>
                  </div>
                </div>

                {/* Controles */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30">
                    <Play size={14} className="mr-1" />
                    Start
                  </Button>
                  <Button size="sm" className="flex-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/30">
                    <Pause size={14} className="mr-1" />
                    Pause
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-gray-600 hover:bg-gray-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      setControlPanelBot(bot);
                    }}
                  >
                    <Settings size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Panel de Detalles */}
        {selectedBot && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-gray-700 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">
                    {selectedBot.symbol} - {selectedBot.strategy}
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedBot(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TradingView Chart Integrado */}
                <div className="bg-gray-800/50 rounded-lg overflow-hidden" style={{ height: "400px" }}>
                  <TradingViewWidget 
                    symbol={selectedBot.symbol.replace("/", "")} 
                    interval="15m" 
                    theme="dark" 
                  />
                </div>

                {/* Métricas Avanzadas Completas */}
                <AdvancedMetrics 
                  bot={selectedBot}
                  equityData={selectedBot.metrics.equity}
                  tradeHistory={selectedBot.metrics.trades}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Panel de Control Dinámico */}
        {controlPanelBot && (
          <BotControlPanel
            bot={controlPanelBot}
            onUpdateBot={handleUpdateBot}
            onClose={() => setControlPanelBot(null)}
          />
        )}
      </div>
    </div>
  );
}