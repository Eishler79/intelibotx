# tests/test_indicators.py

import pandas as pd
from analytics.indicator_engine import IndicatorEngine
from binance.client import Client
import datetime

def get_klines(symbol, interval, lookback=200):
    print(f"🔍 Obteniendo datos de Binance para {symbol} [{interval}]...")
    client = Client()
    klines = client.get_klines(symbol=symbol, interval=interval, limit=lookback)
    df = pd.DataFrame(klines, columns=[
        "timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_asset_volume", "number_of_trades",
        "taker_buy_base_volume", "taker_buy_quote_volume", "ignore"
    ])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
    df.set_index("timestamp", inplace=True)
    df = df[["open", "high", "low", "close", "volume"]].astype(float)
    print(f"✅ Datos cargados: {len(df)} velas\n")
    return df

def main():
    symbol = "BTCUSDT"
    interval = Client.KLINE_INTERVAL_15MINUTE
    df = get_klines(symbol, interval)

    engine = IndicatorEngine(df)
    signals = engine.calculate_indicators()

    print("📊 Últimos datos con indicadores:")
    print(engine.df.tail(5)[[
        "close", "rsi", "macd", "macd_signal",
        "bb_upper", "bb_lower", "vwap", "adx"
    ]])

    print("\n📈 Interpretaciones técnicas:")
    for name, value in signals.items():
        print(f"- {name}: {value}")

if __name__ == "__main__":
    main()