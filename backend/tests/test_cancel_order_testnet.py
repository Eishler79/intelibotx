# test_cancel_order_testnet.py

from binance.client import Client
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET,
)

# Inicializar cliente
client = Client(api_key=BINANCE_TESTNET_API_KEY, api_secret=BINANCE_TESTNET_API_SECRET)
if USE_TESTNET:
    client.API_URL = "https://testnet.binance.vision/api"

# Parámetros
symbol = "BTCUSDT"
order_id = 12535598  # ← Cambia este valor por la orden que quieras cancelar

try:
    result = client.cancel_order(symbol=symbol, orderId=order_id)
    print(f"🗑️ Orden cancelada: {result}")
except Exception as e:
    print(f"❌ Error al cancelar orden: {e}")