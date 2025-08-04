# test_smart_trade_intelligence.py

from intelligence.smart_trade_intelligence import SmartTradeIntelligence

# ✅ Puedes ajustar estos parámetros según lo que desees analizar
symbol = "BTCUSDT"
interval = "15m"
limit = 150

print(f"\n🔍 Ejecutando análisis inteligente para {symbol} [{interval}]...")
engine = SmartTradeIntelligence(symbol=symbol, interval=interval, limit=limit)
summary = engine.get_summary()

print("\n📊 Resumen de análisis inteligente:")
print("- Indicadores Técnicos:")
for k, v in summary['technical_signals'].items():
    print(f"  {k}: {v}")

print("\n- Patrón de Velas más reciente:")
print(f"  {summary['candlestick_pattern']}")

print("\n- Señales Fundamentales:")
for signal in summary['news_signals']:
    print(f"  {signal}")