"""
Servicio para obtener datos reales de mercado desde Binance
Integra precios en tiempo real para los bots de trading
"""

import httpx
import asyncio
import time
import os
from typing import Dict, List, Optional
from dotenv import load_dotenv
import pandas as pd
import numpy as np

load_dotenv()

class RealMarketDataService:
    """Servicio para datos de mercado reales desde Binance"""
    
    def __init__(self, use_testnet: bool = True):
        self.use_testnet = use_testnet
        self.base_url = "https://testnet.binance.vision" if use_testnet else "https://api.binance.com"
        self.api_key = os.getenv("BINANCE_TESTNET_API_KEY" if use_testnet else "BINANCE_API_KEY")
        
    async def get_current_price(self, symbol: str) -> float:
        """Obtener precio actual de un símbolo"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/v3/ticker/price", params={"symbol": symbol.upper()})
                response.raise_for_status()
                data = response.json()
                return float(data["price"])
        except Exception as e:
            print(f"❌ Error obteniendo precio {symbol}: {e}")
            return 0.0
    
    async def get_24hr_ticker(self, symbol: str) -> Dict:
        """Obtener estadísticas 24h de un símbolo"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/v3/ticker/24hr", params={"symbol": symbol.upper()})
                response.raise_for_status()
                data = response.json()
                return {
                    "symbol": data["symbol"],
                    "price": float(data["lastPrice"]),
                    "price_change": float(data["priceChange"]),
                    "price_change_percent": float(data["priceChangePercent"]),
                    "high_price": float(data["highPrice"]),
                    "low_price": float(data["lowPrice"]),
                    "volume": float(data["volume"]),
                    "quote_volume": float(data["quoteVolume"]),
                    "open_time": data["openTime"],
                    "close_time": data["closeTime"]
                }
        except Exception as e:
            print(f"❌ Error obteniendo ticker 24h {symbol}: {e}")
            return {}
    
    async def get_klines(self, symbol: str, interval: str = "15m", limit: int = 100) -> pd.DataFrame:
        """Obtener datos históricos (candlesticks) reales"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "symbol": symbol.upper(),
                    "interval": interval,
                    "limit": limit
                }
                response = await client.get(f"{self.base_url}/api/v3/klines", params=params)
                response.raise_for_status()
                data = response.json()
                
                # Convertir a DataFrame
                df = pd.DataFrame(data, columns=[
                    'timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'close_time', 'quote_volume', 'count', 'taker_buy_volume',
                    'taker_buy_quote_volume', 'ignore'
                ])
                
                # Convertir tipos de datos
                numeric_columns = ['open', 'high', 'low', 'close', 'volume', 'quote_volume']
                for col in numeric_columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                df.set_index('timestamp', inplace=True)
                
                # Retornar solo las columnas necesarias
                return df[['open', 'high', 'low', 'close', 'volume']]
                
        except Exception as e:
            print(f"❌ Error obteniendo klines {symbol}: {e}")
            return pd.DataFrame()
    
    async def get_order_book(self, symbol: str, limit: int = 20) -> Dict:
        """Obtener libro de órdenes actual"""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "symbol": symbol.upper(),
                    "limit": limit
                }
                response = await client.get(f"{self.base_url}/api/v3/depth", params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "symbol": symbol,
                    "bids": [[float(price), float(qty)] for price, qty in data["bids"]],
                    "asks": [[float(price), float(qty)] for price, qty in data["asks"]],
                    "best_bid": float(data["bids"][0][0]) if data["bids"] else 0,
                    "best_ask": float(data["asks"][0][0]) if data["asks"] else 0,
                    "spread": float(data["asks"][0][0]) - float(data["bids"][0][0]) if data["bids"] and data["asks"] else 0
                }
        except Exception as e:
            print(f"❌ Error obteniendo order book {symbol}: {e}")
            return {}
    
    async def get_market_data_for_bot(self, symbol: str, timeframe: str = "15m") -> Dict:
        """Obtener todos los datos necesarios para un bot"""
        try:
            # Obtener datos en paralelo
            tasks = [
                self.get_current_price(symbol),
                self.get_24hr_ticker(symbol),
                self.get_klines(symbol, timeframe, 100),
                self.get_order_book(symbol, 10)
            ]
            
            current_price, ticker_24h, klines_df, order_book = await asyncio.gather(*tasks)
            
            # Calcular indicadores básicos si tenemos datos
            indicators = {}
            if isinstance(klines_df, pd.DataFrame) and not klines_df.empty and len(klines_df) > 20:
                # RSI simplificado
                delta = klines_df['close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                
                # EMAs
                ema_9 = klines_df['close'].ewm(span=9).mean()
                ema_21 = klines_df['close'].ewm(span=21).mean()
                
                indicators = {
                    "rsi": rsi.iloc[-1] if not rsi.empty else 50,
                    "ema_9": ema_9.iloc[-1] if not ema_9.empty else current_price,
                    "ema_21": ema_21.iloc[-1] if not ema_21.empty else current_price,
                    "volume_avg": klines_df['volume'].tail(20).mean(),
                    "current_volume": klines_df['volume'].iloc[-1] if not klines_df.empty else 0
                }
            
            return {
                "symbol": symbol,
                "current_price": current_price,
                "ticker_24h": ticker_24h,
                "klines": klines_df.to_dict('records') if isinstance(klines_df, pd.DataFrame) and not klines_df.empty else [],
                "order_book": order_book,
                "indicators": indicators,
                "timestamp": int(time.time() * 1000),
                "data_source": "binance_testnet" if self.use_testnet else "binance_mainnet"
            }
            
        except Exception as e:
            print(f"❌ Error obteniendo datos completos para {symbol}: {e}")
            return {
                "symbol": symbol,
                "error": str(e),
                "timestamp": int(time.time() * 1000)
            }
    
    async def get_multiple_symbols_data(self, symbols: List[str], timeframe: str = "15m") -> Dict[str, Dict]:
        """Obtener datos para múltiples símbolos en paralelo"""
        try:
            tasks = [self.get_market_data_for_bot(symbol, timeframe) for symbol in symbols]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            return {
                symbols[i]: result if not isinstance(result, Exception) else {"error": str(result)}
                for i, result in enumerate(results)
            }
        except Exception as e:
            print(f"❌ Error obteniendo datos múltiples símbolos: {e}")
            return {}
    
    def calculate_volatility(self, klines_df, period: int = 20) -> float:
        """Calcular volatilidad basada en ATR"""
        if not isinstance(klines_df, pd.DataFrame) or klines_df.empty or len(klines_df) < period:
            return 0.0
        
        try:
            # True Range
            high_low = klines_df['high'] - klines_df['low']
            high_close_prev = np.abs(klines_df['high'] - klines_df['close'].shift(1))
            low_close_prev = np.abs(klines_df['low'] - klines_df['close'].shift(1))
            
            true_range = np.maximum(high_low, np.maximum(high_close_prev, low_close_prev))
            atr = true_range.rolling(window=period).mean().iloc[-1]
            
            # Volatilidad como porcentaje del precio
            current_price = klines_df['close'].iloc[-1]
            return (atr / current_price) * 100
            
        except Exception:
            return 0.0

# Instancia global del servicio
market_service = RealMarketDataService(use_testnet=True)

# Funciones de conveniencia
async def get_real_price(symbol: str) -> float:
    """Obtener precio real rápido"""
    return await market_service.get_current_price(symbol)

async def get_bot_market_data(symbol: str, timeframe: str = "15m") -> Dict:
    """Obtener todos los datos para un bot"""
    return await market_service.get_market_data_for_bot(symbol, timeframe)

# Testing function
async def test_real_data():
    """Función para probar el servicio"""
    print("🧪 Probando servicio de datos reales...")
    
    # Probar precio actual
    btc_price = await market_service.get_current_price("BTCUSDT")
    print(f"💰 BTC Price: ${btc_price:,.2f}")
    
    # Probar datos completos
    market_data = await market_service.get_market_data_for_bot("BTCUSDT")
    if "error" not in market_data:
        print(f"📊 Market Data: {market_data['ticker_24h']['price_change_percent']:.2f}% (24h)")
        print(f"📈 RSI: {market_data['indicators'].get('rsi', 0):.1f}")
        print(f"🔄 Volume: {market_data['indicators'].get('current_volume', 0):,.0f}")
    
    return market_data

if __name__ == "__main__":
    # Test cuando se ejecuta directamente
    asyncio.run(test_real_data())