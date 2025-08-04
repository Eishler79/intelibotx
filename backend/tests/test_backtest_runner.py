# tests/test_backtest_runner.py

from backtest_runner import SmartTradeSimulator

def main():
    simulator = SmartTradeSimulator(symbols=["BTCUSDT", "ETHUSDT"], interval="15m", capital_goal=200.0)
    results = simulator.run_backtest()

    print("\n📊 Resultados Finales del Backtest:\n")
    for symbol, res in results.items():
        print(f"🔹 {symbol} => Ganancia: ${res['total_profit']:.2f} | Operaciones completadas: {res['completed_trades']}")
        for idx, op in enumerate(res['trades'], 1):
            print(f"  {idx:02d}) {op['entry_time']} - {op['exit_time']} | Monto: ${op['amount']} | Resultado: {op['result']} | Ganancia: {op['profit']:.2f}")

if __name__ == "__main__":
    main()