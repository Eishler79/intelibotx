# smarttrade/test_smart_trade_service_takeprofit.py

from smarttrade.models.dca_config import DCAConfig
from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.smart_take_profit_config import SmartTPConfig
from smarttrade.models.smart_stop_loss_config import SmartStopLossConfig
from smarttrade.smart_trade_service import SmartTradeService
import time

print("--- Pruebas de Smart Trade Service con Take Profit ---")

# Configuración DCA y TP
config_dca = DCAConfig(
    max_orders=5,
    deviation_pct=0.025,
    base_order_amount=10.0,
    use_multiplier=True,
    multiplier=1.5
)

tp_config = SmartTPConfig(
    fixed_price=0.00104,
    percent_gain=0.03,
    suggested_gain_pct=0.025
)

# Estado de prueba
trade_state = TradeState(
    symbol="PEPEUSDT",
    entries=[DCAEntry(price=0.001, amount=10.0, timestamp=time.time())],
    base_price=0.001,
    current_position_size=10.0
)

# Instancia del servicio (ahora se inyecta manualmente la configuración TP dentro del módulo)
service = SmartTradeService(dca_config=config_dca)

# Sobrescribimos manualmente el TP Module para pruebas
service.take_profit_module.config = tp_config

# Serie de precios simulada
price_series = [
    0.00101,
    0.00102,
    0.00103,
    0.00104,
    0.00105,
]

for price in price_series:
    print(f"\n→ Precio actual: {price:.6f}")
    service.process_price_update(trade_state, price)