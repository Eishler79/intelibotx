# execution/order_manager.py

from binance.client import Client
from binance.exceptions import BinanceAPIException
import os
from config.settings import USE_TESTNET, BINANCE_TESTNET_API_KEY, BINANCE_TESTNET_API_SECRET

class OrderManager:
    def __init__(self):
        self.client = Client(api_key=BINANCE_TESTNET_API_KEY, api_secret=BINANCE_TESTNET_API_SECRET)
        if USE_TESTNET:
            self.client.API_URL = "https://testnet.binance.vision/api"

    def cancel_order(self, symbol: str, order_id: int):
        try:
            result = self.client.cancel_order(symbol=symbol, orderId=order_id)
            print(f"🗑️ Orden cancelada exitosamente: {result}")
            return result
        except BinanceAPIException as e:
            print(f"[ERROR] No se pudo cancelar la orden {order_id}: {e}")
            return None

    def cancel_all_orders(self, symbol: str):
        try:
            open_orders = self.client.get_open_orders(symbol=symbol)
            results = []
            for order in open_orders:
                result = self.cancel_order(symbol, order['orderId'])
                results.append(result)
            return results
        except BinanceAPIException as e:
            print(f"[ERROR] No se pudo obtener/cancelar órdenes abiertas: {e}")
            return []