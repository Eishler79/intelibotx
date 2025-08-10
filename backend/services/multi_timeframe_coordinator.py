#!/usr/bin/env python3
"""
⏰ MultiTimeframeCoordinator - Análisis Sincronizado Multi-Temporal Profesional
Coordina análisis técnico coherente entre 1m, 5m, 15m, 1H para Smart Scalper

Eduard Guzmán - InteliBotX - Smart Scalper Pro
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import logging

# Core analyzers
from services.market_microstructure_analyzer import MarketMicrostructure, MarketMicrostructureAnalyzer
from services.institutional_detector import InstitutionalAnalysis, InstitutionalDetector, MarketPhase
from services.ta_alternative import (
    calculate_rsi, calculate_ema, calculate_sma, calculate_atr,
    calculate_volume_sma, detect_volume_spike
)

logger = logging.getLogger(__name__)

class TimeframeAlignment(Enum):
    """Estados de alineación entre timeframes"""
    FULLY_ALIGNED_BULLISH = "fully_aligned_bullish"
    FULLY_ALIGNED_BEARISH = "fully_aligned_bearish" 
    PARTIALLY_ALIGNED_BULLISH = "partially_aligned_bullish"
    PARTIALLY_ALIGNED_BEARISH = "partially_aligned_bearish"
    CONFLICTED = "conflicted"
    NEUTRAL = "neutral"

class TrendStrength(Enum):
    """Fuerza de la tendencia multi-timeframe"""
    VERY_STRONG = "very_strong"
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    SIDEWAYS = "sideways"

@dataclass
class TimeframeData:
    """Datos de un timeframe específico"""
    timeframe: str
    
    # OHLCV Data
    opens: List[float]
    highs: List[float]
    lows: List[float]
    closes: List[float]
    volumes: List[float]
    
    # Technical Indicators
    rsi: float
    ema_9: float
    ema_21: float
    ema_50: float
    ema_200: float
    atr: float
    volume_sma: float
    
    # Trend Analysis
    trend_direction: str  # BULLISH, BEARISH, NEUTRAL
    trend_strength: float  # 0.0 - 1.0
    momentum: float       # Price momentum
    
    # Support/Resistance
    key_support: float
    key_resistance: float
    
    # Quality Metrics
    data_quality: float   # 0.0 - 1.0
    reliability: float    # 0.0 - 1.0

@dataclass
class MultiTimeframeSignal:
    """Señal coordinada multi-temporal"""
    symbol: str
    timestamp: str
    
    # Primary Signal
    signal: str           # BUY, SELL, HOLD
    confidence: float     # 0.0 - 1.0
    
    # Timeframe Analysis
    alignment: TimeframeAlignment
    trend_strength: TrendStrength
    timeframe_consensus: float  # 0.0 - 1.0 (agreement between TFs)
    
    # Individual Timeframe Signals
    tf_1m_signal: str
    tf_5m_signal: str
    tf_15m_signal: str
    tf_1h_signal: str
    
    # Risk Assessment
    risk_level: float     # 0.0 - 1.0
    risk_factors: List[str]
    
    # Entry/Exit Levels
    entry_price: float
    stop_loss: float
    take_profit_1: float
    take_profit_2: float
    
    # Timing
    entry_timeframe: str  # Which TF to use for entry
    hold_timeframe: str   # Which TF determines hold duration
    
    # Quality Metrics
    signal_quality: str   # PREMIUM, HIGH, MEDIUM, LOW
    expected_duration: str  # SCALP (1-15m), SHORT (15m-1h), SWING (1h+)

class MultiTimeframeCoordinator:
    """Coordinador de análisis multi-temporal profesional"""
    
    def __init__(self):
        # Timeframes en orden de menor a mayor
        self.timeframes = ["1m", "5m", "15m", "1h"]
        self.timeframe_weights = {
            "1m": 0.15,   # Timing preciso
            "5m": 0.25,   # Confirmación señal
            "15m": 0.35,  # Tendencia primaria
            "1h": 0.25    # Filtro macro
        }
        
        # Analyzers
        self.microstructure_analyzer = MarketMicrostructureAnalyzer()
        self.institutional_detector = InstitutionalDetector()
        
        # Configuration
        self.min_data_points = {
            "1m": 60,   # 1 hora de data mínima
            "5m": 60,   # 5 horas de data mínima  
            "15m": 60,  # 15 horas de data mínima
            "1h": 48    # 48 horas de data mínima
        }
        
        logger.info("⏰ MultiTimeframeCoordinator inicializado (Análisis Sincronizado)")

    def analyze_multi_timeframe_signal(self, symbol: str, 
                                     timeframe_data: Dict[str, TimeframeData]) -> MultiTimeframeSignal:
        """
        Análisis coordinado multi-temporal para generar señal unificada
        
        Args:
            symbol: Par de trading
            timeframe_data: Datos por timeframe {timeframe: TimeframeData}
            
        Returns:
            MultiTimeframeSignal con análisis completo
        """
        try:
            # Validar datos mínimos
            if not self._validate_timeframe_data(timeframe_data):
                return self._generate_fallback_signal(symbol)
            
            # 1. Analizar cada timeframe individualmente
            tf_analyses = self._analyze_individual_timeframes(symbol, timeframe_data)
            
            # 2. Determinar alineación entre timeframes
            alignment, consensus = self._determine_timeframe_alignment(tf_analyses)
            
            # 3. Evaluar fuerza de tendencia multi-temporal
            trend_strength = self._evaluate_trend_strength(tf_analyses, timeframe_data)
            
            # 4. Generar señal unificada
            unified_signal, confidence = self._generate_unified_signal(
                tf_analyses, alignment, trend_strength, consensus
            )
            
            # 5. Análisis de riesgo multi-temporal
            risk_level, risk_factors = self._assess_multi_timeframe_risk(
                symbol, timeframe_data, tf_analyses
            )
            
            # 6. Calcular niveles de entrada/salida
            entry_levels = self._calculate_entry_exit_levels(
                symbol, timeframe_data, unified_signal
            )
            
            # 7. Determinar timing y duración
            entry_tf, hold_tf, duration = self._determine_timing_strategy(
                tf_analyses, trend_strength
            )
            
            # 8. Evaluar calidad de señal
            signal_quality = self._evaluate_signal_quality(
                confidence, consensus, risk_level, alignment
            )
            
            return MultiTimeframeSignal(
                symbol=symbol,
                timestamp=datetime.utcnow().isoformat(),
                
                # Primary Signal
                signal=unified_signal,
                confidence=confidence,
                
                # Multi-timeframe Analysis
                alignment=alignment,
                trend_strength=trend_strength,
                timeframe_consensus=consensus,
                
                # Individual Signals
                tf_1m_signal=tf_analyses.get("1m", {}).get("signal", "HOLD"),
                tf_5m_signal=tf_analyses.get("5m", {}).get("signal", "HOLD"),
                tf_15m_signal=tf_analyses.get("15m", {}).get("signal", "HOLD"),
                tf_1h_signal=tf_analyses.get("1h", {}).get("signal", "HOLD"),
                
                # Risk
                risk_level=risk_level,
                risk_factors=risk_factors,
                
                # Levels
                entry_price=entry_levels["entry"],
                stop_loss=entry_levels["stop_loss"],
                take_profit_1=entry_levels["tp1"],
                take_profit_2=entry_levels["tp2"],
                
                # Timing
                entry_timeframe=entry_tf,
                hold_timeframe=hold_tf,
                
                # Quality
                signal_quality=signal_quality,
                expected_duration=duration
            )
            
        except Exception as e:
            logger.error(f"❌ Error en análisis multi-timeframe {symbol}: {e}")
            return self._generate_fallback_signal(symbol)

    def _validate_timeframe_data(self, timeframe_data: Dict[str, TimeframeData]) -> bool:
        """Validar que tenemos datos suficientes"""
        
        for tf in self.timeframes:
            if tf not in timeframe_data:
                logger.warning(f"⚠️ Falta timeframe {tf}")
                return False
            
            data = timeframe_data[tf]
            min_points = self.min_data_points.get(tf, 50)
            
            if len(data.closes) < min_points:
                logger.warning(f"⚠️ Datos insuficientes en {tf}: {len(data.closes)}/{min_points}")
                return False
            
            # Validar calidad de datos
            if data.data_quality < 0.5:
                logger.warning(f"⚠️ Baja calidad de datos en {tf}: {data.data_quality}")
                return False
        
        return True

    def _analyze_individual_timeframes(self, symbol: str, 
                                     timeframe_data: Dict[str, TimeframeData]) -> Dict[str, Dict]:
        """Analizar cada timeframe individualmente"""
        
        tf_analyses = {}
        
        for tf, data in timeframe_data.items():
            try:
                analysis = self._analyze_single_timeframe(symbol, tf, data)
                tf_analyses[tf] = analysis
                
                logger.debug(f"📊 {tf}: {analysis['signal']} (conf: {analysis['confidence']:.0%})")
                
            except Exception as e:
                logger.error(f"❌ Error analizando {tf}: {e}")
                tf_analyses[tf] = {
                    "signal": "HOLD",
                    "confidence": 0.5,
                    "trend": "NEUTRAL",
                    "strength": 0.0
                }
        
        return tf_analyses

    def _analyze_single_timeframe(self, symbol: str, timeframe: str, 
                                data: TimeframeData) -> Dict[str, Any]:
        """Análisis profundo de un timeframe específico"""
        
        # 1. Análisis técnico básico
        current_price = data.closes[-1]
        
        # Trend analysis basado en EMAs
        trend_score = 0
        if current_price > data.ema_21 > data.ema_50:
            trend_score += 2
        if data.ema_9 > data.ema_21:
            trend_score += 1
        if data.ema_21 > data.ema_50:
            trend_score += 1
        if current_price > data.ema_200:  # Macro trend
            trend_score += 2
        
        # Normalizar trend score
        trend_strength = min(1.0, trend_score / 6)
        
        if trend_score >= 4:
            trend_direction = "BULLISH"
        elif trend_score <= 2:
            trend_direction = "BEARISH"
        else:
            trend_direction = "NEUTRAL"
        
        # 2. RSI analysis
        rsi_signal = "NEUTRAL"
        rsi_confidence = 0.5
        
        if data.rsi < 30:
            rsi_signal = "BUY"
            rsi_confidence = 0.8
        elif data.rsi > 70:
            rsi_signal = "SELL"
            rsi_confidence = 0.8
        elif data.rsi < 40:
            rsi_signal = "BUY"
            rsi_confidence = 0.6
        elif data.rsi > 60:
            rsi_signal = "SELL"
            rsi_confidence = 0.6
        
        # 3. Volume analysis
        current_volume = data.volumes[-1]
        volume_ratio = current_volume / data.volume_sma
        volume_confirmation = volume_ratio > 1.2
        
        # 4. Momentum analysis
        momentum_periods = min(10, len(data.closes) // 2)
        momentum = (current_price - data.closes[-momentum_periods]) / data.closes[-momentum_periods]
        
        # 5. Support/Resistance proximity
        sr_factor = 1.0
        
        # Distancia a soporte/resistencia
        support_dist = abs(current_price - data.key_support) / current_price
        resistance_dist = abs(current_price - data.key_resistance) / current_price
        
        # Penalizar si está muy cerca de niveles (menos reliable)
        if min(support_dist, resistance_dist) < 0.01:  # <1% de distancia
            sr_factor = 0.7
        
        # 6. Combinar señales
        signals = []
        confidences = []
        weights = []
        
        # Trend signal
        if trend_direction == "BULLISH":
            signals.append("BUY")
            confidences.append(trend_strength)
            weights.append(0.4)
        elif trend_direction == "BEARISH":
            signals.append("SELL")
            confidences.append(trend_strength)
            weights.append(0.4)
        
        # RSI signal
        if rsi_signal != "NEUTRAL":
            signals.append(rsi_signal)
            confidences.append(rsi_confidence)
            weights.append(0.3)
        
        # Momentum signal
        if abs(momentum) > 0.01:  # >1% momentum
            momentum_signal = "BUY" if momentum > 0 else "SELL"
            signals.append(momentum_signal)
            confidences.append(min(0.8, abs(momentum) * 20))
            weights.append(0.3)
        
        # Weighted consensus
        if not signals:
            final_signal = "HOLD"
            final_confidence = 0.5
        else:
            # Vote weighting
            buy_weight = sum(w * c for s, c, w in zip(signals, confidences, weights) if s == "BUY")
            sell_weight = sum(w * c for s, c, w in zip(signals, confidences, weights) if s == "SELL")
            total_weight = sum(weights)
            
            if buy_weight > sell_weight and buy_weight / total_weight > 0.6:
                final_signal = "BUY"
                final_confidence = min(0.95, buy_weight / total_weight)
            elif sell_weight > buy_weight and sell_weight / total_weight > 0.6:
                final_signal = "SELL"
                final_confidence = min(0.95, sell_weight / total_weight)
            else:
                final_signal = "HOLD"
                final_confidence = 0.5
        
        # Apply modifiers
        final_confidence *= sr_factor  # S/R proximity adjustment
        if volume_confirmation:
            final_confidence *= 1.1  # Volume boost
        
        final_confidence = min(0.95, final_confidence)
        
        return {
            "signal": final_signal,
            "confidence": final_confidence,
            "trend": trend_direction,
            "strength": trend_strength,
            "rsi": data.rsi,
            "rsi_signal": rsi_signal,
            "momentum": momentum,
            "volume_ratio": volume_ratio,
            "volume_confirmation": volume_confirmation,
            "support_resistance_factor": sr_factor,
            "reliability": data.reliability
        }

    def _determine_timeframe_alignment(self, tf_analyses: Dict[str, Dict]) -> Tuple[TimeframeAlignment, float]:
        """Determinar alineación entre timeframes"""
        
        # Contar señales por tipo
        signals = [analysis["signal"] for analysis in tf_analyses.values()]
        buy_count = signals.count("BUY")
        sell_count = signals.count("SELL")
        hold_count = signals.count("HOLD")
        total_count = len(signals)
        
        # Calcular consensus ponderado
        weighted_buy = 0
        weighted_sell = 0
        total_weight = 0
        
        for tf, analysis in tf_analyses.items():
            weight = self.timeframe_weights.get(tf, 0.25)
            confidence = analysis["confidence"]
            
            if analysis["signal"] == "BUY":
                weighted_buy += weight * confidence
            elif analysis["signal"] == "SELL":
                weighted_sell += weight * confidence
            
            total_weight += weight
        
        # Normalizar
        if total_weight > 0:
            weighted_buy /= total_weight
            weighted_sell /= total_weight
        
        consensus_strength = max(weighted_buy, weighted_sell)
        
        # Determinar alineación
        if buy_count >= 3 and sell_count == 0:
            alignment = TimeframeAlignment.FULLY_ALIGNED_BULLISH
        elif sell_count >= 3 and buy_count == 0:
            alignment = TimeframeAlignment.FULLY_ALIGNED_BEARISH
        elif buy_count > sell_count and weighted_buy > 0.6:
            alignment = TimeframeAlignment.PARTIALLY_ALIGNED_BULLISH
        elif sell_count > buy_count and weighted_sell > 0.6:
            alignment = TimeframeAlignment.PARTIALLY_ALIGNED_BEARISH
        elif buy_count > 0 and sell_count > 0 and abs(buy_count - sell_count) <= 1:
            alignment = TimeframeAlignment.CONFLICTED
        else:
            alignment = TimeframeAlignment.NEUTRAL
        
        return alignment, consensus_strength

    def _evaluate_trend_strength(self, tf_analyses: Dict[str, Dict], 
                                timeframe_data: Dict[str, TimeframeData]) -> TrendStrength:
        """Evaluar fuerza general de la tendencia"""
        
        # Factores para evaluar fuerza
        strength_score = 0
        
        # 1. Alineación de EMAs (más peso a timeframes mayores)
        for tf, data in timeframe_data.items():
            tf_weight = self.timeframe_weights.get(tf, 0.25)
            current_price = data.closes[-1]
            
            # EMA alignment score
            ema_score = 0
            if current_price > data.ema_9 > data.ema_21 > data.ema_50:
                ema_score = 1.0  # Perfect bullish alignment
            elif current_price < data.ema_9 < data.ema_21 < data.ema_50:
                ema_score = 1.0  # Perfect bearish alignment
            elif current_price > data.ema_21 > data.ema_50:
                ema_score = 0.7  # Good alignment
            elif current_price < data.ema_21 < data.ema_50:
                ema_score = 0.7  # Good alignment
            else:
                ema_score = 0.3  # Weak alignment
            
            strength_score += ema_score * tf_weight
        
        # 2. Momentum consistency
        momentum_consistency = 0
        momentums = []
        
        for tf, analysis in tf_analyses.items():
            momentums.append(analysis.get("momentum", 0))
        
        if momentums:
            # Check if momentums have same sign
            positive_count = sum(1 for m in momentums if m > 0)
            negative_count = sum(1 for m in momentums if m < 0)
            
            if positive_count == len(momentums) or negative_count == len(momentums):
                momentum_consistency = 1.0  # All same direction
            elif max(positive_count, negative_count) / len(momentums) >= 0.75:
                momentum_consistency = 0.7  # Mostly same direction
            else:
                momentum_consistency = 0.3  # Mixed
        
        strength_score += momentum_consistency * 0.3
        
        # 3. Volume confirmation across timeframes
        volume_strength = 0
        volume_confirmations = [analysis.get("volume_confirmation", False) 
                              for analysis in tf_analyses.values()]
        volume_strength = sum(volume_confirmations) / len(volume_confirmations)
        
        strength_score += volume_strength * 0.2
        
        # Normalize to 0-1
        strength_score = min(1.0, strength_score)
        
        # Categorize strength
        if strength_score >= 0.85:
            return TrendStrength.VERY_STRONG
        elif strength_score >= 0.70:
            return TrendStrength.STRONG
        elif strength_score >= 0.55:
            return TrendStrength.MODERATE
        elif strength_score >= 0.40:
            return TrendStrength.WEAK
        else:
            return TrendStrength.SIDEWAYS

    def _generate_unified_signal(self, tf_analyses: Dict[str, Dict], 
                               alignment: TimeframeAlignment,
                               trend_strength: TrendStrength,
                               consensus: float) -> Tuple[str, float]:
        """Generar señal unificada considerando todos los factores"""
        
        # Base signal from alignment
        base_signal = "HOLD"
        base_confidence = 0.5
        
        if alignment in [TimeframeAlignment.FULLY_ALIGNED_BULLISH, 
                        TimeframeAlignment.PARTIALLY_ALIGNED_BULLISH]:
            base_signal = "BUY"
            base_confidence = 0.8 if "FULLY" in alignment.value else 0.7
        elif alignment in [TimeframeAlignment.FULLY_ALIGNED_BEARISH,
                          TimeframeAlignment.PARTIALLY_ALIGNED_BEARISH]:
            base_signal = "SELL"
            base_confidence = 0.8 if "FULLY" in alignment.value else 0.7
        elif alignment == TimeframeAlignment.CONFLICTED:
            base_signal = "HOLD"
            base_confidence = 0.3  # Low confidence due to conflict
        
        # Adjust confidence based on trend strength
        strength_multiplier = {
            TrendStrength.VERY_STRONG: 1.2,
            TrendStrength.STRONG: 1.1,
            TrendStrength.MODERATE: 1.0,
            TrendStrength.WEAK: 0.8,
            TrendStrength.SIDEWAYS: 0.6
        }
        
        final_confidence = base_confidence * strength_multiplier.get(trend_strength, 1.0)
        
        # Adjust based on consensus
        final_confidence *= (0.5 + consensus * 0.5)  # Scale by consensus
        
        # Cap confidence
        final_confidence = min(0.95, final_confidence)
        
        # Override to HOLD if confidence too low
        if final_confidence < 0.55:
            base_signal = "HOLD"
            final_confidence = max(0.5, final_confidence)
        
        return base_signal, final_confidence

    def _assess_multi_timeframe_risk(self, symbol: str, 
                                   timeframe_data: Dict[str, TimeframeData],
                                   tf_analyses: Dict[str, Dict]) -> Tuple[float, List[str]]:
        """Evaluar riesgo desde perspectiva multi-temporal"""
        
        risk_factors = []
        risk_score = 0.0
        
        # 1. Conflicto entre timeframes
        signals = [analysis["signal"] for analysis in tf_analyses.values()]
        if "BUY" in signals and "SELL" in signals:
            risk_score += 0.3
            risk_factors.append("Timeframe conflict detected")
        
        # 2. Baja calidad de datos
        avg_data_quality = np.mean([data.data_quality for data in timeframe_data.values()])
        if avg_data_quality < 0.7:
            risk_score += 0.2
            risk_factors.append("Low data quality")
        
        # 3. Alta volatilidad
        atr_values = [data.atr / data.closes[-1] for data in timeframe_data.values()]
        avg_volatility = np.mean(atr_values)
        
        if avg_volatility > 0.03:  # >3% ATR
            risk_score += 0.2
            risk_factors.append("High volatility environment")
        
        # 4. Proximidad a niveles de S/R
        for tf, data in timeframe_data.items():
            current_price = data.closes[-1]
            support_dist = abs(current_price - data.key_support) / current_price
            resistance_dist = abs(current_price - data.key_resistance) / current_price
            
            if min(support_dist, resistance_dist) < 0.005:  # <0.5%
                risk_score += 0.1
                risk_factors.append(f"Near S/R level on {tf}")
        
        # 5. Momentum divergence
        momentums = [analysis.get("momentum", 0) for analysis in tf_analyses.values()]
        momentum_range = max(momentums) - min(momentums)
        
        if momentum_range > 0.05:  # >5% momentum divergence
            risk_score += 0.15
            risk_factors.append("Momentum divergence between timeframes")
        
        # 6. Volume inconsistency
        volume_confirmations = [analysis.get("volume_confirmation", False) 
                              for analysis in tf_analyses.values()]
        volume_agreement = sum(volume_confirmations) / len(volume_confirmations)
        
        if volume_agreement < 0.5:
            risk_score += 0.1
            risk_factors.append("Inconsistent volume confirmation")
        
        # Cap risk score
        final_risk = min(1.0, risk_score)
        
        return final_risk, risk_factors

    def _calculate_entry_exit_levels(self, symbol: str, 
                                   timeframe_data: Dict[str, TimeframeData],
                                   signal: str) -> Dict[str, float]:
        """Calcular niveles óptimos de entrada y salida"""
        
        # Usar datos del timeframe más granular para entry preciso
        entry_tf_data = timeframe_data.get("1m") or timeframe_data.get("5m")
        if not entry_tf_data:
            entry_tf_data = list(timeframe_data.values())[0]
        
        current_price = entry_tf_data.closes[-1]
        atr = entry_tf_data.atr
        
        # Niveles base
        if signal == "BUY":
            # Entry ligeramente arriba del precio actual
            entry_price = current_price * 1.001
            
            # Stop loss debajo de soporte o basado en ATR
            stop_loss = min(entry_tf_data.key_support * 0.998, 
                           current_price - atr * 1.5)
            
            # Take profits basados en resistencia y R:R
            tp1_rr = max(2.0, (entry_tf_data.key_resistance - entry_price) / (entry_price - stop_loss))
            tp1 = entry_price + (entry_price - stop_loss) * min(tp1_rr, 2.5)
            
            tp2 = min(entry_tf_data.key_resistance * 0.998,
                     entry_price + (entry_price - stop_loss) * 4.0)
            
        elif signal == "SELL":
            # Entry ligeramente abajo del precio actual
            entry_price = current_price * 0.999
            
            # Stop loss encima de resistencia o basado en ATR  
            stop_loss = max(entry_tf_data.key_resistance * 1.002,
                           current_price + atr * 1.5)
            
            # Take profits basados en soporte y R:R
            tp1_rr = max(2.0, (entry_price - entry_tf_data.key_support) / (stop_loss - entry_price))
            tp1 = entry_price - (stop_loss - entry_price) * min(tp1_rr, 2.5)
            
            tp2 = max(entry_tf_data.key_support * 1.002,
                     entry_price - (stop_loss - entry_price) * 4.0)
        
        else:  # HOLD
            entry_price = current_price
            stop_loss = current_price - atr
            tp1 = current_price + atr
            tp2 = current_price + atr * 2
        
        return {
            "entry": entry_price,
            "stop_loss": stop_loss,
            "tp1": tp1,
            "tp2": tp2
        }

    def _determine_timing_strategy(self, tf_analyses: Dict[str, Dict], 
                                 trend_strength: TrendStrength) -> Tuple[str, str, str]:
        """Determinar estrategia de timing y duración"""
        
        # Entry timeframe (más granular con mejor señal)
        entry_tf = "1m"  # Default
        best_confidence = 0
        
        for tf in ["1m", "5m"]:  # Solo TFs de entry
            if tf in tf_analyses:
                confidence = tf_analyses[tf]["confidence"]
                if confidence > best_confidence:
                    best_confidence = confidence
                    entry_tf = tf
        
        # Hold timeframe basado en fuerza de tendencia
        if trend_strength in [TrendStrength.VERY_STRONG, TrendStrength.STRONG]:
            hold_tf = "15m"  # Hold longer on strong trends
            duration = "SHORT"  # 15m-1h
        elif trend_strength == TrendStrength.MODERATE:
            hold_tf = "5m"
            duration = "SCALP"  # 1-15m
        else:
            hold_tf = "1m"
            duration = "SCALP"  # Quick scalp
        
        return entry_tf, hold_tf, duration

    def _evaluate_signal_quality(self, confidence: float, consensus: float, 
                                risk_level: float, alignment: TimeframeAlignment) -> str:
        """Evaluar calidad general de la señal"""
        
        quality_score = 0
        
        # Factor 1: Confidence
        if confidence >= 0.8:
            quality_score += 3
        elif confidence >= 0.7:
            quality_score += 2
        elif confidence >= 0.6:
            quality_score += 1
        
        # Factor 2: Consensus
        if consensus >= 0.8:
            quality_score += 3
        elif consensus >= 0.7:
            quality_score += 2
        elif consensus >= 0.6:
            quality_score += 1
        
        # Factor 3: Low risk
        if risk_level <= 0.3:
            quality_score += 2
        elif risk_level <= 0.5:
            quality_score += 1
        
        # Factor 4: Alignment
        if "FULLY_ALIGNED" in alignment.value:
            quality_score += 2
        elif "PARTIALLY_ALIGNED" in alignment.value:
            quality_score += 1
        
        # Categorize quality
        if quality_score >= 8:
            return "PREMIUM"
        elif quality_score >= 6:
            return "HIGH"
        elif quality_score >= 4:
            return "MEDIUM"
        else:
            return "LOW"

    def _generate_fallback_signal(self, symbol: str) -> MultiTimeframeSignal:
        """Generar señal fallback cuando hay problemas"""
        
        return MultiTimeframeSignal(
            symbol=symbol,
            timestamp=datetime.utcnow().isoformat(),
            
            signal="HOLD",
            confidence=0.5,
            
            alignment=TimeframeAlignment.NEUTRAL,
            trend_strength=TrendStrength.SIDEWAYS,
            timeframe_consensus=0.5,
            
            tf_1m_signal="HOLD",
            tf_5m_signal="HOLD", 
            tf_15m_signal="HOLD",
            tf_1h_signal="HOLD",
            
            risk_level=0.5,
            risk_factors=["Insufficient data"],
            
            entry_price=0.0,
            stop_loss=0.0,
            take_profit_1=0.0,
            take_profit_2=0.0,
            
            entry_timeframe="1m",
            hold_timeframe="5m",
            
            signal_quality="LOW",
            expected_duration="SCALP"
        )

    def create_timeframe_data(self, timeframe: str, opens: List[float], highs: List[float],
                            lows: List[float], closes: List[float], volumes: List[float]) -> TimeframeData:
        """Helper para crear TimeframeData con indicadores calculados"""
        
        if len(closes) < 50:
            # Datos insuficientes
            return TimeframeData(
                timeframe=timeframe,
                opens=opens, highs=highs, lows=lows, closes=closes, volumes=volumes,
                rsi=50, ema_9=closes[-1] if closes else 0, ema_21=closes[-1] if closes else 0,
                ema_50=closes[-1] if closes else 0, ema_200=closes[-1] if closes else 0,
                atr=0, volume_sma=volumes[-1] if volumes else 0,
                trend_direction="NEUTRAL", trend_strength=0.0, momentum=0.0,
                key_support=closes[-1] if closes else 0, key_resistance=closes[-1] if closes else 0,
                data_quality=0.3, reliability=0.3
            )
        
        # Calcular indicadores
        current_price = closes[-1]
        rsi = calculate_rsi(closes, period=14)
        ema_9 = calculate_ema(closes, 9)
        ema_21 = calculate_ema(closes, 21)
        ema_50 = calculate_ema(closes, 50)
        ema_200 = calculate_ema(closes, 200) if len(closes) >= 200 else current_price
        atr = calculate_atr(highs, lows, closes, period=14)
        volume_sma = calculate_volume_sma(volumes, period=20)
        
        # Trend analysis
        if current_price > ema_21 > ema_50:
            trend_direction = "BULLISH"
            trend_strength = min(1.0, (current_price - ema_50) / ema_50 * 20)
        elif current_price < ema_21 < ema_50:
            trend_direction = "BEARISH"
            trend_strength = min(1.0, (ema_50 - current_price) / ema_50 * 20)
        else:
            trend_direction = "NEUTRAL"
            trend_strength = 0.0
        
        # Momentum
        momentum_period = min(10, len(closes) // 4)
        momentum = (current_price - closes[-momentum_period]) / closes[-momentum_period]
        
        # Support/Resistance (simplified)
        recent_highs = highs[-20:]
        recent_lows = lows[-20:]
        key_resistance = max(recent_highs)
        key_support = min(recent_lows)
        
        # Quality metrics
        data_completeness = len(closes) / self.min_data_points.get(timeframe, 50)
        price_consistency = 1.0 - (np.std(closes[-10:]) / np.mean(closes[-10:]))
        
        data_quality = min(1.0, (data_completeness + price_consistency) / 2)
        reliability = min(1.0, data_quality * 1.2)
        
        return TimeframeData(
            timeframe=timeframe,
            opens=opens, highs=highs, lows=lows, closes=closes, volumes=volumes,
            rsi=rsi, ema_9=ema_9, ema_21=ema_21, ema_50=ema_50, ema_200=ema_200,
            atr=atr, volume_sma=volume_sma,
            trend_direction=trend_direction, trend_strength=trend_strength, momentum=momentum,
            key_support=key_support, key_resistance=key_resistance,
            data_quality=data_quality, reliability=reliability
        )


# Testing function  
def test_multi_timeframe_coordinator():
    """Test del coordinador multi-temporal"""
    print("🧪 Testing MultiTimeframeCoordinator...")
    
    coordinator = MultiTimeframeCoordinator()
    
    # Generar datos de prueba para diferentes timeframes
    import random
    
    def generate_ohlcv(n_periods: int, base_price: float, trend_bias: float = 0.0):
        """Generar datos OHLCV con sesgo de tendencia"""
        opens = [base_price]
        highs = []
        lows = []
        closes = []
        volumes = []
        
        current_price = base_price
        
        for i in range(n_periods):
            # Trend bias
            change = random.gauss(trend_bias, abs(trend_bias) + 0.01)
            
            open_price = current_price
            close = max(base_price * 0.5, open_price * (1 + change))
            
            high = max(open_price, close) * (1 + random.uniform(0, 0.005))
            low = min(open_price, close) * (1 - random.uniform(0, 0.005))
            volume = random.uniform(1000, 5000)
            
            opens.append(close)
            highs.append(high)
            lows.append(low)
            closes.append(close)
            volumes.append(volume)
            
            current_price = close
        
        return opens[1:], highs, lows, closes, volumes
    
    # Crear datos con tendencia alcista consistente
    base_price = 50000
    trend_bias = 0.002  # 0.2% per period average
    
    timeframe_data = {}
    
    # 1m data (más períodos)
    opens_1m, highs_1m, lows_1m, closes_1m, volumes_1m = generate_ohlcv(120, base_price, trend_bias * 0.5)
    timeframe_data["1m"] = coordinator.create_timeframe_data("1m", opens_1m, highs_1m, lows_1m, closes_1m, volumes_1m)
    
    # 5m data  
    opens_5m, highs_5m, lows_5m, closes_5m, volumes_5m = generate_ohlcv(80, base_price, trend_bias)
    timeframe_data["5m"] = coordinator.create_timeframe_data("5m", opens_5m, highs_5m, lows_5m, closes_5m, volumes_5m)
    
    # 15m data
    opens_15m, highs_15m, lows_15m, closes_15m, volumes_15m = generate_ohlcv(60, base_price, trend_bias * 1.5)
    timeframe_data["15m"] = coordinator.create_timeframe_data("15m", opens_15m, highs_15m, lows_15m, closes_15m, volumes_15m)
    
    # 1h data
    opens_1h, highs_1h, lows_1h, closes_1h, volumes_1h = generate_ohlcv(48, base_price, trend_bias * 2)
    timeframe_data["1h"] = coordinator.create_timeframe_data("1h", opens_1h, highs_1h, lows_1h, closes_1h, volumes_1h)
    
    # Analizar señal multi-temporal
    signal = coordinator.analyze_multi_timeframe_signal("BTCUSDT", timeframe_data)
    
    print(f"⏰ Análisis Multi-Temporal {signal.symbol}:")
    print(f"  Señal Principal: {signal.signal} ({signal.confidence:.0%} confianza)")
    print(f"  Calidad: {signal.signal_quality}")
    print(f"  Alineación: {signal.alignment.value}")
    print(f"  Fuerza Tendencia: {signal.trend_strength.value}")
    print(f"  Consenso TFs: {signal.timeframe_consensus:.0%}")
    print(f"  Riesgo: {signal.risk_level:.0%}")
    print(f"  Duración Esperada: {signal.expected_duration}")
    
    print("\n  📊 Señales por Timeframe:")
    print(f"    1m: {signal.tf_1m_signal}")
    print(f"    5m: {signal.tf_5m_signal}")
    print(f"    15m: {signal.tf_15m_signal}")
    print(f"    1h: {signal.tf_1h_signal}")
    
    if signal.risk_factors:
        print(f"\n  ⚠️ Factores de Riesgo: {', '.join(signal.risk_factors)}")
    
    print(f"\n  🎯 Niveles de Trading:")
    print(f"    Entry: ${signal.entry_price:.2f} ({signal.entry_timeframe})")
    print(f"    Stop Loss: ${signal.stop_loss:.2f}")
    print(f"    TP1: ${signal.take_profit_1:.2f}")
    print(f"    TP2: ${signal.take_profit_2:.2f}")
    
    print("✅ MultiTimeframeCoordinator test completado")

if __name__ == "__main__":
    test_multi_timeframe_coordinator()