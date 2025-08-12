#!/usr/bin/env python3
"""
⏰ MultiTimeframeCoordinator - Coordinación real multi-timeframe
SPEC_REF: SMART_SCALPER_STRATEGY.md#multi-timeframe-coordination
"""

from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

class TimeframeAlignment(Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"

class TrendStrength(Enum):
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"

@dataclass
class TimeframeData:
    timeframe: str
    opens: List[float]
    highs: List[float]
    lows: List[float]
    closes: List[float]
    volumes: List[float]
    rsi: float
    ema_9: float
    ema_21: float
    ema_50: float
    ema_200: float
    atr: float
    volume_sma: float
    key_support: float
    key_resistance: float
    trend_direction: str
    trend_strength: float
    momentum: float

@dataclass
class MultiTimeframeSignal:
    signal: str
    confidence: float
    alignment: TimeframeAlignment
    trend_strength: TrendStrength

class MultiTimeframeCoordinator:
    def analyze_multi_timeframe_signal(self, symbol: str, 
                                     timeframe_data: Dict[str, TimeframeData]) -> MultiTimeframeSignal:
        """Análisis real de múltiples timeframes usando datos de Binance"""
        
        # Analizar alineación de tendencias
        alignment = self._analyze_trend_alignment(timeframe_data)
        
        # Calcular fortaleza general
        strength = self._calculate_trend_strength(timeframe_data)
        
        # Generar señal combinada
        signal, confidence = self._generate_combined_signal(timeframe_data, alignment)
        
        return MultiTimeframeSignal(
            signal=signal,
            confidence=confidence,
            alignment=alignment,
            trend_strength=strength
        )
    
    def _analyze_trend_alignment(self, timeframe_data: Dict[str, TimeframeData]) -> TimeframeAlignment:
        """Analizar alineación de tendencias entre timeframes"""
        if not timeframe_data:
            return TimeframeAlignment.NEUTRAL
            
        bullish_count = 0
        bearish_count = 0
        
        for tf, data in timeframe_data.items():
            if data.trend_direction == "BULLISH":
                bullish_count += 1
            elif data.trend_direction == "BEARISH":
                bearish_count += 1
        
        total_tf = len(timeframe_data)
        
        if bullish_count >= total_tf * 0.7:
            return TimeframeAlignment.BULLISH
        elif bearish_count >= total_tf * 0.7:
            return TimeframeAlignment.BEARISH
        else:
            return TimeframeAlignment.NEUTRAL
    
    def _calculate_trend_strength(self, timeframe_data: Dict[str, TimeframeData]) -> TrendStrength:
        """Calcular fortaleza de tendencia usando datos reales"""
        if not timeframe_data:
            return TrendStrength.WEAK
            
        total_strength = 0
        count = 0
        
        for tf, data in timeframe_data.items():
            total_strength += data.trend_strength
            count += 1
        
        avg_strength = total_strength / count if count > 0 else 0
        
        if avg_strength >= 0.7:
            return TrendStrength.STRONG
        elif avg_strength >= 0.4:
            return TrendStrength.MODERATE
        else:
            return TrendStrength.WEAK
    
    def _generate_combined_signal(self, timeframe_data: Dict[str, TimeframeData], 
                                alignment: TimeframeAlignment) -> tuple:
        """Generar señal combinada basada en análisis real"""
        if not timeframe_data:
            return "HOLD", 0.5
            
        # Priorizar timeframes más altos para dirección general
        timeframe_priority = {"1h": 4, "15m": 3, "5m": 2, "1m": 1}
        
        weighted_signal = 0
        total_weight = 0
        
        for tf, data in timeframe_data.items():
            weight = timeframe_priority.get(tf, 1)
            
            # Convertir trend_direction a señal numérica
            if data.trend_direction == "BULLISH":
                signal_value = 1
            elif data.trend_direction == "BEARISH":
                signal_value = -1
            else:
                signal_value = 0
            
            weighted_signal += signal_value * weight * data.trend_strength
            total_weight += weight
        
        if total_weight == 0:
            return "HOLD", 0.5
            
        final_signal = weighted_signal / total_weight
        
        # Determinar señal y confianza
        if final_signal > 0.3:
            signal = "BUY"
            confidence = min(0.95, abs(final_signal))
        elif final_signal < -0.3:
            signal = "SELL"
            confidence = min(0.95, abs(final_signal))
        else:
            signal = "HOLD"
            confidence = 0.5
        
        return signal, confidence