# analytics/strategy_evaluator.py

from analytics.indicator_engine import TechnicalIndicatorEngine
from analytics.candlestick_patterns import CandlestickPatternDetector
import pandas as pd

class StrategyEvaluator:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        self.indicator_signals = None
        self.pattern_signals = None

    def evaluate(self):
        # Indicadores técnicos
        tech_engine = TechnicalIndicatorEngine(self.df)
        indicator_results = tech_engine.compute_indicators()

        # Patrones de velas
        pattern_detector = CandlestickPatternDetector(self.df)
        patterns_df = pattern_detector.detect()
        latest_pattern = pattern_detector.get_latest_pattern()
        latest_signal = pattern_detector.get_latest_signal()

        self.indicator_signals = indicator_results
        self.pattern_signals = {
            "pattern": latest_pattern,
            "signal": latest_signal
        }

        # Calcular score técnico (puede ser más complejo en versiones futuras)
        score = self._calculate_score(indicator_results, latest_signal)

        return {
            "summary": self._generate_summary(),
            "indicators": indicator_results,
            "pattern": self.pattern_signals,
            "score": score
        }

    def _calculate_score(self, indicators: dict, pattern_signal: str) -> int:
        score = 0
        if isinstance(indicators, dict):
            for key, val in indicators.items():
                if isinstance(val, str):
                    if "Bullish" in val or "Oversold" in val or "Breakout" in val or "Above" in val:
                        score += 1
                    elif "Bearish" in val or "Overbought" in val or "Breakdown" in val or "Below" in val:
                        score -= 1

        if pattern_signal == "long":
            score += 1
        elif pattern_signal == "short":
            score -= 1

        return score

    def _generate_summary(self):
        if self.pattern_signals and self.pattern_signals["signal"]:
            return f"Latest pattern: {self.pattern_signals['pattern']} - Suggests: {self.pattern_signals['signal']}"
        return "No clear pattern detected."

    def generate_signals_per_row(self):
        """
        Genera señales LONG/SHORT por fila para uso en simulación.
        """
        tech_engine = TechnicalIndicatorEngine(self.df)
        df_with_indicators = tech_engine.compute_all_indicators_df()

        signals = []
        for _, row in df_with_indicators.iterrows():
            rsi = row.get("RSI")
            macd_diff = row.get("MACD_diff")

            if rsi is not None:
                if rsi < 45:
                    signals.append("LONG")
                elif rsi > 55:
                    signals.append("SHORT")
                else:
                    signals.append(None)
            else:
                signals.append(None)

        df_with_indicators["signal"] = signals

        # ✅ Agregado para verificar que las señales se estén generando
        print(df_with_indicators[["timestamp", "RSI", "MACD_diff", "signal"]].tail(10))

        return df_with_indicators

# Alias para compatibilidad con módulos antiguos
SmartStrategyEvaluator = StrategyEvaluator

