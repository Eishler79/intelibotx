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
            
        return MarketMicrostructure(
            point_of_control=poc,
            value_area_high=va_high,
            value_area_low=va_low,
            dominant_side=dominant_side
        )