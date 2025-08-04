# tests/test_smart_trade_simulator.py

from backtest.simulator.smart_trade_simulator import SmartTradeSimulator

def test_simulation_reaches_target_or_not():
    simulator = SmartTradeSimulator(symbol="BTCUSDT", interval="15m", capital=1000.0)
    trades = simulator.run(max_profit_target=200.0)

    total_profit = sum([trade['profit'] for trade in trades])
    print(f"\n🧪 Total de operaciones simuladas: {len(trades)}")
    print(f"💰 Ganancia total: ${total_profit:.2f}")

    assert total_profit >= 0, "La ganancia total debe ser al menos cero"
    assert isinstance(trades, list), "El resultado debe ser una lista de operaciones"

    if total_profit >= 200.0:
        print("✅ Objetivo de ganancia alcanzado en la simulación.")
    else:
        print("ℹ️ La simulación finalizó sin alcanzar el objetivo.")