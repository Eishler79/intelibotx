import pandas as pd
from analytics.strategy_evaluator import StrategyEvaluator
from services.db_logger import TradeLogger
import plotly.graph_objects as go
import plotly.io as pio

# ✅ Clase principal de Backtest
class BacktestBot:
    def __init__(self, df: pd.DataFrame, symbol: str, capital: float = 1000.0):
        self.df = df.copy()
        self.symbol = symbol
        self.capital = capital
        self.logger = TradeLogger()
        self.trades = []

    # 🧠 Simulación real usando lógica de señales técnicas
    def run_backtest(self):
        evaluator = StrategyEvaluator(self.df)
        df_with_signals = evaluator.generate_signals_per_row()

        position = None
        entry_type = None

        for i, row in df_with_signals.iterrows():
            signal = row["signal"]
            close_price = row["close"]

            if signal == "LONG" and position is None:
                position = {"entry_price": close_price, "entry_index": i}
                entry_type = "LONG"
                print(f"[ENTRY] LONG at {close_price} | index {i}")

            elif signal == "SHORT" and position is None:
                position = {"entry_price": close_price, "entry_index": i}
                entry_type = "SHORT"
                print(f"[ENTRY] SHORT at {close_price} | index {i}")

            elif signal != entry_type and position is not None:
                exit_price = close_price
                if entry_type == "LONG":
                    profit = exit_price - position["entry_price"]
                elif entry_type == "SHORT":
                    profit = position["entry_price"] - exit_price

                self.logger.log_trade(self.symbol, entry_type, position["entry_price"], exit_price)
                self.trades.append({
                    "symbol": self.symbol,
                    "direction": entry_type,
                    "entry": position["entry_price"],
                    "exit": exit_price,
                    "profit": profit
                })
                print(f"[EXIT] {entry_type} at {exit_price} | Profit: {profit:.2f} | index {i}")
                position = None
                entry_type = None

        return self.trades

    # 📊 Resumen de rendimiento con métricas clave
    def summary(self):
        profits = [t["profit"] for t in self.trades]
        total_trades = len(profits)
        total_profit = sum(profits)
        avg_profit = total_profit / total_trades if total_trades > 0 else 0
        win_trades = [p for p in profits if p > 0]
        lose_trades = [p for p in profits if p <= 0]
        win_rate = len(win_trades) / total_trades * 100 if total_trades > 0 else 0

        # 📉 Max Drawdown
        equity_curve = [0]
        for p in profits:
            equity_curve.append(equity_curve[-1] + p)
        peak = equity_curve[0]
        drawdowns = []
        for value in equity_curve:
            if value > peak:
                peak = value
            drawdown = peak - value
            drawdowns.append(drawdown)
        max_drawdown = max(drawdowns) if drawdowns else 0

        # 📈 Sharpe Ratio (anualizado, sin riesgo libre)
        if total_trades > 1:
            returns = pd.Series(profits)
            sharpe = (returns.mean() / returns.std()) * (252 ** 0.5) if returns.std() != 0 else 0
        else:
            sharpe = 0

        # 💹 Profit Factor
        gross_profit = sum([p for p in profits if p > 0])
        gross_loss = abs(sum([p for p in profits if p < 0]))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')

        return {
            "symbol": self.symbol,
            "total_trades": total_trades,
            "total_profit": round(total_profit, 2),
            "avg_profit": round(avg_profit, 2),
            "win_rate": round(win_rate, 2),
            "max_drawdown": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe, 3),
            "profit_factor": round(profit_factor, 2)
        }

    # 📈 Visualización de las operaciones
    def plot_trades(self, return_html=False):
        fig = go.Figure()

        # Línea de precios
        fig.add_trace(go.Scatter(
            x=self.df["timestamp"],
            y=self.df["close"],
            mode="lines",
            name="Precio",
            line=dict(color="gray", width=1)
        ))

        for trade in self.trades:
            entry_index = self.df[self.df["close"] == trade["entry"]].index[0]
            exit_index = self.df[self.df["close"] == trade["exit"]].index[0]

            entry_time = self.df.loc[entry_index, "timestamp"]
            exit_time = self.df.loc[exit_index, "timestamp"]

            color = "green" if trade["direction"] == "LONG" else "red"

            # Punto de entrada
            fig.add_trace(go.Scatter(
                x=[entry_time],
                y=[trade["entry"]],
                mode="markers",
                marker=dict(color=color, size=10, symbol="circle"),
                name=f'Entry {trade["direction"]}'
            ))

            # Punto de salida
            fig.add_trace(go.Scatter(
                x=[exit_time],
                y=[trade["exit"]],
                mode="markers",
                marker=dict(color="blue", size=8, symbol="x"),
                name='Exit'
            ))

            # Línea entre entrada y salida
            fig.add_trace(go.Scatter(
                x=[entry_time, exit_time],
                y=[trade["entry"], trade["exit"]],
                mode="lines",
                line=dict(color=color, dash="dot"),
                showlegend=False
            ))

        fig.update_layout(
            title=f"Simulación de Trades: {self.symbol}",
            xaxis_title="Tiempo",
            yaxis_title="Precio",
            height=600
        )

        if return_html:
            return pio.to_html(fig, full_html=False, include_plotlyjs="cdn")
        else:
            fig.show()

# ✅ Función auxiliar externa (usada en endpoint o pruebas)
def run_backtest_and_plot(symbol: str):
    # ✅ Intenta cargar datos específicos del símbolo, con fallback a BTCUSDT
    symbol_file = f"data/{symbol.lower().replace('/', '_')}_15m.csv"
    fallback_file = "data/btcusdt_15m.csv"
    
    try:
        df = pd.read_csv(symbol_file)
        print(f"✅ Usando datos específicos para {symbol}")
    except FileNotFoundError:
        try:
            df = pd.read_csv(fallback_file)
            print(f"⚠️ Archivo {symbol_file} no encontrado. Usando datos de BTCUSDT como ejemplo para {symbol}")
        except FileNotFoundError:
            raise FileNotFoundError(f"No se encontraron datos para {symbol} ni datos de fallback")
    
    bot = BacktestBot(df, symbol=symbol, capital=1000.0)
    bot.run_backtest()
    return bot.plot_trades(return_html=True)

# ✅ Nueva función: ejecución con lógica real (puntos de entrada/salida)
def run_backtest_and_extract_trades(symbol: str):
    # ✅ Intenta cargar datos específicos del símbolo, con fallback a BTCUSDT
    symbol_file = f"data/{symbol.lower().replace('/', '_')}_15m.csv"
    fallback_file = "data/btcusdt_15m.csv"
    
    try:
        df = pd.read_csv(symbol_file)
    except FileNotFoundError:
        df = pd.read_csv(fallback_file)
    
    bot = BacktestBot(df, symbol=symbol, capital=1000.0)
    trades = bot.run_backtest()
    return trades

# 🗂 Guardar resumen de métricas como archivo JSON
def save_summary_report(self, output_dir="logs"):
    import os
    import json
    from datetime import datetime

    os.makedirs(output_dir, exist_ok=True)
    summary_data = self.summary()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/summary_{self.symbol}_{timestamp}.json"

    with open(filename, "w") as f:
        json.dump(summary_data, f, indent=4)

    print(f"✅ Resumen guardado en: {filename}")