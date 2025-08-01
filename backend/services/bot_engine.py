from typing import Dict, Any

class BotEngine:
    def __init__(self, config: Dict[str, Any]):
        self.symbol = config.get("symbol", "BTC/USDT")
        self.strategy = config.get("strategy", "default")
        self.capital = config.get("capital", 100.0)
        self.risk = config.get("risk", 0.02)  # 2% por defecto
        self.timeframe = config.get("timeframe", "15m")

        # Inicializa otras configuraciones necesarias
        self.indicator_engine = None  # se integrará luego
        self.pattern_detector = None  # se integrará luego

    def load_indicators(self, indicator_engine):
        """Permite inyectar el motor de indicadores."""
        self.indicator_engine = indicator_engine

    def load_pattern_detector(self, pattern_detector):
        """Permite inyectar el detector de patrones de velas."""
        self.pattern_detector = pattern_detector

    def evaluate_market(self, df) -> Dict[str, Any]:
        """Evalúa el mercado y decide si se debe operar."""
        signals = {}

        if self.indicator_engine:
            signals.update(self.indicator_engine.evaluate(df))

        if self.pattern_detector:
            signals.update(self.pattern_detector.evaluate(df))

        # Lógica básica de decisión inicial
        if signals.get("rsi") == "oversold" and signals.get("macd") == "bullish":
            action = "BUY"
        elif signals.get("rsi") == "overbought" and signals.get("macd") == "bearish":
            action = "SELL"
        else:
            action = "HOLD"

        return {
            "symbol": self.symbol,
            "action": action,
            "signals": signals
        }

    def run(self, df) -> Dict[str, Any]:
        """Ejecuta el análisis completo del bot."""
        decision = self.evaluate_market(df)
        print(f"[BotEngine] Evaluación: {decision}")
        return decision