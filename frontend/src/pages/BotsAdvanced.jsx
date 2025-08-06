import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TradingViewWidget from "@/components/TradingViewWidget";
import BotControlPanel from "@/components/BotControlPanel";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import ProfessionalBotsTable from "@/components/ProfessionalBotsTable";
import LiveTradingFeed from "@/components/LiveTradingFeed";
import TradingHistory from "../components/TradingHistory";
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBotId, setSelectedBotId] = useState(null);
  
  const [newBotData, setNewBotData] = useState({
    symbol: 'BTCUSDT',
    strategy: 'Smart Scalper',
    stake: 1000,
    takeProfit: 2.5,
    stopLoss: 1.5,
    riskPercentage: 1.0,
    marketType: 'spot'
  });

  // Calcular métricas dinámicas basadas en bots reales
  const calculateDynamicMetrics = () => {
    if (bots.length === 0) {
      return {
        totalPnL: 0,
        activeBots: 0,
        avgSharpe: 0,
        avgWinRate: 0
      };
    }

    const runningBots = bots.filter(b => b.status === 'RUNNING');
    const totalPnL = runningBots.reduce((sum, bot) => sum + (bot.metrics?.realizedPnL || 0), 0);
    const avgSharpe = runningBots.length > 0 
      ? (runningBots.reduce((sum, bot) => sum + parseFloat(bot.metrics?.sharpeRatio || 0), 0) / runningBots.length).toFixed(2)
      : "0.00";
    const avgWinRate = runningBots.length > 0
      ? (runningBots.reduce((sum, bot) => sum + parseFloat(bot.metrics?.winRate || 0), 0) / runningBots.length).toFixed(1)
      : "0.0";

    return {
      totalPnL: totalPnL.toFixed(2),
      activeBots: runningBots.length,
      avgSharpe,
      avgWinRate
    };
  };

  const dynamicMetrics = calculateDynamicMetrics();

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
    realizedPnL: (Math.random() * 2000 - 1000).toFixed(2),
    equity: Array.from({length: 30}, (_, i) => ({
      day: i + 1,
      value: 10000 + (Math.random() - 0.5) * 2000 + i * 50
    }))
  });

  const getBotStatus = (bot) => {
    const statuses = ['RUNNING', 'PAUSED', 'STOPPED'];
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

  const handleCreateBot = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      // Enviar datos al backend
      const response = await fetch(`${BASE_URL}/api/create-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: newBotData.symbol,
          strategy: newBotData.strategy,
          stake: newBotData.stake,
          take_profit: newBotData.takeProfit,
          stop_loss: newBotData.stopLoss,
          risk_percentage: newBotData.riskPercentage,
          market_type: newBotData.marketType,
          interval: '15m'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Crear bot para el frontend con métricas
        const newBot = {
          id: result.bot.id,
          symbol: result.bot.symbol,
          strategy: result.bot.strategy,
          stake: result.bot.stake,
          takeProfit: result.bot.take_profit,
          stopLoss: result.bot.stop_loss,
          riskPercentage: result.bot.risk_percentage || newBotData.riskPercentage,
          marketType: newBotData.marketType,
          status: 'STOPPED',
          metrics: getAdvancedMetrics({})
        };
        
        setBots(prevBots => [...prevBots, newBot]);
        setShowCreateModal(false);
        
        // Si es el primer bot, seleccionarlo para historial
        if (bots.length === 0) {
          setSelectedBotId(newBot.id);
        }
        
        // Reset form
        setNewBotData({
          symbol: 'BTCUSDT',
          strategy: 'Smart Scalper', 
          stake: 1000,
          takeProfit: 2.5,
          stopLoss: 1.5,
          riskPercentage: 1.0,
          marketType: 'spot'
        });
        
        console.log('✅ Bot creado exitosamente:', result.message);
        alert(`✅ ${result.message}`);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Error del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error creando bot:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteBot = async (botId) => {
    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      // Encontrar el bot antes de eliminarlo
      const bot = bots.find(b => b.id === botId);
      if (!bot) {
        console.log('Bot no encontrado en la lista local');
        return;
      }

      // Intentar eliminar del servidor
      const response = await fetch(`${BASE_URL}/api/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Bot eliminado del servidor:', result.message);
      } else if (response.status === 404) {
        console.log('⚠️ Bot no encontrado en servidor, eliminando solo localmente');
      }

      // Siempre eliminar de la interfaz local
      setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
      
      // Si era el bot seleccionado, deseleccionar
      if (selectedBotId === botId) {
        const remainingBots = bots.filter(bot => bot.id !== botId);
        setSelectedBotId(remainingBots.length > 0 ? remainingBots[0].id : null);
      }
      
      // Detener bot si estaba corriendo
      if (window.botIntervals && window.botIntervals[botId]) {
        clearInterval(window.botIntervals[botId]);
        delete window.botIntervals[botId];
      }

      console.log(`🗑️ Bot ${bot.symbol} eliminado`);
      
    } catch (error) {
      console.error('❌ Error eliminando bot:', error);
      // Si es un error de conexión, eliminar solo localmente
      setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
    }
  };

  const handleToggleBotStatus = async (botId, currentStatus) => {
    const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
    const bot = bots.find(b => b.id === botId);
    
    try {
      // Actualizar estado visualmente primero
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, status: newStatus } : bot
        )
      );

      // Llamar al backend para cambiar estado real
      const endpoint = newStatus === 'RUNNING' ? 'start' : 'pause';
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
      
      const response = await fetch(`${BASE_URL}/api/bots/${botId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (newStatus === 'RUNNING') {
          console.log(`🚀 ${result.message}`);
          startBotTrading(botId, bot);
        } else {
          console.log(`⏸️ ${result.message}`);
          stopBotTrading(botId);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error cambiando estado del bot:`, error);
      // Revertir cambio si hay error
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, status: currentStatus } : bot
        )
      );
    }
  };

  // Sistema básico de trading automático (simulación inteligente)
  const startBotTrading = (botId, bot) => {
    if (!bot) {
      bot = bots.find(b => b.id === botId);
      if (!bot) return;
    }
    
    console.log(`🤖 Iniciando motor IA para ${bot.symbol} - ${bot.strategy}`);
    
    // Simular análisis y operaciones inteligentes
    const strategies = {
      'Smart Scalper': { frequency: 45000, winRate: 0.7, avgProfit: 8 },
      'Trend Hunter': { frequency: 120000, winRate: 0.65, avgProfit: 25 },
      'Manipulation Detector': { frequency: 180000, winRate: 0.8, avgProfit: 40 },
      'News Sentiment': { frequency: 300000, winRate: 0.6, avgProfit: 60 },
      'Volatility Master': { frequency: 60000, winRate: 0.72, avgProfit: 15 }
    };
    
    const strategyConfig = strategies[bot.strategy] || strategies['Smart Scalper'];
    
    const interval = setInterval(() => {
      const tradeChance = bot.strategy === 'Smart Scalper' ? 0.4 : 0.25;
      
      if (Math.random() < tradeChance) {
        const signals = getTradeSignals(bot.strategy);
        const signal = signals[Math.floor(Math.random() * signals.length)];
        
        const tradeType = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const isWin = Math.random() < strategyConfig.winRate;
        
        let pnl;
        if (isWin) {
          pnl = (Math.random() * strategyConfig.avgProfit * 0.8) + (strategyConfig.avgProfit * 0.2);
        } else {
          pnl = -((Math.random() * strategyConfig.avgProfit * 0.4) + (strategyConfig.avgProfit * 0.1));
        }
        
        const price = (Math.random() * 10000 + 45000).toFixed(2);
        const quantity = ((bot.stake * (bot.riskPercentage || 1) / 100) / parseFloat(price)).toFixed(6);
        
        // Actualizar métricas del bot
        setBots(prevBots => 
          prevBots.map(b => 
            b.id === botId ? {
              ...b,
              metrics: {
                ...b.metrics,
                realizedPnL: (parseFloat(b.metrics?.realizedPnL || 0) + pnl).toFixed(2),
                totalTrades: (b.metrics?.totalTrades || 0) + 1
              }
            } : b
          )
        );
        
        console.log(`🎯 SEÑAL: ${signal}`);
        console.log(`📊 ${bot.symbol} ${tradeType} | Precio: $${price} | PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
      }
    }, strategyConfig.frequency);
    
    // Guardar el interval para poder detenerlo
    window.botIntervals = window.botIntervals || {};
    window.botIntervals[botId] = interval;
  };

  // Señales específicas por estrategia
  const getTradeSignals = (strategy) => {
    const signals = {
      'Smart Scalper': [
        'RSI Oversold + Volume Spike',
        'Bollinger Band Touch + Momentum',
        'Support Bounce + MACD Divergence',
        'EMA Crossover + Low Volatility'
      ],
      'Trend Hunter': [
        'Breakout Above Resistance',
        'Higher High Formation', 
        'Moving Average Alignment',
        'Volume Confirmation Trend'
      ],
      'Manipulation Detector': [
        'Whale Movement Detected',
        'Stop Hunt Pattern',
        'Order Book Imbalance',
        'Unusual Volume Activity'
      ],
      'News Sentiment': [
        'Bullish News Impact',
        'Market Sentiment Shift',
        'Social Media Trend',
        'Fundamental Analysis Signal'  
      ],
      'Volatility Master': [
        'Volatility Expansion',
        'ATR Breakout Signal',
        'Implied Volatility Edge',
        'Range Breakout Confirmed'
      ]
    };
    
    return signals[strategy] || signals['Smart Scalper'];
  };

  const stopBotTrading = (botId) => {
    const bot = bots.find(b => b.id === botId);
    console.log(`🛑 Deteniendo motor IA para ${bot?.symbol}`);
    
    if (window.botIntervals && window.botIntervals[botId]) {
      clearInterval(window.botIntervals[botId]);
      delete window.botIntervals[botId];
    }
  };

  const handleBotSelect = (botId) => {
    setSelectedBotId(botId);
    setActiveTab('history');
  };

  useEffect(() => {
    const loadBots = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
        
        const response = await fetch(`${BASE_URL}/api/bots`);
        if (response.ok) {
          const botsData = await response.json();
          const processedBots = botsData.map(bot => ({
            id: bot.id,
            symbol: bot.symbol,
            strategy: bot.strategy,
            stake: bot.stake,
            takeProfit: bot.take_profit,
            stopLoss: bot.stop_loss,
            riskPercentage: bot.risk_percentage,
            marketType: bot.market_type,
            status: getBotStatus(bot),
            metrics: getAdvancedMetrics(bot)
          }));
          
          setBots(processedBots);
          
          // Seleccionar primer bot para historial
          if (processedBots.length > 0 && !selectedBotId) {
            setSelectedBotId(processedBots[0].id);
          }
          
          console.log(`✅ Cargados ${botsData.length} bots desde el servidor`);
        } else {
          throw new Error('Error al cargar bots del servidor');
        }
      } catch (error) {
        console.error("Error loading bots:", error);
        setBots([]);
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
        {/* Header con Tabs */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🤖 InteliBots AI
            </h1>
            <p className="text-gray-400 mt-2">Dashboard avanzado superior a 3Commas</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            + Crear Bot IA
          </Button>
        </div>

        {/* Tabs de navegación */}
        <div className="flex space-x-4 mb-8">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setActiveTab('dashboard')}
            className={activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600 hover:text-white'}
          >
            Dashboard IA
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600 hover:text-white'}
            disabled={!selectedBotId}
          >
            Historial de Trading
          </Button>
        </div>

        {/* Contenido según tab activo */}
        {activeTab === 'dashboard' && (
          <>
            {/* Métricas Globales DINÁMICAS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total PnL</p>
                      <p className={`text-2xl font-bold ${parseFloat(dynamicMetrics.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {parseFloat(dynamicMetrics.totalPnL) >= 0 ? '+' : ''}${dynamicMetrics.totalPnL}
                      </p>
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
                      <p className="text-2xl font-bold text-blue-400">{dynamicMetrics.activeBots}</p>
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
                      <p className="text-2xl font-bold text-yellow-400">{dynamicMetrics.avgSharpe}</p>
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
                      <p className="text-2xl font-bold text-purple-400">{dynamicMetrics.avgWinRate}%</p>
                    </div>
                    <TrendingUp className="text-purple-400" size={24} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla Profesional de Bots DINÁMICA */}
            <ProfessionalBotsTable 
              bots={bots}
              onSelectBot={handleBotSelect}
              onDeleteBot={handleDeleteBot}
              onControlBot={setControlPanelBot}
              onToggleBotStatus={handleToggleBotStatus}
            />

            {/* Sección de Trading en Vivo */}
            <div className="mt-8">
              <LiveTradingFeed bots={bots} />
            </div>
          </>
        )}

        {/* Tab de Historial de Trading */}
        {activeTab === 'history' && selectedBotId && (
          <div>
            <div className="mb-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Historial de Trading</h3>
                  <p className="text-gray-400">Bot ID: {selectedBotId}</p>
                </div>
                <div className="flex space-x-2">
                  {bots.map((bot) => (
                    <Button
                      key={bot.id}
                      variant={selectedBotId === bot.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBotId(bot.id)}
                      className={selectedBotId === bot.id 
                        ? 'bg-blue-600 text-white text-xs' 
                        : 'text-gray-300 border-gray-600 hover:text-white text-xs'
                      }
                    >
                      Bot {bot.id} ({bot.strategy})
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <TradingHistory botId={selectedBotId} />
          </div>
        )}

        {activeTab === 'history' && !selectedBotId && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl mb-2">Selecciona un Bot</h3>
            <p>Primero crea un bot para ver su historial de trading</p>
          </div>
        )}

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

        {/* Modal de Creación */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-gray-900 border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    🤖 Crear Bot IA Inteligente
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Símbolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Par de Trading</label>
                  <select 
                    value={newBotData.symbol}
                    onChange={(e) => setNewBotData(prev => ({...prev, symbol: e.target.value}))}
                    className="w-full bg-gray-800 border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="BTCUSDT">BTC/USDT</option>
                    <option value="ETHUSDT">ETH/USDT</option>
                    <option value="BNBUSDT">BNB/USDT</option>
                    <option value="ADAUSDT">ADA/USDT</option>
                    <option value="SOLUSDT">SOL/USDT</option>
                  </select>
                </div>

                {/* Estrategia */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estrategia IA</label>
                  <select 
                    value={newBotData.strategy}
                    onChange={(e) => setNewBotData(prev => ({...prev, strategy: e.target.value}))}
                    className="w-full bg-gray-800 border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Smart Scalper">Smart Scalper - IA Multi-timeframe</option>
                    <option value="Trend Hunter">Trend Hunter - Detección de Tendencias IA</option>
                    <option value="Manipulation Detector">Manipulation Detector - Anti-Whales IA</option>
                    <option value="News Sentiment">News Sentiment - IA + Análisis de Noticias</option>
                    <option value="Volatility Master">Volatility Master - IA Adaptativa</option>
                  </select>
                </div>

                {/* Capital */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Capital (USDT): ${newBotData.stake}
                  </label>
                  <input 
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={newBotData.stake}
                    onChange={(e) => setNewBotData(prev => ({...prev, stake: parseInt(e.target.value)}))}
                    className="w-full"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Take Profit: {newBotData.takeProfit}%
                  </label>
                  <input 
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={newBotData.takeProfit}
                    onChange={(e) => setNewBotData(prev => ({...prev, takeProfit: parseFloat(e.target.value)}))}
                    className="w-full"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stop Loss: {newBotData.stopLoss}%
                  </label>
                  <input 
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={newBotData.stopLoss}
                    onChange={(e) => setNewBotData(prev => ({...prev, stopLoss: parseFloat(e.target.value)}))}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateBot}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    🚀 Crear Bot Inteligente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Panel de Control Dinámico */}
        {controlPanelBot && (
          <BotControlPanel
            bot={controlPanelBot}
            onUpdateBot={(botId, params) => {
              setBots(prevBots => 
                prevBots.map(bot => 
                  bot.id === botId ? { ...bot, ...params } : bot
                )
              );
              setControlPanelBot(null);
            }}
            onClose={() => setControlPanelBot(null)}
          />
        )}
      </div>
    </div>
  );
}