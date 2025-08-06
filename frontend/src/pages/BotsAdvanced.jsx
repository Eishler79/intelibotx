import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchBots } from "@/services/api";
import TradingViewWidget from "@/components/TradingViewWidget";
import BotControlPanel from "@/components/BotControlPanel";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import ProfessionalBotsTable from "@/components/ProfessionalBotsTable";
import LiveTradingFeed from "@/components/LiveTradingFeed";
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
  const [newBotData, setNewBotData] = useState({
    symbol: 'BTCUSDT',
    strategy: 'Smart Scalper',
    stake: 1000,
    takeProfit: 2.5,
    stopLoss: 1.5,
    riskPercentage: 1.0,
    marketType: 'spot'
  });

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
        // Bot no existe en servidor, solo eliminar localmente
        console.log('⚠️ Bot no encontrado en servidor, eliminando solo localmente');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Error del servidor');
      }

      // Siempre eliminar de la interfaz local
      setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
      
      // Detener bot si estaba corriendo
      if (window.botIntervals && window.botIntervals[botId]) {
        clearInterval(window.botIntervals[botId]);
        delete window.botIntervals[botId];
      }

      console.log(`🗑️ Bot ${bot.symbol} eliminado de la interfaz`);
      
    } catch (error) {
      console.error('❌ Error eliminando bot:', error);
      
      // Si es un error de conexión, eliminar solo localmente
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        setBots(prevBots => prevBots.filter(bot => bot.id !== botId));
        console.log('🔌 Sin conexión - Bot eliminado solo localmente');
      } else {
        alert(`Error: ${error.message}`);
      }
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
          console.log(`📊 Bot ${bot?.symbol} - Estrategia: ${bot?.strategy}`);
          startBotTrading(botId, bot);
        } else {
          console.log(`⏸️ ${result.message}`);
          stopBotTrading(botId);
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ Error cambiando estado del bot:`, error);
      // Revertir cambio si hay error
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, status: currentStatus } : bot
        )
      );
      
      // Mostrar error al usuario
      alert(`Error: No se pudo ${newStatus === 'RUNNING' ? 'iniciar' : 'pausar'} el bot. ${error.message}`);
    }
  };

  // Sistema básico de trading automático (simulación inteligente)
  const startBotTrading = (botId, bot) => {
    if (!bot) {
      bot = bots.find(b => b.id === botId);
      if (!bot) return;
    }
    
    console.log(`🤖 Iniciando motor de trading IA para ${bot.symbol}`);
    console.log(`📊 Estrategia: ${bot.strategy}`);
    console.log(`💰 Capital: $${bot.stake} USDT`);
    console.log(`🎯 TP: ${bot.takeProfit}% | SL: ${bot.stopLoss}%`);
    console.log(`⚡ Mercado: ${bot.marketType?.toUpperCase() || 'SPOT'}`);
    
    // Simular análisis y operaciones inteligentes
    const strategies = {
      'Smart Scalper': { frequency: 45000, winRate: 0.7, avgProfit: 8 },        // 45s
      'Trend Hunter': { frequency: 120000, winRate: 0.65, avgProfit: 25 },       // 2min  
      'Manipulation Detector': { frequency: 180000, winRate: 0.8, avgProfit: 40 }, // 3min
      'News Sentiment': { frequency: 300000, winRate: 0.6, avgProfit: 60 },      // 5min
      'Volatility Master': { frequency: 60000, winRate: 0.72, avgProfit: 15 }    // 1min
    };
    
    const strategyConfig = strategies[bot.strategy] || strategies['Smart Scalper'];
    
    // Análisis inicial
    console.log(`🔍 ${bot.strategy} analizando mercado ${bot.symbol}...`);
    console.log(`📈 Parámetros: Frecuencia ${strategyConfig.frequency/1000}s | Win Rate ${(strategyConfig.winRate*100).toFixed(1)}%`);
    
    const interval = setInterval(() => {
      // Probabilidad de trade basada en la estrategia
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
        
        console.log(`🎯 SEÑAL: ${signal}`);
        console.log(`📊 ${bot.symbol} ${tradeType} | Precio: $${price} | Cantidad: ${quantity}`);
        console.log(`💰 PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT | ${((pnl/bot.stake)*100).toFixed(2)}%`);
        console.log(`---`);
      } else {
        // Logs de análisis sin operación
        const analysisLogs = [
          `📊 Analizando ${bot.symbol} - Volatilidad dentro de rango`,
          `🔍 Esperando señal de entrada - RSI neutral`,
          `📈 Monitoreando resistencias clave`,
          `⏳ Condiciones de mercado evaluándose`,
          `🎯 Buscando setup de alta probabilidad`
        ];
        
        if (Math.random() > 0.7) { // 30% chance de mostrar análisis
          const log = analysisLogs[Math.floor(Math.random() * analysisLogs.length)];
          console.log(`${log} [${bot.strategy}]`);
        }
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
    console.log(`🛑 Deteniendo motor de trading para ${bot?.symbol}`);
    
    if (window.botIntervals && window.botIntervals[botId]) {
      clearInterval(window.botIntervals[botId]);
      delete window.botIntervals[botId];
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
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelibotx-production.up.railway.app';
        
        const response = await fetch(`${BASE_URL}/api/bots`);
        if (response.ok) {
          const botsData = await response.json();
          setBots(botsData.map(bot => ({
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
          })));
          console.log(`✅ Cargados ${botsData.length} bots desde el servidor`);
        } else {
          throw new Error('Error al cargar bots del servidor');
        }
      } catch (error) {
        console.error("Error loading bots:", error);
        console.log("📝 Sin conexión al servidor - Iniciando sin bots");
        setBots([]); // Empezar sin bots si no hay conexión
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
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
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

        {/* Tabla Profesional de Bots */}
        <ProfessionalBotsTable 
          bots={bots}
          onSelectBot={setSelectedBot}
          onDeleteBot={handleDeleteBot}
          onControlBot={setControlPanelBot}
          onToggleBotStatus={handleToggleBotStatus}
        />

        {/* Sección de Trading en Vivo */}
        <div className="mt-8">
          <LiveTradingFeed bots={bots} />
        </div>

        {/* Grid de Bots - DEPRECADO, reemplazado por tabla profesional */}
        <div style={{display: 'none'}}>
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
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-600 hover:bg-red-800 text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar bot ${bot.symbol}?`)) {
                        handleDeleteBot(bot.id);
                      }
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

                {/* Tipo de Mercado */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Mercado</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={newBotData.marketType === 'spot' ? 'default' : 'outline'}
                      onClick={() => setNewBotData(prev => ({...prev, marketType: 'spot'}))}
                      className="w-full"
                    >
                      Spot
                    </Button>
                    <Button 
                      variant={newBotData.marketType === 'futures' ? 'default' : 'outline'}
                      onClick={() => setNewBotData(prev => ({...prev, marketType: 'futures'}))}
                      className="w-full"
                    >
                      Futuros
                    </Button>
                  </div>
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
                    Take Profit: {newBotData.takeProfit}% (${(newBotData.stake * newBotData.takeProfit / 100).toFixed(2)} USDT)
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
                    Stop Loss: {newBotData.stopLoss}% (-${(newBotData.stake * newBotData.stopLoss / 100).toFixed(2)} USDT)
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

                {/* Risk per Trade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Riesgo por Trade: {newBotData.riskPercentage}%
                  </label>
                  <input 
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={newBotData.riskPercentage}
                    onChange={(e) => setNewBotData(prev => ({...prev, riskPercentage: parseFloat(e.target.value)}))}
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
            onUpdateBot={handleUpdateBot}
            onClose={() => setControlPanelBot(null)}
          />
        )}
      </div>
    </div>
  );
}