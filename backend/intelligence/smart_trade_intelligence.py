# intelligence/smart_trade_intelligence.py

from analytics.indicator_engine import TechnicalIndicatorEngine
from analytics.candlestick_patterns import CandlestickPatternDetector
from analytics.news_engine import NewsAnalyzer
from intelligence.smart_dashboard import (
    display_signal_summary,
    display_candlestick_pattern,
    display_fundamental_news,
)
from analytics.manipulation_detector import MarketManipulationDetector
import pandas as pd
from binance.client import Client
import os

class SmartTradeIntelligence:
    def __init__(self, symbol: str, interval: str = "15m", limit: int = 150):
        self.symbol = symbol.upper()
        self.interval = interval
        self.limit = limit
        self.client = Client(api_key=os.getenv("BINANCE_API_KEY"), api_secret=os.getenv("BINANCE_API_SECRET"))

    def fetch_candles(self) -> pd.DataFrame:
        klines = self.client.get_klines(symbol=self.symbol, interval=self.interval, limit=self.limit)
        df = pd.DataFrame(klines, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_asset_volume', 'number_of_trades',
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])
        df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)
        df = df.astype(float)
        return df

    def analyze(self, show_dashboard: bool = False, auto_decision: bool = False) -> dict:
        df = self.fetch_candles()
        print(f"\n🔍 Ejecutando análisis inteligente para {self.symbol} [{self.interval}]...\n")

        # 🛡️ Detección de manipulación institucional
        manipulation_detector = MarketManipulationDetector(df)
        manipulation_flags = manipulation_detector.detect()

        if manipulation_flags["total_flags"] >= 2:
            if show_dashboard:
                print("⚠️ Posible manipulación institucional detectada. Se recomienda NO operar.")
                print("⚙️ Señales detectadas:", [k for k, v in manipulation_flags.items() if v is True and k != "total_flags"])
            
            return {
                "technical_signals": {},
                "candlestick_pattern": None,
                "signal": "wait",
                "news_signals": [],
                "auto_decision": {
                    "action": "wait",
                    "reason": "Posible manipulación institucional detectada",
                    "score": 0,
                    "score_components": [
                        ("Manipulación: " + k, True)
                        for k, v in manipulation_flags.items()
                        if v is True and k != "total_flags"
                    ]
                }
            }

        # 🔎 Análisis técnico
        indicator_engine = TechnicalIndicatorEngine(df)
        indicators = indicator_engine.compute_indicators()

        pattern_detector = CandlestickPatternDetector(df)
        pattern_detector.detect()
        candlestick_pattern = pattern_detector.get_latest_pattern()
        signal_from_pattern = pattern_detector.get_latest_signal()

        if candlestick_pattern and ("BULL" in candlestick_pattern.upper() or "ENGULFING" in candlestick_pattern.upper()):
            signal = "long"
        else:
            signal = "short"

        # 🗞️ Análisis de noticias
        news_analyzer = NewsAnalyzer(symbols=[self.symbol])
        news_signals = news_analyzer.search_news()

        if show_dashboard:
            display_signal_summary(indicators)
            display_candlestick_pattern(candlestick_pattern, signal)
            display_fundamental_news(news_signals)

        # 🧠 Cálculo de score
        score_components = []
        score = 0
        try:
            rsi_value = float(indicators['RSI'].split('(')[-1].replace(')', ''))
            macd_signal = indicators['MACD'].startswith("Bullish")
            news_score = 1 if news_signals and any("positive" in s.lower() for s in news_signals) else 0

            score += 1 if rsi_value < 30 else 0
            score += 1 if macd_signal else 0
            score += 1 if signal_from_pattern == "long" and signal == "long" else 0
            score += news_score

            score_components = [
                ("RSI < 30", rsi_value < 30),
                ("MACD Bullish", macd_signal),
                ("Candle Long", signal_from_pattern == "long" and signal == "long"),
                ("News Positive", news_score == 1)
            ]
        except Exception:
            pass

        # ✅ Toma de decisión
        if score >= 3:
            action = "long"
            reason = "Score alto basado en señales técnicas y fundamentales"
        elif score <= 1:
            action = "short"
            reason = "Score bajo, señales bajistas predominantes"
        else:
            action = "wait"
            reason = "Score intermedio, sin confirmación"

        decision = {
            "action": action,
            "reason": reason,
            "score": score,
            "score_components": score_components
        }

        return {
            "technical_signals": indicators,
            "candlestick_pattern": candlestick_pattern,
            "signal": signal,
            "news_signals": news_signals,
            "auto_decision": decision
        }