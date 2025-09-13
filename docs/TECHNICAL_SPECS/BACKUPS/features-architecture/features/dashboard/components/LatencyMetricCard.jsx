/**
 * 📊 LatencyMetricCard - Componente especializado para métricas individuales
 * 
 * SPEC_REF: DL-076 Specialized Components Pattern
 * Eduard Guzmán - InteliBotX
 */

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LatencyMetricCard({ 
  icon: Icon, 
  title, 
  value, 
  unit = "ms", 
  subtitle, 
  color,
  badge,
  isHighlighted = false 
}) {
  return (
    <Card className={`bg-gray-800/50 border-gray-700/50 ${isHighlighted ? 'border-red-500/50 animate-pulse' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={color} size={20} />
          {badge && (
            <Badge className={badge.className}>
              {badge.text}
            </Badge>
          )}
        </div>
        <p className="text-gray-400 text-xs mb-1">{title}</p>
        <p className={`text-xl font-bold ${color}`}>
          {value}{unit}
        </p>
        {subtitle && (
          <p className="text-gray-500 text-xs mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}