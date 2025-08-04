# utils/fetch_binance_data.py

import pandas as pd
from binance.client import Client
import os
from dotenv import load_dotenv

# Cargar las variables del entorno (.env)
load_dotenv()

api_key = os.getenv("BINANCE_API_KEY")
api_secret = os.getenv("BINANCE_API_SECRET")

client = Client(api_key, api_secret)

def fetch_klines(symbol="BTCUSDT", interval="15m", limit=500):
    """
    Descarga datos OHLC de Binance y los guarda como CSV.
    """
    print(f"Fetching {symbol} data...")
    klines = client.get_klines(symbol=symbol, interval=interval, limit=limit)

    df = pd.DataFrame(klines, columns=[
        "timestamp", "open", "high", "low", "close", "volume",
        "close_time", "quote_asset_volume", "number_of_trades",
        "taker_buy_base", "taker_buy_quote", "ignore"
    ])

    df["timestamp"] = pd.to_datetime(df["timestamp"], unit='ms')
    df.set_index("timestamp", inplace=True)
    df = df[["open", "high", "low", "close", "volume"]].astype(float)

    filename = f"data_{symbol}_{interval}.csv"
    df.to_csv(filename)
    print(f"Saved to {filename}")

if __name__ == "__main__":
    fetch_klines("BTCUSDT", "15m", 1000)