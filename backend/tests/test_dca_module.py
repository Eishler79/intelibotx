from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.dca_config import DCAConfig
from smarttrade.modules.dca_module import DCAModule
import time

# Crear configuración tipo 3Commas
config = DCAConfig(
    max_orders=5,
    deviation_pct=0.025,       # 2.5%
    base_order_amount=10.0,
    use_multiplier=True,
    multiplier=1.5
)

# Crear estado inicial con una orden base
trade_state = TradeState(
    symbol="FLOKIUSDT",
    entries=[
        DCAEntry(price=0.001000, amount=10.0, timestamp=time.time())
    ],
    base_price=0.001000,
    current_position_size=10.0
)

dca_module = DCAModule(config)

# Simula una secuencia de precios bajando en escalones de -2.5%
price_series = [0.000975, 0.000950, 0.000925, 0.000900, 0.000880]

for price in price_series:
    dca_module.evaluate_dca(trade_state, price)
    print(f"[Simulación] Precio: {price:.6f} | Órdenes DCA: {len(trade_state.entries)} | Base Price: {trade_state.base_price:.6f}")