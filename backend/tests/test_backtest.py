import pandas as pd
from services.backtest_bot import BacktestBot
from analytics.strategy_evaluator import StrategyEvaluator

df = pd.read_csv("data_BTCUSDT_15m.csv")

# Generar señales individualmente para inspección
evaluator = StrategyEvaluator(df)
df_with_signals = evaluator.generate_signals_per_row()

# ✅ Mostrar las últimas filas con señales generadas
print(df_with_signals[["timestamp", "RSI", "MACD_diff", "signal"]].tail(15))

# Ejecutar el backtest
bot = BacktestBot(df, symbol="BTC/USDT")
trades = bot.run_backtest()
print(bot.summary())
bot.plot_trades()