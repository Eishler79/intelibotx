"""
Rutas API para historial de trading y órdenes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

from services.trading_history_service import trading_history_service, create_sample_trading_data
from models.trading_order import OrderType, OrderSide, OrderStatus, TradeStatus

router = APIRouter()

class CreateOrderRequest(BaseModel):
    bot_id: int
    symbol: str = "BTCUSDT"
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    quantity: float
    strategy: str = "Smart Scalper"
    market_price: float
    confidence: float = 0.75
    price: Optional[float] = None
    stop_price: Optional[float] = None

@router.get("/api/bots/{bot_id}/orders")
async def get_bot_orders(
    bot_id: int,
    limit: int = Query(50, le=200),
    status: Optional[OrderStatus] = None
):
    """Obtener historial de órdenes de un bot"""
    try:
        orders = trading_history_service.get_bot_orders(
            bot_id=bot_id,
            limit=limit,
            status=status
        )
        
        return {
            "bot_id": bot_id,
            "total_orders": len(orders),
            "orders": orders
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo órdenes: {str(e)}")

@router.get("/api/bots/{bot_id}/trades")
async def get_bot_trades(
    bot_id: int,
    limit: int = Query(50, le=200),
    status: Optional[TradeStatus] = None
):
    """Obtener historial de trades de un bot"""
    try:
        trades = trading_history_service.get_bot_trades(
            bot_id=bot_id,
            limit=limit,
            status=status
        )
        
        return {
            "bot_id": bot_id,
            "total_trades": len(trades),
            "trades": trades
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo trades: {str(e)}")

@router.get("/api/bots/{bot_id}/trading-summary")
async def get_trading_summary(
    bot_id: int,
    days: int = Query(30, le=365)
):
    """Obtener resumen de trading de un bot"""
    try:
        summary = trading_history_service.get_trading_summary(
            bot_id=bot_id,
            days=days
        )
        
        return {
            "bot_id": bot_id,
            "summary": summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resumen: {str(e)}")

@router.post("/api/bots/{bot_id}/orders")
async def create_order(bot_id: int, order_request: CreateOrderRequest):
    """Crear una nueva orden"""
    try:
        # Validar que bot_id coincida
        if order_request.bot_id != bot_id:
            raise HTTPException(status_code=400, detail="Bot ID no coincide")
        
        order = trading_history_service.create_order(
            bot_id=order_request.bot_id,
            symbol=order_request.symbol,
            side=order_request.side,
            order_type=order_request.order_type,
            quantity=order_request.quantity,
            strategy=order_request.strategy,
            market_price=order_request.market_price,
            confidence=order_request.confidence,
            price=order_request.price,
            stop_price=order_request.stop_price
        )
        
        return {
            "message": f"✅ Orden {order_request.side} creada para {order_request.symbol}",
            "order": trading_history_service._order_to_dict(order)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando orden: {str(e)}")

@router.post("/api/bots/{bot_id}/create-sample-data")
async def create_sample_data(bot_id: int):
    """Crear datos de ejemplo para demostración"""
    try:
        success = create_sample_trading_data(bot_id)
        
        if success:
            return {
                "message": f"✅ Datos de ejemplo creados para bot {bot_id}",
                "bot_id": bot_id,
                "orders_created": 50,
                "note": "Los datos incluyen órdenes simuladas de las últimas 2 semanas"
            }
        else:
            raise HTTPException(status_code=500, detail="Error creando datos de ejemplo")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/api/bots/{bot_id}/performance-metrics")
async def get_performance_metrics(
    bot_id: int,
    days: int = Query(30, le=365)
):
    """Obtener métricas de rendimiento detalladas"""
    try:
        summary = trading_history_service.get_trading_summary(bot_id, days)
        
        # Calcular métricas adicionales
        trades = summary.get("recent_trades", [])
        
        # Distribución por estrategia
        strategy_performance = {}
        for trade in trades:
            strategy = trade.get("strategy", "Unknown")
            if strategy not in strategy_performance:
                strategy_performance[strategy] = {
                    "trades": 0,
                    "wins": 0,
                    "total_pnl": 0.0
                }
            
            strategy_performance[strategy]["trades"] += 1
            if trade.get("realized_pnl", 0) > 0:
                strategy_performance[strategy]["wins"] += 1
            strategy_performance[strategy]["total_pnl"] += trade.get("realized_pnl", 0)
        
        # Calcular win rate por estrategia
        for strategy in strategy_performance:
            perf = strategy_performance[strategy]
            perf["win_rate"] = (perf["wins"] / perf["trades"] * 100) if perf["trades"] > 0 else 0
        
        return {
            "bot_id": bot_id,
            "period_days": days,
            "overall_performance": summary["summary"],
            "detailed_performance": summary["performance"],
            "strategy_breakdown": strategy_performance,
            "open_positions": summary["open_positions"],
            "recent_activity": trades[:10]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo métricas: {str(e)}")

@router.get("/api/trading-history/stats")
async def get_global_stats():
    """Obtener estadísticas globales del sistema"""
    try:
        # Esta sería una implementación más completa en producción
        return {
            "system_stats": {
                "total_bots": 1,
                "active_bots": 1,
                "total_orders_today": 25,
                "total_volume_24h": "1,250 USDT",
                "average_win_rate": "68.5%",
                "top_performing_strategy": "Smart Scalper"
            },
            "market_summary": {
                "most_traded_symbols": ["BTCUSDT", "ETHUSDT", "ADAUSDT"],
                "market_condition": "Bullish",
                "volatility": "Medium"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo estadísticas: {str(e)}")