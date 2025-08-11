"""
🔄 Trading Operations API - Sistema de Persistencia para Trading en Vivo
Endpoints para almacenar y recuperar operaciones de trading con IDs únicos
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import uuid4
import json

from db.database import get_session
from services.auth_service import get_current_user
from models.user import User

router = APIRouter()

# Modelo para operaciones de trading
from sqlmodel import SQLModel, Field
from enum import Enum

class TradeSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class TradeStatus(str, Enum):
    EXECUTED = "EXECUTED"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"

class TradingOperation(SQLModel, table=True):
    """Modelo para operaciones de trading persistentes"""
    __tablename__ = "trading_operations"
    
    # Identificadores
    id: str = Field(primary_key=True, default_factory=lambda: str(uuid4()))
    bot_id: int = Field(foreign_key="botconfig.id")
    user_id: int = Field(foreign_key="user.id")
    
    # Datos de la operación
    symbol: str
    side: TradeSide
    quantity: float
    price: float
    executed_price: Optional[float] = None
    
    # Estrategia y señal
    strategy: str = "Smart Scalper"
    signal: str = "Unknown"
    algorithm_used: str = "EMA_CROSSOVER"
    confidence: float = 0.0
    
    # P&L y métricas
    pnl: float = 0.0
    commission: float = 0.0
    realized_pnl: float = 0.0
    
    # Estado
    status: TradeStatus = TradeStatus.EXECUTED
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    executed_at: Optional[datetime] = None
    
    # Metadatos
    trade_metadata: Optional[str] = None  # JSON string para datos adicionales

class CreateTradeRequest(SQLModel):
    """Request para crear nueva operación"""
    bot_id: int
    symbol: str
    side: TradeSide
    quantity: float
    price: float
    strategy: str = "Smart Scalper"
    signal: str = "Unknown"
    algorithm_used: str = "EMA_CROSSOVER"
    confidence: float = 0.0
    pnl: float = 0.0

@router.post("/api/bots/{bot_id}/trading-operations")
async def create_trading_operation(
    bot_id: int,
    trade: CreateTradeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    🎯 Crear nueva operación de trading persistente
    
    **Sustituye**: La generación de trades en memoria del frontend
    **Beneficio**: Los trades persisten entre sesiones
    """
    try:
        # Verificar que bot_id en URL coincida con request
        if bot_id != trade.bot_id:
            raise HTTPException(status_code=400, detail="Bot ID mismatch")
        
        # Crear operación
        operation = TradingOperation(
            bot_id=trade.bot_id,
            user_id=current_user.id,
            symbol=trade.symbol,
            side=trade.side,
            quantity=trade.quantity,
            price=trade.price,
            executed_price=trade.price,  # Para simulación
            strategy=trade.strategy,
            signal=trade.signal,
            algorithm_used=trade.algorithm_used,
            confidence=trade.confidence,
            pnl=trade.pnl,
            status=TradeStatus.EXECUTED,
            executed_at=datetime.utcnow()
        )
        
        session.add(operation)
        session.commit()
        session.refresh(operation)
        
        return {
            "success": True,
            "trade_id": operation.id,
            "message": f"Trading operation created for {trade.symbol}",
            "operation": {
                "id": operation.id,
                "bot_id": operation.bot_id,
                "symbol": operation.symbol,
                "side": operation.side,
                "quantity": operation.quantity,
                "price": operation.price,
                "pnl": operation.pnl,
                "strategy": operation.strategy,
                "signal": operation.signal,
                "algorithm_used": operation.algorithm_used,
                "confidence": operation.confidence,
                "created_at": operation.created_at.isoformat(),
                "executed_at": operation.executed_at.isoformat() if operation.executed_at else None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating trading operation: {str(e)}")

@router.get("/api/bots/{bot_id}/trading-operations")
async def get_bot_trading_operations(
    bot_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    side: Optional[TradeSide] = None,
    days: int = Query(7, ge=1, le=365),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    📊 Obtener operaciones de trading de un bot con paginación
    
    **Sustituye**: bot.liveTradeHistory del frontend
    **Beneficio**: Datos persisten + paginación + filtros
    """
    try:
        # Query base
        query = select(TradingOperation).where(
            TradingOperation.bot_id == bot_id,
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(days=days)
        )
        
        # Filtro por side si se proporciona
        if side:
            query = query.where(TradingOperation.side == side)
        
        # Ordenar por fecha descendente
        query = query.order_by(TradingOperation.created_at.desc())
        
        # Paginación
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        # Ejecutar query
        operations = session.exec(query).all()
        
        # Count total para paginación
        count_query = select(TradingOperation).where(
            TradingOperation.bot_id == bot_id,
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(days=days)
        )
        if side:
            count_query = count_query.where(TradingOperation.side == side)
        
        total_count = len(session.exec(count_query).all())
        total_pages = (total_count + limit - 1) // limit
        
        # Formatear respuesta
        operations_data = []
        for op in operations:
            operations_data.append({
                "id": op.id,
                "symbol": op.symbol,
                "side": op.side,
                "quantity": op.quantity,
                "price": op.price,
                "executed_price": op.executed_price,
                "pnl": op.pnl,
                "strategy": op.strategy,
                "signal": op.signal,
                "algorithm_used": op.algorithm_used,
                "confidence": op.confidence,
                "status": op.status,
                "created_at": op.created_at.isoformat(),
                "executed_at": op.executed_at.isoformat() if op.executed_at else None
            })
        
        return {
            "success": True,
            "bot_id": bot_id,
            "operations": operations_data,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trading operations: {str(e)}")

@router.get("/api/trading-operations/{trade_id}")
async def get_trading_operation(
    trade_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    🔍 Obtener operación específica por ID
    
    **Responde a**: Consulta #2 del usuario sobre IDs de operaciones
    """
    try:
        operation = session.exec(
            select(TradingOperation).where(
                TradingOperation.id == trade_id,
                TradingOperation.user_id == current_user.id
            )
        ).first()
        
        if not operation:
            raise HTTPException(status_code=404, detail="Trading operation not found")
        
        return {
            "success": True,
            "operation": {
                "id": operation.id,
                "bot_id": operation.bot_id,
                "symbol": operation.symbol,
                "side": operation.side,
                "quantity": operation.quantity,
                "price": operation.price,
                "executed_price": operation.executed_price,
                "pnl": operation.pnl,
                "commission": operation.commission,
                "strategy": operation.strategy,
                "signal": operation.signal,
                "algorithm_used": operation.algorithm_used,
                "confidence": operation.confidence,
                "status": operation.status,
                "created_at": operation.created_at.isoformat(),
                "executed_at": operation.executed_at.isoformat() if operation.executed_at else None,
                "binance_order_id": None  # Para futuro uso con órdenes reales
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching operation: {str(e)}")

@router.get("/api/trading-feed/live")
async def get_live_trading_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    bot_ids: Optional[str] = Query(None),  # Comma-separated bot IDs
    hours: int = Query(24, ge=1, le=168),  # Últimas X horas
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    ⚡ Feed en vivo de todas las operaciones de trading con paginación
    
    **Sustituye**: LiveTradingFeed component data source
    **Beneficio**: Datos persisten + filtros por bots + tiempo real + paginación
    """
    try:
        # Query base
        base_query = select(TradingOperation).where(
            TradingOperation.user_id == current_user.id,
            TradingOperation.created_at >= datetime.utcnow() - timedelta(hours=hours)
        )
        
        # Filtro por bot IDs si se proporciona
        if bot_ids:
            bot_id_list = [int(x.strip()) for x in bot_ids.split(',') if x.strip().isdigit()]
            if bot_id_list:
                base_query = base_query.where(TradingOperation.bot_id.in_(bot_id_list))
        
        # Count total para paginación
        count_query = base_query
        total_count = len(session.exec(count_query).all())
        total_pages = (total_count + limit - 1) // limit
        
        # Query con paginación
        query = base_query.order_by(TradingOperation.created_at.desc())
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        operations = session.exec(query).all()
        
        # Formatear para Trading Live Feed
        feed_data = []
        for op in operations:
            # Calcular tiempo relativo
            time_diff = datetime.utcnow() - op.created_at
            total_seconds = int(time_diff.total_seconds())
            
            if total_seconds < 60:
                time_ago = f"{total_seconds}s ago"
            elif total_seconds < 3600:
                time_ago = f"{total_seconds // 60}m ago"
            elif total_seconds < 86400:
                time_ago = f"{total_seconds // 3600}h ago"
            else:
                time_ago = f"{total_seconds // 86400}d ago"
            
            feed_data.append({
                "id": op.id,
                "bot_id": op.bot_id,
                "symbol": op.symbol,
                "side": op.side,
                "quantity": op.quantity,
                "price": op.price,
                "pnl": op.pnl,
                "strategy": op.strategy,
                "signal": op.signal,
                "algorithm_used": op.algorithm_used,
                "confidence": op.confidence,
                "timestamp": op.created_at.isoformat(),
                "time_ago": time_ago,
                "profit": op.pnl > 0
            })
        
        return {
            "success": True,
            "feed": feed_data,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "limit": limit,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "time_window_hours": hours
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching live feed: {str(e)}")

@router.delete("/api/trading-operations/{trade_id}")
async def delete_trading_operation(
    trade_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """🗑️ Eliminar operación de trading (solo para correcciones)"""
    try:
        operation = session.exec(
            select(TradingOperation).where(
                TradingOperation.id == trade_id,
                TradingOperation.user_id == current_user.id
            )
        ).first()
        
        if not operation:
            raise HTTPException(status_code=404, detail="Trading operation not found")
        
        session.delete(operation)
        session.commit()
        
        return {
            "success": True,
            "message": f"Trading operation {trade_id} deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting operation: {str(e)}")