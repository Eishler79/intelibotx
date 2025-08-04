# test_smart_take_profit.py

from smarttrade.models.trade_state import TradeState, DCAEntry
from smarttrade.models.smart_take_profit_config import SmartTakeProfitConfig
from smarttrade.modules.smart_take_profit_module import SmartTakeProfitModule
import time

print("--- Pruebas de Smart Take Profit ---")

# Configuraciones de prueba
config = SmartTakeProfitConfig(
    enabled=True,
    method="percent",  # Cambia a 'fixed' o 'suggested' para probar los otros modos
    value=3.0  # Porcentaje o precio fijo, según el método
)

# Instancia del módulo
tp_module = SmartTakeProfitModule(config)

# Estado de entrada simulada
trade_state = TradeState(
    symbol="PEPEUSDT",
    entries=[
        DCAEntry(price=0.0010, amount=100.0, timestamp=time.time()),
    ],
    base_price=0.0010,
    current_position_size=100.0,
    take_profit_triggered=False
)

# Precios simulados (por encima del TP base)
price_series = [
    0.00101, 0.00102, 0.00103,
    0.00104, 0.00105, 0.00106,
    0.00107, 0.00108, 0.00109,
    0.00110  # Debería activar el TP si supera el umbral
]

# Ejecuta la simulación
for price in price_series:
    print(f"\n→ Precio actual: {price:.6f}")
    if tp_module.evaluate_take_profit(trade_state, price):
        print(f"[TP ACTIVO] Se activa Take Profit con precio: {price}")
        break
    else:
        print("[TP INACTIVO]")