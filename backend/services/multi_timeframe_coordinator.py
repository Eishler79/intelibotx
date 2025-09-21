#!/usr/bin/env python3
"""
⏰ MultiTimeframeCoordinator - Coordinación real multi-timeframe
SPEC_REF: SMART_SCALPER_STRATEGY.md#multi-timeframe-coordination
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class TimeframeAlignment(Enum):
    FULLY_ALIGNED_BULLISH = "FULLY_ALIGNED_BULLISH"
    PARTIALLY_ALIGNED_BULLISH = "PARTIALLY_ALIGNED_BULLISH"
    FULLY_ALIGNED_BEARISH = "FULLY_ALIGNED_BEARISH"
    PARTIALLY_ALIGNED_BEARISH = "PARTIALLY_ALIGNED_BEARISH"
    NEUTRAL = "NEUTRAL"
    CONFLICTED = "CONFLICTED"

class TrendStrength(Enum):
    SIDEWAYS = "sideways"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERY_STRONG = "very_strong"

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
    data_quality: float  # 🔧 DL-004: Mantener robustez algoritmo institucional
    reliability: float   # 🔧 DL-004: Evaluación confianza datos Binance

@dataclass
class MultiTimeframeSignal:
    symbol: str
    timestamp: str
    signal: str
    confidence: float
    alignment: TimeframeAlignment
    trend_strength: TrendStrength
    timeframe_consensus: float

class MultiTimeframeCoordinator:
    def analyze_multi_timeframe_signal(self, symbol: str, 
                                     timeframe_data: Dict[str, TimeframeData]) -> MultiTimeframeSignal:
        """Análisis real de múltiples timeframes usando datos de Binance"""
        
        # Analizar alineación de tendencias
        alignment, consensus = self._analyze_trend_alignment(timeframe_data)
        
        # Calcular fortaleza general
        strength = self._calculate_trend_strength(timeframe_data)
        
        # Generar señal combinada
        signal, confidence = self._generate_combined_signal(timeframe_data, alignment)
        
        return MultiTimeframeSignal(
            symbol=symbol,
            timestamp=datetime.utcnow().isoformat(),
            signal=signal,
            confidence=confidence,
            alignment=alignment,
            trend_strength=strength,
            timeframe_consensus=consensus
        )
    
    def _analyze_trend_alignment(self, timeframe_data: Dict[str, TimeframeData]) -> Tuple[TimeframeAlignment, float]:
        """Analizar alineación de tendencias entre timeframes"""
        if not timeframe_data:
            return TimeframeAlignment.NEUTRAL, 0.0

        bullish_count = sum(1 for data in timeframe_data.values() if data.trend_direction == "BULLISH")
        bearish_count = sum(1 for data in timeframe_data.values() if data.trend_direction == "BEARISH")
        total_tf = len(timeframe_data)
        consensus = max(bullish_count, bearish_count) / total_tf if total_tf else 0.0

        if bullish_count == total_tf:
            alignment = TimeframeAlignment.FULLY_ALIGNED_BULLISH
        elif bearish_count == total_tf:
            alignment = TimeframeAlignment.FULLY_ALIGNED_BEARISH
        elif bullish_count >= max(1, int(total_tf * 0.6)):
            alignment = TimeframeAlignment.PARTIALLY_ALIGNED_BULLISH
        elif bearish_count >= max(1, int(total_tf * 0.6)):
            alignment = TimeframeAlignment.PARTIALLY_ALIGNED_BEARISH
        elif bullish_count > 0 and bearish_count > 0:
            alignment = TimeframeAlignment.CONFLICTED
        else:
            alignment = TimeframeAlignment.NEUTRAL

        return alignment, consensus
    
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
        
        if avg_strength >= 0.8:
            return TrendStrength.VERY_STRONG
        if avg_strength >= 0.6:
            return TrendStrength.STRONG
        if avg_strength >= 0.4:
            return TrendStrength.MODERATE
        if avg_strength >= 0.2:
            return TrendStrength.WEAK
        return TrendStrength.SIDEWAYS
    
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

        if alignment in (TimeframeAlignment.FULLY_ALIGNED_BULLISH, TimeframeAlignment.FULLY_ALIGNED_BEARISH):
            confidence = min(0.99, confidence + 0.15)
        elif alignment in (TimeframeAlignment.PARTIALLY_ALIGNED_BULLISH, TimeframeAlignment.PARTIALLY_ALIGNED_BEARISH):
            confidence = min(0.95, confidence + 0.05)
        elif alignment == TimeframeAlignment.CONFLICTED:
            confidence = max(0.3, confidence * 0.7)

        return signal, confidence
