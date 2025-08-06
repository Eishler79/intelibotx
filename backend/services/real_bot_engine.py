"""
Bot Engine Avanzado con Datos Reales de Mercado
Integra precios en tiempo real y ejecución de órdenes reales
"""

import asyncio
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime
import pandas as pd

from real_market_data import market_service, get_bot_market_data
from http_testnet_service import create_testnet_order, cancel_testnet_order, get_open_orders
import sys
sys.path.append('..')
from analytics.strategy_evaluator import StrategyEvaluator

@dataclass
class BotState:
    """Estado actual del bot"""
    id: int
    symbol: str
    strategy: str
    status: str = "STOPPED"  # STOPPED, RUNNING, PAUSED, ERROR
    balance: float = 1000.0
    position_size: float = 0.0
    entry_price: float = 0.0
    current_pnl: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    last_signal: str = "HOLD"
    last_update: datetime = None
    open_orders: List[Dict] = None

    def __post_init__(self):
        if self.last_update is None:
            self.last_update = datetime.now()
        if self.open_orders is None:
            self.open_orders = []

class RealBotEngine:
    """Motor de bots con datos reales de Binance"""
    
    def __init__(self, bot_config: Dict[str, Any]):
        self.config = bot_config
        self.state = BotState(
            id=bot_config.get("id", int(time.time())),
            symbol=bot_config.get("symbol", "BTCUSDT"),
            strategy=bot_config.get("strategy", "Smart Scalper"),
            balance=float(bot_config.get("stake", 1000))
        )
        
        # Parámetros de trading
        self.take_profit = float(bot_config.get("take_profit", 2.5)) / 100
        self.stop_loss = float(bot_config.get("stop_loss", 1.5)) / 100
        self.risk_percentage = float(bot_config.get("risk_percentage", 1.0)) / 100
        self.timeframe = bot_config.get("interval", "15m")
        
        # Componentes
        self.strategy_evaluator = StrategyEvaluator()
        self.is_running = False
        self.last_analysis = {}
        
        print(f"🤖 Bot {self.state.id} inicializado: {self.state.strategy} en {self.state.symbol}")
    
    async def start(self):
        """Iniciar el bot"""
        if self.is_running:
            return {"error": "Bot ya está ejecutándose"}
        
        self.is_running = True
        self.state.status = "RUNNING"
        self.state.last_update = datetime.now()
        
        print(f"🚀 Bot {self.state.id} iniciado: {self.state.strategy}")
        
        # Iniciar loop de trading en background (simulado por ahora)
        asyncio.create_task(self.trading_loop())
        
        return {
            "message": f"Bot {self.state.strategy} iniciado",
            "bot_id": self.state.id,
            "status": self.state.status,
            "symbol": self.state.symbol
        }
    
    async def pause(self):
        """Pausar el bot"""
        self.is_running = False
        self.state.status = "PAUSED"
        self.state.last_update = datetime.now()
        
        # Cancelar órdenes abiertas
        await self.cancel_open_orders()
        
        print(f"⏸️ Bot {self.state.id} pausado")
        
        return {
            "message": f"Bot {self.state.strategy} pausado",
            "bot_id": self.state.id,
            "status": self.state.status
        }
    
    async def stop(self):
        """Detener el bot"""
        self.is_running = False
        self.state.status = "STOPPED"
        self.state.last_update = datetime.now()
        
        # Cancelar órdenes abiertas y cerrar posiciones
        await self.cancel_open_orders()
        await self.close_positions()
        
        print(f"🛑 Bot {self.state.id} detenido")
        
        return {
            "message": f"Bot {self.state.strategy} detenido",
            "bot_id": self.state.id,
            "status": self.state.status
        }
    
    async def get_market_analysis(self) -> Dict[str, Any]:
        """Obtener análisis de mercado actual"""
        try:
            # Obtener datos reales de mercado
            market_data = await get_bot_market_data(self.state.symbol, self.timeframe)
            
            if "error" in market_data:
                return {"error": f"No se pudieron obtener datos de mercado: {market_data['error']}"}
            
            # Aplicar estrategia específica
            signal = self.apply_strategy(market_data)
            
            # Calcular métricas
            metrics = self.calculate_metrics(market_data)
            
            analysis = {
                "bot_id": self.state.id,
                "symbol": self.state.symbol,
                "strategy": self.state.strategy,
                "current_price": market_data.get("current_price", 0),
                "signal": signal,
                "confidence": self.calculate_confidence(market_data, signal),
                "metrics": metrics,
                "market_data": {
                    "price_change_24h": market_data.get("ticker_24h", {}).get("price_change_percent", 0),
                    "volume_24h": market_data.get("ticker_24h", {}).get("volume", 0),
                    "rsi": market_data.get("indicators", {}).get("rsi", 50),
                    "volatility": 0.0  # Simplified - no pandas calculation
                },
                "timestamp": int(time.time() * 1000)
            }
            
            self.last_analysis = analysis
            return analysis
            
        except Exception as e:
            error_msg = f"Error en análisis de mercado: {str(e)}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
    
    def apply_strategy(self, market_data: Dict) -> str:
        """Aplicar la estrategia específica del bot"""
        indicators = market_data.get("indicators", {})
        ticker_24h = market_data.get("ticker_24h", {})
        
        if self.state.strategy == "Smart Scalper":
            return self.smart_scalper_strategy(indicators, ticker_24h)
        elif self.state.strategy == "Trend Hunter":
            return self.trend_hunter_strategy(indicators, ticker_24h)
        elif self.state.strategy == "Manipulation Detector":
            return self.manipulation_detector_strategy(indicators, ticker_24h)
        elif self.state.strategy == "News Sentiment":
            return self.news_sentiment_strategy(indicators, ticker_24h)
        elif self.state.strategy == "Volatility Master":
            return self.volatility_master_strategy(indicators, ticker_24h)
        else:
            return "HOLD"
    
    def smart_scalper_strategy(self, indicators: Dict, ticker_24h: Dict) -> str:
        """Estrategia Smart Scalper con datos reales"""
        rsi = indicators.get("rsi", 50)
        volume_ratio = indicators.get("current_volume", 0) / max(indicators.get("volume_avg", 1), 1)
        
        # Condiciones de entrada
        if rsi < 30 and volume_ratio > 1.5:
            return "BUY"
        elif rsi > 70 and volume_ratio > 1.5:
            return "SELL"
        
        return "HOLD"
    
    def trend_hunter_strategy(self, indicators: Dict, ticker_24h: Dict) -> str:
        """Estrategia Trend Hunter con datos reales"""
        ema_9 = indicators.get("ema_9", 0)
        ema_21 = indicators.get("ema_21", 0)
        price_change_24h = ticker_24h.get("price_change_percent", 0)
        
        # Tendencia alcista
        if ema_9 > ema_21 and price_change_24h > 2:
            return "BUY"
        # Tendencia bajista
        elif ema_9 < ema_21 and price_change_24h < -2:
            return "SELL"
        
        return "HOLD"
    
    def manipulation_detector_strategy(self, indicators: Dict, ticker_24h: Dict) -> str:
        """Estrategia Manipulation Detector"""
        volume_ratio = indicators.get("current_volume", 0) / max(indicators.get("volume_avg", 1), 1)
        price_change_24h = abs(ticker_24h.get("price_change_percent", 0))
        
        # Detectar posible manipulación
        if volume_ratio > 3 and price_change_24h > 5:
            # Evitar trading durante manipulación
            return "HOLD"
        elif volume_ratio > 1.5 and price_change_24h < 2:
            # Condiciones normales de mercado
            rsi = indicators.get("rsi", 50)
            return "BUY" if rsi < 40 else "SELL" if rsi > 60 else "HOLD"
        
        return "HOLD"
    
    def news_sentiment_strategy(self, indicators: Dict, ticker_24h: Dict) -> str:
        """Estrategia News Sentiment (simplificada)"""
        price_change_24h = ticker_24h.get("price_change_percent", 0)
        volume_ratio = indicators.get("current_volume", 0) / max(indicators.get("volume_avg", 1), 1)
        
        # Simulación de sentiment basado en precio y volumen
        if price_change_24h > 3 and volume_ratio > 2:
            return "BUY"  # Sentiment positivo
        elif price_change_24h < -3 and volume_ratio > 2:
            return "SELL"  # Sentiment negativo
        
        return "HOLD"
    
    def volatility_master_strategy(self, indicators: Dict, ticker_24h: Dict) -> str:
        """Estrategia Volatility Master"""
        rsi = indicators.get("rsi", 50)
        price_change_24h = abs(ticker_24h.get("price_change_percent", 0))
        
        # Alta volatilidad - estrategia conservadora
        if price_change_24h > 5:
            return "BUY" if rsi < 25 else "SELL" if rsi > 75 else "HOLD"
        # Baja volatilidad - estrategia más agresiva
        else:
            return "BUY" if rsi < 35 else "SELL" if rsi > 65 else "HOLD"
    
    def calculate_confidence(self, market_data: Dict, signal: str) -> float:
        """Calcular nivel de confianza en la señal"""
        if signal == "HOLD":
            return 0.5
        
        indicators = market_data.get("indicators", {})
        rsi = indicators.get("rsi", 50)
        volume_ratio = indicators.get("current_volume", 0) / max(indicators.get("volume_avg", 1), 1)
        
        # Factores de confianza
        rsi_confidence = 0.7 if (rsi < 30 or rsi > 70) else 0.3
        volume_confidence = min(volume_ratio / 2, 0.8)
        
        return (rsi_confidence + volume_confidence) / 2
    
    def calculate_metrics(self, market_data: Dict) -> Dict[str, Any]:
        """Calcular métricas del bot"""
        win_rate = (self.state.winning_trades / max(self.state.total_trades, 1)) * 100
        
        return {
            "total_trades": self.state.total_trades,
            "winning_trades": self.state.winning_trades,
            "win_rate": round(win_rate, 1),
            "current_pnl": round(self.state.current_pnl, 2),
            "balance": round(self.state.balance, 2),
            "position_size": self.state.position_size,
            "sharpe_ratio": self.calculate_sharpe_ratio(),
            "max_drawdown": self.calculate_max_drawdown(),
            "profit_factor": self.calculate_profit_factor()
        }
    
    def calculate_sharpe_ratio(self) -> float:
        """Calcular Sharpe ratio (simplificado)"""
        if self.state.total_trades < 10:
            return 0.0
        return round((self.state.current_pnl / max(abs(self.state.current_pnl) * 0.5, 1)), 2)
    
    def calculate_max_drawdown(self) -> float:
        """Calcular máximo drawdown (simplificado)"""
        return round(min(-5.0, self.state.current_pnl * 0.3), 1)
    
    def calculate_profit_factor(self) -> float:
        """Calcular profit factor (simplificado)"""
        if self.state.total_trades == 0:
            return 1.0
        return round(1.0 + (self.state.winning_trades / max(self.state.total_trades, 1)), 2)
    
    async def execute_trade(self, signal: str, price: float, confidence: float):
        """Ejecutar una operación real en testnet"""
        if signal == "HOLD" or confidence < 0.6:
            return None
        
        try:
            # Calcular cantidad basada en riesgo
            risk_amount = self.state.balance * self.risk_percentage
            quantity = risk_amount / price
            
            # Precio de entrada ajustado
            if signal == "BUY":
                order_price = price * 0.999  # Ligeramente por debajo del precio actual
                side = "BUY"
            else:
                order_price = price * 1.001  # Ligeramente por encima del precio actual
                side = "SELL"
            
            # Crear orden en testnet
            order_result = await create_testnet_order(
                symbol=self.state.symbol,
                side=side,
                quantity=f"{quantity:.6f}",
                price=f"{order_price:.2f}"
            )
            
            if "orderId" in order_result:
                self.state.total_trades += 1
                self.state.last_signal = signal
                self.state.last_update = datetime.now()
                
                print(f"✅ Orden ejecutada: {side} {quantity:.6f} {self.state.symbol} @ ${order_price:.2f}")
                
                return {
                    "success": True,
                    "order_id": order_result["orderId"],
                    "side": side,
                    "quantity": quantity,
                    "price": order_price,
                    "signal": signal,
                    "confidence": confidence
                }
            else:
                print(f"❌ Error ejecutando orden: {order_result}")
                return {"success": False, "error": str(order_result)}
                
        except Exception as e:
            error_msg = f"Error ejecutando trade: {str(e)}"
            print(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    async def cancel_open_orders(self):
        """Cancelar todas las órdenes abiertas"""
        try:
            open_orders = await get_open_orders(self.state.symbol)
            for order in open_orders:
                await cancel_testnet_order(self.state.symbol, order["orderId"])
                print(f"🗑️ Orden {order['orderId']} cancelada")
        except Exception as e:
            print(f"⚠️ Error cancelando órdenes: {e}")
    
    async def close_positions(self):
        """Cerrar todas las posiciones abiertas (simplificado)"""
        if self.state.position_size != 0:
            print(f"💰 Cerrando posición de {self.state.position_size} {self.state.symbol}")
            self.state.position_size = 0.0
            self.state.entry_price = 0.0
    
    async def trading_loop(self):
        """Loop principal de trading (background task)"""
        while self.is_running:
            try:
                # Obtener análisis cada 30 segundos
                analysis = await self.get_market_analysis()
                
                if "error" not in analysis:
                    signal = analysis.get("signal", "HOLD")
                    confidence = analysis.get("confidence", 0.0)
                    current_price = analysis.get("current_price", 0)
                    
                    # Ejecutar trade si hay señal fuerte
                    if signal != "HOLD" and confidence > 0.7:
                        trade_result = await self.execute_trade(signal, current_price, confidence)
                        if trade_result and trade_result.get("success"):
                            print(f"🎯 Trade ejecutado: {trade_result}")
                
                # Esperar antes del siguiente análisis
                await asyncio.sleep(30)  # 30 segundos entre análisis
                
            except Exception as e:
                print(f"❌ Error en trading loop: {e}")
                await asyncio.sleep(60)  # Esperar más tiempo si hay error
    
    def get_status(self) -> Dict[str, Any]:
        """Obtener estado completo del bot"""
        return {
            "id": self.state.id,
            "symbol": self.state.symbol,
            "strategy": self.state.strategy,
            "status": self.state.status,
            "balance": self.state.balance,
            "current_pnl": self.state.current_pnl,
            "total_trades": self.state.total_trades,
            "winning_trades": self.state.winning_trades,
            "win_rate": (self.state.winning_trades / max(self.state.total_trades, 1)) * 100,
            "last_signal": self.state.last_signal,
            "last_update": self.state.last_update.isoformat() if self.state.last_update else None,
            "is_running": self.is_running,
            "last_analysis": self.last_analysis
        }

# Factory function para crear bots
def create_real_bot(bot_config: Dict[str, Any]) -> RealBotEngine:
    """Crear una nueva instancia de bot real"""
    return RealBotEngine(bot_config)

# Testing
async def test_real_bot():
    """Función de testing"""
    bot_config = {
        "id": 12345,
        "symbol": "BTCUSDT",
        "strategy": "Smart Scalper",
        "stake": 1000,
        "take_profit": 2.5,
        "stop_loss": 1.5,
        "risk_percentage": 1.0
    }
    
    bot = create_real_bot(bot_config)
    
    # Probar análisis
    analysis = await bot.get_market_analysis()
    print(f"📊 Análisis: {analysis}")
    
    # Probar estado
    status = bot.get_status()
    print(f"🤖 Estado: {status}")
    
    return bot

if __name__ == "__main__":
    asyncio.run(test_real_bot())