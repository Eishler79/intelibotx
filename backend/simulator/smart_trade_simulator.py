# simulator/smart_trade_simulator.py

import pandas as pd
from intelligence.smart_trade_intelligence import SmartTradeIntelligence

class SmartTradeSimulator:
    def __init__(self, symbol: str, interval: str = "15m", capital: float = 200.0):
        self.symbol = symbol
        self.interval = interval
        self.initial_capital = capital
        self.remaining_capital = capital
        self.operations = []

    def simulate(self, order_sizes: list, tp_targets: list, sl_ratio: float = 1.0):
        intelligence = SmartTradeIntelligence(symbol=self.symbol, interval=self.interval)
        df = intelligence.fetch_candles()

        for i in range(len(df) - 1):
            slice_df = df.iloc[:i+1].copy()
            intelligence = SmartTradeIntelligence(symbol=self.symbol, interval=self.interval)
            intelligence.fetch_candles = lambda: slice_df
            result = intelligence.analyze(show_dashboard=False)

            signal = result.get("signal", "")
            close_price = slice_df['close'].iloc[-1]

            if signal == "long" and self.remaining_capital >= min(order_sizes):
                for order_size, tp in zip(order_sizes, tp_targets):
                    if self.remaining_capital >= order_size:
                        tp_price = close_price * (1 + tp)
                        sl_price = close_price * (1 - tp * sl_ratio)

                        # Simular si el precio toca TP antes del SL
                        future_prices = df.iloc[i+1:i+4]['high']  # ventanas de 3 velas siguientes
                        future_lows = df.iloc[i+1:i+4]['low']

                        if any(high >= tp_price for high in future_prices):
                            self.operations.append({
                                "entry": close_price,
                                "exit": tp_price,
                                "side": "long",
                                "result": "TP",
                                "gain": order_size * tp,
                                "capital_after": self.remaining_capital + order_size * tp
                            })
                            self.remaining_capital += order_size * tp
                        elif any(low <= sl_price for low in future_lows):
                            loss = order_size * tp * sl_ratio
                            self.operations.append({
                                "entry": close_price,
                                "exit": sl_price,
                                "side": "long",
                                "result": "SL",
                                "gain": -loss,
                                "capital_after": self.remaining_capital - loss
                            })
                            self.remaining_capital -= loss
                        else:
                            continue

                        self.remaining_capital -= order_size

                        if self.remaining_capital <= 0:
                            break
            
            if self.remaining_capital <= 0:
                break

        return {
            "initial_capital": self.initial_capital,
            "final_capital": self.remaining_capital,
            "operations": self.operations
        }