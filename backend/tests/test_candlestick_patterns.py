# test_candlestick_patterns.py

from data.binance_data import get_ohlcv_data
from analytics.candlestick_patterns import CandlestickPatternDetector
import pandas as pd

# Configuración
symbol = "BTCUSDT"
interval = "15m"
limit = 100

print(f"🔍 Obteniendo velas de Binance para {symbol} [{interval}]...")
df = get_ohlcv_data(symbol, interval, limit=limit)

if df.empty:
    print("⚠️ No se pudieron obtener datos.")
    exit()

# Detectar patrones
print(f"🔎 Aplicando detección de patrones de velas...")
detector = CandlestickPatternDetector(df)
patterns_df = detector.detect()

# Mostrar últimos patrones detectados
print("\n📊 Últimos patrones detectados:")
last_patterns = patterns_df.dropna(subset=["pattern"]).tail(10)
if last_patterns.empty:
    print("⚠️ No se detectaron patrones en las últimas velas.")
else:
    for index, row in last_patterns.iterrows():
        print(f"{index} | {row['pattern']} | Close: {row['close']}")