# analytics/indicator_engine.py

import pandas as pd
import numpy as np
import ta
from typing import Dict, Any

MIN_REQUIRED_BARS = 50

class TechnicalIndicatorEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def compute_indicators(self) -> Dict[str, Any]:
        if len(self.df) < MIN_REQUIRED_BARS:
            return {
                "summary": "Insuficientes datos",
                "details": {},
                "score": 0
            }

        df = self.df.copy()
        signals = {}

        # RSI
        rsi = ta.momentum.RSIIndicator(close=df['close'], window=14).rsi()
        df['rsi'] = rsi
        signals['RSI'] = self._interpret_rsi(rsi.iloc[-1])

        # MACD
        macd = ta.trend.MACD(close=df['close'])
        df['macd'] = macd.macd()
        df['macd_signal'] = macd.macd_signal()
        df['macd_hist'] = macd.macd_diff()
        signals['MACD'] = self._interpret_macd(df['macd_hist'].iloc[-1])

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(close=df['close'])
        df['bb_upper'] = bb.bollinger_hband()
        df['bb_lower'] = bb.bollinger_lband()
        signals['Bollinger'] = self._interpret_bollinger(
            df['close'].iloc[-1],
            df['bb_upper'].iloc[-1],
            df['bb_lower'].iloc[-1]
        )

        # ADX
        adx = ta.trend.ADXIndicator(high=df['high'], low=df['low'], close=df['close'])
        df['adx'] = adx.adx()
        signals['ADX'] = f"{df['adx'].iloc[-1]:.2f}"

        # VWAP (manual)
        try:
            df['vwap'] = (df['close'] * df['volume']).cumsum() / df['volume'].cumsum()
            signals['VWAP'] = "Above Price" if df['close'].iloc[-1] > df['vwap'].iloc[-1] else "Below Price"
        except:
            df['vwap'] = None
            signals['VWAP'] = "N/A"

        self.df = df
        return {
            "summary": self._summarize_signals(signals),
            "details": signals,
            "score": self._calculate_score(signals)
        }

    def calculate_indicators(self):
        return self.compute_indicators()

    def _interpret_rsi(self, value: float) -> str:
        if value > 70:
            return f"Overbought ({value:.2f})"
        elif value < 30:
            return f"Oversold ({value:.2f})"
        else:
            return f"Neutral ({value:.2f})"

    def _interpret_macd(self, value: float) -> str:
        if value > 0:
            return f"Bullish ({value:.2f})"
        elif value < 0:
            return f"Bearish ({value:.2f})"
        else:
            return "Neutral (0)"

    def _interpret_bollinger(self, close: float, upper: float, lower: float) -> str:
        if close > upper:
            return "Breakout Up"
        elif close < lower:
            return "Breakdown Down"
        else:
            return "Inside Bands"

    def _summarize_signals(self, signals: Dict[str, str]) -> str:
        bullish = sum(1 for s in signals.values() if "Bullish" in s or "Oversold" in s or "Breakout" in s or s == "Above Price")
        bearish = sum(1 for s in signals.values() if "Bearish" in s or "Overbought" in s or "Breakdown" in s or s == "Below Price")

        if bullish > bearish:
            return "Bullish Bias"
        elif bearish > bullish:
            return "Bearish Bias"
        else:
            return "Neutral Bias"

    def _calculate_score(self, signals: Dict[str, str]) -> int:
        score = 0
        for val in signals.values():
            if "Bullish" in val or "Oversold" in val or "Breakout" in val or val == "Above Price":
                score += 1
            elif "Bearish" in val or "Overbought" in val or "Breakdown" in val or val == "Below Price":
                score -= 1
        return score
    def compute_all_indicators_df(self):
        """
        Agrega columnas de indicadores técnicos al DataFrame original.
        Retorna un nuevo DataFrame con RSI, MACD_diff y otros si deseas.
        """
        df = self.df.copy()

        # RSI
        df["RSI"] = ta.momentum.RSIIndicator(close=df["close"]).rsi()

        # MACD
        macd = ta.trend.MACD(close=df["close"])
        df["MACD_diff"] = macd.macd_diff()

        # Puedes agregar más indicadores aquí si deseas...

        return df

IndicatorEngine = TechnicalIndicatorEngine