from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.dca_config import DCAConfig
from smarttrade.smart_trade_service import SmartTradeService
import time

# Configuración inicial
config = DCAConfig(
    max_orders=5,
    deviation_pct=0.025,
    base_order_amount=10.0,
    use_multiplier=True,
    multiplier=1.5
)

# Simula estado inicial con una entrada base
trade_state = TradeState(
    symbol="PEPEUSDT",
    entries=[DCAEntry(price=0.001, amount=10.0, timestamp=time.time())],
    base_price=0.001,
    current_position_size=10.0
)

# Instancia el servicio con módulos integrados
service = SmartTradeService(dca_config=config)

# Secuencia de precios: baja para activar DCA, luego sube para activar TP
price_series = [
    0.000975, 0.000950, 0.000925, 0.000900,  # activa DCA
    0.000930, 0.000980, 0.001000,            # acercándose al TP
    0.001030, 0.001050, 0.001025, 0.001000   # activa y ejecuta trailing TP
]

print("Simulación iniciada...\n")
for price in price_series:
    print(f"→ Precio actual: {price:.6f}")
    service.process_price_update(trade_state, price)
    print(f"   Base: {trade_state.base_price:.6f} | TP Activo: {trade_state.take_profit_triggered} | High: {trade_state.trailing_high}")
    print(f"   Órdenes DCA: {len(trade_state.entries)} | Posición actual: {trade_state.current_position_size}")
    print("-" * 60)