/**
 * 📋 BotTemplateDetail - Componente especializado para panel detallado Bot Único templates
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';

export default function BotTemplateDetail({ selectedTemplate, riskInfo, operationalModes }) {
  if (!selectedTemplate) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-6 mb-6">
      <h3 className="text-white font-bold text-lg mb-3 flex items-center">
        {selectedTemplate.icon} {selectedTemplate.name} - Configuración Bot Único Detallada
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        
        {/* Configuración Inicial */}
        <div className="space-y-2">
          <h4 className="text-blue-400 font-semibold">Configuración Inicial</h4>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Tipo de Bot:</span>
              <span className="text-white">Bot Único Adaptativo</span>
            </div>
            <div className="flex justify-between">
              <span>Capital inicial:</span>
              <span className="text-white">{(selectedTemplate.initial_config.initial_capital_allocation * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Tolerancia riesgo:</span>
              <span className="text-white">{selectedTemplate.initial_config.risk_tolerance}</span>
            </div>
          </div>
        </div>
        
        {/* Modos Operativos */}
        <div className="space-y-2">
          <h4 className="text-blue-400 font-semibold">Modos Operativos</h4>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Modos preferidos:</span>
              <span className="text-white text-xs">{operationalModes}</span>
            </div>
            <div className="flex justify-between">
              <span>Adaptación:</span>
              <span className="text-green-400">Automática</span>
            </div>
            <div className="flex justify-between">
              <span>TP/SL:</span>
              <span className="text-yellow-400">Dinámico según modo</span>
            </div>
          </div>
        </div>
        
        {/* Trading Settings */}
        <div className="space-y-2">
          <h4 className="text-blue-400 font-semibold">Configuración Trading</h4>
          <div className="space-y-1 text-gray-300">
            <div className="flex justify-between">
              <span>Max trades:</span>
              <span className="text-white">{selectedTemplate.initial_config.max_concurrent_trades}</span>
            </div>
            <div className="flex justify-between">
              <span>Algoritmos:</span>
              <span className="text-green-400">Solo Institucionales</span>
            </div>
            <div className="flex justify-between">
              <span>Aprendizaje:</span>
              <span className="text-blue-400">ML Continuo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mt-4 p-3 rounded-lg bg-gray-900/50">
        <h4 className="text-white font-medium mb-2">Evaluación de Riesgo</h4>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-3 h-3 rounded-full ${riskInfo.bg.replace('/20', '')}`}></div>
          <span className={`font-semibold ${riskInfo.color}`}>Riesgo {riskInfo.level}</span>
        </div>
        <p className="text-gray-400 text-sm">{riskInfo.description}</p>
      </div>

      {/* Performance Metrics */}
      {selectedTemplate.performance_metrics && (
        <div className="mt-4 p-3 rounded-lg bg-green-900/20 border border-green-700/30">
          <h4 className="text-green-400 font-medium mb-2">📊 Métricas de Performance</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-green-400">{selectedTemplate.performance_metrics.win_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Return:</span>
              <span className="text-green-400">{selectedTemplate.performance_metrics.avg_return}%</span>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            * Métricas basadas en testing admin con Bot Único
          </p>
        </div>
      )}

      {/* Bot Único Explanation */}
      <div className="mt-4 p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
        <h4 className="text-purple-400 font-medium mb-2">🤖 Sobre Bot Único</h4>
        <p className="text-gray-400 text-sm">
          Esta configuración establece los parámetros iniciales. El Bot Único se adaptará automáticamente 
          según las condiciones del mercado, cambiando entre modos operativos para optimizar performance 
          y proteger contra manipulación institucional.
        </p>
      </div>
    </div>
  );
}