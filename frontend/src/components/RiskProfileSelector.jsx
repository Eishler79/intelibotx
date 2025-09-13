import React from 'react';
import { Shield, TrendingUp, Zap } from 'lucide-react';

// SPEC_REF: CORE_PHILOSOPHY.md#bot-concept (Bot Único institutional adaptation)
// SUCCESS CRITERIA: Component <150 lines + educational UX
const RiskProfileSelector = ({ value, onChange, className = "" }) => {
  const profiles = [
    {
      value: 'CONSERVATIVE',
      label: 'Conservador',
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      description: 'Protección máxima anti-manipulación',
      details: [
        'Bot prioriza ANTI_MANIPULATION_MODE',
        'Ganancias rápidas 0.3-1% seguras',
        'Algoritmos Wyckoff + Order Blocks'
      ]
    },
    {
      value: 'MODERATE',
      label: 'Moderado',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      description: 'Balance protección y crecimiento',
      details: [
        'Bot alterna SCALPING_MODE + protección',
        'Ganancias 0.5-1.5% consistentes',
        'Smart Money Concepts + VSA'
      ]
    },
    {
      value: 'AGGRESSIVE',
      label: 'Agresivo',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      description: 'Máximo potencial con protección',
      details: [
        'Bot usa TREND_FOLLOWING + NEWS_SENTIMENT',
        'Ganancias 1-3% oportunidades institucionales',
        'Market Profile + Institutional Order Flow'
      ]
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Perfil de Riesgo Institucional
        <span className="text-xs text-gray-500 block mt-1">
          El Bot Único ajusta algoritmos automáticamente según tu perfil
        </span>
      </label>
      
      <div className="grid grid-cols-1 gap-3">
        {profiles.map((profile) => {
          const Icon = profile.icon;
          const isSelected = value === profile.value;
          
          return (
            <div
              key={profile.value}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all
                ${isSelected 
                  ? `${profile.bgColor} border-current` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onChange(profile.value)}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-6 h-6 mt-1 ${isSelected ? profile.color : 'text-gray-400'}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${isSelected ? profile.color : 'text-gray-900'}`}>
                      {profile.label}
                    </h3>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-current opacity-80" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {profile.description}
                  </p>
                  
                  {isSelected && (
                    <div className="mt-3 space-y-1">
                      {profile.details.map((detail, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60 mr-2" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <input
                type="radio"
                name="riskProfile"
                value={profile.value}
                checked={isSelected}
                onChange={() => onChange(profile.value)}
                className="sr-only"
              />
            </div>
          );
        })}
      </div>
      
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-600">
          💡 <strong>Bot Único Inteligente:</strong> Independientemente del perfil seleccionado, 
          el bot detecta manipulación y se protege automáticamente. El perfil solo influye 
          en la agresividad durante condiciones normales de mercado.
        </p>
      </div>
    </div>
  );
};

export default RiskProfileSelector;