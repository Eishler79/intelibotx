from models.trade_state import TradeState, DCAEntry
from modules.trailing_service_module import TrailingServiceModule
import time

# Simula una posición abierta
trade_state = TradeState(
    symbol="PEPEUSDT",
    entries=[
        DCAEntry(price=0.001, amount=1000, timestamp=time.time())
    ],
    base_price=0.001,
    current_position_size=1000
)

# Instancia el módulo
trailing_module = TrailingServiceModule(activation_threshold=0.025, trailing_offset=0.002)

# Simula una serie de precios
price_series = [0.001, 0.00102, 0.00103, 0.001025, 0.00104, 0.00105, 0.00104, 0.00102]

for price in price_series:
    trailing_module.evaluate_trailing_tp(trade_state, price)
    print(f"[Simulación] Precio: {price:.6f} | TP Activo: {trade_state.take_profit_triggered} | High: {trade_state.trailing_high}")