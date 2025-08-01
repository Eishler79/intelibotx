# tests/test_smart_dashboard.py

from intelligence.smart_dashboard import (
    display_signal_summary,
    display_candlestick_pattern,
    display_fundamental_news
)

# Simulación de datos para prueba
signals = {
    "RSI": "Neutral (45.60)",
    "MACD": "Bearish (-120.4)",
    "Bollinger": "Inside Bands",
    "ADX": "28.7",
    "VWAP": "Above Price"
}

pattern = "CDLENGULFING"
signal = "long"

news = {
    "symbol": "BTCUSDT",
    "headline": "El ETF genera presión en BTC",
    "source": "Twitter"
}

# Prueba visual de cada parte del dashboard
display_signal_summary(signals)
display_candlestick_pattern(pattern, signal)
display_fundamental_news(news)