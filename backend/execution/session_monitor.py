# execution/session_monitor.py

import time
from execution.trade_executor_service import TradeExecutorService
from smarttrade.smart_trade_service import SmartTradeService
from smarttrade.models.trade_state import TradeState
from utils.client import get_price

class SessionMonitor:
    def __init__(self, symbol: str, smart_trade_service: SmartTradeService, trade_state: TradeState = None, interval: float = 10.0):
        self.symbol = symbol.upper()
        self.interval = interval  # segundos entre actualizaciones
        self.smart_trade_service = smart_trade_service
        self.trade_state = trade_state or TradeState(symbol=self.symbol, base_price=0.0)

    def start(self):
        print(f"📡 Iniciando monitor de sesión para {self.symbol} cada {self.interval} segundos")

        while True:
            try:
                current_price = get_price(self.symbol)
                print(f"💹 Precio actual de {self.symbol}: {current_price} USDT")

                self.trade_state.current_price = current_price
                self.smart_trade_service.process_price_update(self.trade_state, current_price)

                time.sleep(self.interval)

            except Exception as e:
                print(f"[ERROR] Fallo durante la sesión: {e}")
                time.sleep(self.interval)