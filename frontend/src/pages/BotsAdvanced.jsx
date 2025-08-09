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
import EnhancedBotCreationModal from "../components/EnhancedBotCreationModal";
import BotTemplates from "../components/BotTemplates";
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
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  

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
    const totalPnL = runningBots.reduce((sum, bot) => sum + Number(bot.metrics?.realizedPnL || 0), 0);
    const avgSharpe = runningBots.length > 0 
      ? Number((runningBots.reduce((sum, bot) => sum + Number(bot.metrics?.sharpeRatio || 0), 0) / runningBots.length).toFixed(2))
      : 0;
    const avgWinRate = runningBots.length > 0
      ? Number((runningBots.reduce((sum, bot) => sum + Number(bot.metrics?.winRate || 0), 0) / runningBots.length).toFixed(1))
      : 0;

    return {
      totalPnL: Number(totalPnL.toFixed(2)),
      activeBots: runningBots.length,
      avgSharpe: Number(avgSharpe.toFixed(2)),
      avgWinRate: Number(avgWinRate.toFixed(1))
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


  // Handlers para nuevos componentes Enhanced
  const handleEnhancedBotCreated = (newBot) => {
    const botData = newBot.bot || newBot;
    console.log('🚀 Bot creado recibido:', botData);
    setBots(prevBots => [...prevBots, {
      id: botData.id,
      name: botData.name,  // ✅ FIX: Add missing name field
      symbol: botData.symbol,
      strategy: botData.strategy,
      stake: botData.stake,
      take_profit: botData.take_profit,  // ✅ FIX: Use correct field name
      stop_loss: botData.stop_loss,  // ✅ FIX: Use correct field name
      takeProfit: botData.take_profit,  // Keep both for compatibility
      stopLoss: botData.stop_loss,  // Keep both for compatibility
      riskPercentage: botData.risk_percentage || 1.0,
      risk_percentage: botData.risk_percentage || 1.0,
      marketType: botData.market_type || 'spot',
      market_type: botData.market_type || 'spot',  // ✅ FIX: Use correct field name
      leverage: botData.leverage || 1,  // ✅ FIX: Add missing leverage field
      margin_type: botData.margin_type || 'ISOLATED',  // ✅ FIX: Add missing margin_type field
      status: 'STOPPED',
      metrics: getAdvancedMetrics({})
    }]);
    setShowEnhancedModal(false);
    setSuccessMessage(`✅ ${botData.name || 'Bot Enhanced'} creado exitosamente`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleTemplateSelected = (template) => {
    console.log('Template seleccionado:', template);
    setSelectedTemplate(template);
    setShowTemplates(false);
    // Abrir directamente el modal Enhanced con la configuración del template
    setTimeout(() => {
      setShowEnhancedModal(true);
    }, 100);
    setSuccessMessage(`✅ Template "${template.name}" cargado en el formulario.`);
    setTimeout(() => setSuccessMessage(null), 3000);
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
    try {
      console.log('🔄 Cambiando estado bot:', botId, 'de', currentStatus);
      
      const newStatus = currentStatus === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      const bot = bots.find(b => b.id === botId);
      
      if (!bot) {
        throw new Error('Bot no encontrado');
      }
      
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
      
      // Mostrar mensaje de error al usuario
      setSuccessMessage(`❌ Error al cambiar estado del bot: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
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
        
        // Asegurar que pnl sea un número válido
        pnl = isNaN(pnl) ? 0 : Number(pnl);
        
        const price = Number((Math.random() * 10000 + 45000).toFixed(2));
        const stake = Number(bot.stake) || 1000;
        const risk = Number(bot.riskPercentage) || 1;
        const quantity = Number(((stake * risk / 100) / price).toFixed(6));
        
        // Actualizar métricas del bot
        setBots(prevBots => 
          prevBots.map(b => 
            b.id === botId ? {
              ...b,
              metrics: {
                ...b.metrics,
                realizedPnL: Number((Number(b.metrics?.realizedPnL || 0) + pnl).toFixed(2)),
                totalTrades: (b.metrics?.totalTrades || 0) + 1
              }
            } : b
          )
        );
        
        console.log(`🎯 SEÑAL: ${signal}`);
        console.log(`📊 ${bot.symbol} ${tradeType} | Precio: $${price} | PnL: ${pnl >= 0 ? '+' : ''}$${Number(pnl).toFixed(2)}`);
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
    try {
      console.log('🔍 Seleccionando bot para historial:', botId);
      setSelectedBotId(botId);
      setActiveTab('history');
      console.log('✅ Bot seleccionado para historial exitosamente');
    } catch (error) {
      console.error('❌ Error en handleBotSelect:', error);
      setSuccessMessage(`❌ Error al seleccionar bot: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleViewBotDetails = (bot) => {
    try {
      console.log('👁️ Mostrando detalles avanzados del bot:', bot.id);
      setSelectedBot(bot);
      console.log('✅ Detalles del bot mostrados exitosamente');
    } catch (error) {
      console.error('❌ Error en handleViewBotDetails:', error);
      setSuccessMessage(`❌ Error al mostrar detalles: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
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
            name: bot.name,  // ✅ FIX: Add name field
            symbol: bot.symbol,
            strategy: bot.strategy,
            stake: bot.stake,
            take_profit: bot.take_profit,  // ✅ FIX: Use correct field name
            stop_loss: bot.stop_loss,  // ✅ FIX: Use correct field name
            takeProfit: bot.take_profit,  // Keep both for compatibility
            stopLoss: bot.stop_loss,  // Keep both for compatibility
            riskPercentage: bot.risk_percentage,
            risk_percentage: bot.risk_percentage,
            marketType: bot.market_type,
            market_type: bot.market_type,  // ✅ FIX: Use correct field name
            leverage: bot.leverage || 1,  // ✅ FIX: Add leverage field
            margin_type: bot.margin_type || 'ISOLATED',  // ✅ FIX: Add margin_type field
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
          <div className="flex space-x-3">
            <Button 
              onClick={() => setShowEnhancedModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              🚀 Crear Bot Enhanced
            </Button>
            <Button 
              onClick={() => setShowTemplates(true)}
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
            >
              📋 Templates
            </Button>
          </div>
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
              onViewDetails={handleViewBotDetails}
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
                  {bots.map((bot) => {
                    if (!bot || !bot.id) return null;
                    return (
                      <Button
                        key={bot.id}
                        variant={selectedBotId === bot.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          console.log('🔄 Cambiando bot seleccionado a:', bot.id);
                          setSelectedBotId(bot.id);
                        }}
                        className={selectedBotId === bot.id 
                          ? 'bg-blue-600 text-white text-xs' 
                          : 'text-gray-300 border-gray-600 hover:text-white text-xs'
                        }
                      >
                        Bot {bot.id} ({bot.strategy || 'N/A'})
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Envolver TradingHistory en try-catch visual */}
            <div className="relative">
              <TradingHistory botId={selectedBotId} />
            </div>
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

        {/* Modal de Mensaje de Éxito/Error */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50">
            <div className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur-sm ${
              successMessage.includes('❌') 
                ? 'bg-red-900/90 border border-red-500/50 text-red-100' 
                : 'bg-green-900/90 border border-green-500/50 text-green-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className="text-lg">
                  {successMessage.includes('❌') ? '❌' : '✅'}
                </div>
                <div className="font-medium">
                  {successMessage.replace('❌ ', '').replace('✅ ', '')}
                </div>
                <button 
                  onClick={() => setSuccessMessage(null)}
                  className="ml-2 text-gray-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Bot Creation Modal */}
        <EnhancedBotCreationModal
          isOpen={showEnhancedModal}
          onClose={() => {
            setShowEnhancedModal(false);
            setSelectedTemplate(null);
          }}
          onBotCreated={handleEnhancedBotCreated}
          selectedTemplate={selectedTemplate}
        />

        {/* Bot Templates Modal */}
        <BotTemplates
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleTemplateSelected}
        />
      </div>
    </div>
  );
}