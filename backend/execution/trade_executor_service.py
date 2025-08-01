from binance.client import Client
from binance.exceptions import BinanceAPIException
from smarttrade.models.trade_state import TradeState
from config.settings import (
    USE_TESTNET,
    BINANCE_TESTNET_SPOT_BASE_URL,
    BINANCE_TESTNET_API_KEY,
    BINANCE_TESTNET_API_SECRET
)


class TradeExecutorService:
    def __init__(self):
        api_key = BINANCE_TESTNET_API_KEY
        api_secret = BINANCE_TESTNET_API_SECRET
        self.client = Client(api_key, api_secret)
        if USE_TESTNET:
            self.client.API_URL = BINANCE_TESTNET_SPOT_BASE_URL

    def place_market_buy(self, symbol: str, quantity: float):
        try:
            order = self.client.order_market_buy(
                symbol=symbol,
                quantity=quantity
            )
            print(f"[ORDEN COMPRA] Ejecutada: {order['orderId']} - {order['fills']}")
            return order
        except BinanceAPIException as e:
            print(f"[ERROR] Falló orden de compra: {e.message}")
            return None

    def place_market_sell(self, symbol: str, quantity: float):
        try:
            order = self.client.order_market_sell(
                symbol=symbol,
                quantity=quantity
            )
            print(f"[ORDEN VENTA] Ejecutada: {order['orderId']} - {order['fills']}")
            return order
        except BinanceAPIException as e:
            print(f"[ERROR] Falló orden de venta: {e.message}")
            return None
