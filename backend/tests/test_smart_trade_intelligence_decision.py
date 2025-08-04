# tests/test_smart_trade_intelligence_decision.py

from intelligence.smart_trade_intelligence import SmartTradeIntelligence

def main():
    symbol = "BTCUSDT"
    intelligence = SmartTradeIntelligence(symbol=symbol, interval="15m")
    result = intelligence.analyze(show_dashboard=True)

    print("\n📋 Resultado de la lógica de decisión:")
    print(f"- Señal generada: {result.get('decision', 'No definida')}")
    print(f"- Motivo: {result.get('decision_reason', 'No disponible')}")

if __name__ == "__main__":
    main()