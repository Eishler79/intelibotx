import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BotTemplates = ({ isOpen, onSelectTemplate, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const predefinedTemplates = [
    {
      id: 'conservative',
      name: 'Conservador',
      description: 'Estrategia de bajo riesgo con take profits pequeños y stop losses ajustados',
      icon: '🛡️',
      config: {
        strategy: 'Smart Scalper',
        take_profit: 1.5,
        stop_loss: 1.0,
        risk_percentage: 0.5,
        leverage: 1,
        market_type: 'SPOT',
        dca_levels: 2,
        interval: '15m',
        entry_order_type: 'LIMIT',
        exit_order_type: 'LIMIT',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: false
      },
      characteristics: [
        'Riesgo: 0.5% por operación',
        'R:R ratio: 1.5:1',
        'Solo mercado SPOT',
        'DCA conservador (2 niveles)'
      ]
    },
    {
      id: 'aggressive',
      name: 'Agresivo Alpha',
      description: 'Alta rentabilidad con mayor riesgo, ideal para traders experimentados',
      icon: '🚀',
      config: {
        strategy: 'Trend Hunter',
        take_profit: 5.0,
        stop_loss: 2.5,
        risk_percentage: 2.0,
        leverage: 3,
        market_type: 'FUTURES_USDT',
        dca_levels: 5,
        interval: '5m',
        entry_order_type: 'MARKET',
        exit_order_type: 'MARKET',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: true
      },
      characteristics: [
        'Riesgo: 2.0% por operación',
        'R:R ratio: 2:1',
        'Futures con 3x leverage',
        'DCA agresivo (5 niveles)',
        'Trailing stop activado'
      ]
    },
    {
      id: 'scalper',
      name: 'Ultra Scalper',
      description: 'Movimientos rápidos con múltiples operaciones pequeñas',
      icon: '⚡',
      config: {
        strategy: 'Smart Scalper',
        take_profit: 0.8,
        stop_loss: 0.5,
        risk_percentage: 1.5,
        leverage: 2,
        market_type: 'FUTURES_USDT',
        dca_levels: 1,
        interval: '1m',
        entry_order_type: 'MARKET',
        exit_order_type: 'MARKET',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: false
      },
      characteristics: [
        'Riesgo: 1.5% por operación',
        'R:R ratio: 1.6:1',
        'Timeframe: 1 minuto',
        'Operaciones rápidas',
        'Sin DCA (1 nivel)'
      ]
    },
    {
      id: 'futures_hunter',
      name: 'Futures Hunter',
      description: 'Especializado en futures con alto apalancamiento controlado',
      icon: '🎯',
      config: {
        strategy: 'Volatility Master',
        take_profit: 4.0,
        stop_loss: 2.0,
        risk_percentage: 1.8,
        leverage: 5,
        market_type: 'FUTURES_USDT',
        dca_levels: 3,
        interval: '15m',
        entry_order_type: 'MARKET',
        exit_order_type: 'MARKET',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: true
      },
      characteristics: [
        'Riesgo: 1.8% por operación',
        'R:R ratio: 2:1',
        'Leverage: 5x controlado',
        'Futures USDT',
        'Trailing stop inteligente'
      ]
    },
    {
      id: 'manipulation_detector',
      name: 'Manipulation Detector',
      description: 'Detecta movimientos de ballenas y manipulación de mercado',
      icon: '🔍',
      config: {
        strategy: 'Manipulation Detector',
        take_profit: 3.5,
        stop_loss: 1.8,
        risk_percentage: 1.5,
        leverage: 2,
        market_type: 'SPOT',
        dca_levels: 2,
        interval: '30m',
        entry_order_type: 'LIMIT',
        exit_order_type: 'MARKET',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: true
      },
      characteristics: [
        'Riesgo: 1.5% por operación',
        'R:R ratio: 1.94:1',
        'Detección anti-ballenas',
        'Protección contra manipulación',
        'Timeframe: 30 minutos'
      ]
    },
    {
      id: 'news_sentiment',
      name: 'News Sentiment Bot',
      description: 'Bot que opera basado en sentimiento de noticias y redes sociales',
      icon: '📰',
      config: {
        strategy: 'News Sentiment',
        take_profit: 5.0,
        stop_loss: 2.5,
        risk_percentage: 2.2,
        leverage: 1,
        market_type: 'SPOT',
        dca_levels: 1,
        interval: '1h',
        entry_order_type: 'MARKET',
        exit_order_type: 'MARKET',
        tp_order_type: 'LIMIT',
        sl_order_type: 'STOP_MARKET',
        trailing_stop: false
      },
      characteristics: [
        'Riesgo: 2.2% por operación',
        'R:R ratio: 2:1',
        'Análisis de noticias en tiempo real',
        'Sentiment de redes sociales',
        'Timeframe: 1 hora'
      ]
    }
  ];

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  const getRiskLevel = (riskPercentage) => {
    if (riskPercentage <= 1.0) return { level: 'Bajo', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (riskPercentage <= 1.5) return { level: 'Medio', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'Alto', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Templates de Bots</h2>
              <p className="text-gray-400">
                Selecciona una configuración predefinida para empezar rápidamente
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {predefinedTemplates.map((template) => {
              const riskInfo = getRiskLevel(template.config.risk_percentage);
              const isSelected = selectedTemplate?.id === template.id;
              
              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-white text-lg">{template.name}</CardTitle>
                          <div className={`inline-block px-2 py-1 rounded-full text-xs ${riskInfo.bg} ${riskInfo.color}`}>
                            Riesgo {riskInfo.level}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-300 text-sm">{template.description}</p>
                    
                    {/* Características principales */}
                    <div className="space-y-2">
                      <h4 className="text-white font-semibold text-sm">Características:</h4>
                      <ul className="space-y-1">
                        {template.characteristics.map((char, index) => (
                          <li key={index} className="text-xs text-gray-400 flex items-center">
                            <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                            {char}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Config preview */}
                    <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">TP:</span>
                          <span className="text-green-400">{template.config.take_profit}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SL:</span>
                          <span className="text-red-400">{template.config.stop_loss}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Leverage:</span>
                          <span className="text-white">{template.config.leverage}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mercado:</span>
                          <span className="text-blue-400">{template.config.market_type}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Template seleccionado - Detalles */}
          {selectedTemplate && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-3 flex items-center">
                {selectedTemplate.icon} {selectedTemplate.name} - Configuración Detallada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="text-blue-400 font-semibold">Trading</h4>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span>Estrategia:</span>
                      <span className="text-white">{selectedTemplate.config.strategy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeframe:</span>
                      <span className="text-white">{selectedTemplate.config.interval}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mercado:</span>
                      <span className="text-white">{selectedTemplate.config.market_type}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-blue-400 font-semibold">Gestión de Riesgo</h4>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span>Take Profit:</span>
                      <span className="text-green-400">{selectedTemplate.config.take_profit}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop Loss:</span>
                      <span className="text-red-400">{selectedTemplate.config.stop_loss}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Riesgo por trade:</span>
                      <span className="text-white">{selectedTemplate.config.risk_percentage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-blue-400 font-semibold">Órdenes</h4>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span>Entrada:</span>
                      <span className="text-white">{selectedTemplate.config.entry_order_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Salida:</span>
                      <span className="text-white">{selectedTemplate.config.exit_order_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DCA Niveles:</span>
                      <span className="text-white">{selectedTemplate.config.dca_levels}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {selectedTemplate ? `Usar ${selectedTemplate.name}` : 'Selecciona un Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotTemplates;