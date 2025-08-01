from fastapi import APIRouter, HTTPException
from binance.exceptions import BinanceAPIException
import logging
from decimal import Decimal, ROUND_DOWN

from clients import client
from models  import OrderInput, CancelInput
from utils.core import get_minimum
from utils.order import quantize_qty

router = APIRouter(tags=["spot"])
logger = logging.getLogger("uvicorn.error")

@router.post("/order/minimal")
def create_minimal_order(data: OrderInput):
    try:
        # 1) extraemos minNotional y stepSize
        min_notional, step_size = get_minimum(client, data.symbol)

        # 2) calculamos cantidad bruta
        raw_qty = min_notional / data.price

        # 3) truncamos al paso permitido
        qty_str = quantize_qty(raw_qty, step_size)

        # 4) creamos la orden LIMIT GTC
        order = client.create_order(
            symbol      = data.symbol.upper(),
            side        = data.side.upper(),
            type        = "LIMIT",
            timeInForce = "GTC",
            quantity    = qty_str,
            price       = str(data.price),
        )
        return order

    except BinanceAPIException as e:
        # Errores de Binance (precisión, balance, etc.)
        logger.error(f"[Spot] BinanceAPIException {e.status_code}: {e.message}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)

    except Exception:
        # Cualquier otro fallo
        logger.exception("[Spot] Error inesperado creando orden")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.delete("/order")
def cancel_order(data: CancelInput):
    try:
        return client.cancel_order(
            symbol  = data.symbol.upper(),
            orderId = data.orderId,
        )
    except BinanceAPIException as e:
        logger.error(f"[Spot] No se pudo cancelar orden {data.orderId}: {e.message}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception:
        logger.exception("[Spot] Error inesperado cancelando orden")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/orders/{symbol}", tags=["spot"])
def list_spot_orders(symbol: str,):
    """
    Devuelve las órdenes abiertas para un símbolo (spot).
    """
    return client.get_open_orders(symbol=symbol.upper())

@router.get("/orders/all/{symbol}", tags=["spot"])
def list_all_spot_orders(symbol: str,):
    """
    Devuelve todas las órdenes (abiertas y cerradas) para un símbolo (spot).
    """
    return client.get_all_orders(symbol=symbol.upper(), limit=500)