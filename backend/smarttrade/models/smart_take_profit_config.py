# smarttrade/models/smart_take_profit_config.py

from pydantic import BaseModel
from typing import Literal

class SmartTPConfig(BaseModel):
    tp_type: Literal["fixed", "percent", "suggested"] = "suggested"
    fixed_price: float = 0.0
    percent_gain: float = 0.03  # 3%
    suggested_gain_pct: float = 0.025  # 2.5%

# Alias retrocompatible
SmartTakeProfitConfig = SmartTPConfig