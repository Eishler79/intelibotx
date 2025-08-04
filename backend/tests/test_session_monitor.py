# test_session_monitor.py

import time
from execution.session_monitor import SessionMonitor
from smarttrade.smart_trade_service import SmartTradeService
from smarttrade.models.dca_config import DCAConfig
from smarttrade.models.smart_stop_loss_config import SmartStopLossConfig
from smarttrade.models.smart_take_profit_config import SmartTPConfig
from smarttrade.models.trade_state import TradeState

# Configuración inicial
symbol = "BTCUSDT"
interval = 3  # segundos entre precios simulados

# Simula precios (ajusta esta lista para probar distintos escenarios)
simulated_prices = [
    106000.0,  # 🔹 Base inicial
    105900.0,  # 🔻 Baja leve, posible entrada DCA
    105500.0,  # 🔻 Más abajo, segunda DCA (si lo soportas)
    106400.0,  # 🔼 Rebote fuerte, se establece trailing
    106700.0,  # 🔼 Nuevo máximo con trailing
    106200.0,  # 🔽 Retroceso: ¿activa TP con trailing?
    100400.0,  # 🔻 Cae fuerte: se activa Stop Loss (SL 1.5%)
    109000.0,  # 🔼 Sube directo, activa TP por sugerido (2%)
    110000.0,  # sube más (actualiza máximo)
    108500.0,  # retroceso del 1.37% → debería activar cierre por trailing
    99500.0,  # 🔻 Fuerte caída, activa Stop Loss
    110000.0,  # 🔼 Sube de nuevo, pero ya no hay posición abierta
]

# Inicializa estado de la operación (simulado)
trade_state = TradeState(symbol=symbol, base_price=None, current_position_size=1.0, auto_restart_enabled=True  # 🔁 Habilita reinicio automático tras TP o SL
)

# Configuraciones del sistema inteligente
dca_config = DCAConfig(base_order_size=10.0, safety_order_size=10.0)
tp_config = SmartTPConfig(tp_type="suggested", suggested_gain_pct=0.02)  # TP 2%
sl_config = SmartStopLossConfig(max_loss_pct=0.015)  # SL 1.5%

# Inicializa el servicio
smart_trade_service = SmartTradeService(
    dca_config=dca_config,
    stop_loss_config=sl_config,
    tp_config=tp_config
)

# Simulación secuencial
print(f"🧪 Simulando monitoreo de precios para {symbol}")

for price in simulated_prices:
    print(f"\n💹 Precio simulado: {price:.2f} USDT")
    print(f"🌀 Ciclo actual: {trade_state.cycle_count}")

    try:
        smart_trade_service.process_price_update(trade_state, price)
    except Exception as e:
        print(f"[ERROR] {e}")

    time.sleep(interval)