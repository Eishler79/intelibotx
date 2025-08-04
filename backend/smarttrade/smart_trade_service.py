# smart_trade_service.py

from smarttrade.models.trade_state import TradeState
from smarttrade.models.dca_config import DCAConfig
from smarttrade.models.smart_stop_loss_config import SmartStopLossConfig
from smarttrade.models.smart_take_profit_config import SmartTPConfig

from smarttrade.modules.dca_module import DCAModule
from smarttrade.modules.trailing_service_module import TrailingServiceModule
from smarttrade.modules.smart_stop_loss_module import SmartStopLossModule
from smarttrade.modules.smart_take_profit_module import SmartTakeProfitModule

class SmartTradeService:
    def __init__(
        self,
        dca_config: DCAConfig = DCAConfig(),
        trailing_activation_pct: float = 0.025,
        trailing_offset: float = 0.002,
        stop_loss_config: SmartStopLossConfig = SmartStopLossConfig(),
        tp_config: SmartTPConfig = SmartTPConfig()
    ):
        self.dca_module = DCAModule(dca_config)
        self.trailing_module = TrailingServiceModule(trailing_activation_pct, trailing_offset)
        self.take_profit_module = SmartTakeProfitModule(tp_config=tp_config)
        self.stop_loss_module = SmartStopLossModule(stop_loss_config)

    def process_price_update(self, trade_state: TradeState, current_price: float):
        if trade_state.base_price is None:
            trade_state.base_price = current_price
            print(f"📈 Precio base inicial establecido en {trade_state.base_price}")

        """Orquesta todas las decisiones de trading al recibir un nuevo precio"""
        self.dca_module.evaluate_dca(trade_state, current_price)
        self.trailing_module.evaluate_trailing_tp(trade_state, current_price)

        if self.stop_loss_module.evaluate_stop_loss(trade_state, current_price):
            print(f"[CIERRE] Se activa Stop Loss. Acción sugerida: cerrar posición.")
            if trade_state.auto_restart_enabled:
                self.reset_trade_state(trade_state, current_price)
            return

        # DCA
        try:
            self.dca_module.evaluate_dca(trade_state, current_price)
        except Exception as e:
            print(f"[DCA ERROR] Fallo en evaluación de DCA: {e}")

        # Trailing Take Profit
        try:
            self.trailing_module.evaluate_trailing_tp(trade_state, current_price)
        except Exception as e:
            print(f"[TRAILING TP ERROR] Fallo en trailing TP: {e}")

        
        # Smart Take Profit
        try:
            if self.take_profit_module.evaluate_take_profit(trade_state, current_price):
                self.reset_trade_state(trade_state, current_price)
        except Exception as e:
            print(f"[TP ERROR] Fallo en evaluación de Take Profit: {e}")

        # Smart Stop Loss
        try:
            if self.stop_loss_module.evaluate_stop_loss(trade_state, current_price):
                print(f"[CIERRE] Se activa Stop Loss. Acción sugerida: cerrar posición.")
                self.reset_trade_state(trade_state)  # Reinicio tras SL
                return
        except Exception as e:
            print(f"[SL ERROR] Fallo en evaluación de Stop Loss: {e}")
    
    def reset_trade_state(self, trade_state: TradeState):
        """Reinicia el estado de la operación para simular una nueva entrada"""
        print("🔄 Reiniciando estado de operación para nuevo ciclo.")
        trade_state.entries = []
        trade_state.base_price = None
        trade_state.take_profit_triggered = False
        trade_state.trailing_high = None
        trade_state.stop_loss_price = None
        trade_state.current_position_size = 1.0  # Simula nueva entrada

    def reset_trade_state(self, trade_state: TradeState, current_price: float):
        trade_state.base_price = current_price
        trade_state.entries.clear()
        trade_state.trailing_high = None
        trade_state.take_profit_triggered = False
        trade_state.stop_loss_price = None
        trade_state.current_position_size = 0.0
        trade_state.cycle_count += 1
        print(f"🔄 Nuevo ciclo iniciado (#{trade_state.cycle_count}) con base en {current_price}")