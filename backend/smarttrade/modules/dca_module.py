from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.dca_config import DCAConfig
import time

class DCAModule:
    def __init__(self, config: DCAConfig = DCAConfig()):
        self.config = config

    def evaluate_dca(self, trade_state: TradeState, current_price: float):
        """
        Verifica si debe ejecutarse una nueva entrada DCA con base en el precio actual.
        """
        num_entries = len(trade_state.entries)

        if num_entries >= self.config.max_orders:
            return  # Ya alcanzó el máximo

        if num_entries == 0:
            return  # Aún no hay orden base

        last_entry = trade_state.entries[-1]
        expected_price = last_entry.price * (1 - self.config.deviation_pct)

        if current_price <= expected_price:
            if self.config.use_multiplier:
                amount = self.config.base_order_amount * (self.config.multiplier ** num_entries)
            else:
                amount = self.config.base_order_amount

            new_entry = DCAEntry(price=current_price, amount=amount, timestamp=time.time())
            trade_state.entries.append(new_entry)

            # Recalcular precio base ponderado
            total_value = sum(e.price * e.amount for e in trade_state.entries)
            total_amount = sum(e.amount for e in trade_state.entries)
            trade_state.base_price = total_value / total_amount
            trade_state.current_position_size = total_amount

            print(f"[DCA] Nueva entrada a {current_price:.6f} con monto {amount}. Nuevo precio base: {trade_state.base_price:.6f}")