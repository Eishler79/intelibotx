# tests/test_intel.py

import sys
import os

# Añade la raíz del proyecto al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from intelligence.smart_trade_intelligence import SmartTradeIntelligence
from intelligence.smart_dashboard import (
    display_signal_summary,
    display_candlestick_pattern,
    display_fundamental_news,
    display_decision_summary,
)

if __name__ == "__main__":
    symbol = "BTCUSDT"
    interval = "15m"

    intelligence = SmartTradeIntelligence(symbol=symbol, interval=interval)
    result = intelligence.analyze(show_dashboard=False, auto_decision=True)

    print("\n📌 Mostrando resultados del análisis...\n")

    display_signal_summary(result["technical_signals"])
    display_candlestick_pattern(result["candlestick_pattern"], result["signal"])
    display_fundamental_news(result["news_signals"])
    display_decision_summary(result["auto_decision"])