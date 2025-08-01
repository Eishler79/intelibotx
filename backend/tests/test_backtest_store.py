import pandas as pd
from services.backtest_bot import BacktestBot
from services.persistence import create_tables, save_trades, save_summary

# Crear DB y tablas
create_tables()

# Cargar datos CSV (simulados de Binance 15m, por ejemplo)
df = pd.read_csv("data_BTCUSDT_15m.csv", index_col="timestamp", parse_dates=True)

# Simular
bot = BacktestBot(df, symbol="BTC/USDT")
trades = bot.run_backtest()
summary = bot.summary()

# Guardar resultados
save_trades("BTC/USDT", trades)
save_summary("BTC/USDT", summary)

# Ver resultado por consola
print("🔁 BACKTEST FINALIZADO")
print("📊 Resumen:")
print(summary)
print(f"📂 Guardado en: backtest_results.db")