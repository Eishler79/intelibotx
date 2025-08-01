from pydantic import BaseModel

class DCAConfig(BaseModel):
    max_orders: int = 3
    deviation_pct: float = 0.025  # 2.5%
    base_order_amount: float = 10.0
    use_multiplier: bool = True
    multiplier: float = 1.5