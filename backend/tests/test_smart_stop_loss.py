# test_smart_stop_loss.py
from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.smart_stop_loss_config import SmartStopLossConfig
from smarttrade.modules.smart_stop_loss_module import SmartStopLossModule
import time

# Simulación de estado de trade
trade_state = TradeState(
    symbol="PEPEUSDT",
    entries=[DCAEntry(price=0.0010, amount=10.0, timestamp=time.time())],
    base_price=0.0010,
    current_position_size=10.0
)

print("--- Pruebas de Smart Stop Loss ---")

# Caso 1: Stop Loss fijo
sl_fixed = SmartStopLossConfig(mode='fixed', fixed_price=0.0009)
sl_module = SmartStopLossModule(config=sl_fixed)
print(f"[FIXED] SL activo: {sl_module.evaluate_stop_loss(trade_state, 0.00085)}")  # True

# Caso 2: Stop Loss por porcentaje
sl_percent = SmartStopLossConfig(mode='percent', percent_threshold=0.05)
sl_module = SmartStopLossModule(config=sl_percent)
print(f"[PERCENT] SL activo: {sl_module.evaluate_stop_loss(trade_state, 0.00094)}")  # True

# Caso 3: Stop Loss sugerido con porcentaje
sl_suggested = SmartStopLossConfig(mode='suggested', percent_threshold=0.04)
sl_module = SmartStopLossModule(config=sl_suggested)
print(f"[SUGGESTED] SL activo: {sl_module.evaluate_stop_loss(trade_state, 0.00095)}")  # False
print(f"[SUGGESTED] SL activo: {sl_module.evaluate_stop_loss(trade_state, 0.00093)}")  # True