# smart_take_profit_module.py

from smarttrade.models.trade_state import TradeState
from smarttrade.models.smart_take_profit_config import SmartTPConfig

class SmartTakeProfitModule:
    def __init__(self, tp_config: SmartTPConfig = SmartTPConfig()):
        self.tp_config = tp_config

    def evaluate_take_profit(self, trade_state: TradeState, current_price: float) -> bool:
        """
        Evalúa si se debe activar un Take Profit según:
        - Precio fijo
        - Porcentaje sobre precio base
        - Porcentaje sugerido como fallback
        """

        if not trade_state or not isinstance(current_price, (int, float)):
            return False

        # 1. TP Fijo
        if self.tp_config.tp_type == "fixed" and self.tp_config.fixed_price:
            if current_price >= self.tp_config.fixed_price:
                print(f"[TP - FIXED] {current_price:.6f} >= {self.tp_config.fixed_price:.6f}")
                trade_state.take_profit_triggered = True
                return True

        # 2. TP Porcentual
        if self.tp_config.tp_type == "percent":
            tp_price = trade_state.base_price * (1 + self.tp_config.percent_gain)
            if current_price >= tp_price:
                print(f"[TP - PERCENTUAL] {current_price:.6f} >= {tp_price:.6f} (+{self.tp_config.percent_gain*100:.2f}%)")
                trade_state.take_profit_triggered = True
                return True

        # 3. TP Sugerido
        if self.tp_config.tp_type == "suggested":
            tp_price = trade_state.base_price * (1 + self.tp_config.suggested_gain_pct)
            if current_price >= tp_price:
                print(f"[TP - SUGERIDO] {current_price:.6f} >= {tp_price:.6f}")
                trade_state.take_profit_triggered = True
                return True

        print("[TP INACTIVO]")
        return False