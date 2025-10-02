#!/usr/bin/env python3
"""
🔬 MarketMicrostructureAnalyzer - Análisis real de microestructura
SPEC_REF: SMART_SCALPER_STRATEGY.md#market-microstructure
"""

from typing import List, Dict
from dataclasses import dataclass
from enum import Enum

class VolumeType(Enum):
    BUY = "buy"
    SELL = "sell"
    NEUTRAL = "neutral"

@dataclass
class MarketMicrostructure:
    point_of_control: float
    value_area_high: float
    value_area_low: float
    dominant_side: VolumeType
    # SPEC_REF: GUARDRAILS.md P8 + ERROR #3 Resolution
    volume_anomaly_score: float = 0.0
    liquidity_score: float = 0.7
    order_flow_imbalance: float = 0.0
    institutional_footprint: float = 0.4

class MarketMicrostructureAnalyzer:
    def analyze_market_microstructure(self, symbol: str, timeframe: str, 
                                    highs: List[float], lows: List[float],
                                    closes: List[float], volumes: List[float]) -> MarketMicrostructure:
        """Análisis real de microestructura con datos de Binance"""
        
        # Volume Profile real
        volume_profile = {}
        for i in range(len(closes)):
            price = round((highs[i] + lows[i] + closes[i]) / 3, 2)
            volume_profile[price] = volume_profile.get(price, 0) + volumes[i]
        
        # Point of Control (precio con más volumen)
        poc = max(volume_profile.keys(), key=lambda x: volume_profile[x])
        
        # Value Area (70% del volumen)
        total_volume = sum(volume_profile.values())
        target_volume = total_volume * 0.70
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
            dominant_side = VolumeType.BUY
        elif sell_volume > buy_volume * 1.2:
            dominant_side = VolumeType.SELL
        else:
            dominant_side = VolumeType.NEUTRAL
            
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
        
        # Order Flow Imbalance: Diferencia real buy/sell volume
        total_volume = buy_volume + sell_volume if (buy_volume + sell_volume) > 0 else 1
        order_flow_imbalance = (buy_volume - sell_volume) / total_volume
        
        # Institutional Footprint: Detecta órdenes grandes vs promedio
        volume_threshold = volume_mean * 2  # Órdenes 2x promedio = institucionales
        institutional_trades = sum(1 for v in volumes if v > volume_threshold)
        institutional_footprint = institutional_trades / len(volumes) if volumes else 0
        
        return MarketMicrostructure(
            point_of_control=poc,
            value_area_high=va_high,
            value_area_low=va_low,
            dominant_side=dominant_side,
            volume_anomaly_score=volume_anomaly_score,
            liquidity_score=liquidity_score,
            order_flow_imbalance=order_flow_imbalance,
            institutional_footprint=institutional_footprint
        )