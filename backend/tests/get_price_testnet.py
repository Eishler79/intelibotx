from binance.client import Client
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET,
    BINANCE_TESTNET_SPOT_BASE_URL
)

SYMBOL = "BTCUSDT"

client = Client(BINANCE_TESTNET_API_KEY, BINANCE_TESTNET_API_SECRET)
if USE_TESTNET:
    client.API_URL = BINANCE_TESTNET_SPOT_BASE_URL

price = client.get_symbol_ticker(symbol=SYMBOL)
print(f"🟢 Precio actual de {SYMBOL} en Testnet: {price['price']}")