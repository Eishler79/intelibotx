"""
Servicio para gestionar el historial de trading y órdenes
"""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlmodel import Session, select, create_engine

from models.trading_order import (
    TradingOrder, Trade, TradingSession, 
    OrderType, OrderSide, OrderStatus, TradeStatus,
    TradingMetrics
)

class TradingHistoryService:
    """Servicio para gestionar historial de trading"""
    
    def __init__(self, db_url: str = "sqlite:///./trading_history.db"):
        self.engine = create_engine(db_url, echo=False)
        # Crear tablas si no existen
        from sqlmodel import SQLModel
        SQLModel.metadata.create_all(self.engine)
        
        # Almacén temporal para órdenes activas (en producción usaríamos Redis)
        self.active_orders: Dict[int, Dict] = {}
        self.active_trades: Dict[int, Dict] = {}
    
    def create_order(self, 
                    bot_id: int,
                    symbol: str,
                    side: OrderSide,
                    order_type: OrderType,
                    quantity: float,
                    strategy: str,
                    market_price: float,
                    confidence: float,
                    price: Optional[float] = None,
                    stop_price: Optional[float] = None) -> TradingOrder:
        """Crear una nueva orden"""
        
        order = TradingOrder(
            bot_id=bot_id,
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            stop_price=stop_price,
            market_price_at_creation=market_price,
            strategy_applied=strategy,
            confidence_level=confidence,
            status=OrderStatus.PENDING
        )
        
        with Session(self.engine) as session:
            session.add(order)
            session.commit()
            session.refresh(order)
        
        # Simular ejecución inmediata para órdenes de mercado
        if order_type == OrderType.MARKET:
            self.simulate_order_fill(order.id, market_price, quantity)
        
        return order
    
    def simulate_order_fill(self, order_id: int, fill_price: float, filled_qty: float):
        """Simular ejecución de orden (para testnet)"""
        
        with Session(self.engine) as session:
            order = session.get(TradingOrder, order_id)
            if order:
                order.status = OrderStatus.FILLED
                order.filled_quantity = filled_qty
                order.avg_fill_price = fill_price
                order.filled_at = datetime.now()
                order.updated_at = datetime.now()
                
                # Simular comisión (0.1% típica de Binance)
                order.commission = filled_qty * fill_price * 0.001
                
                session.add(order)
                session.commit()
                
                # Crear o actualizar trade
                self._handle_trade_creation_or_update(order)
    
    def _handle_trade_creation_or_update(self, order: TradingOrder):
        """Manejar creación o actualización de trade"""
        
        with Session(self.engine) as session:
            # Buscar trade abierto para este bot y símbolo
            statement = select(Trade).where(
                Trade.bot_id == order.bot_id,
                Trade.symbol == order.symbol,
                Trade.status == TradeStatus.OPEN
            )
            existing_trade = session.exec(statement).first()
            
            if order.side == OrderSide.BUY:
                if not existing_trade:
                    # Crear nuevo trade de compra
                    trade = Trade(
                        bot_id=order.bot_id,
                        symbol=order.symbol,
                        strategy=order.strategy_applied,
                        entry_price=order.avg_fill_price,
                        quantity=order.filled_quantity,
                        status=TradeStatus.OPEN,
                        entry_market_conditions={
                            "price": order.market_price_at_creation,
                            "strategy": order.strategy_applied,
                            "confidence": order.confidence_level,
                            "timestamp": order.created_at.isoformat()
                        }
                    )
                    session.add(trade)
                    session.commit()
                    session.refresh(trade)
                    
                    # Actualizar orden con trade_id
                    order.trade_id = trade.id
                    session.add(order)
                    session.commit()
            
            else:  # SELL
                if existing_trade:
                    # Cerrar trade existente
                    existing_trade.exit_price = order.avg_fill_price
                    existing_trade.closed_at = datetime.now()
                    existing_trade.status = TradeStatus.COMPLETED
                    
                    # Calcular P&L
                    existing_trade.realized_pnl = TradingMetrics.calculate_pnl(
                        existing_trade.entry_price,
                        existing_trade.exit_price,
                        existing_trade.quantity,
                        OrderSide.BUY
                    )
                    
                    existing_trade.pnl_percentage = TradingMetrics.calculate_pnl_percentage(
                        existing_trade.entry_price,
                        existing_trade.exit_price,
                        OrderSide.BUY
                    )
                    
                    # Calcular duración
                    duration = datetime.now() - existing_trade.opened_at
                    existing_trade.duration_minutes = int(duration.total_seconds() / 60)
                    
                    existing_trade.exit_market_conditions = {
                        "price": order.market_price_at_creation,
                        "strategy": order.strategy_applied,
                        "timestamp": order.created_at.isoformat()
                    }
                    
                    existing_trade.close_reason = "strategy"
                    
                    session.add(existing_trade)
                    
                    # Actualizar orden con trade_id
                    order.trade_id = existing_trade.id
                    session.add(order)
                    session.commit()
    
    def get_bot_orders(self, bot_id: int, limit: int = 50, status: Optional[OrderStatus] = None) -> List[Dict]:
        """Obtener órdenes de un bot"""
        
        with Session(self.engine) as session:
            statement = select(TradingOrder).where(TradingOrder.bot_id == bot_id)
            
            if status:
                statement = statement.where(TradingOrder.status == status)
            
            statement = statement.order_by(TradingOrder.created_at.desc()).limit(limit)
            
            orders = session.exec(statement).all()
            
            return [self._order_to_dict(order) for order in orders]
    
    def get_bot_trades(self, bot_id: int, limit: int = 50, status: Optional[TradeStatus] = None) -> List[Dict]:
        """Obtener trades de un bot"""
        
        with Session(self.engine) as session:
            statement = select(Trade).where(Trade.bot_id == bot_id)
            
            if status:
                statement = statement.where(Trade.status == status)
            
            statement = statement.order_by(Trade.opened_at.desc()).limit(limit)
            
            trades = session.exec(statement).all()
            
            return [self._trade_to_dict(trade) for trade in trades]
    
    def get_trading_summary(self, bot_id: int, days: int = 30) -> Dict:
        """Obtener resumen de trading"""
        
        with Session(self.engine) as session:
            # Fecha límite
            since_date = datetime.now() - timedelta(days=days)
            
            # Trades completados
            completed_statement = select(Trade).where(
                Trade.bot_id == bot_id,
                Trade.status.in_([TradeStatus.COMPLETED, TradeStatus.STOP_LOSS_HIT, TradeStatus.TAKE_PROFIT_HIT]),
                Trade.closed_at >= since_date
            )
            completed_trades = session.exec(completed_statement).all()
            
            # Trades abiertos
            open_statement = select(Trade).where(
                Trade.bot_id == bot_id,
                Trade.status == TradeStatus.OPEN
            )
            open_trades = session.exec(open_statement).all()
            
            # Cálculos
            total_trades = len(completed_trades)
            winning_trades = len([t for t in completed_trades if t.realized_pnl and t.realized_pnl > 0])
            losing_trades = len([t for t in completed_trades if t.realized_pnl and t.realized_pnl <= 0])
            
            total_pnl = sum([t.realized_pnl for t in completed_trades if t.realized_pnl]) if completed_trades else 0
            total_wins = sum([t.realized_pnl for t in completed_trades if t.realized_pnl and t.realized_pnl > 0]) if completed_trades else 0
            total_losses = sum([t.realized_pnl for t in completed_trades if t.realized_pnl and t.realized_pnl < 0]) if completed_trades else 0
            
            win_rate = TradingMetrics.calculate_win_rate(winning_trades, total_trades)
            profit_factor = TradingMetrics.calculate_profit_factor(total_wins, total_losses)
            
            return {
                "summary": {
                    "period_days": days,
                    "total_trades": total_trades,
                    "winning_trades": winning_trades,
                    "losing_trades": losing_trades,
                    "open_trades": len(open_trades),
                    "win_rate": round(win_rate, 2),
                    "total_pnl": round(total_pnl, 4),
                    "profit_factor": round(profit_factor, 2)
                },
                "performance": {
                    "total_wins": round(total_wins, 4),
                    "total_losses": round(abs(total_losses), 4),
                    "avg_win": round(total_wins / winning_trades, 4) if winning_trades > 0 else 0,
                    "avg_loss": round(abs(total_losses) / losing_trades, 4) if losing_trades > 0 else 0,
                    "largest_win": round(max([t.realized_pnl for t in completed_trades if t.realized_pnl and t.realized_pnl > 0], default=0), 4),
                    "largest_loss": round(min([t.realized_pnl for t in completed_trades if t.realized_pnl and t.realized_pnl < 0], default=0), 4)
                },
                "recent_trades": [self._trade_to_dict(trade) for trade in completed_trades[:10]],
                "open_positions": [self._trade_to_dict(trade) for trade in open_trades]
            }
    
    def _order_to_dict(self, order: TradingOrder) -> Dict:
        """Convertir orden a diccionario"""
        return {
            "id": order.id,
            "bot_id": order.bot_id,
            "symbol": order.symbol,
            "side": order.side,
            "type": order.order_type,
            "quantity": order.quantity,
            "price": order.price,
            "stop_price": order.stop_price,
            "status": order.status,
            "filled_quantity": order.filled_quantity,
            "avg_fill_price": order.avg_fill_price,
            "market_price_at_creation": order.market_price_at_creation,
            "strategy_applied": order.strategy_applied,
            "confidence_level": order.confidence_level,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "filled_at": order.filled_at.isoformat() if order.filled_at else None,
            "commission": order.commission,
            "commission_asset": order.commission_asset,
            "binance_order_id": order.binance_order_id,
            "trade_id": order.trade_id
        }
    
    def _trade_to_dict(self, trade: Trade) -> Dict:
        """Convertir trade a diccionario"""
        return {
            "id": trade.id,
            "bot_id": trade.bot_id,
            "symbol": trade.symbol,
            "strategy": trade.strategy,
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "quantity": trade.quantity,
            "stop_loss_price": trade.stop_loss_price,
            "take_profit_price": trade.take_profit_price,
            "status": trade.status,
            "unrealized_pnl": trade.unrealized_pnl,
            "realized_pnl": trade.realized_pnl,
            "pnl_percentage": trade.pnl_percentage,
            "opened_at": trade.opened_at.isoformat() if trade.opened_at else None,
            "closed_at": trade.closed_at.isoformat() if trade.closed_at else None,
            "duration_minutes": trade.duration_minutes,
            "total_commission": trade.total_commission,
            "close_reason": trade.close_reason,
            "entry_market_conditions": trade.entry_market_conditions,
            "exit_market_conditions": trade.exit_market_conditions
        }

# Instancia global del servicio
trading_history_service = TradingHistoryService()

# Función para simular datos de ejemplo
def create_sample_trading_data(bot_id: int = 1754488379):
    """Crear datos de ejemplo para mostrar en la UI"""
    
    import random
    from datetime import datetime, timedelta
    
    service = TradingHistoryService()
    
    # Simular órdenes de las últimas 2 semanas
    strategies = ["Smart Scalper", "Trend Hunter", "Manipulation Detector", "News Sentiment", "Volatility Master"]
    symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT"]
    
    base_time = datetime.now() - timedelta(days=14)
    
    for i in range(50):  # 50 órdenes de ejemplo
        # Tiempo aleatorio en las últimas 2 semanas
        order_time = base_time + timedelta(
            days=random.randint(0, 14),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59)
        )
        
        symbol = random.choice(symbols)
        strategy = random.choice(strategies)
        side = random.choice([OrderSide.BUY, OrderSide.SELL])
        
        # Precio base según símbolo
        base_prices = {"BTCUSDT": 110000, "ETHUSDT": 3500, "ADAUSDT": 1.2}
        base_price = base_prices[symbol]
        
        # Variación de precio ±5%
        market_price = base_price * (1 + random.uniform(-0.05, 0.05))
        quantity = random.uniform(0.001, 0.1) if symbol == "BTCUSDT" else random.uniform(0.1, 10)
        
        # Crear orden
        order = TradingOrder(
            bot_id=bot_id,
            symbol=symbol,
            side=side,
            order_type=OrderType.MARKET,
            quantity=quantity,
            market_price_at_creation=market_price,
            strategy_applied=strategy,
            confidence_level=random.uniform(0.5, 0.95),
            status=OrderStatus.FILLED,
            filled_quantity=quantity,
            avg_fill_price=market_price * (1 + random.uniform(-0.001, 0.001)),  # Pequeña variación
            filled_at=order_time,
            created_at=order_time,
            commission=quantity * market_price * 0.001
        )
        
        with Session(service.engine) as session:
            session.add(order)
            session.commit()
    
    print(f"✅ Creados datos de ejemplo para bot {bot_id}")
    return True

if __name__ == "__main__":
    # Crear datos de ejemplo
    create_sample_trading_data()