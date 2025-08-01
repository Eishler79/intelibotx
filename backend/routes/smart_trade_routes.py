# routes/smart_trade_routes.py

from fastapi import APIRouter, Path, Query
from execution.smart_trade_session import SmartTradeSession

router = APIRouter()

@router.post("/run-smart-trade/{symbol}", summary="Ejecutar sesión de trading inteligente")
def run_smart_trade(
    symbol: str = Path(..., description="Símbolo de trading, ej: BTCUSDT"),
    interval: str = Query("15m", description="Intervalo de velas, ej: 15m"),
    stake: float = Query(20.0, description="Monto a usar por operación en USDT")
):
    session = SmartTradeSession(symbol=symbol, interval=interval, stake=stake)
    session.run()
    return {"message": f"Sesión ejecutada para {symbol} en {interval} con ${stake}"}