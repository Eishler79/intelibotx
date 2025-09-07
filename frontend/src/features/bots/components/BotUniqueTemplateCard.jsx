/**
 * 🤖 BotUniqueTemplateCard - Componente especializado para template cards Bot Único
 * 
 * SPEC_REF: DL-077 Bot Único Templates Architecture Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BotUniqueTemplateCard({ 
  template, 
  isSelected, 
  onSelect, 
  riskInfo,
  operationalModes 
}) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
      onClick={() => onSelect(template)}
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
        
        {/* Bot Único Characteristics */}
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Configuración Bot Único:</h4>
          <ul className="space-y-1">
            <li className="text-xs text-gray-400 flex items-center">
              <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
              Capital inicial: {(template.initial_config.initial_capital_allocation * 100)}%
            </li>
            <li className="text-xs text-gray-400 flex items-center">
              <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
              Tolerancia: {template.initial_config.risk_tolerance}
            </li>
            <li className="text-xs text-gray-400 flex items-center">
              <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
              Modos preferidos: {operationalModes}
            </li>
            <li className="text-xs text-gray-400 flex items-center">
              <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
              Max trades: {template.initial_config.max_concurrent_trades}
            </li>
          </ul>
        </div>

        {/* Performance Metrics (if available) */}
        {template.performance_metrics && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-center">
              <span className="text-gray-400">Performance histórica: </span>
              <span className="text-green-400">{template.performance_metrics.win_rate}% win rate</span>
            </div>
          </div>
        )}

        {/* Admin Badge */}
        {template.created_by_admin && (
          <div className="text-center">
            <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
              ✅ Validado por Admin
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}