#!/usr/bin/env python3
"""
🏛️ InstitutionalDetector - Detección Profesional de Manipulación de Mercado
Identifica Stop Hunting, Liquidity Grabs, False Breakouts y patrones institucionales

Eduard Guzmán - InteliBotX - Smart Scalper Pro
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import logging

# Market microstructure analysis
from services.market_microstructure_analyzer import MarketMicrostructure, LiquidityZoneType
from services.ta_alternative import (
    calculate_rsi, calculate_ema, calculate_sma, calculate_atr,
    calculate_volume_sma, detect_volume_spike
)

logger = logging.getLogger(__name__)

class ManipulationType(Enum):
    """Tipos de manipulación detectados"""
    STOP_HUNTING = "stop_hunting"
    LIQUIDITY_GRAB = "liquidity_grab"
    FALSE_BREAKOUT = "false_breakout"
    WYCKOFF_SPRING = "wyckoff_spring"
    WYCKOFF_UPTHRUST = "wyckoff_upthrust"
    ICEBERG_ORDER = "iceberg_order"
    SPOOFING = "spoofing"
    WASH_TRADING = "wash_trading"

class MarketPhase(Enum):
    """Fases del mercado según Wyckoff"""
    ACCUMULATION = "accumulation"
    MARKUP = "markup"
    DISTRIBUTION = "distribution" 
    MARKDOWN = "markdown"
    SIDEWAYS = "sideways"

@dataclass
class ManipulationEvent:
    """Evento de manipulación detectado"""
    type: ManipulationType
    timestamp: str
    price_level: float
    confidence: float  # 0.0 - 1.0
    severity: str      # LOW, MEDIUM, HIGH, CRITICAL
    description: str
    volume_evidence: bool
    price_evidence: bool
    time_evidence: bool
    follow_through_expected: str  # BULLISH, BEARISH, NEUTRAL
    risk_level: float  # 0.0 - 1.0 (para trading)
    
@dataclass
class InstitutionalAnalysis:
    """Análisis completo institucional"""
    symbol: str
    timeframe: str
    timestamp: str
    
    # Detecciones de manipulación
    manipulation_events: List[ManipulationEvent]
    active_manipulations: List[ManipulationType]
    
    # Análisis Wyckoff
    market_phase: MarketPhase
    wyckoff_signals: List[str]
    accumulation_distribution_line: float  # A/D Line
    
    # Smart Money Concepts
    market_structure_break: bool
    change_of_character: bool
    order_blocks: List[Dict[str, Any]]
    fair_value_gaps: List[Dict[str, Any]]
    liquidity_sweep_detected: bool
    
    # Institutional Footprint
    large_player_activity: float    # 0.0 - 1.0
    retail_sentiment_score: float   # 0.0 - 1.0 (high = retail heavy)
    smart_money_flow: str          # INFLOW, OUTFLOW, NEUTRAL
    
    # Trading Implications
    manipulation_risk: float        # 0.0 - 1.0
    trade_safety_score: float      # 0.0 - 1.0 (high = safer to trade)
    recommended_action: str         # AVOID, CAUTION, FADE, FOLLOW, NEUTRAL

class InstitutionalDetector:
    """Detector avanzado de actividad institucional y manipulación"""
    
    def __init__(self):
        self.stop_hunt_threshold = 0.02    # 2% typical stop hunt distance
        self.liquidity_grab_time = 3       # Max bars for liquidity grab
        self.false_breakout_ratio = 0.5    # Volume ratio for false breakouts
        self.wyckoff_lookback = 50         # Bars for Wyckoff analysis
        
        logger.info("🏛️ InstitutionalDetector inicializado (Anti-Manipulación)")

    def analyze_institutional_activity(self, symbol: str, timeframe: str,
                                     opens: List[float], highs: List[float], 
                                     lows: List[float], closes: List[float], 
                                     volumes: List[float],
                                     microstructure: Optional[MarketMicrostructure] = None) -> InstitutionalAnalysis:
        """
        Análisis completo de actividad institucional
        
        Args:
            symbol: Par de trading
            timeframe: Temporalidad 
            opens, highs, lows, closes, volumes: Datos OHLCV
            microstructure: Análisis de microestructura opcional
            
        Returns:
            InstitutionalAnalysis con detecciones completas
        """
        try:
            if len(closes) < 20:
                return self._generate_fallback_analysis(symbol, timeframe)
            
            # 1. Detectar eventos de manipulación
            manipulation_events = self._detect_manipulation_events(
                opens, highs, lows, closes, volumes
            )
            
            # 2. Análisis Wyckoff
            market_phase, wyckoff_signals, ad_line = self._analyze_wyckoff_method(
                opens, highs, lows, closes, volumes
            )
            
            # 3. Smart Money Concepts  
            structure_break, change_char, order_blocks, fvgs, liquidity_sweep = self._analyze_smart_money_concepts(
                opens, highs, lows, closes, volumes
            )
            
            # 4. Institutional Footprint
            large_activity, retail_sentiment, money_flow = self._analyze_institutional_footprint(
                opens, highs, lows, closes, volumes, microstructure
            )
            
            # 5. Risk Assessment
            manip_risk, safety_score, recommended = self._assess_trading_implications(
                manipulation_events, market_phase, large_activity
            )
            
            # Determinar manipulaciones activas
            active_manips = [event.type for event in manipulation_events 
                           if event.confidence > 0.6 and 
                           event.risk_level > 0.5]
            
            return InstitutionalAnalysis(
                symbol=symbol,
                timeframe=timeframe,
                timestamp=datetime.utcnow().isoformat(),
                
                # Manipulación
                manipulation_events=manipulation_events,
                active_manipulations=active_manips,
                
                # Wyckoff
                market_phase=market_phase,
                wyckoff_signals=wyckoff_signals,
                accumulation_distribution_line=ad_line,
                
                # Smart Money
                market_structure_break=structure_break,
                change_of_character=change_char,
                order_blocks=order_blocks,
                fair_value_gaps=fvgs,
                liquidity_sweep_detected=liquidity_sweep,
                
                # Footprint
                large_player_activity=large_activity,
                retail_sentiment_score=retail_sentiment,
                smart_money_flow=money_flow,
                
                # Trading
                manipulation_risk=manip_risk,
                trade_safety_score=safety_score,
                recommended_action=recommended
            )
            
        except Exception as e:
            logger.error(f"❌ Error en análisis institucional {symbol}: {e}")
            return self._generate_fallback_analysis(symbol, timeframe)

    def _detect_manipulation_events(self, opens: List[float], highs: List[float], 
                                   lows: List[float], closes: List[float], 
                                   volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar eventos específicos de manipulación"""
        
        events = []
        
        # 1. Stop Hunting Detection
        events.extend(self._detect_stop_hunting(opens, highs, lows, closes, volumes))
        
        # 2. Liquidity Grab Detection  
        events.extend(self._detect_liquidity_grabs(opens, highs, lows, closes, volumes))
        
        # 3. False Breakout Detection
        events.extend(self._detect_false_breakouts(opens, highs, lows, closes, volumes))
        
        # 4. Wyckoff Spring/Upthrust
        events.extend(self._detect_wyckoff_events(opens, highs, lows, closes, volumes))
        
        # 5. Iceberg Orders (volume anomalies)
        events.extend(self._detect_iceberg_orders(opens, highs, lows, closes, volumes))
        
        # Ordenar por timestamp (más recientes primero)
        events.sort(key=lambda x: x.timestamp, reverse=True)
        
        return events[:20]  # Top 20 eventos más recientes

    def _detect_stop_hunting(self, opens: List[float], highs: List[float], 
                           lows: List[float], closes: List[float], 
                           volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar patrones de Stop Hunting"""
        
        events = []
        lookback = min(20, len(closes) - 1)
        
        for i in range(lookback, len(closes)):
            # Buscar spikes que rompen niveles obvios y revierten rápidamente
            current_high = highs[i]
            current_low = lows[i]
            current_close = closes[i]
            current_volume = volumes[i]
            
            # Niveles de referencia
            recent_highs = highs[i-lookback:i]
            recent_lows = lows[i-lookback:i]
            resistance_level = max(recent_highs)
            support_level = min(recent_lows)
            
            avg_volume = calculate_volume_sma(volumes[i-10:i], 10)
            
            # Stop Hunt al alza (sweep highs)
            if (current_high > resistance_level * 1.001 and  # Rompe resistencia
                current_close < resistance_level and         # Pero cierra debajo
                current_volume > avg_volume * 1.5):          # Con volumen elevado
                
                # Verificar reversión rápida
                reversal_strength = (resistance_level - current_close) / resistance_level
                
                if reversal_strength > 0.005:  # Reversión > 0.5%
                    confidence = min(0.9, 0.3 + reversal_strength * 20 + 
                                   min(0.4, (current_volume / avg_volume - 1) / 3))
                    
                    events.append(ManipulationEvent(
                        type=ManipulationType.STOP_HUNTING,
                        timestamp=datetime.utcnow().isoformat(),
                        price_level=current_high,
                        confidence=confidence,
                        severity="HIGH" if confidence > 0.75 else "MEDIUM",
                        description=f"Stop hunt detected above ${resistance_level:.2f}, swept to ${current_high:.2f}",
                        volume_evidence=current_volume > avg_volume * 1.5,
                        price_evidence=True,
                        time_evidence=True,
                        follow_through_expected="BEARISH",
                        risk_level=confidence
                    ))
            
            # Stop Hunt a la baja (sweep lows)
            if (current_low < support_level * 0.999 and     # Rompe soporte
                current_close > support_level and           # Pero cierra encima
                current_volume > avg_volume * 1.5):         # Con volumen elevado
                
                reversal_strength = (current_close - support_level) / support_level
                
                if reversal_strength > 0.005:
                    confidence = min(0.9, 0.3 + reversal_strength * 20 + 
                                   min(0.4, (current_volume / avg_volume - 1) / 3))
                    
                    events.append(ManipulationEvent(
                        type=ManipulationType.STOP_HUNTING,
                        timestamp=datetime.utcnow().isoformat(),
                        price_level=current_low,
                        confidence=confidence,
                        severity="HIGH" if confidence > 0.75 else "MEDIUM",
                        description=f"Stop hunt detected below ${support_level:.2f}, swept to ${current_low:.2f}",
                        volume_evidence=current_volume > avg_volume * 1.5,
                        price_evidence=True,
                        time_evidence=True,
                        follow_through_expected="BULLISH",
                        risk_level=confidence
                    ))
        
        return events

    def _detect_liquidity_grabs(self, opens: List[float], highs: List[float], 
                              lows: List[float], closes: List[float], 
                              volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar Liquidity Grabs (toma de liquidez institucional)"""
        
        events = []
        
        for i in range(5, len(closes)):
            # Buscar patrones donde hay ruptura seguida de reversión inmediata
            
            # Datos actuales
            current_open = opens[i]
            current_high = highs[i]
            current_low = lows[i]
            current_close = closes[i]
            current_volume = volumes[i]
            
            # Contexto reciente
            prev_close = closes[i-1]
            recent_high = max(highs[i-5:i])
            recent_low = min(lows[i-5:i])
            avg_volume = calculate_volume_sma(volumes[i-5:i], 5)
            
            # Liquidity Grab alcista (grab selling liquidity)
            gap_up = current_open > prev_close * 1.005  # Gap up > 0.5%
            failed_breakout = current_high > recent_high and current_close < recent_high * 0.998
            volume_confirmation = current_volume > avg_volume * 1.2
            
            if gap_up and failed_breakout and volume_confirmation:
                # Calcular confianza basada en magnitud de grab
                grab_magnitude = (current_high - recent_high) / recent_high
                reversal_magnitude = (current_high - current_close) / current_high
                
                confidence = min(0.85, 0.4 + grab_magnitude * 50 + reversal_magnitude * 10)
                
                events.append(ManipulationEvent(
                    type=ManipulationType.LIQUIDITY_GRAB,
                    timestamp=datetime.utcnow().isoformat(),
                    price_level=current_high,
                    confidence=confidence,
                    severity="HIGH" if confidence > 0.7 else "MEDIUM",
                    description=f"Liquidity grab above ${recent_high:.2f}, failed at ${current_high:.2f}",
                    volume_evidence=volume_confirmation,
                    price_evidence=True,
                    time_evidence=True,
                    follow_through_expected="BEARISH",
                    risk_level=confidence * 0.8
                ))
            
            # Liquidity Grab bajista (grab buying liquidity)
            gap_down = current_open < prev_close * 0.995  # Gap down > 0.5%
            failed_breakdown = current_low < recent_low and current_close > recent_low * 1.002
            
            if gap_down and failed_breakdown and volume_confirmation:
                grab_magnitude = (recent_low - current_low) / recent_low
                reversal_magnitude = (current_close - current_low) / current_close
                
                confidence = min(0.85, 0.4 + grab_magnitude * 50 + reversal_magnitude * 10)
                
                events.append(ManipulationEvent(
                    type=ManipulationType.LIQUIDITY_GRAB,
                    timestamp=datetime.utcnow().isoformat(),
                    price_level=current_low,
                    confidence=confidence,
                    severity="HIGH" if confidence > 0.7 else "MEDIUM",
                    description=f"Liquidity grab below ${recent_low:.2f}, failed at ${current_low:.2f}",
                    volume_evidence=volume_confirmation,
                    price_evidence=True,
                    time_evidence=True,
                    follow_through_expected="BULLISH",
                    risk_level=confidence * 0.8
                ))
        
        return events

    def _detect_false_breakouts(self, opens: List[float], highs: List[float], 
                              lows: List[float], closes: List[float], 
                              volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar False Breakouts (rupturas falsas)"""
        
        events = []
        
        for i in range(10, len(closes)):
            # Identificar niveles de soporte/resistencia
            lookback_period = min(10, i)
            resistance = max(highs[i-lookback_period:i])
            support = min(lows[i-lookback_period:i])
            
            current_high = highs[i]
            current_low = lows[i]
            current_close = closes[i]
            current_volume = volumes[i]
            
            avg_volume = calculate_volume_sma(volumes[i-5:i], 5)
            
            # False breakout alcista
            breakout_up = current_high > resistance * 1.002  # Rompe > 0.2%
            weak_followthrough = current_close < resistance * 1.001  # Cierre débil
            low_volume = current_volume < avg_volume * 0.8  # Volumen bajo
            
            if breakout_up and (weak_followthrough or low_volume):
                # Verificar si hay reversión en siguientes barras (si disponibles)
                future_weakness = True
                if i < len(closes) - 2:
                    future_weakness = closes[i+1] < resistance or closes[i+2] < resistance
                
                confidence = 0.6
                if weak_followthrough:
                    confidence += 0.15
                if low_volume:
                    confidence += 0.1
                if future_weakness:
                    confidence += 0.1
                
                events.append(ManipulationEvent(
                    type=ManipulationType.FALSE_BREAKOUT,
                    timestamp=datetime.utcnow().isoformat(),
                    price_level=current_high,
                    confidence=min(0.9, confidence),
                    severity="MEDIUM",
                    description=f"False breakout above ${resistance:.2f}, failed to sustain",
                    volume_evidence=low_volume,
                    price_evidence=weak_followthrough,
                    time_evidence=future_weakness,
                    follow_through_expected="BEARISH",
                    risk_level=confidence * 0.7
                ))
            
            # False breakdown bajista
            breakdown_down = current_low < support * 0.998  # Rompe > 0.2%
            weak_followthrough = current_close > support * 0.999  # Cierre débil
            
            if breakdown_down and (weak_followthrough or low_volume):
                future_weakness = True
                if i < len(closes) - 2:
                    future_weakness = closes[i+1] > support or closes[i+2] > support
                
                confidence = 0.6
                if weak_followthrough:
                    confidence += 0.15
                if low_volume:
                    confidence += 0.1  
                if future_weakness:
                    confidence += 0.1
                
                events.append(ManipulationEvent(
                    type=ManipulationType.FALSE_BREAKOUT,
                    timestamp=datetime.utcnow().isoformat(),
                    price_level=current_low,
                    confidence=min(0.9, confidence),
                    severity="MEDIUM",
                    description=f"False breakdown below ${support:.2f}, failed to sustain",
                    volume_evidence=low_volume,
                    price_evidence=weak_followthrough,
                    time_evidence=future_weakness,
                    follow_through_expected="BULLISH",
                    risk_level=confidence * 0.7
                ))
        
        return events

    def _detect_wyckoff_events(self, opens: List[float], highs: List[float], 
                             lows: List[float], closes: List[float], 
                             volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar eventos Wyckoff (Spring, Upthrust)"""
        
        events = []
        lookback = min(self.wyckoff_lookback, len(closes) - 1)
        
        for i in range(lookback, len(closes)):
            # Buscar Spring (test of support en accumulation)
            recent_lows = lows[i-lookback:i]
            support_level = min(recent_lows)
            current_low = lows[i]
            current_close = closes[i]
            current_volume = volumes[i]
            
            # Spring: breach support brevemente, luego recovery con volumen
            if (current_low < support_level * 0.995 and  # Breach support
                current_close > support_level and        # Recover above support
                current_volume > calculate_volume_sma(volumes[i-5:i], 5) * 1.2):  # Volume
                
                # Verificar contexto de accumulation
                price_range = max(highs[i-lookback:i]) - min(lows[i-lookback:i])
                recent_range = current_close - current_low
                
                if recent_range > price_range * 0.3:  # Significant recovery
                    confidence = 0.7 + min(0.2, (current_close - support_level) / support_level * 100)
                    
                    events.append(ManipulationEvent(
                        type=ManipulationType.WYCKOFF_SPRING,
                        timestamp=datetime.utcnow().isoformat(),
                        price_level=current_low,
                        confidence=confidence,
                        severity="HIGH",
                        description=f"Wyckoff Spring at ${current_low:.2f}, support ${support_level:.2f}",
                        volume_evidence=True,
                        price_evidence=True,
                        time_evidence=True,
                        follow_through_expected="BULLISH",
                        risk_level=0.3  # Spring is actually bullish
                    ))
            
            # Upthrust: breach resistance brevemente, luego weakness
            recent_highs = highs[i-lookback:i]
            resistance_level = max(recent_highs)
            current_high = highs[i]
            
            if (current_high > resistance_level * 1.005 and  # Breach resistance
                current_close < resistance_level and         # Weak close
                current_volume > calculate_volume_sma(volumes[i-5:i], 5) * 1.2):
                
                weakness = (resistance_level - current_close) / resistance_level
                if weakness > 0.01:  # Significant weakness
                    confidence = 0.7 + min(0.2, weakness * 50)
                    
                    events.append(ManipulationEvent(
                        type=ManipulationType.WYCKOFF_UPTHRUST,
                        timestamp=datetime.utcnow().isoformat(),
                        price_level=current_high,
                        confidence=confidence,
                        severity="HIGH",
                        description=f"Wyckoff Upthrust at ${current_high:.2f}, resistance ${resistance_level:.2f}",
                        volume_evidence=True,
                        price_evidence=True,
                        time_evidence=True,
                        follow_through_expected="BEARISH",
                        risk_level=0.3  # Upthrust is actually bearish
                    ))
        
        return events

    def _detect_iceberg_orders(self, opens: List[float], highs: List[float], 
                             lows: List[float], closes: List[float], 
                             volumes: List[float]) -> List[ManipulationEvent]:
        """Detectar Iceberg Orders (órdenes institucionales grandes fragmentadas)"""
        
        events = []
        
        for i in range(10, len(closes)):
            # Buscar patrones de absorción con volumen anómalo
            current_volume = volumes[i]
            avg_volume = calculate_volume_sma(volumes[i-10:i], 10)
            
            # Volumen muy alto
            if current_volume > avg_volume * 3:
                # Pero precio se mantiene en rango estrecho (absorción)
                price_range = (highs[i] - lows[i]) / closes[i]
                
                # Contexto de 3 barras alrededor
                context_range = 0
                if i >= 1 and i < len(closes) - 1:
                    context_highs = highs[i-1:i+2]
                    context_lows = lows[i-1:i+2]
                    context_range = (max(context_highs) - min(context_lows)) / closes[i]
                
                # Iceberg si alto volumen pero rango estrecho
                if price_range < 0.01 and context_range < 0.02:  # <1% rango individual, <2% contexto
                    confidence = min(0.8, 0.4 + (current_volume / avg_volume - 3) / 10)
                    
                    # Determinar dirección basada en posición del close
                    close_position = (closes[i] - lows[i]) / max(highs[i] - lows[i], 1e-8)
                    
                    if close_position > 0.6:
                        follow_through = "BULLISH"
                        description = f"Iceberg buying detected at ${closes[i]:.2f}"
                    elif close_position < 0.4:
                        follow_through = "BEARISH"
                        description = f"Iceberg selling detected at ${closes[i]:.2f}"
                    else:
                        follow_through = "NEUTRAL"
                        description = f"Iceberg order detected at ${closes[i]:.2f}"
                    
                    events.append(ManipulationEvent(
                        type=ManipulationType.ICEBERG_ORDER,
                        timestamp=datetime.utcnow().isoformat(),
                        price_level=closes[i],
                        confidence=confidence,
                        severity="MEDIUM",
                        description=description,
                        volume_evidence=True,
                        price_evidence=True,
                        time_evidence=False,
                        follow_through_expected=follow_through,
                        risk_level=0.2  # Iceberg orders are less risky
                    ))
        
        return events

    def _analyze_wyckoff_method(self, opens: List[float], highs: List[float], 
                               lows: List[float], closes: List[float], 
                               volumes: List[float]) -> Tuple[MarketPhase, List[str], float]:
        """Análisis Wyckoff completo"""
        
        if len(closes) < self.wyckoff_lookback:
            return MarketPhase.SIDEWAYS, [], 0.0
        
        # Calcular A/D Line (Accumulation/Distribution)
        ad_line = self._calculate_ad_line(highs, lows, closes, volumes)
        
        # Determinar fase del mercado
        market_phase = self._determine_market_phase(highs, lows, closes, volumes)
        
        # Generar señales Wyckoff
        signals = self._generate_wyckoff_signals(market_phase, highs, lows, closes, volumes)
        
        return market_phase, signals, ad_line

    def _calculate_ad_line(self, highs: List[float], lows: List[float], 
                          closes: List[float], volumes: List[float]) -> float:
        """Calcular Accumulation/Distribution Line"""
        
        ad_values = []
        
        for i in range(len(closes)):
            high = highs[i]
            low = lows[i]
            close = closes[i]
            volume = volumes[i]
            
            # Money Flow Multiplier
            if high != low:
                mfm = ((close - low) - (high - close)) / (high - low)
            else:
                mfm = 0
            
            # Money Flow Volume
            mfv = mfm * volume
            ad_values.append(mfv)
        
        # A/D Line es suma acumulativa
        return sum(ad_values)

    def _determine_market_phase(self, highs: List[float], lows: List[float], 
                               closes: List[float], volumes: List[float]) -> MarketPhase:
        """Determinar fase del mercado según Wyckoff"""
        
        lookback = min(self.wyckoff_lookback, len(closes))
        
        # Analizar tendencia y volumen
        price_trend = (closes[-1] - closes[-lookback]) / closes[-lookback]
        avg_volume_recent = sum(volumes[-10:]) / 10
        avg_volume_baseline = sum(volumes[-30:-10]) / 20 if len(volumes) >= 30 else avg_volume_recent
        
        volume_trend = avg_volume_recent / max(avg_volume_baseline, 1)
        
        # Volatilidad
        recent_range = max(highs[-lookback:]) - min(lows[-lookback:])
        range_pct = recent_range / closes[-1]
        
        # Determinación de fase
        if abs(price_trend) < 0.05 and range_pct < 0.1:  # Sideways
            if volume_trend > 1.2:  # Alto volumen en sideways
                # Puede ser acumulación o distribución
                if price_trend >= 0:
                    return MarketPhase.ACCUMULATION
                else:
                    return MarketPhase.DISTRIBUTION
            else:
                return MarketPhase.SIDEWAYS
        elif price_trend > 0.05:  # Tendencia alcista
            return MarketPhase.MARKUP
        elif price_trend < -0.05:  # Tendencia bajista
            return MarketPhase.MARKDOWN
        else:
            return MarketPhase.SIDEWAYS

    def _generate_wyckoff_signals(self, phase: MarketPhase, highs: List[float], 
                                 lows: List[float], closes: List[float], 
                                 volumes: List[float]) -> List[str]:
        """Generar señales específicas según fase Wyckoff"""
        
        signals = []
        
        if phase == MarketPhase.ACCUMULATION:
            signals.extend([
                "Look for Springs (tests of support)",
                "Volume should dry up on declines",
                "Signs of strength on rallies",
                "Prepare for markup phase"
            ])
        elif phase == MarketPhase.DISTRIBUTION:
            signals.extend([
                "Look for Upthrusts (tests of resistance)",
                "Volume should increase on declines",
                "Signs of weakness on rallies",
                "Prepare for markdown phase"
            ])
        elif phase == MarketPhase.MARKUP:
            signals.extend([
                "Trend following opportunities",
                "Buy pullbacks to support",
                "Volume should confirm moves",
                "Watch for distribution signs"
            ])
        elif phase == MarketPhase.MARKDOWN:
            signals.extend([
                "Trend following opportunities (short)",
                "Sell rallies to resistance", 
                "Volume should confirm moves",
                "Watch for accumulation signs"
            ])
        else:  # SIDEWAYS
            signals.extend([
                "Range trading opportunities",
                "Buy support, sell resistance",
                "Wait for breakout confirmation",
                "Monitor volume for phase change"
            ])
        
        return signals

    def _analyze_smart_money_concepts(self, opens: List[float], highs: List[float], 
                                    lows: List[float], closes: List[float], 
                                    volumes: List[float]) -> Tuple[bool, bool, List[Dict], List[Dict], bool]:
        """Análisis Smart Money Concepts (ICT methodology)"""
        
        # Market Structure Break
        structure_break = self._detect_market_structure_break(highs, lows, closes)
        
        # Change of Character
        change_char = self._detect_change_of_character(highs, lows, closes, volumes)
        
        # Order Blocks
        order_blocks = self._identify_order_blocks(opens, highs, lows, closes, volumes)
        
        # Fair Value Gaps
        fair_value_gaps = self._identify_fair_value_gaps(highs, lows, opens, closes)
        
        # Liquidity Sweep
        liquidity_sweep = self._detect_liquidity_sweep(highs, lows, closes, volumes)
        
        return structure_break, change_char, order_blocks, fair_value_gaps, liquidity_sweep

    def _detect_market_structure_break(self, highs: List[float], lows: List[float], 
                                     closes: List[float]) -> bool:
        """Detectar Break of Structure (BOS)"""
        
        if len(closes) < 10:
            return False
        
        # Buscar estructura de Higher Highs/Lower Lows
        recent_highs = highs[-10:]
        recent_lows = lows[-10:]
        
        # Estructura alcista rota si hace Lower Low
        if len(recent_lows) >= 3:
            last_low = recent_lows[-1]
            prev_lows = recent_lows[-3:-1]
            if last_low < min(prev_lows):
                return True
        
        # Estructura bajista rota si hace Higher High  
        if len(recent_highs) >= 3:
            last_high = recent_highs[-1]
            prev_highs = recent_highs[-3:-1]
            if last_high > max(prev_highs):
                return True
        
        return False

    def _detect_change_of_character(self, highs: List[float], lows: List[float], 
                                   closes: List[float], volumes: List[float]) -> bool:
        """Detectar Change of Character (CHoCH)"""
        
        if len(closes) < 15:
            return False
        
        # Buscar cambio en comportamiento del precio
        recent_period = 10
        baseline_period = 10
        
        recent_volatility = np.std(closes[-recent_period:])
        baseline_volatility = np.std(closes[-recent_period-baseline_period:-recent_period])
        
        recent_volume = sum(volumes[-recent_period:]) / recent_period
        baseline_volume = sum(volumes[-recent_period-baseline_period:-recent_period]) / baseline_period
        
        # CHoCH si hay cambio significativo en volatilidad Y volumen
        volatility_change = abs(recent_volatility - baseline_volatility) / baseline_volatility
        volume_change = abs(recent_volume - baseline_volume) / max(baseline_volume, 1)
        
        return volatility_change > 0.3 and volume_change > 0.5

    def _identify_order_blocks(self, opens: List[float], highs: List[float], 
                             lows: List[float], closes: List[float], 
                             volumes: List[float]) -> List[Dict[str, Any]]:
        """Identificar Order Blocks (zonas de órdenes institucionales)"""
        
        order_blocks = []
        
        for i in range(5, len(closes)):
            # Order Block = candle que causa movimiento fuerte
            current_volume = volumes[i]
            avg_volume = calculate_volume_sma(volumes[i-5:i], 5)
            
            # Movimiento fuerte = high volume + strong price move
            price_move = abs(closes[i] - opens[i]) / opens[i]
            strong_move = current_volume > avg_volume * 1.5 and price_move > 0.01
            
            if strong_move:
                # Determinar tipo de order block
                if closes[i] > opens[i]:  # Bullish OB
                    ob_type = "bullish"
                    ob_high = highs[i]
                    ob_low = opens[i]
                else:  # Bearish OB
                    ob_type = "bearish"
                    ob_high = opens[i]
                    ob_low = lows[i]
                
                order_blocks.append({
                    'type': ob_type,
                    'high': ob_high,
                    'low': ob_low,
                    'volume': current_volume,
                    'strength': min(1, price_move * 50),
                    'age': len(closes) - i
                })
        
        # Mantener solo los más relevantes
        order_blocks.sort(key=lambda x: x['strength'], reverse=True)
        return order_blocks[:5]

    def _identify_fair_value_gaps(self, highs: List[float], lows: List[float], 
                                opens: List[float], closes: List[float]) -> List[Dict[str, Any]]:
        """Identificar Fair Value Gaps (gaps en el precio)"""
        
        fair_value_gaps = []
        
        for i in range(2, len(closes)):
            # FVG = gap entre candles consecutivos
            prev_high = highs[i-1]
            prev_low = lows[i-1]
            current_high = highs[i]
            current_low = lows[i]
            
            # Bullish FVG: current low > previous high
            if current_low > prev_high:
                gap_size = current_low - prev_high
                gap_pct = gap_size / closes[i-1]
                
                if gap_pct > 0.002:  # Gap > 0.2%
                    fair_value_gaps.append({
                        'type': 'bullish',
                        'high': current_low,
                        'low': prev_high,
                        'size': gap_size,
                        'size_pct': gap_pct,
                        'age': len(closes) - i
                    })
            
            # Bearish FVG: current high < previous low
            elif current_high < prev_low:
                gap_size = prev_low - current_high
                gap_pct = gap_size / closes[i-1]
                
                if gap_pct > 0.002:
                    fair_value_gaps.append({
                        'type': 'bearish',
                        'high': prev_low,
                        'low': current_high,
                        'size': gap_size,
                        'size_pct': gap_pct,
                        'age': len(closes) - i
                    })
        
        # Ordenar por tamaño (gaps más grandes primero)
        fair_value_gaps.sort(key=lambda x: x['size_pct'], reverse=True)
        return fair_value_gaps[:3]

    def _detect_liquidity_sweep(self, highs: List[float], lows: List[float], 
                              closes: List[float], volumes: List[float]) -> bool:
        """Detectar Liquidity Sweep (barrido de liquidez)"""
        
        if len(closes) < 10:
            return False
        
        # Buscar sweeps recientes (últimas 5 barras)
        for i in range(len(closes) - 5, len(closes)):
            if i < 5:
                continue
                
            # Sweep of highs
            recent_highs = highs[i-5:i]
            resistance = max(recent_highs)
            
            if (highs[i] > resistance * 1.002 and  # Sweep resistance
                closes[i] < resistance and         # Fail to sustain
                volumes[i] > calculate_volume_sma(volumes[i-5:i], 5) * 1.3):  # Volume
                return True
            
            # Sweep of lows
            recent_lows = lows[i-5:i]
            support = min(recent_lows)
            
            if (lows[i] < support * 0.998 and     # Sweep support
                closes[i] > support and           # Fail to sustain
                volumes[i] > calculate_volume_sma(volumes[i-5:i], 5) * 1.3):
                return True
        
        return False

    def _analyze_institutional_footprint(self, opens: List[float], highs: List[float], 
                                       lows: List[float], closes: List[float], 
                                       volumes: List[float], 
                                       microstructure: Optional[MarketMicrostructure]) -> Tuple[float, float, str]:
        """Analizar huella institucional vs retail"""
        
        if len(closes) < 20:
            return 0.5, 0.5, "NEUTRAL"
        
        # Large Player Activity Score
        large_activity = 0.0
        
        # Factor 1: Volume patterns
        avg_volume = calculate_volume_sma(volumes, 20)
        recent_volume = sum(volumes[-5:]) / 5
        
        if recent_volume > avg_volume * 2:
            large_activity += 0.3
        
        # Factor 2: Price action vs volume divergences
        price_momentum = (closes[-1] - closes[-10]) / closes[-10]
        volume_momentum = (recent_volume - avg_volume) / avg_volume
        
        # Institucionales pueden mover precio con menos volumen (efficiency)
        if abs(price_momentum) > 0.02 and volume_momentum < 0.5:
            large_activity += 0.2
        
        # Factor 3: Microstructure evidence
        if microstructure and microstructure.institutional_footprint > 0.5:
            large_activity += microstructure.institutional_footprint * 0.3
        
        # Factor 4: Pattern sophistication
        sophisticated_patterns = 0
        
        # Check for complex patterns that retail typically doesn't create
        for i in range(5, len(closes)):
            # Absorption patterns
            if (volumes[i] > avg_volume * 2 and 
                abs(closes[i] - opens[i]) / opens[i] < 0.005):
                sophisticated_patterns += 1
        
        if sophisticated_patterns > 0:
            large_activity += min(0.2, sophisticated_patterns / 10)
        
        large_activity = min(1.0, large_activity)
        
        # Retail Sentiment Score (inverse relationship)
        retail_sentiment = 1 - large_activity
        
        # Smart Money Flow Direction
        if large_activity > 0.6:
            if price_momentum > 0:
                money_flow = "INFLOW"
            else:
                money_flow = "OUTFLOW"
        else:
            money_flow = "NEUTRAL"
        
        return large_activity, retail_sentiment, money_flow

    def _assess_trading_implications(self, manipulation_events: List[ManipulationEvent], 
                                   market_phase: MarketPhase, 
                                   large_activity: float) -> Tuple[float, float, str]:
        """Evaluar implicaciones para trading"""
        
        # Manipulation Risk
        high_risk_events = [e for e in manipulation_events 
                           if e.confidence > 0.7 and e.risk_level > 0.6]
        
        manipulation_risk = min(1.0, len(high_risk_events) / 3)
        
        # Add phase-based risk
        if market_phase in [MarketPhase.DISTRIBUTION, MarketPhase.ACCUMULATION]:
            manipulation_risk += 0.2  # Higher risk in transition phases
        
        manipulation_risk = min(1.0, manipulation_risk)
        
        # Trade Safety Score
        safety_score = 1.0 - manipulation_risk
        
        # Adjust for large player activity
        if large_activity > 0.7:
            safety_score *= 0.8  # Less safe when institutions are very active
        
        # Recommended Action
        if manipulation_risk > 0.7:
            recommended = "AVOID"
        elif manipulation_risk > 0.5:
            recommended = "CAUTION"
        elif manipulation_risk > 0.3:
            if market_phase == MarketPhase.MARKUP:
                recommended = "FOLLOW"  # Follow the trend in markup
            elif market_phase == MarketPhase.MARKDOWN:
                recommended = "FOLLOW"  # Follow the trend in markdown
            else:
                recommended = "FADE"    # Fade in other phases
        else:
            recommended = "NEUTRAL"
        
        return manipulation_risk, safety_score, recommended

    def _generate_fallback_analysis(self, symbol: str, timeframe: str) -> InstitutionalAnalysis:
        """Generar análisis fallback cuando no hay datos suficientes"""
        
        return InstitutionalAnalysis(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=datetime.utcnow().isoformat(),
            
            # Sin manipulación detectada
            manipulation_events=[],
            active_manipulations=[],
            
            # Wyckoff neutral
            market_phase=MarketPhase.SIDEWAYS,
            wyckoff_signals=["Insufficient data for analysis"],
            accumulation_distribution_line=0.0,
            
            # Smart Money neutral
            market_structure_break=False,
            change_of_character=False,
            order_blocks=[],
            fair_value_gaps=[],
            liquidity_sweep_detected=False,
            
            # Footprint neutral
            large_player_activity=0.5,
            retail_sentiment_score=0.5,
            smart_money_flow="NEUTRAL",
            
            # Trading neutral
            manipulation_risk=0.3,  # Default moderate risk
            trade_safety_score=0.7,
            recommended_action="NEUTRAL"
        )


# Testing function
def test_institutional_detector():
    """Test del detector institucional"""
    print("🧪 Testing InstitutionalDetector...")
    
    detector = InstitutionalDetector()
    
    # Generar datos de prueba con patrones de manipulación
    import random
    n_periods = 100
    base_price = 50000
    
    opens = []
    highs = []
    lows = []
    closes = []
    volumes = []
    
    current_price = base_price
    
    for i in range(n_periods):
        # Generar OHLCV con algunos patrones de manipulación
        open_price = current_price + random.gauss(0, base_price * 0.002)
        
        # Simular stop hunt ocasional
        if random.random() < 0.05:  # 5% chance of stop hunt
            # Stop hunt pattern
            high = open_price * (1 + random.uniform(0.01, 0.02))  # Spike up
            low = open_price * (1 - random.uniform(0.002, 0.005))
            close = open_price + random.gauss(0, open_price * 0.003)
            volume = random.uniform(3000, 8000)  # High volume
        else:
            # Normal price action
            change = random.gauss(0, base_price * 0.005)
            close = max(base_price * 0.5, open_price + change)
            high = max(open_price, close) + random.uniform(0, close * 0.003)
            low = min(open_price, close) - random.uniform(0, close * 0.003)
            volume = random.uniform(1000, 3000)
        
        opens.append(open_price)
        highs.append(high)
        lows.append(low)
        closes.append(close)
        volumes.append(volume)
        
        current_price = close
    
    # Analizar actividad institucional
    result = detector.analyze_institutional_activity(
        "BTCUSDT", "5m", opens, highs, lows, closes, volumes
    )
    
    print(f"🏛️ Análisis Institucional {result.symbol} ({result.timeframe}):")
    print(f"  Eventos de Manipulación: {len(result.manipulation_events)}")
    print(f"  Manipulaciones Activas: {[m.value for m in result.active_manipulations]}")
    print(f"  Fase Wyckoff: {result.market_phase.value}")
    print(f"  Smart Money Flow: {result.smart_money_flow}")
    print(f"  Actividad Institucional: {result.large_player_activity:.2%}")
    print(f"  Sentimiento Retail: {result.retail_sentiment_score:.2%}")
    print(f"  Riesgo Manipulación: {result.manipulation_risk:.2%}")
    print(f"  Score Seguridad: {result.trade_safety_score:.2%}")
    print(f"  Acción Recomendada: {result.recommended_action}")
    
    if result.manipulation_events:
        print("\n  📋 Eventos Detectados:")
        for event in result.manipulation_events[:3]:  # Top 3
            print(f"    - {event.type.value}: {event.description} (Conf: {event.confidence:.0%})")
    
    print("✅ InstitutionalDetector test completado")

if __name__ == "__main__":
    test_institutional_detector()