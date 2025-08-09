"""
Modelo para órdenes de trading con historial detallado
"""

from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime
from typing import Optional
from enum import Enum

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    STOP_LIMIT = "stop_limit"

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    FILLED = "FILLED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"

class TradeStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    COMPLETED = "COMPLETED"
    STOP_LOSS_HIT = "STOP_LOSS_HIT"
    TAKE_PROFIT_HIT = "TAKE_PROFIT_HIT"

class TradingOrder(SQLModel, table=True):
    """Modelo para órdenes individuales"""
    
    __tablename__ = "trading_orders"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(index=True)
    
    # Información básica de la orden
    symbol: str = Field(index=True)
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None  # Para límit orders
    stop_price: Optional[float] = None  # Para stop orders
    
    # Estado y ejecución
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    avg_fill_price: Optional[float] = None
    
    # Información del mercado al momento de crear
    market_price_at_creation: float
    strategy_applied: str
    confidence_level: float
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None
    
    # Información adicional
    commission: float = 0.0
    commission_asset: str = "USDT"
    
    # ID de Binance (si se ejecutó)
    binance_order_id: Optional[str] = None
    
    # Relación con trade
    trade_id: Optional[int] = Field(foreign_key="trades.id", default=None)

class Trade(SQLModel, table=True):
    """Modelo para trades completos (compra + venta)"""
    
    __tablename__ = "trades"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(index=True)
    
    # Información básica del trade
    symbol: str = Field(index=True)
    strategy: str
    
    # Precios y cantidades
    entry_price: float
    exit_price: Optional[float] = None
    quantity: float
    
    # Stop Loss y Take Profit
    stop_loss_price: Optional[float] = None
    take_profit_price: Optional[float] = None
    
    # Estado del trade
    status: TradeStatus = TradeStatus.OPEN
    
    # Cálculos de P&L
    unrealized_pnl: float = 0.0
    realized_pnl: Optional[float] = None
    pnl_percentage: Optional[float] = None
    
    # Información del mercado
    entry_market_conditions: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))  # JSON con RSI, EMAs, etc.
    exit_market_conditions: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    
    # Timestamps
    opened_at: datetime = Field(default_factory=datetime.now)
    closed_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    
    # Comisiones
    total_commission: float = 0.0
    
    # Razón de cierre
    close_reason: Optional[str] = None  # "take_profit", "stop_loss", "manual", "strategy"

class TradingSession(SQLModel, table=True):
    """Modelo para sesiones de trading del bot"""
    
    __tablename__ = "trading_sessions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    bot_id: int = Field(index=True)
    
    # Información de la sesión
    started_at: datetime = Field(default_factory=datetime.now)
    ended_at: Optional[datetime] = None
    
    # Estadísticas de la sesión
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    
    # P&L de la sesión
    total_pnl: float = 0.0
    total_commission: float = 0.0
    net_pnl: float = 0.0
    
    # Métricas
    win_rate: float = 0.0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    profit_factor: float = 0.0
    
    # Drawdown
    max_drawdown: float = 0.0
    max_drawdown_percentage: float = 0.0
    
    # Balance inicial y final
    starting_balance: float
    ending_balance: Optional[float] = None
    
    # Información adicional
    strategy_distribution: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))  # Cuántos trades por estrategia
    symbol_distribution: Optional[dict] = Field(default_factory=dict, sa_column=Column(JSON))   # Cuántos trades por símbolo

# Funciones auxiliares para cálculos
class TradingMetrics:
    """Clase para cálculos de métricas de trading"""
    
    @staticmethod
    def calculate_pnl(entry_price: float, exit_price: float, quantity: float, side: OrderSide) -> float:
        """Calcular P&L de un trade"""
        if side == OrderSide.BUY:
            return (exit_price - entry_price) * quantity
        else:  # SELL
            return (entry_price - exit_price) * quantity
    
    @staticmethod
    def calculate_pnl_percentage(entry_price: float, exit_price: float, side: OrderSide) -> float:
        """Calcular P&L en porcentaje"""
        if side == OrderSide.BUY:
            return ((exit_price - entry_price) / entry_price) * 100
        else:  # SELL
            return ((entry_price - exit_price) / entry_price) * 100
    
    @staticmethod
    def calculate_win_rate(winning_trades: int, total_trades: int) -> float:
        """Calcular tasa de ganancia"""
        return (winning_trades / total_trades * 100) if total_trades > 0 else 0.0
    
    @staticmethod
    def calculate_profit_factor(total_wins: float, total_losses: float) -> float:
        """Calcular factor de ganancia"""
        return (total_wins / abs(total_losses)) if total_losses != 0 else 0.0
    
    @staticmethod
    def calculate_sharpe_ratio(returns: list, risk_free_rate: float = 0.0) -> float:
        """Calcular Sharpe ratio"""
        if len(returns) < 2:
            return 0.0
        
        import statistics
        avg_return = statistics.mean(returns)
        std_return = statistics.stdev(returns)
        
        return (avg_return - risk_free_rate) / std_return if std_return > 0 else 0.0