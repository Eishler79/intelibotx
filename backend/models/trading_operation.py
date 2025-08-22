#!/usr/bin/env python3
"""
📊 TradingOperation Model - Modelo SQLModel para operaciones de trading
Moved from routes/ to models/ for proper architecture compliance

✅ GUARDRAILS P3: Architectural fix - models should be in models/ not routes/
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4
from sqlmodel import SQLModel, Field

class TradeSide(str, Enum):
    """Enum para lado de la operación"""
    BUY = "BUY"
    SELL = "SELL"

class TradeStatus(str, Enum):
    """Enum para estado de la operación"""
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
    algorithm_used: str = None  # Se establecerá dinámicamente
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
    algorithm_used: Optional[str] = None
    confidence: float = 0.0
    trade_metadata: Optional[str] = None

class TradeResponse(SQLModel):
    """Response con detalles de la operación"""
    id: str
    bot_id: int
    user_id: int
    symbol: str
    side: TradeSide
    quantity: float
    price: float
    executed_price: Optional[float]
    strategy: str
    signal: str
    algorithm_used: Optional[str]
    confidence: float
    pnl: float
    commission: float
    realized_pnl: float
    status: TradeStatus
    created_at: datetime
    executed_at: Optional[datetime]
    trade_metadata: Optional[str]