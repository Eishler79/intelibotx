#!/usr/bin/env python3
"""
🔬 MarketMicrostructureAnalyzer - Análisis real de microestructura
SPEC_REF: SMART_SCALPER_STRATEGY.md#market-microstructure
"""

from typing import List, Dict
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class VolumeType(Enum):
    BUYING_PRESSURE = "buying_pressure"
    SELLING_PRESSURE = "selling_pressure"
    BALANCED = "balanced"
    NEUTRAL = "balanced"  # Alias para compatibilidad retroactiva

@dataclass
class MarketMicrostructure:
    symbol: str
    timeframe: str
    timestamp: str
    point_of_control: float
    value_area_high: float
    value_area_low: float
    dominant_side: VolumeType
    volume_profile_levels: List[Dict[str, float]]
    delta_cumulative: float
    delta_current: float
    order_flow_imbalance: float
    liquidity_zones: List[Dict[str, float]]
    absorption_levels: List[Dict[str, float]]
    stop_clusters: List[Dict[str, float]]
    bid_ask_spread_impact: float
    market_depth_score: float
    liquidity_score: float
    volume_anomaly_score: float
    price_action_divergence: float
    institutional_footprint: float

class MarketMicrostructureAnalyzer:
    def analyze_market_microstructure(self, symbol: str, timeframe: str, 
                                    highs: List[float], lows: List[float],
                                    closes: List[float], volumes: List[float]) -> MarketMicrostructure:
        """Análisis real de microestructura con datos de Binance"""
        
        # Volume Profile real
        volume_profile: Dict[float, float] = {}
        for i in range(len(closes)):
            price = round((highs[i] + lows[i] + closes[i]) / 3, 2)
            volume_profile[price] = volume_profile.get(price, 0.0) + volumes[i]

        # Point of Control (precio con más volumen)
        poc = max(volume_profile.keys(), key=lambda x: volume_profile[x])
        
        # Value Area (70% del volumen)
        profile_volume_total = sum(volume_profile.values())
        target_volume = profile_volume_total * 0.70
        sorted_prices = sorted(volume_profile.keys(), key=lambda x: volume_profile[x], reverse=True)
        
        cumulative = 0
        value_prices = []
        for price in sorted_prices:
            cumulative += volume_profile[price]
            value_prices.append(price)
            if cumulative >= target_volume:
                break
        
        va_high = max(value_prices) if value_prices else poc * 1.01
        va_low = min(value_prices) if value_prices else poc * 0.99
        
        # Order Flow real
        buy_volume = sum(volumes[i] for i in range(1, len(closes)) if closes[i] > closes[i-1])
        sell_volume = sum(volumes[i] for i in range(1, len(closes)) if closes[i] < closes[i-1])
        
        if buy_volume > sell_volume * 1.2:
            dominant_side = VolumeType.BUYING_PRESSURE
        elif sell_volume > buy_volume * 1.2:
            dominant_side = VolumeType.SELLING_PRESSURE
        else:
            dominant_side = VolumeType.BALANCED
            
        # SPEC_REF: DL-001 Real Data Calculations - No hardcode
        # Volume Anomaly Score: Detecta manipulación por volumen anormal
        volume_mean = sum(volumes) / len(volumes) if volumes else 1
        volume_std = (sum((v - volume_mean) ** 2 for v in volumes) / len(volumes)) ** 0.5 if volumes else 1
        recent_volume = volumes[-3:] if len(volumes) >= 3 else volumes
        volume_anomaly_score = min(1.0, max(0.0, 
            sum(abs(v - volume_mean) / volume_std for v in recent_volume) / len(recent_volume) / 2
        ))
        
        # Liquidity Score: Basado en dispersión de precios (proxy bid-ask spread)
        price_range = max(highs) - min(lows) if highs and lows else 0.001
        current_price = closes[-1] if closes else 1
        spread_proxy = price_range / current_price if current_price > 0 else 0.001
        liquidity_score = max(0.1, min(1.0, 1 - (spread_proxy * 100)))  # Mejor liquidez = menor spread
        bid_ask_spread_impact = min(1.0, spread_proxy * 150)
        market_depth_score = max(0.0, min(1.0, 1 - bid_ask_spread_impact))

        # Order Flow Imbalance: Diferencia real buy/sell volume
        trade_volume_total = buy_volume + sell_volume if (buy_volume + sell_volume) > 0 else 1
        order_flow_imbalance = (buy_volume - sell_volume) / trade_volume_total

        # Delta calculations (última vela y acumulado)
        if len(closes) >= 2:
            last_delta = volumes[-1] if closes[-1] > closes[-2] else -volumes[-1]
        else:
            last_delta = 0.0
        delta_current = last_delta
        delta_cumulative = buy_volume - sell_volume

        # Volume profile breakdown for institutional features
        sorted_levels = sorted(volume_profile.items(), key=lambda item: item[1], reverse=True)
        volume_profile_levels = [
            {
                "price": price,
                "volume": volume,
                    "weight": (volume / profile_volume_total) if profile_volume_total else 0.0
            }
            for price, volume in sorted_levels[:10]
        ]

        # Liquidity zones → niveles de mayor interés institucional
        liquidity_zones = volume_profile_levels[:3]

        # Absorción: zonas donde el precio tuvo poca variación vs alto volumen
        absorption_levels = []
        for price, volume in sorted_levels[:5]:
            deviation = abs(price - poc) / poc if poc else 0.0
            if deviation < 0.01:
                absorption_levels.append({
                    "price": price,
                    "volume": volume,
                    "deviation": deviation
                })

        # Stop clusters: proximidad a extremos (va_high/va_low)
        stop_clusters = []
        for price, volume in sorted_levels[:5]:
            if price >= va_high * 0.995:
                stop_clusters.append({"price": price, "type": "high_liquidity"})
            elif price <= va_low * 1.005:
                stop_clusters.append({"price": price, "type": "low_liquidity"})

        # Institutional Footprint: Detecta órdenes grandes vs promedio
        volume_threshold = volume_mean * 2  # Órdenes 2x promedio = institucionales
        institutional_trades = sum(1 for v in volumes if v > volume_threshold)
        institutional_footprint = institutional_trades / len(volumes) if volumes else 0

        price_action_divergence = abs(closes[-1] - poc) / poc if poc else 0.0

        return MarketMicrostructure(
            symbol=symbol,
            timeframe=timeframe,
            timestamp=datetime.utcnow().isoformat(),
            point_of_control=poc,
            value_area_high=va_high,
            value_area_low=va_low,
            dominant_side=dominant_side,
            volume_profile_levels=volume_profile_levels,
            delta_cumulative=delta_cumulative,
            delta_current=delta_current,
            volume_anomaly_score=volume_anomaly_score,
            liquidity_zones=liquidity_zones,
            absorption_levels=absorption_levels,
            stop_clusters=stop_clusters,
            bid_ask_spread_impact=bid_ask_spread_impact,
            market_depth_score=market_depth_score,
            liquidity_score=liquidity_score,
            order_flow_imbalance=order_flow_imbalance,
            price_action_divergence=price_action_divergence,
            institutional_footprint=institutional_footprint
        )
