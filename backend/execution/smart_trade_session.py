from intelligence.smart_trade_intelligence import SmartTradeIntelligence
from execution.trade_executor_service import TradeExecutorService
import os
import time
from logger.trade_logger import log_operation  # ✅ función correcta
from logger.daily_logger import log_operation_detail
from datetime import datetime

class SmartTradeSession:
    def __init__(self, symbol: str, interval: str = "15m", stake: float = 20.0):
        self.symbol = symbol.upper()
        self.interval = interval
        self.stake = stake
        self.api_key = os.getenv("BINANCE_API_KEY")
        self.api_secret = os.getenv("BINANCE_API_SECRET")
        self.executor = TradeExecutorService()

    def run(self):
        print(f"\n🚀 Iniciando sesión inteligente en tiempo real para {self.symbol} [{self.interval}]\n")
        intelligence = SmartTradeIntelligence(self.symbol, self.interval)
        result = intelligence.analyze(show_dashboard=True, auto_decision=True)

        decision = result.get("auto_decision", {})
        action = decision.get("action")
        reason = decision.get("reason", "N/A")
        print(f"🤖 Decisión automática: {action.upper()} - Motivo: {reason}")

        operation_data = {
            "symbol": self.symbol,
            "interval": self.interval,
            "stake": self.stake,
            "action": action,
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat()
        }

        if action == "long":
            print(f"✅ Ejecutando orden de COMPRA por ${self.stake} en {self.symbol}")
            self.executor.place_market_buy(
                symbol=self.symbol,
                quantity=self._estimate_quantity(self.stake, self.symbol)
            )
            operation_data["status"] = "executed_buy"
        elif action == "short":
            print(f"✅ Ejecutando orden de VENTA por ${self.stake} en {self.symbol}")
            self.executor.place_market_sell(
                symbol=self.symbol,
                quantity=self._estimate_quantity(self.stake, self.symbol)
            )
            operation_data["status"] = "executed_sell"
        else:
            print("⏸️ Sin acción tomada. Esperando mejor oportunidad.")
            operation_data["status"] = "no_action"

        # ✅ Guardar log
        log_operation(operation_data)
        
        # Ya existe: save_operation_log(operation_data)
        log_operation_detail(operation_data)

    def _estimate_quantity(self, usd_amount: float, symbol: str):
        from binance.client import Client
        spot_client = Client(self.api_key, self.api_secret)
        ticker = spot_client.get_symbol_ticker(symbol=symbol)
        price = float(ticker["price"])
        quantity = usd_amount / price
        return round(quantity, 5)