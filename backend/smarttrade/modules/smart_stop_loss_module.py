# smart_stop_loss_module.py
from smarttrade.models.trade_state import TradeState
from smarttrade.models.smart_stop_loss_config import SmartStopLossConfig

class SmartStopLossModule:
    def __init__(self, config: SmartStopLossConfig = SmartStopLossConfig()):
        self.config = config

    def evaluate_stop_loss(self, trade_state: TradeState, current_price: float) -> bool:
        """
        Evalúa si se debe activar el Stop Loss según el modo configurado.
        Retorna True si se debe cerrar la posición.
        """
        if self.config.mode == 'fixed' and self.config.fixed_price is not None:
            return current_price <= self.config.fixed_price

        elif self.config.mode == 'percent' and self.config.percent_threshold is not None:
            threshold_price = trade_state.base_price * (1 - self.config.percent_threshold)
            return current_price <= threshold_price

        elif self.config.mode == 'suggested':
            # Modo sugerido: estrategia de SL dinámico (ej. trailing desde un soporte o un % adaptativo)
            # Se puede enriquecer con indicadores técnicos
            if self.config.percent_threshold:
                dynamic_sl = trade_state.base_price * (1 - self.config.percent_threshold)
                return current_price <= dynamic_sl

        return False