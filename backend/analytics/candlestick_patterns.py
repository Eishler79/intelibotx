# analytics/candlestick_patterns.py

import pandas as pd
import numpy as np
from typing import Optional

class CandlestickPatternDetector:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.df['pattern'] = None
        self.df['signal'] = None

    def detect(self) -> pd.DataFrame:
        df = self.df.copy()
        for i in range(1, len(df)):
            o, h, l, c = df.iloc[i][['open', 'high', 'low', 'close']]
            po, pc = df.iloc[i - 1][['open', 'close']]
            body = abs(c - o)
            range_ = h - l
            upper = h - max(o, c)
            lower = min(o, c) - l

            pattern: Optional[str] = None
            signal: Optional[str] = None

            # Doji
            if body < 0.1 * range_:
                pattern = "Doji"
                signal = "neutral"

            # Hammer
            elif body < 0.3 * range_ and lower > 2 * body and upper < 0.1 * range_:
                pattern = "Hammer"
                signal = "long"

            # Inverted Hammer
            elif body < 0.3 * range_ and upper > 2 * body and lower < 0.1 * range_:
                pattern = "Inverted Hammer"
                signal = "long"

            # Bullish Engulfing
            elif o < c and po > pc and o < pc and c > po:
                pattern = "Bullish Engulfing"
                signal = "long"

            # Bearish Engulfing
            elif o > c and po < pc and o > pc and c < po:
                pattern = "Bearish Engulfing"
                signal = "short"

            # Shooting Star
            elif body < 0.3 * range_ and upper > 2 * body and lower < 0.1 * range_:
                pattern = "Shooting Star"
                signal = "short"

            # Dragonfly Doji
            elif body < 0.1 * range_ and upper < 0.2 * range_ and lower > 0.6 * range_:
                pattern = "Dragonfly Doji"
                signal = "long"

            # Morning Star (simplified)
            elif po > pc and o < c and c > po:
                pattern = "Morning Star"
                signal = "long"

            # Evening Star (simplified)
            elif po < pc and o > c and c < po:
                pattern = "Evening Star"
                signal = "short"

            if pattern:
                df.at[df.index[i], 'pattern'] = pattern
                df.at[df.index[i], 'signal'] = signal

        self.df = df
        return df

    def get_latest_pattern(self) -> Optional[str]:
        patterns = self.df['pattern'].dropna()
        return patterns.iloc[-1] if not patterns.empty else None

    def get_latest_signal(self) -> Optional[str]:
        signals = self.df['signal'].dropna()
        return signals.iloc[-1] if not signals.empty else None

    def summarize_patterns(self) -> pd.DataFrame:
        return self.df[['pattern', 'signal']].dropna().reset_index(drop=True)