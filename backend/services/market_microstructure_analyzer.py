#!/usr/bin/env python3
"""
🔬 MarketMicrostructureAnalyzer - Análisis Profesional de Microestructura de Mercado
Análisis order flow, volume profile, delta analysis nivel institucional

Eduard Guzmán - InteliBotX - Smart Scalper Pro
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum
import logging

# Technical analysis functions
from services.ta_alternative import (
    calculate_rsi, calculate_ema, calculate_sma, calculate_atr,
    calculate_volume_sma, detect_volume_spike
)

logger = logging.getLogger(__name__)

class VolumeType(Enum):
    """Tipos de volumen para análisis delta"""
    BUYING_PRESSURE = "buying_pressure"
    SELLING_PRESSURE = "selling_pressure"
    NEUTRAL = "neutral"
    CLIMAX = "climax"

class LiquidityZoneType(Enum):
    """Tipos de zonas de liquidez"""
    SUPPORT = "support"
    RESISTANCE = "resistance"
    ORDER_BLOCK = "order_block"
    FAIR_VALUE_GAP = "fair_value_gap"
    LIQUIDITY_POOL = "liquidity_pool"

@dataclass
class VolumeProfileLevel:
    """Nivel específico en el Volume Profile"""
    price: float
    volume: float
    volume_pct: float
    buying_volume: float
    selling_volume: float
    delta: float  # buying - selling
    is_high_volume_node: bool
    is_point_of_control: bool

@dataclass
class MarketMicrostructure:
    """Resultado completo del análisis de microestructura"""
    symbol: str
    timeframe: str
    timestamp: str
    
    # Volume Profile Analysis
    point_of_control: float  # POC - precio con mayor volumen
    value_area_high: float   # VAH - 70% superior del volumen
    value_area_low: float    # VAL - 70% inferior del volumen
    volume_profile_levels: List[VolumeProfileLevel]
    
    # Order Flow Analysis
    delta_cumulative: float  # Buying pressure - Selling pressure acumulado
    delta_current: float     # Delta del período actual
    order_flow_imbalance: float  # Imbalance score (-1 to 1)
    dominant_side: VolumeType
    
    # Liquidity Analysis
    liquidity_zones: List[Dict[str, Any]]  # Support/Resistance con fuerza
    absorption_levels: List[float]  # Niveles donde se absorbe presión
    stop_clusters: List[float]     # Clusters de stop loss probables
    
    # Market Efficiency
    bid_ask_spread_impact: float   # Impacto spread en scalping
    market_depth_score: float     # Profundidad de mercado (0-1)
    liquidity_score: float        # Score general de liquidez (0-1)
    
    # Manipulation Indicators
    volume_anomaly_score: float    # Detección volumen anómalo (0-1)
    price_action_divergence: float # Divergencia precio vs volumen
    institutional_footprint: float # Huellas institucionales (0-1)

class MarketMicrostructureAnalyzer:
    """Analizador profesional de microestructura de mercado"""
    
    def __init__(self, lookback_periods: int = 100):
        self.lookback_periods = lookback_periods
        self.volume_profile_bins = 50  # Resolución del volume profile
        self.value_area_percentage = 0.70  # 70% del volumen para value area
        
        logger.info("🔬 MarketMicrostructureAnalyzer inicializado (Nivel Profesional)")

    def analyze_market_microstructure(self, symbol: str, timeframe: str,
                                    highs: List[float], lows: List[float],
                                    closes: List[float], volumes: List[float],
                                    opens: Optional[List[float]] = None) -> MarketMicrostructure:
        """
        Análisis completo de microestructura de mercado
        
        Args:
            symbol: Par de trading
            timeframe: Temporalidad (1m, 5m, 15m)
            highs, lows, closes, volumes: Datos OHLCV
            opens: Precios de apertura (opcional)
            
        Returns:
            MarketMicrostructure con análisis completo
        """
        try:
            if len(closes) < self.lookback_periods:
                return self._generate_fallback_microstructure(symbol, timeframe, closes[-1] if closes else 0)
            
            # Usar opens si están disponibles, sino aproximar
            if opens is None:
                opens = [closes[0]] + closes[:-1]  # Open[i] ≈ Close[i-1]
            
            # 1. Volume Profile Analysis
            poc, vah, val, volume_levels = self._analyze_volume_profile(highs, lows, closes, volumes)
            
            # 2. Order Flow Analysis  
            delta_cum, delta_curr, imbalance, dominant = self._analyze_order_flow(
                opens, highs, lows, closes, volumes
            )
            
            # 3. Liquidity Analysis
            liquidity_zones = self._identify_liquidity_zones(highs, lows, closes, volumes)
            absorption_levels = self._find_absorption_levels(closes, volumes)
            stop_clusters = self._identify_stop_clusters(highs, lows, closes)
            
            # 4. Market Efficiency Metrics
            spread_impact = self._calculate_spread_impact(highs, lows, closes)
            depth_score = self._calculate_market_depth_score(volumes)
            liquidity_score = self._calculate_liquidity_score(highs, lows, closes, volumes)
            
            # 5. Manipulation Detection
            volume_anomaly = self._detect_volume_anomalies(volumes)
            price_divergence = self._detect_price_action_divergence(closes, volumes)
            institutional_print = self._detect_institutional_footprint(
                opens, highs, lows, closes, volumes
            )
            
            return MarketMicrostructure(
                symbol=symbol,
                timeframe=timeframe,
                timestamp=datetime.utcnow().isoformat(),
                
                # Volume Profile
                point_of_control=poc,
                value_area_high=vah,
                value_area_low=val,
                volume_profile_levels=volume_levels,
                
                # Order Flow
                delta_cumulative=delta_cum,
                delta_current=delta_curr,
                order_flow_imbalance=imbalance,
                dominant_side=dominant,
                
                # Liquidity
                liquidity_zones=liquidity_zones,
                absorption_levels=absorption_levels,
                stop_clusters=stop_clusters,
                
                # Market Efficiency
                bid_ask_spread_impact=spread_impact,
                market_depth_score=depth_score,
                liquidity_score=liquidity_score,
                
                # Manipulation
                volume_anomaly_score=volume_anomaly,
                price_action_divergence=price_divergence,
                institutional_footprint=institutional_print
            )
            
        except Exception as e:
            logger.error(f"❌ Error en análisis microestructura {symbol}: {e}")
            return self._generate_fallback_microstructure(symbol, timeframe, closes[-1] if closes else 0)

    def _analyze_volume_profile(self, highs: List[float], lows: List[float], 
                              closes: List[float], volumes: List[float]) -> Tuple[float, float, float, List[VolumeProfileLevel]]:
        """Análisis Volume Profile profesional"""
        
        # Determinar rango de precios para bins
        price_min = min(lows[-self.lookback_periods:])
        price_max = max(highs[-self.lookback_periods:])
        price_range = price_max - price_min
        
        if price_range == 0:
            current_price = closes[-1]
            return current_price, current_price, current_price, []
        
        # Crear bins de precio
        bin_size = price_range / self.volume_profile_bins
        bins = [price_min + i * bin_size for i in range(self.volume_profile_bins + 1)]
        
        # Inicializar estructura de datos
        volume_at_price = {}
        buying_volume = {}
        selling_volume = {}
        
        # Procesar cada período
        for i in range(max(0, len(closes) - self.lookback_periods), len(closes)):
            high = highs[i]
            low = lows[i]
            close = closes[i]
            volume = volumes[i]
            
            # Aproximar distribución de volumen en el rango H-L
            if high == low:  # Evitar división por cero
                price_levels = [close]
                volume_per_level = [volume]
            else:
                # Distribución triangular centrada en close
                num_levels = min(10, max(1, int((high - low) / (price_range / 100))))
                price_levels = np.linspace(low, high, num_levels)
                
                # Más volumen cerca del close (distribución triangular)
                distances = np.abs(price_levels - close)
                weights = 1 / (distances + 1e-8)  # Evitar división por cero
                weights = weights / np.sum(weights)
                volume_per_level = volume * weights
            
            # Clasificar buying/selling basado en posición del close en el rango
            if high != low:
                close_position = (close - low) / (high - low)  # 0 = low, 1 = high
            else:
                close_position = 0.5
            
            # Distribución buying/selling
            buying_ratio = close_position  # Más buying si close cerca del high
            selling_ratio = 1 - close_position
            
            # Asignar volumen a bins
            for price, vol in zip(price_levels, volume_per_level):
                # Encontrar bin correspondiente
                bin_idx = min(len(bins) - 2, max(0, int((price - price_min) / bin_size)))
                bin_price = bins[bin_idx] + bin_size / 2  # Centro del bin
                
                if bin_price not in volume_at_price:
                    volume_at_price[bin_price] = 0
                    buying_volume[bin_price] = 0
                    selling_volume[bin_price] = 0
                
                volume_at_price[bin_price] += vol
                buying_volume[bin_price] += vol * buying_ratio
                selling_volume[bin_price] += vol * selling_ratio
        
        if not volume_at_price:
            current_price = closes[-1]
            return current_price, current_price, current_price, []
        
        # Calcular Point of Control (POC)
        poc_price = max(volume_at_price.keys(), key=lambda k: volume_at_price[k])
        
        # Calcular Value Area (70% del volumen)
        total_volume = sum(volume_at_price.values())
        target_volume = total_volume * self.value_area_percentage
        
        # Ordenar por volumen descendente
        sorted_prices = sorted(volume_at_price.keys(), key=lambda k: volume_at_price[k], reverse=True)
        
        value_area_prices = []
        accumulated_volume = 0
        
        for price in sorted_prices:
            value_area_prices.append(price)
            accumulated_volume += volume_at_price[price]
            if accumulated_volume >= target_volume:
                break
        
        vah = max(value_area_prices) if value_area_prices else poc_price
        val = min(value_area_prices) if value_area_prices else poc_price
        
        # Crear VolumeProfileLevel objects
        volume_levels = []
        max_volume = max(volume_at_price.values()) if volume_at_price else 1
        
        for price in sorted(volume_at_price.keys()):
            volume = volume_at_price[price]
            volume_pct = volume / total_volume * 100
            buy_vol = buying_volume.get(price, 0)
            sell_vol = selling_volume.get(price, 0)
            delta = buy_vol - sell_vol
            
            is_hvn = volume > max_volume * 0.3  # High Volume Node
            is_poc = price == poc_price
            
            volume_levels.append(VolumeProfileLevel(
                price=price,
                volume=volume,
                volume_pct=volume_pct,
                buying_volume=buy_vol,
                selling_volume=sell_vol,
                delta=delta,
                is_high_volume_node=is_hvn,
                is_point_of_control=is_poc
            ))
        
        return poc_price, vah, val, volume_levels

    def _analyze_order_flow(self, opens: List[float], highs: List[float], 
                          lows: List[float], closes: List[float], 
                          volumes: List[float]) -> Tuple[float, float, float, VolumeType]:
        """Análisis de Order Flow y Delta"""
        
        deltas = []
        
        for i in range(1, len(closes)):
            open_price = opens[i]
            high = highs[i]
            low = lows[i]
            close = closes[i]
            volume = volumes[i]
            
            # Aproximar buying/selling pressure
            if high != low:
                # Posición del close en el rango
                close_position = (close - low) / (high - low)
                
                # Buying pressure si close cerca del high
                buying_pressure = volume * close_position
                selling_pressure = volume * (1 - close_position)
            else:
                # Sin rango, usar comparación con apertura
                if close > open_price:
                    buying_pressure = volume * 0.7
                    selling_pressure = volume * 0.3
                elif close < open_price:
                    buying_pressure = volume * 0.3
                    selling_pressure = volume * 0.7
                else:
                    buying_pressure = volume * 0.5
                    selling_pressure = volume * 0.5
            
            delta = buying_pressure - selling_pressure
            deltas.append(delta)
        
        if not deltas:
            return 0.0, 0.0, 0.0, VolumeType.NEUTRAL
        
        # Delta acumulado
        delta_cumulative = sum(deltas)
        
        # Delta actual (últimos períodos)
        recent_periods = min(10, len(deltas))
        delta_current = sum(deltas[-recent_periods:]) / recent_periods
        
        # Imbalance score
        total_volume_recent = sum(volumes[-recent_periods:])
        if total_volume_recent > 0:
            imbalance = abs(delta_current) / (total_volume_recent / recent_periods)
            imbalance = min(1.0, imbalance)  # Normalizar 0-1
        else:
            imbalance = 0.0
        
        # Determinar lado dominante
        if abs(delta_current) < total_volume_recent * 0.1:
            dominant = VolumeType.NEUTRAL
        elif delta_current > 0:
            if imbalance > 0.5:
                dominant = VolumeType.CLIMAX if delta_current > total_volume_recent * 0.3 else VolumeType.BUYING_PRESSURE
            else:
                dominant = VolumeType.BUYING_PRESSURE
        else:
            if imbalance > 0.5:
                dominant = VolumeType.CLIMAX if abs(delta_current) > total_volume_recent * 0.3 else VolumeType.SELLING_PRESSURE
            else:
                dominant = VolumeType.SELLING_PRESSURE
        
        return delta_cumulative, delta_current, imbalance, dominant

    def _identify_liquidity_zones(self, highs: List[float], lows: List[float], 
                                closes: List[float], volumes: List[float]) -> List[Dict[str, Any]]:
        """Identificar zonas de liquidez (soporte/resistencia con volumen)"""
        
        liquidity_zones = []
        lookback = min(50, len(closes))
        
        if lookback < 10:
            return liquidity_zones
        
        # Identificar pivots significativos
        for i in range(2, lookback - 2):
            idx = len(closes) - lookback + i
            high = highs[idx]
            low = lows[idx]
            volume = volumes[idx]
            
            # Pivot High (resistencia potencial)
            if (highs[idx-2] < high and highs[idx-1] < high and 
                highs[idx+1] < high and highs[idx+2] < high):
                
                # Calcular fuerza basada en volumen y retests
                strength = self._calculate_level_strength(high, highs, lows, closes, volumes, idx)
                
                if strength > 0.3:  # Filtro de calidad
                    liquidity_zones.append({
                        'type': LiquidityZoneType.RESISTANCE,
                        'price': high,
                        'strength': strength,
                        'volume_confirmation': volume > calculate_volume_sma(volumes[:idx+1], 20),
                        'age': len(closes) - idx,
                        'retest_count': self._count_retests(high, closes[idx:], tolerance=0.001)
                    })
            
            # Pivot Low (soporte potencial)  
            if (lows[idx-2] > low and lows[idx-1] > low and 
                lows[idx+1] > low and lows[idx+2] > low):
                
                strength = self._calculate_level_strength(low, highs, lows, closes, volumes, idx)
                
                if strength > 0.3:
                    liquidity_zones.append({
                        'type': LiquidityZoneType.SUPPORT,
                        'price': low,
                        'strength': strength,
                        'volume_confirmation': volume > calculate_volume_sma(volumes[:idx+1], 20),
                        'age': len(closes) - idx,
                        'retest_count': self._count_retests(low, closes[idx:], tolerance=0.001)
                    })
        
        # Ordenar por fuerza descendente
        liquidity_zones.sort(key=lambda x: x['strength'], reverse=True)
        
        # Retornar top zones
        return liquidity_zones[:10]

    def _find_absorption_levels(self, closes: List[float], volumes: List[float]) -> List[float]:
        """Encontrar niveles donde se absorbe presión de compra/venta"""
        
        absorption_levels = []
        lookback = min(30, len(closes))
        
        for i in range(lookback, len(closes)):
            # Buscar patrones de absorción
            price_range = closes[i-5:i+1]
            volume_range = volumes[i-5:i+1]
            
            # Criterios de absorción:
            # 1. Volumen alto
            # 2. Precio se mantiene en rango estrecho a pesar del volumen
            avg_volume = sum(volume_range) / len(volume_range)
            max_volume = max(volume_range)
            price_volatility = max(price_range) - min(price_range)
            avg_price = sum(price_range) / len(price_range)
            
            # Detección de absorción
            if (max_volume > avg_volume * 2 and  # Volumen elevado
                price_volatility < avg_price * 0.01):  # Precio estable
                
                absorption_levels.append(closes[i])
        
        # Eliminar duplicados cercanos
        absorption_levels = self._remove_nearby_levels(absorption_levels, tolerance=0.005)
        
        return absorption_levels

    def _identify_stop_clusters(self, highs: List[float], lows: List[float], 
                              closes: List[float]) -> List[float]:
        """Identificar clusters probables de stop loss"""
        
        stop_clusters = []
        
        # Stops típicamente se colocan:
        # 1. Debajo de soportes recientes
        # 2. Encima de resistencias recientes  
        # 3. En números redondos
        # 4. En niveles técnicos obvios
        
        lookback = min(20, len(closes))
        
        for i in range(lookback, len(closes)):
            current_high = highs[i]
            current_low = lows[i]
            
            # Stop loss típico debajo de mínimos recientes (para longs)
            recent_low = min(lows[i-lookback:i])
            if recent_low < current_low:
                stop_level = recent_low * 0.999  # Ligeramente debajo
                stop_clusters.append(stop_level)
            
            # Stop loss típico encima de máximos recientes (para shorts)
            recent_high = max(highs[i-lookback:i])
            if recent_high > current_high:
                stop_level = recent_high * 1.001  # Ligeramente encima
                stop_clusters.append(stop_level)
        
        # Añadir números redondos cercanos al precio actual
        current_price = closes[-1]
        round_numbers = self._find_round_numbers(current_price)
        stop_clusters.extend(round_numbers)
        
        # Eliminar duplicados y mantener solo los más relevantes
        stop_clusters = self._remove_nearby_levels(stop_clusters, tolerance=0.01)
        
        return stop_clusters[:15]  # Top 15 clusters

    def _calculate_spread_impact(self, highs: List[float], lows: List[float], 
                               closes: List[float]) -> float:
        """Calcular impacto estimado del spread en scalping"""
        
        if len(closes) < 10:
            return 0.001  # 0.1% default
        
        # Aproximar spread basado en volatilidad intrabar
        spreads = []
        for i in range(len(highs)):
            if highs[i] != lows[i]:
                # Spread típico es fracción del rango H-L
                estimated_spread = (highs[i] - lows[i]) * 0.1  # 10% del rango
                spread_pct = estimated_spread / closes[i]
                spreads.append(spread_pct)
        
        if spreads:
            avg_spread = sum(spreads) / len(spreads)
            return min(0.01, max(0.0001, avg_spread))  # 0.01% - 1%
        
        return 0.001

    def _calculate_market_depth_score(self, volumes: List[float]) -> float:
        """Calcular score de profundidad de mercado basado en volumen"""
        
        if len(volumes) < 10:
            return 0.5
        
        # Análisis de consistencia de volumen
        recent_volumes = volumes[-20:]
        avg_volume = sum(recent_volumes) / len(recent_volumes)
        volume_std = np.std(recent_volumes)
        
        # Score basado en consistencia (menos volatilidad = mejor profundidad)
        if avg_volume > 0:
            consistency_score = 1 - min(1, volume_std / avg_volume)
        else:
            consistency_score = 0.5
        
        # Score basado en volumen absoluto (normalizado)
        volume_score = min(1, avg_volume / (sum(volumes) / len(volumes)))
        
        # Score combinado
        depth_score = (consistency_score * 0.6 + volume_score * 0.4)
        
        return max(0, min(1, depth_score))

    def _calculate_liquidity_score(self, highs: List[float], lows: List[float], 
                                 closes: List[float], volumes: List[float]) -> float:
        """Score general de liquidez del mercado"""
        
        if len(closes) < 20:
            return 0.5
        
        # Factores de liquidez:
        # 1. Volumen promedio
        # 2. Spread estimado (menor = mejor)
        # 3. Volatilidad (moderada es mejor)
        # 4. Consistencia de precios
        
        avg_volume = sum(volumes[-20:]) / min(20, len(volumes))
        spread_impact = self._calculate_spread_impact(highs[-20:], lows[-20:], closes[-20:])
        
        # Volatilidad (ATR normalizado)
        atr = calculate_atr(highs[-20:], lows[-20:], closes[-20:], 14)
        volatility_score = min(1, atr / closes[-1] * 100)  # Normalizar
        
        # Score combinado
        volume_component = min(1, avg_volume / 1000)  # Normalizar volumen
        spread_component = 1 - min(1, spread_impact * 100)  # Menor spread = mejor
        volatility_component = 1 - min(1, volatility_score)  # Moderada volatilidad
        
        liquidity_score = (volume_component * 0.4 + 
                          spread_component * 0.3 + 
                          volatility_component * 0.3)
        
        return max(0, min(1, liquidity_score))

    def _detect_volume_anomalies(self, volumes: List[float]) -> float:
        """Detectar anomalías de volumen (posible manipulación)"""
        
        if len(volumes) < 20:
            return 0.0
        
        recent_volumes = volumes[-10:]
        baseline_volumes = volumes[-30:-10] if len(volumes) >= 30 else volumes[:-10]
        
        if not baseline_volumes:
            return 0.0
        
        recent_avg = sum(recent_volumes) / len(recent_volumes)
        baseline_avg = sum(baseline_volumes) / len(baseline_volumes)
        
        if baseline_avg > 0:
            volume_ratio = recent_avg / baseline_avg
            
            # Anomalía si volumen > 3x normal o < 0.3x normal
            if volume_ratio > 3:
                anomaly_score = min(1, (volume_ratio - 3) / 7)  # Max at 10x
            elif volume_ratio < 0.3:
                anomaly_score = min(1, (0.3 - volume_ratio) / 0.3)
            else:
                anomaly_score = 0
            
            return anomaly_score
        
        return 0.0

    def _detect_price_action_divergence(self, closes: List[float], volumes: List[float]) -> float:
        """Detectar divergencia entre precio y volumen"""
        
        if len(closes) < 20:
            return 0.0
        
        # Correlación precio vs volumen en ventana móvil
        window = 10
        price_changes = []
        volume_changes = []
        
        for i in range(window, len(closes)):
            price_change = (closes[i] - closes[i-window]) / closes[i-window]
            volume_change = (volumes[i] - volumes[i-window]) / max(volumes[i-window], 1)
            
            price_changes.append(price_change)
            volume_changes.append(volume_change)
        
        if len(price_changes) > 5:
            # Calcular correlación simple
            correlation = np.corrcoef(price_changes, volume_changes)[0, 1]
            
            # Divergencia = baja correlación (esperamos correlación positiva)
            if np.isnan(correlation):
                divergence = 0.5
            else:
                # Convertir correlación (-1 a 1) a divergencia (0 a 1)
                divergence = max(0, 1 - abs(correlation))
            
            return min(1, divergence)
        
        return 0.0

    def _detect_institutional_footprint(self, opens: List[float], highs: List[float], 
                                      lows: List[float], closes: List[float], 
                                      volumes: List[float]) -> float:
        """Detectar huellas de trading institucional"""
        
        if len(closes) < 10:
            return 0.0
        
        institutional_signals = []
        
        for i in range(1, len(closes)):
            signals = 0
            
            # 1. Volumen elevado con rango estrecho (absorción)
            volume_ratio = volumes[i] / max(calculate_volume_sma(volumes[:i], 20), 1)
            price_range = (highs[i] - lows[i]) / closes[i]
            
            if volume_ratio > 2 and price_range < 0.005:  # Alto volumen, rango estrecho
                signals += 1
            
            # 2. Reversión después de spike de volumen
            if i > 1:
                prev_volume_spike = volumes[i-1] > calculate_volume_sma(volumes[:i-1], 20) * 1.5
                price_reversal = (closes[i] - closes[i-2]) * (closes[i-1] - closes[i-2]) < 0
                
                if prev_volume_spike and price_reversal:
                    signals += 1
            
            # 3. Breakout falso con volumen (stop hunting)
            if i >= 5:
                recent_high = max(highs[i-5:i])
                recent_low = min(lows[i-5:i])
                
                # Breakout seguido de reversión
                breakout_up = highs[i] > recent_high and closes[i] < recent_high
                breakout_down = lows[i] < recent_low and closes[i] > recent_low
                high_volume = volumes[i] > calculate_volume_sma(volumes[:i], 20) * 1.5
                
                if (breakout_up or breakout_down) and high_volume:
                    signals += 1
            
            # 4. Patrones Wyckoff (simplificado)
            if i >= 10:
                # Test/Spring pattern
                recent_lows = lows[i-10:i]
                if len(recent_lows) > 5:
                    support_level = min(recent_lows[:-2])
                    if lows[i] < support_level and closes[i] > support_level:
                        if volumes[i] > calculate_volume_sma(volumes[:i], 20):
                            signals += 1
            
            institutional_signals.append(signals)
        
        if institutional_signals:
            # Score basado en frecuencia de señales institucionales
            avg_signals = sum(institutional_signals) / len(institutional_signals)
            max_possible_signals = 4  # Máximo señales por período
            
            footprint_score = min(1, avg_signals / max_possible_signals)
            return footprint_score
        
        return 0.0

    # Funciones auxiliares
    
    def _calculate_level_strength(self, level: float, highs: List[float], lows: List[float], 
                                closes: List[float], volumes: List[float], idx: int) -> float:
        """Calcular fuerza de un nivel de precio"""
        
        strength = 0.0
        
        # Fuerza basada en volumen en el nivel
        volume_strength = volumes[idx] / max(calculate_volume_sma(volumes[:idx+1], 20), 1)
        strength += min(1, volume_strength / 2) * 0.4
        
        # Fuerza basada en retests posteriores
        future_prices = closes[idx:]
        retest_count = self._count_retests(level, future_prices)
        strength += min(1, retest_count / 3) * 0.3
        
        # Fuerza basada en significancia del pivot
        if idx >= 5:
            price_context = highs[idx-5:idx+1] + lows[idx-5:idx+1]
            level_percentile = sum(1 for p in price_context if p < level) / len(price_context)
            # Niveles en extremos (0-20% o 80-100%) son más fuertes
            extremity = max(level_percentile, 1 - level_percentile)
            if extremity > 0.8:
                strength += 0.3
        
        return min(1, strength)

    def _count_retests(self, level: float, prices: List[float], tolerance: float = 0.002) -> int:
        """Contar cuántas veces se ha retesteado un nivel"""
        
        retests = 0
        for price in prices:
            if abs(price - level) / level <= tolerance:
                retests += 1
        
        return retests

    def _remove_nearby_levels(self, levels: List[float], tolerance: float = 0.005) -> List[float]:
        """Eliminar niveles muy cercanos entre sí"""
        
        if not levels:
            return []
        
        cleaned_levels = [levels[0]]
        
        for level in levels[1:]:
            is_unique = True
            for existing in cleaned_levels:
                if abs(level - existing) / existing <= tolerance:
                    is_unique = False
                    break
            
            if is_unique:
                cleaned_levels.append(level)
        
        return cleaned_levels

    def _find_round_numbers(self, price: float) -> List[float]:
        """Encontrar números redondos cercanos al precio"""
        
        round_numbers = []
        
        # Determinar magnitud del precio
        if price >= 1000:
            increments = [100, 250, 500]
        elif price >= 100:
            increments = [10, 25, 50]
        elif price >= 10:
            increments = [1, 2.5, 5]
        elif price >= 1:
            increments = [0.1, 0.25, 0.5]
        else:
            increments = [0.01, 0.025, 0.05]
        
        for increment in increments:
            # Números redondos cercanos
            base = int(price / increment) * increment
            round_numbers.extend([base, base + increment, base - increment])
        
        # Filtrar solo números cercanos al precio actual (±5%)
        nearby_rounds = [rn for rn in round_numbers 
                        if abs(rn - price) / price <= 0.05 and rn > 0]
        
        return list(set(nearby_rounds))  # Eliminar duplicados

    def _generate_fallback_microstructure(self, symbol: str, timeframe: str, 
                                        current_price: float) -> MarketMicrostructure:
        """Generar estructura fallback cuando no hay datos suficientes"""
        
        return MarketMicrostructure(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=datetime.utcnow().isoformat(),
            
            # Volume Profile básico
            point_of_control=current_price,
            value_area_high=current_price * 1.01,
            value_area_low=current_price * 0.99,
            volume_profile_levels=[],
            
            # Order Flow neutral
            delta_cumulative=0.0,
            delta_current=0.0,
            order_flow_imbalance=0.0,
            dominant_side=VolumeType.NEUTRAL,
            
            # Liquidez básica
            liquidity_zones=[],
            absorption_levels=[],
            stop_clusters=[],
            
            # Market efficiency default
            bid_ask_spread_impact=0.001,
            market_depth_score=0.5,
            liquidity_score=0.5,
            
            # Sin manipulación detectada
            volume_anomaly_score=0.0,
            price_action_divergence=0.0,
            institutional_footprint=0.0
        )

# Testing function
def test_market_microstructure():
    """Test del analizador de microestructura"""
    print("🧪 Testing MarketMicrostructureAnalyzer...")
    
    analyzer = MarketMicrostructureAnalyzer()
    
    # Generar datos de prueba
    import random
    n_periods = 100
    base_price = 50000
    
    opens = [base_price]
    highs = []
    lows = []
    closes = []
    volumes = []
    
    for i in range(n_periods):
        # Generar OHLCV realista
        open_price = opens[-1] if i > 0 else base_price
        change = random.gauss(0, base_price * 0.01)  # 1% volatilidad
        close = max(base_price * 0.5, open_price + change)
        
        high = max(open_price, close) + random.uniform(0, close * 0.005)
        low = min(open_price, close) - random.uniform(0, close * 0.005)
        volume = random.uniform(1000, 5000)
        
        opens.append(close)  # Next open = current close
        highs.append(high)
        lows.append(low)
        closes.append(close)
        volumes.append(volume)
    
    # Analizar microestructura
    result = analyzer.analyze_market_microstructure(
        "BTCUSDT", "5m", highs, lows, closes, volumes, opens[1:]
    )
    
    print(f"📊 Análisis para {result.symbol} ({result.timeframe}):")
    print(f"  POC: ${result.point_of_control:.2f}")
    print(f"  Value Area: ${result.value_area_low:.2f} - ${result.value_area_high:.2f}")
    print(f"  Order Flow Delta: {result.delta_current:.2f} ({result.dominant_side.value})")
    print(f"  Liquidity Score: {result.liquidity_score:.2%}")
    print(f"  Institutional Footprint: {result.institutional_footprint:.2%}")
    print(f"  Volume Anomaly: {result.volume_anomaly_score:.2%}")
    print(f"  Zonas de Liquidez: {len(result.liquidity_zones)}")
    print(f"  Stop Clusters: {len(result.stop_clusters)}")
    
    print("✅ MarketMicrostructureAnalyzer test completado")

if __name__ == "__main__":
    test_market_microstructure()