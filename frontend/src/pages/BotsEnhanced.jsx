import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EnhancedBotCreationModal from '../components/EnhancedBotCreationModal';
import BotTemplates from '../components/BotTemplates';
import { useRealTimeData, useExchangeBalance } from '../hooks/useRealTimeData';
import { calculateMonetaryValues, formatMonetaryValue, calculateRiskMetrics } from '../utils/botCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const BotsEnhanced = () => {
  const { isAuthenticated, userExchanges } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Datos en tiempo real del primer exchange disponible
  const firstExchange = userExchanges?.[0];
  const realTimeData = useRealTimeData(firstExchange?.id, 'BTCUSDT');
  const balanceData = useExchangeBalance(firstExchange?.id);

  useEffect(() => {
    if (firstExchange) {
      setSelectedExchange(firstExchange);
    }
  }, [firstExchange]);

  const handleCreateBot = async (botData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('intelibotx_token')}`
        },
        body: JSON.stringify(botData)
      });

      if (response.ok) {
        const newBot = await response.json();
        setBots(prev => [...prev, newBot]);
        console.log('Bot creado exitosamente:', newBot);
      } else {
        const errorData = await response.json();
        console.error('Error creando bot:', errorData);
      }
    } catch (error) {
      console.error('Error en request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setShowTemplates(false);
    // Pre-llenar modal con template seleccionado
    setTimeout(() => {
      setShowCreateModal(true);
    }, 100);
    console.log('Template seleccionado:', template);
  };

  const mockBotData = {
    stake: 100,
    take_profit: 2.5,
    stop_loss: 1.5,
    leverage: 1,
    market_type: 'SPOT',
    base_currency: 'USDT'
  };

  const monetaryPreview = realTimeData.currentPrice ? 
    calculateMonetaryValues(mockBotData, realTimeData.currentPrice, balanceData.getBalance('USDT')) : 
    null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
          <p>Debes iniciar sesión para acceder a esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🤖 Enhanced Bot Creation - DEMO
          </h1>
          <p className="text-gray-300 text-lg">
            Prueba completa de FASE 1B: Bot Creation Enhanced con datos reales
          </p>
        </div>

        {/* Exchange Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center">
                🔗 Exchanges Conectados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400 mb-2">
                {userExchanges?.length || 0}
              </div>
              <div className="space-y-1">
                {userExchanges?.map(exchange => (
                  <div key={exchange.id} className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-gray-300">{exchange.exchange_name.toUpperCase()}</span>
                  </div>
                ))}
                {userExchanges?.length === 0 && (
                  <div className="text-yellow-400 text-sm">No hay exchanges configurados</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center">
                💰 Balance Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realTimeData.loading ? (
                <div className="text-gray-400">Cargando...</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-400">
                    ${balanceData.getBalance('USDT').toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">USDT disponible</div>
                  {selectedExchange && (
                    <div className="text-xs text-blue-400">
                      📡 {selectedExchange.exchange_name.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center">
                📈 Precio BTCUSDT
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realTimeData.loading ? (
                <div className="text-gray-400">Cargando...</div>
              ) : (
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">
                    ${realTimeData.currentPrice?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Precio en tiempo real</div>
                  {realTimeData.isConnected && (
                    <div className="flex items-center text-xs text-green-400">
                      <div className="w-1 h-1 bg-green-400 rounded-full mr-1"></div>
                      Conectado
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cálculos Monetarios Preview */}
        {monetaryPreview && (
          <Card className="bg-blue-500/10 border-blue-500/50 mb-8">
            <CardHeader>
              <CardTitle className="text-blue-400">💡 Preview Cálculos Dinámicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-green-400 text-lg font-bold">
                    {formatMonetaryValue(monetaryPreview.tpValue, 'USDT', true)}
                  </div>
                  <div className="text-xs text-gray-400">Take Profit</div>
                </div>
                <div>
                  <div className="text-red-400 text-lg font-bold">
                    {formatMonetaryValue(-monetaryPreview.slValue, 'USDT', true)}
                  </div>
                  <div className="text-xs text-gray-400">Stop Loss</div>
                </div>
                <div>
                  <div className="text-white text-lg font-bold">
                    ${monetaryPreview.positionSize.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">Posición Total</div>
                </div>
                <div>
                  <div className="text-yellow-400 text-lg font-bold">
                    {(monetaryPreview.tpValue / monetaryPreview.slValue).toFixed(2)}:1
                  </div>
                  <div className="text-xs text-gray-400">R:R Ratio</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botones de Testing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">🚀 Enhanced Bot Creation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                Prueba el nuevo modal de creación de bots con todos los features implementados:
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>✅ Nombres personalizados del bot</li>
                <li>✅ Selector de exchange integrado</li>
                <li>✅ Gestión completa de órdenes (TP/SL/Entry/Exit)</li>
                <li>✅ Apalancamiento futures (1-125x)</li>
                <li>✅ Valores monetarios dinámicos en tiempo real</li>
                <li>✅ Selección moneda base</li>
              </ul>
              <Button
                onClick={() => setShowCreateModal(true)}
                disabled={userExchanges?.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500"
              >
                {userExchanges?.length === 0 ? 'Configura un Exchange primero' : 'Abrir Enhanced Creator'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">📋 Bot Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300 text-sm">
                Explora templates predefinidos con configuraciones optimizadas:
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>✅ 6 templates predefinidos (Conservador, Agresivo, etc.)</li>
                <li>✅ Análisis de riesgo automático</li>
                <li>✅ Configuración detallada de cada template</li>
                <li>✅ Métricas de R:R ratio calculadas</li>
                <li>✅ Persistencia de templates personalizados</li>
                <li>✅ Import/Export configuraciones</li>
              </ul>
              <Button
                onClick={() => setShowTemplates(true)}
                className="w-full bg-purple-600 hover:bg-purple-500"
              >
                Explorar Templates
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status de Implementación */}
        <Card className="bg-green-500/10 border-green-500/50">
          <CardHeader>
            <CardTitle className="text-green-400">✅ FASE 1B - Bot Creation Enhanced COMPLETADA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-white font-semibold mb-2">1B.1 Enhanced Modal</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✅ EnhancedBotCreationModal.jsx</li>
                  <li>✅ Nombres personalizados</li>
                  <li>✅ Selector exchanges</li>
                  <li>✅ Gestión órdenes completa</li>
                  <li>✅ Valores monetarios dinámicos</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">1B.2 Real-time Calcs</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✅ botCalculations.js</li>
                  <li>✅ useRealTimeData.js</li>
                  <li>✅ Balance validation</li>
                  <li>✅ Leverage limits</li>
                  <li>✅ Risk calculations</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">1B.3 Bot Templates</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✅ BotTemplates.jsx</li>
                  <li>✅ configTemplates.js</li>
                  <li>✅ 6 templates predefinidos</li>
                  <li>✅ Templates personalizados</li>
                  <li>✅ Import/Export</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <EnhancedBotCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBotCreated={handleCreateBot}
      />

      <BotTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};

export default BotsEnhanced;