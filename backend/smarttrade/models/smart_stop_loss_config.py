# smart_stop_loss_config.py
from pydantic import BaseModel
from typing import Literal, Optional

class SmartStopLossConfig(BaseModel):
    mode: Literal['fixed', 'percent', 'suggested'] = 'percent'
    fixed_price: Optional[float] = None
    percent_threshold: Optional[float] = 0.05  # 5% por defecto
    allow_dynamic_adjustment: bool = True