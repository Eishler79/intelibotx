from pydantic import BaseModel

class OrderInput(BaseModel):
    symbol: str    # p.ej. "ETHUSDT"
    side: str      # "BUY" o "SELL"
    price: float   # precio límite

class CancelInput(BaseModel):
    symbol: str
    orderId: int