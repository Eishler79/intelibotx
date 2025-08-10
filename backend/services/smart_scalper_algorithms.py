#!/usr/bin/env python3
"""
🧠 Smart Scalper Multi-Algoritmo - Sistema Adaptativo Inteligente
Múltiples algoritmos que se adaptan automáticamente a condiciones del mercado

Eduard Guzmán - InteliBotX
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime

# Import TA functions
from services.ta_alternative import (
    calculate_rsi, get_rsi_status, calculate_sma, calculate_ema,
    calculate_atr, detect_volume_spike, calculate_volume_sma,
    calculate_bollinger_bands
)

logger = logging.getLogger(__name__)

class MarketCondition(Enum):
    """Condiciones del mercado para selección de algoritmo"""
    TRENDING_UP = "trending_up"
    TRENDING_DOWN = "trending_down" 
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    BREAKOUT = "breakout"

@dataclass
class ScalperSignal:
    """Señal completa del Smart Scalper con metadatos"""
    signal: str  # BUY, SELL, HOLD
    confidence: float  # 0.0 - 1.0
    algorithm_used: str
    conditions_met: List[str]
    entry_price: float
    take_profit: Optional[float] = None
    stop_loss: Optional[float] = None
    market_condition: MarketCondition = MarketCondition.SIDEWAYS
    volatility_score: float = 0.0
    risk_score: float = 0.5
    timestamp: str = ""

class SmartScalperEngine:
    """Motor principal del Smart Scalper Multi-Algoritmo"""
    
    def __init__(self):
        self.algorithms = {
            "ema_crossover": self._ema_crossover_algorithm,
            "rsi_oversold": self._rsi_oversold_algorithm,
            "macd_divergence": self._macd_divergence_algorithm,
            "support_bounce": self._support_bounce_algorithm,
            "moving_average_alignment": self._ma_alignment_algorithm,
            "higher_high_formation": self._higher_high_algorithm,
            "volume_breakout": self._volume_breakout_algorithm,
            "bollinger_squeeze": self._bollinger_squeeze_algorithm
        }
        
        logger.info("🧠 Smart Scalper Multi-Algoritmo inicializado")

    def analyze_market_conditions(self, highs: List[float], lows: List[float], 
                                closes: List[float], volumes: List[float]) -> MarketCondition:
        """Analizar condiciones actuales del mercado"""
        if len(closes) < 50:
            return MarketCondition.SIDEWAYS
        
        # Calcular indicadores para análisis de mercado
        ema_20 = calculate_ema(closes, 20)
        ema_50 = calculate_ema(closes, 50)
        atr = calculate_atr(highs, lows, closes, 14)
        current_price = closes[-1]
        
        # Detectar tendencia
        price_vs_ema20 = (current_price - ema_20) / ema_20
        ema_spread = (ema_20 - ema_50) / ema_50
        
        # Calcular volatilidad
        volatility_ratio = atr / current_price
        
        # Determinar condición principal
        if volatility_ratio > 0.03:  # Alta volatilidad
            return MarketCondition.HIGH_VOLATILITY
        elif volatility_ratio < 0.01:  # Baja volatilidad
            return MarketCondition.LOW_VOLATILITY
        elif ema_spread > 0.02 and price_vs_ema20 > 0.01:
            return MarketCondition.TRENDING_UP
        elif ema_spread < -0.02 and price_vs_ema20 < -0.01:
            return MarketCondition.TRENDING_DOWN
        else:
            return MarketCondition.SIDEWAYS

    def select_best_algorithm(self, market_condition: MarketCondition, 
                            highs: List[float], lows: List[float], 
                            closes: List[float], volumes: List[float]) -> str:
        """Seleccionar el mejor algoritmo según condiciones del mercado"""
        
        # Mapeo de condiciones a algoritmos más efectivos
        algorithm_map = {
            MarketCondition.TRENDING_UP: ["ema_crossover", "moving_average_alignment", "higher_high_formation"],
            MarketCondition.TRENDING_DOWN: ["ema_crossover", "moving_average_alignment"],
            MarketCondition.SIDEWAYS: ["support_bounce", "rsi_oversold", "bollinger_squeeze"],
            MarketCondition.HIGH_VOLATILITY: ["volume_breakout", "macd_divergence"],
            MarketCondition.LOW_VOLATILITY: ["ema_crossover", "support_bounce"],
            MarketCondition.BREAKOUT: ["volume_breakout", "higher_high_formation"]
        }
        
        preferred_algorithms = algorithm_map.get(market_condition, ["rsi_oversold"])
        
        # Evaluar cuál de los algoritmos preferidos es mejor para la situación actual
        best_algorithm = preferred_algorithms[0]
        best_score = 0
        
        for algo in preferred_algorithms:
            score = self._evaluate_algorithm_fitness(algo, highs, lows, closes, volumes)
            if score > best_score:
                best_score = score
                best_algorithm = algo
        
        return best_algorithm

    def _evaluate_algorithm_fitness(self, algorithm: str, highs: List[float], 
                                  lows: List[float], closes: List[float], 
                                  volumes: List[float]) -> float:
        """Evaluar qué tan adecuado es un algoritmo para las condiciones actuales"""
        
        if len(closes) < 20:
            return 0.0
        
        rsi = calculate_rsi(closes)
        volume_spike, volume_ratio = detect_volume_spike(volumes)
        atr = calculate_atr(highs, lows, closes)
        volatility = atr / closes[-1]
        
        fitness_scores = {
            "ema_crossover": self._score_ema_conditions(closes),
            "rsi_oversold": self._score_rsi_conditions(rsi),
            "macd_divergence": self._score_macd_conditions(closes),
            "support_bounce": self._score_support_conditions(highs, lows, closes),
            "moving_average_alignment": self._score_ma_alignment(closes),
            "higher_high_formation": self._score_higher_high(highs, closes),
            "volume_breakout": volume_ratio if volume_spike else 0.3,
            "bollinger_squeeze": self._score_bollinger_squeeze(closes, volatility)
        }
        
        return fitness_scores.get(algorithm, 0.5)

    def generate_signal(self, symbol: str, highs: List[float], lows: List[float], 
                       closes: List[float], volumes: List[float]) -> ScalperSignal:
        """Generar señal inteligente usando el mejor algoritmo"""
        
        if len(closes) < 50:
            return self._fallback_signal(symbol, closes[-1] if closes else 0)
        
        # 1. Analizar condiciones del mercado
        market_condition = self.analyze_market_conditions(highs, lows, closes, volumes)
        
        # 2. Seleccionar mejor algoritmo
        best_algorithm = self.select_best_algorithm(market_condition, highs, lows, closes, volumes)
        
        # 3. Ejecutar algoritmo seleccionado
        signal = self.algorithms[best_algorithm](symbol, highs, lows, closes, volumes)
        
        # 4. Enriquecer señal con contexto
        signal.market_condition = market_condition
        signal.algorithm_used = best_algorithm
        signal.timestamp = datetime.utcnow().isoformat()
        
        # 5. Calcular scores de riesgo y volatilidad
        atr = calculate_atr(highs, lows, closes)
        signal.volatility_score = min(atr / closes[-1] * 10, 1.0)
        signal.risk_score = self._calculate_risk_score(signal, market_condition)
        
        logger.info(f"🎯 {symbol}: {signal.signal} usando {best_algorithm} "
                   f"({signal.confidence:.0%} confianza, {market_condition.value})")
        
        return signal

    # =================================================================
    # ALGORITMOS ESPECÍFICOS
    # =================================================================
    
    def _ema_crossover_algorithm(self, symbol: str, highs: List[float], 
                               lows: List[float], closes: List[float], 
                               volumes: List[float]) -> ScalperSignal:
        """EMA Crossover + Low Volatility"""
        
        ema_9 = calculate_ema(closes, 9)
        ema_21 = calculate_ema(closes, 21)
        atr = calculate_atr(highs, lows, closes)
        current_price = closes[-1]
        
        # Condiciones
        bullish_cross = ema_9 > ema_21
        volatility_ok = atr / current_price < 0.025  # Baja volatilidad
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if bullish_cross and volatility_ok:
            signal = "BUY"
            confidence = 0.8
            conditions_met = ["EMA_BULLISH_CROSS", "LOW_VOLATILITY"]
        elif not bullish_cross and volatility_ok:
            signal = "SELL" 
            confidence = 0.75
            conditions_met = ["EMA_BEARISH_CROSS", "LOW_VOLATILITY"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="EMA Crossover + Low Volatility",
            conditions_met=conditions_met,
            entry_price=current_price,
            take_profit=current_price * (1.02 if signal == "BUY" else 0.98),
            stop_loss=current_price * (0.99 if signal == "BUY" else 1.01)
        )
    
    def _rsi_oversold_algorithm(self, symbol: str, highs: List[float], 
                              lows: List[float], closes: List[float], 
                              volumes: List[float]) -> ScalperSignal:
        """RSI Oversold/Overbought con Volume Confirmation"""
        
        rsi = calculate_rsi(closes)
        volume_spike, volume_ratio = detect_volume_spike(volumes)
        current_price = closes[-1]
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if rsi < 30 and volume_spike:
            signal = "BUY"
            confidence = 0.85
            conditions_met = ["RSI_OVERSOLD", "VOLUME_SPIKE"]
        elif rsi > 70 and volume_spike:
            signal = "SELL"
            confidence = 0.85 
            conditions_met = ["RSI_OVERBOUGHT", "VOLUME_SPIKE"]
        elif rsi < 35:
            signal = "BUY"
            confidence = 0.65
            conditions_met = ["RSI_OVERSOLD"]
        elif rsi > 65:
            signal = "SELL"
            confidence = 0.65
            conditions_met = ["RSI_OVERBOUGHT"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="RSI Oversold + Volume",
            conditions_met=conditions_met,
            entry_price=current_price
        )
    
    def _macd_divergence_algorithm(self, symbol: str, highs: List[float], 
                                 lows: List[float], closes: List[float], 
                                 volumes: List[float]) -> ScalperSignal:
        """MACD Divergence Detection"""
        
        # Calcular MACD simplificado
        ema_12 = calculate_ema(closes, 12)
        ema_26 = calculate_ema(closes, 26)
        macd = ema_12 - ema_26
        
        # Aproximar signal line
        macd_signal = calculate_ema([macd] * 9, 9)
        macd_histogram = macd - macd_signal
        
        current_price = closes[-1]
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        # Detectar divergencia (simplificado)
        if macd_histogram > 0 and macd > macd_signal:
            signal = "BUY"
            confidence = 0.75
            conditions_met = ["MACD_BULLISH", "HISTOGRAM_POSITIVE"]
        elif macd_histogram < 0 and macd < macd_signal:
            signal = "SELL"
            confidence = 0.75
            conditions_met = ["MACD_BEARISH", "HISTOGRAM_NEGATIVE"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="MACD Divergence",
            conditions_met=conditions_met,
            entry_price=current_price
        )
    
    def _support_bounce_algorithm(self, symbol: str, highs: List[float], 
                                lows: List[float], closes: List[float], 
                                volumes: List[float]) -> ScalperSignal:
        """Support Bounce + MACD Divergence"""
        
        current_price = closes[-1]
        
        # Calcular niveles de soporte/resistencia (simplificado)
        recent_lows = sorted(lows[-20:])
        recent_highs = sorted(highs[-20:])
        support_level = recent_lows[2]  # 3er mínimo más bajo
        resistance_level = recent_highs[-3]  # 3er máximo más alto
        
        # Distancia a niveles
        support_distance = (current_price - support_level) / support_level
        resistance_distance = (resistance_level - current_price) / current_price
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        # Bounce desde soporte
        if support_distance < 0.015 and support_distance > 0:  # Cerca del soporte
            signal = "BUY"
            confidence = 0.8
            conditions_met = ["SUPPORT_BOUNCE", "NEAR_SUPPORT"]
        elif resistance_distance < 0.015 and resistance_distance > 0:  # Cerca de resistencia
            signal = "SELL"
            confidence = 0.8
            conditions_met = ["RESISTANCE_REJECTION", "NEAR_RESISTANCE"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="Support Bounce + MACD Divergence",
            conditions_met=conditions_met,
            entry_price=current_price,
            take_profit=resistance_level if signal == "BUY" else support_level,
            stop_loss=support_level * 0.995 if signal == "BUY" else resistance_level * 1.005
        )
    
    def _ma_alignment_algorithm(self, symbol: str, highs: List[float], 
                              lows: List[float], closes: List[float], 
                              volumes: List[float]) -> ScalperSignal:
        """Moving Average Alignment"""
        
        ema_9 = calculate_ema(closes, 9)
        ema_21 = calculate_ema(closes, 21) 
        ema_50 = calculate_ema(closes, 50)
        current_price = closes[-1]
        
        # Alineación alcista: precio > EMA9 > EMA21 > EMA50
        bullish_alignment = current_price > ema_9 > ema_21 > ema_50
        bearish_alignment = current_price < ema_9 < ema_21 < ema_50
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if bullish_alignment:
            signal = "BUY"
            confidence = 0.85
            conditions_met = ["MA_BULLISH_ALIGNMENT", "TREND_CONFIRMATION"]
        elif bearish_alignment:
            signal = "SELL"
            confidence = 0.85
            conditions_met = ["MA_BEARISH_ALIGNMENT", "TREND_CONFIRMATION"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="Moving Average Alignment",
            conditions_met=conditions_met,
            entry_price=current_price
        )
    
    def _higher_high_algorithm(self, symbol: str, highs: List[float], 
                             lows: List[float], closes: List[float], 
                             volumes: List[float]) -> ScalperSignal:
        """Higher High Formation"""
        
        if len(highs) < 10:
            return self._fallback_signal(symbol, closes[-1])
        
        current_price = closes[-1]
        recent_highs = highs[-10:]
        
        # Detectar patrón de máximos más altos
        higher_high = recent_highs[-1] > max(recent_highs[-5:-1])
        increasing_trend = len([h for i, h in enumerate(recent_highs[1:], 1) 
                              if h > recent_highs[i-1]]) >= 3
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if higher_high and increasing_trend:
            signal = "BUY"  # Continuación alcista
            confidence = 0.8
            conditions_met = ["HIGHER_HIGH", "INCREASING_TREND"]
        elif not higher_high and current_price < calculate_ema(closes, 20):
            signal = "SELL"  # Reversión bajista
            confidence = 0.7
            conditions_met = ["FAILED_HIGHER_HIGH", "BELOW_EMA"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="Higher High Formation",
            conditions_met=conditions_met,
            entry_price=current_price
        )
    
    def _volume_breakout_algorithm(self, symbol: str, highs: List[float], 
                                 lows: List[float], closes: List[float], 
                                 volumes: List[float]) -> ScalperSignal:
        """Volume Breakout Strategy"""
        
        volume_spike, volume_ratio = detect_volume_spike(volumes, threshold=2.0)
        current_price = closes[-1]
        
        # Detectar breakout con volumen
        price_change_pct = (closes[-1] - closes[-5]) / closes[-5]
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if volume_spike and price_change_pct > 0.02:  # Breakout alcista
            signal = "BUY"
            confidence = 0.9
            conditions_met = ["VOLUME_BREAKOUT", "PRICE_SURGE"]
        elif volume_spike and price_change_pct < -0.02:  # Breakout bajista
            signal = "SELL"
            confidence = 0.9
            conditions_met = ["VOLUME_BREAKDOWN", "PRICE_DROP"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="Volume Breakout",
            conditions_met=conditions_met,
            entry_price=current_price
        )
    
    def _bollinger_squeeze_algorithm(self, symbol: str, highs: List[float], 
                                   lows: List[float], closes: List[float], 
                                   volumes: List[float]) -> ScalperSignal:
        """Bollinger Squeeze Strategy"""
        
        upper, middle, lower = calculate_bollinger_bands(closes, period=20, std_dev=2)
        current_price = closes[-1]
        
        # Calcular ancho de las bandas (squeeze detection)
        band_width = (upper - lower) / middle
        atr = calculate_atr(highs, lows, closes)
        squeeze = band_width < 0.1  # Bandas muy estrechas
        
        conditions_met = []
        signal = "HOLD"
        confidence = 0.5
        
        if squeeze and current_price > upper:  # Breakout al alza
            signal = "BUY"
            confidence = 0.85
            conditions_met = ["BOLLINGER_SQUEEZE", "UPSIDE_BREAKOUT"]
        elif squeeze and current_price < lower:  # Breakout a la baja
            signal = "SELL"
            confidence = 0.85
            conditions_met = ["BOLLINGER_SQUEEZE", "DOWNSIDE_BREAKOUT"]
        elif current_price > middle and not squeeze:
            signal = "BUY"
            confidence = 0.6
            conditions_met = ["ABOVE_BB_MIDDLE"]
        
        return ScalperSignal(
            signal=signal,
            confidence=confidence,
            algorithm_used="Bollinger Squeeze",
            conditions_met=conditions_met,
            entry_price=current_price,
            take_profit=upper if signal == "BUY" else lower,
            stop_loss=middle
        )

    # =================================================================
    # FUNCIONES DE APOYO
    # =================================================================
    
    def _score_ema_conditions(self, closes: List[float]) -> float:
        """Scoring para condiciones EMA"""
        ema_9 = calculate_ema(closes, 9)
        ema_21 = calculate_ema(closes, 21)
        spread = abs(ema_9 - ema_21) / closes[-1]
        return min(spread * 20, 1.0)  # Mejor cuando hay divergencia clara
    
    def _score_rsi_conditions(self, rsi: float) -> float:
        """Scoring para condiciones RSI"""
        if rsi < 30 or rsi > 70:
            return 0.9  # Condiciones extremas
        elif rsi < 40 or rsi > 60:
            return 0.7  # Condiciones moderadas
        else:
            return 0.3  # Zona neutral
    
    def _score_macd_conditions(self, closes: List[float]) -> float:
        """Scoring para condiciones MACD"""
        # Simplificado - evaluar momentum
        momentum = (closes[-1] - closes[-5]) / closes[-5]
        return min(abs(momentum) * 10, 1.0)
    
    def _score_support_conditions(self, highs: List[float], lows: List[float], closes: List[float]) -> float:
        """Scoring para condiciones de soporte"""
        current_price = closes[-1]
        recent_low = min(lows[-10:])
        distance_to_support = (current_price - recent_low) / recent_low
        return max(0, 1.0 - distance_to_support * 10)  # Mejor cerca de soportes
    
    def _score_ma_alignment(self, closes: List[float]) -> float:
        """Scoring para alineación de MAs"""
        ema_9 = calculate_ema(closes, 9)
        ema_21 = calculate_ema(closes, 21)
        ema_50 = calculate_ema(closes, 50)
        
        # Verificar alineación
        bullish_align = closes[-1] > ema_9 > ema_21 > ema_50
        bearish_align = closes[-1] < ema_9 < ema_21 < ema_50
        
        return 0.9 if (bullish_align or bearish_align) else 0.4
    
    def _score_higher_high(self, highs: List[float], closes: List[float]) -> float:
        """Scoring para formación de Higher Highs"""
        if len(highs) < 5:
            return 0.3
        
        recent_max = max(highs[-5:])
        previous_max = max(highs[-10:-5])
        
        return 0.8 if recent_max > previous_max else 0.3
    
    def _score_bollinger_squeeze(self, closes: List[float], volatility: float) -> float:
        """Scoring para Bollinger Squeeze"""
        return max(0, 1.0 - volatility * 20)  # Mejor con baja volatilidad
    
    def _calculate_risk_score(self, signal: ScalperSignal, market_condition: MarketCondition) -> float:
        """Calcular score de riesgo basado en condiciones"""
        base_risk = 0.5
        
        # Ajustar según condición de mercado
        risk_adjustments = {
            MarketCondition.HIGH_VOLATILITY: 0.3,  # Mayor riesgo
            MarketCondition.LOW_VOLATILITY: -0.2,  # Menor riesgo
            MarketCondition.TRENDING_UP: -0.1,
            MarketCondition.TRENDING_DOWN: 0.1,
            MarketCondition.SIDEWAYS: 0.0,
            MarketCondition.BREAKOUT: 0.2
        }
        
        risk_score = base_risk + risk_adjustments.get(market_condition, 0)
        
        # Ajustar según confianza
        risk_score = risk_score * (1 - signal.confidence * 0.3)
        
        return max(0.1, min(0.9, risk_score))
    
    def _fallback_signal(self, symbol: str, current_price: float) -> ScalperSignal:
        """Señal de fallback cuando no hay datos suficientes"""
        return ScalperSignal(
            signal="HOLD",
            confidence=0.5,
            algorithm_used="Fallback - Insufficient Data",
            conditions_met=["INSUFFICIENT_DATA"],
            entry_price=current_price,
            market_condition=MarketCondition.SIDEWAYS
        )

# =================================================================
# TESTING
# =================================================================

def test_smart_scalper_engine():
    """Test del motor Smart Scalper"""
    print("🧪 Testing Smart Scalper Multi-Algoritmo...")
    
    engine = SmartScalperEngine()
    
    # Data de prueba
    highs = [102, 104, 103, 105, 107, 106, 108, 110, 109, 111, 113, 112, 114, 116, 115] * 4
    lows = [100, 101, 100, 102, 104, 103, 105, 107, 106, 108, 110, 109, 111, 113, 112] * 4
    closes = [101, 103, 102, 104, 106, 105, 107, 109, 108, 110, 112, 111, 113, 115, 114] * 4
    volumes = [1000, 1200, 800, 1500, 2000, 1100, 1300, 1800, 900, 1600, 2200, 1000, 1400, 1900, 1050] * 4
    
    # Test 1: Condiciones de mercado
    market_condition = engine.analyze_market_conditions(highs, lows, closes, volumes)
    print(f"📊 Condición de mercado: {market_condition.value}")
    
    # Test 2: Selección de algoritmo
    best_algo = engine.select_best_algorithm(market_condition, highs, lows, closes, volumes)
    print(f"🎯 Mejor algoritmo: {best_algo}")
    
    # Test 3: Generar señal
    signal = engine.generate_signal("BTCUSDT", highs, lows, closes, volumes)
    print(f"📈 Señal: {signal.signal} ({signal.confidence:.0%})")
    print(f"🧠 Algoritmo usado: {signal.algorithm_used}")
    print(f"✅ Condiciones: {', '.join(signal.conditions_met)}")
    print(f"⚖️ Riesgo: {signal.risk_score:.0%} | Volatilidad: {signal.volatility_score:.0%}")
    
    # Test múltiples algoritmos
    print("\n" + "="*60)
    print("🔄 Testing múltiples algoritmos:")
    
    for algo_name, algo_func in engine.algorithms.items():
        try:
            test_signal = algo_func("TEST", highs, lows, closes, volumes)
            print(f"  {algo_name:<25}: {test_signal.signal} ({test_signal.confidence:.0%})")
        except Exception as e:
            print(f"  {algo_name:<25}: ERROR - {e}")
    
    print("✅ Smart Scalper Engine test completed")

if __name__ == "__main__":
    test_smart_scalper_engine()