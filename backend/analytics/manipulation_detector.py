import pandas as pd
import numpy as np

class MarketManipulationDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df

    def detect(self) -> dict:
        """
        Detecta señales de manipulación en las últimas velas.
        Retorna un dict con señales y su peso.
        """
        findings = {
            "long_wick": self.detect_long_wicks(),
            "vwap_divergence": self.detect_vwap_divergence(),
            "bollinger_abuse": self.detect_bollinger_abuse(),
            "volume_spike": self.detect_volume_spike(),
            "indicator_conflict": self.detect_indicator_conflict(),
        }
        findings["total_flags"] = sum(1 for v in findings.values() if v is True)
        return findings

    def detect_long_wicks(self, threshold=2.5) -> bool:
        """
        Detecta mechas largas respecto al cuerpo.
        """
        last = self.df.iloc[-1]
        body = abs(last['close'] - last['open'])
        upper_wick = last['high'] - max(last['close'], last['open'])
        lower_wick = min(last['close'], last['open']) - last['low']
        return upper_wick > threshold * body or lower_wick > threshold * body

    def detect_vwap_divergence(self, threshold=0.02) -> bool:
        """
        Detecta si el precio actual está alejado del VWAP > 2%
        """
        if "vwap" not in self.df.columns:
            return False
        last_price = self.df.iloc[-1]['close']
        last_vwap = self.df.iloc[-1]['vwap']
        return abs(last_price - last_vwap) / last_vwap > threshold

    def detect_bollinger_abuse(self) -> bool:
        """
        Detecta si la vela cierra fuera de las bandas sin confirmación de volumen.
        """
        if not {'bb_upper', 'bb_lower', 'volume'}.issubset(self.df.columns):
            return False
        last = self.df.iloc[-1]
        return (
            (last['close'] > last['bb_upper'] or last['close'] < last['bb_lower']) 
            and last['volume'] < self.df['volume'].rolling(10).mean().iloc[-1]
        )

    def detect_volume_spike(self, multiplier=3.0) -> bool:
        """
        Detecta picos de volumen inusuales
        """
        last_volume = self.df.iloc[-1]['volume']
        avg_volume = self.df['volume'].rolling(10).mean().iloc[-2]  # evita incluir el pico
        return last_volume > multiplier * avg_volume

    def detect_indicator_conflict(self) -> bool:
        """
        Detecta señales contradictorias entre RSI y MACD.
        Ej: RSI > 50 pero MACD negativo fuerte (o viceversa)
        """
        if not {"rsi", "macd"}.issubset(set(self.df.columns.map(str).str.lower().str.strip())):
            return False
        rsi = self.df.iloc[-1]["rsi"]
        macd = self.df.iloc[-1]["macd"]
        return (rsi > 50 and macd < -20) or (rsi < 50 and macd > 20)