from binance.client import Client
from binance.exceptions import BinanceAPIException
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET,
    BINANCE_TESTNET_SPOT_BASE_URL
)

# Parámetros de la orden
SYMBOL = "BTCUSDT"
QUANTITY = 0.001  # Pequeña cantidad para prueba
PRICE = 20000.0   # Precio fijo bajo para asegurarnos que quede como orden límite

def place_test_order():
    # Crear cliente con claves de testnet
    client = Client(BINANCE_TESTNET_API_KEY, BINANCE_TESTNET_API_SECRET)

    # Asignar URL especial de testnet (¡clave!)
    if USE_TESTNET:
        client.API_URL = BINANCE_TESTNET_SPOT_BASE_URL

    try:
        print(f"\n📤 Colocando orden de COMPRA LIMITADA en {SYMBOL} @ {PRICE} USDT")
        order = client.create_order(
            symbol=SYMBOL,
            side=Client.SIDE_BUY,
            type=Client.ORDER_TYPE_LIMIT,
            timeInForce=Client.TIME_IN_FORCE_GTC,
            quantity=QUANTITY,
            price=str(PRICE)
        )
        print("✅ Orden colocada:")
        print(order)
    except BinanceAPIException as e:
        print(f"❌ [BinanceAPIException] {e}")
    except Exception as e:
        print(f"❌ [Error inesperado] {e}")

if __name__ == "__main__":
    place_test_order()