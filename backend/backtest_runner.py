# backtest_runner.py

from simulator.smart_trade_simulator import SmartTradeSimulator

def main():
    symbols = ["BTCUSDT", "ETHUSDT"]
    timeframe = "15m"
    trade_sizes = [15, 20, 30, 40]
    target_profit = 200

    simulator = SmartTradeSimulator(
        symbols=symbols,
        timeframe=timeframe,
        trade_sizes=trade_sizes,
        target_profit=target_profit
    )
    simulator.run_backtest()

if __name__ == "__main__":
    main()