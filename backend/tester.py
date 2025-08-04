# tester.py
from execution.smart_trade_session import SmartTradeSession

if __name__ == "__main__":
    session = SmartTradeSession(symbol="BTCUSDT", interval="15m", stake=20.0)
    session.run()
    