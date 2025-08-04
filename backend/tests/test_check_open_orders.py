# test_check_open_orders.py

from binance.client import Client
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET,
)

# Inicializar cliente en modo Testnet
client = Client(api_key=BINANCE_TESTNET_API_KEY, api_secret=BINANCE_TESTNET_API_SECRET)
if USE_TESTNET:
    client.API_URL = "https://testnet.binance.vision/api"

# Consultar órdenes abiertas para BTCUSDT
symbol = "BTCUSDT"
orders = client.get_open_orders(symbol=symbol)

print("📋 Órdenes abiertas:")
for order in orders:
    print(order)