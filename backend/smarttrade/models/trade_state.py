# models/trade_state.py

from typing import List, Optional
from pydantic import BaseModel

class DCAEntry(BaseModel):
    price: float
    amount: float
    timestamp: float

class TradeState(BaseModel):
    symbol: str
    entries: List[DCAEntry] = []
    base_price: Optional[float] = None
    take_profit_triggered: bool = False
    trailing_high: Optional[float] = None
    stop_loss_price: Optional[float] = None
    current_position_size: float = 0.0

    # 🔽 Nuevos campos opcionales
    cycle_count: int = 0
    auto_restart_enabled: bool = True