#!/usr/bin/env python3
"""
🔧 Alternative Technical Analysis - Railway Compatible
Implementaciones ligeras de indicadores técnicos sin TA-Lib
"""

import pandas as pd
import numpy as np
from typing import List, Tuple, Optional

def calculate_rsi(closes: List[float], period: int = 14) -> float:
    """Calcular RSI usando pandas (sin TA-Lib)"""
    if len(closes) < period + 1:
        return 50.0
    
    df = pd.DataFrame({'close': closes})
    delta = df['close'].diff()
    
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    
    return float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50.0

def calculate_sma(closes: List[float], period: int) -> float:
    """Calcular Simple Moving Average"""
    if len(closes) < period:
        return closes[-1] if closes else 0.0
    
    return float(np.mean(closes[-period:]))

def calculate_ema(closes: List[float], period: int) -> float:
    """Calcular Exponential Moving Average"""
    if len(closes) < period:
        return closes[-1] if closes else 0.0
    
    df = pd.DataFrame({'close': closes})
    ema = df['close'].ewm(span=period).mean()
    return float(ema.iloc[-1])

def calculate_atr(highs: List[float], lows: List[float], closes: List[float], period: int = 14) -> float:
    """Calcular Average True Range"""
    if len(highs) < period + 1:
        return 0.0
    
    df = pd.DataFrame({
        'high': highs,
        'low': lows,
        'close': closes
    })
    
    df['prev_close'] = df['close'].shift(1)
    df['tr1'] = df['high'] - df['low']
    df['tr2'] = abs(df['high'] - df['prev_close'])
    df['tr3'] = abs(df['low'] - df['prev_close'])
    
    df['true_range'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)
    atr = df['true_range'].rolling(window=period).mean()
    
    return float(atr.iloc[-1]) if not pd.isna(atr.iloc[-1]) else 0.0

def calculate_bollinger_bands(closes: List[float], period: int = 20, std_dev: int = 2) -> Tuple[float, float, float]:
    """Calcular Bandas de Bollinger (upper, middle, lower)"""
    if len(closes) < period:
        last_price = closes[-1] if closes else 0.0
        return last_price, last_price, last_price
    
    df = pd.DataFrame({'close': closes})
    
    middle = df['close'].rolling(window=period).mean()
    std = df['close'].rolling(window=period).std()
    
    upper = middle + (std * std_dev)
    lower = middle - (std * std_dev)
    
    return (
        float(upper.iloc[-1]) if not pd.isna(upper.iloc[-1]) else closes[-1],
        float(middle.iloc[-1]) if not pd.isna(middle.iloc[-1]) else closes[-1],
        float(lower.iloc[-1]) if not pd.isna(lower.iloc[-1]) else closes[-1]
    )

def calculate_volume_sma(volumes: List[float], period: int = 20) -> float:
    """Calcular promedio de volumen"""
    if len(volumes) < period:
        return volumes[-1] if volumes else 0.0
    
    return float(np.mean(volumes[-period:]))

def detect_volume_spike(volumes: List[float], threshold: float = 1.5, period: int = 20) -> Tuple[bool, float]:
    """Detectar pico de volumen"""
    if len(volumes) < period + 1:
        return False, 1.0
    
    current_volume = volumes[-1]
    avg_volume = calculate_volume_sma(volumes[:-1], period)
    
    if avg_volume == 0:
        return False, 1.0
    
    volume_ratio = current_volume / avg_volume
    spike_detected = volume_ratio >= threshold
    
    return spike_detected, volume_ratio

def get_rsi_status(rsi: float) -> str:
    """Obtener estado del RSI"""
    if rsi >= 70:
        return "OVERBOUGHT"
    elif rsi <= 30:
        return "OVERSOLD"
    elif rsi >= 60:
        return "BULLISH"
    elif rsi <= 40:
        return "BEARISH"
    else:
        return "NEUTRAL"

def calculate_price_change(closes: List[float], periods: int = 1) -> Tuple[float, float]:
    """Calcular cambio de precio (absoluto y porcentual)"""
    if len(closes) < periods + 1:
        return 0.0, 0.0
    
    current = closes[-1]
    previous = closes[-periods-1]
    
    absolute_change = current - previous
    percentage_change = (absolute_change / previous * 100) if previous != 0 else 0.0
    
    return absolute_change, percentage_change

# Test function
def test_ta_alternative():
    """Test de las funciones alternativas"""
    print("🧪 Testing TA Alternative functions...")
    
    # Data de prueba
    test_closes = [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113]
    test_highs = [c + 1 for c in test_closes]
    test_lows = [c - 1 for c in test_closes]
    test_volumes = [1000, 1200, 800, 1500, 2000, 1100, 1300, 1800, 900, 1600, 2200, 1000, 1400, 1900, 1050]
    
    # Tests
    rsi = calculate_rsi(test_closes)
    print(f"RSI: {rsi:.2f} ({get_rsi_status(rsi)})")
    
    sma = calculate_sma(test_closes, 10)
    print(f"SMA(10): {sma:.2f}")
    
    ema = calculate_ema(test_closes, 10)
    print(f"EMA(10): {ema:.2f}")
    
    atr = calculate_atr(test_highs, test_lows, test_closes)
    print(f"ATR: {atr:.2f}")
    
    upper, middle, lower = calculate_bollinger_bands(test_closes)
    print(f"Bollinger: Upper={upper:.2f}, Middle={middle:.2f}, Lower={lower:.2f}")
    
    vol_spike, vol_ratio = detect_volume_spike(test_volumes)
    print(f"Volume Spike: {vol_spike} (Ratio: {vol_ratio:.2f})")
    
    abs_change, pct_change = calculate_price_change(test_closes)
    print(f"Price Change: {abs_change:.2f} ({pct_change:.2f}%)")
    
    print("✅ All tests completed")

if __name__ == "__main__":
    test_ta_alternative()