# tests/test_backtest_bot.py

import pandas as pd
from services.backtest_bot import BacktestBot
import io
import plotly.io as pio
import plotly.graph_objs as go

def plot_trades(self, return_fig=False):
    fig = go.Figure()
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

        fig.add_trace(go.Scatter(
            x=[entry_time],
            y=[trade["entry"]],
            mode="markers",
            marker=dict(color=color, size=10, symbol="circle"),
            name=f'Entry {trade["direction"]}'
        ))
        fig.add_trace(go.Scatter(
            x=[exit_time],
            y=[trade["exit"]],
            mode="markers",
            marker=dict(color="blue", size=8, symbol="x"),
            name='Exit'
        ))
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

    if return_fig:
        return fig
    else:
        fig.show()

def run_backtest_and_plot(symbol: str):
    # Cargar CSV con velas — asegúrate de tener este archivo
    df = pd.read_csv(f"data/{symbol.lower().replace('/', '_')}_15m.csv")

    # Instanciar y correr backtest
    bot = BacktestBot(df, symbol=symbol, capital=1000.0)
    bot.run_backtest()

    # Generar gráfico en HTML
    fig = bot.plot_trades(return_fig=True)
    html_chart = pio.to_html(fig, full_html=False, include_plotlyjs="cdn")

    return html_chart