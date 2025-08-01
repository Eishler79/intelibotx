# routes/backtest_plot.py

from fastapi import APIRouter, Response
import pandas as pd
from services.backtest_bot import BacktestBot

router = APIRouter()

@router.get("/backtest-plot/{symbol}", response_class=Response)
def get_backtest_plot(symbol: str):
    try:
        df = pd.read_csv(f"data/{symbol.lower().replace('/', '_')}_15m.csv")
        bot = BacktestBot(df, symbol=symbol, capital=1000.0)
        bot.run_backtest()
        html_chart = bot.plot_trades(return_html=True)
        return Response(content=html_chart, media_type="text/html")
    except Exception as e:
        return Response(content=f"<h3>Error: {e}</h3>", media_type="text/html")