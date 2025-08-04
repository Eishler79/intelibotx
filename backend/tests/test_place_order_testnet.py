from binance.client import Client
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET,
    BINANCE_TESTNET_SPOT_BASE_URL
)

SYMBOL = "BTCUSDT"
QUANTITY = 0.001  # Ajusta según mínimo permitido en testnet

# Inicializa cliente
client = Client(BINANCE_TESTNET_API_KEY, BINANCE_TESTNET_API_SECRET)
if USE_TESTNET:
    client.API_URL = BINANCE_TESTNET_SPOT_BASE_URL

# Obtiene precio actual
price_data = client.get_symbol_ticker(symbol=SYMBOL)
market_price = float(price_data["price"])
limit_price = round(market_price * 0.995, 2)  # 0.5% más bajo

print(f"\n📤 Colocando orden de COMPRA LIMITADA en {SYMBOL} @ {limit_price} USDT")

try:
    order = client.order_limit_buy(
        symbol=SYMBOL,
        quantity=QUANTITY,
        price=str(limit_price)
    )
    print("✅ Orden colocada con éxito:")
    print(order)
except Exception as e:
    print(f"❌ Error al colocar orden: {e}")