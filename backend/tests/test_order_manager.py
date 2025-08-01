# test_order_manager.py

from execution.order_manager import OrderManager

# Símbolo a utilizar
symbol = "BTCUSDT"

# Instancia del OrderManager
manager = OrderManager()

# ✅ Prueba de cancelación individual
# order_id = 12345678  # Reemplaza con un ID real para probar
# manager.cancel_order(symbol, order_id)

# ✅ Prueba de cancelación de todas las órdenes abiertas
print(f"🧹 Cancelando TODAS las órdenes abiertas para {symbol}...")
manager.cancel_all_orders(symbol)