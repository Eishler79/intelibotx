# modules/trailing_service_module.py

from models.trade_state import TradeState

class TrailingServiceModule:
    def __init__(self, activation_threshold: float = 0.025, trailing_offset: float = 0.002):
        """
        :param activation_threshold: Porcentaje de ganancia mínimo para activar trailing TP (ej. 2.5%)
        :param trailing_offset: Porcentaje desde el máximo para disparar TP (ej. 0.2%)
        """
        self.activation_threshold = activation_threshold
        self.trailing_offset = trailing_offset

    def evaluate_trailing_tp(self, trade_state: TradeState, current_price: float):
        """Evalúa si se debe activar o ejecutar trailing TP."""

        if trade_state.base_price is None or trade_state.current_position_size == 0:
            return

        gain_ratio = (current_price - trade_state.base_price) / trade_state.base_price

        # 1. Activar trailing TP si aún no ha sido activado
        if not trade_state.take_profit_triggered and gain_ratio >= self.activation_threshold:
            trade_state.take_profit_triggered = True
            trade_state.trailing_high = current_price
            print(f"[Trailing TP ACTIVADO] Activado en {current_price:.2f} (+{gain_ratio*100:.2f}%)")
            return

        # 2. Si ya está activado, actualizar el máximo y verificar si se debe cerrar
        if trade_state.take_profit_triggered:
            if current_price > trade_state.trailing_high:
                trade_state.trailing_high = current_price
                print(f"[Trailing TP] Nuevo máximo alcanzado: {current_price:.2f}")
            elif current_price <= trade_state.trailing_high * (1 - self.trailing_offset):
                print(f"[Trailing TP] Retroceso desde {trade_state.trailing_high:.2f} → {current_price:.2f} (>{self.trailing_offset*100:.2f}%) — Cerrando posición")
                trade_state.current_position_size = 0  # Marcar como cerrada
                trade_state.take_profit_triggered = False