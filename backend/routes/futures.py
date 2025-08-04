from fastapi import APIRouter, HTTPException
from binance.exceptions import BinanceAPIException
import logging
from decimal import Decimal, ROUND_DOWN

from clients import client
from models  import OrderInput, CancelInput
from utils.core import get_minimum_futures
from utils.order import quantize_qty

router = APIRouter(tags=["futures"])
logger = logging.getLogger("uvicorn.error")


@router.post("/order/minimal")
def create_minimal_futures_order(data: OrderInput):
    try:
        # 1) obtenemos minNotional y stepSize de futuros
        min_notional, step_size = get_minimum_futures(client, data.symbol)

        # 2) cantidad bruta
        raw_qty = min_notional / data.price

        # 3) truncado a precisión permitida
        qty_str = quantize_qty(raw_qty, step_size)

        # 4) enviamos la orden de futuros
        order = client.futures_create_order(
            symbol      = data.symbol.upper(),
            side        = data.side.upper(),
            type        = "LIMIT",
            timeInForce = "GTC",
            quantity    = qty_str,
            price       = str(data.price),
        )
        return order

    except BinanceAPIException as e:
        logger.error(f"[Futures] BinanceAPIException {e.status_code}: {e.message}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)

    except Exception:
        logger.exception("[Futures] Error inesperado creando orden")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.delete("/order")
def cancel_futures_order(data: CancelInput):
    try:
        return client.futures_cancel_order(
            symbol  = data.symbol.upper(),
            orderId = data.orderId,
        )
    except BinanceAPIException as e:
        logger.error(f"[Futures] No se pudo cancelar orden {data.orderId}: {e.message}")
        raise HTTPException(status_code=e.status_code or 400, detail=e.message)
    except Exception:
        logger.exception("[Futures] Error inesperado cancelando orden")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/orders/{symbol}", tags=["futures"])
def list_futures_open_orders(symbol: str):
    """
    Devuelve las órdenes ABIERTAS en el mercado de Futuros para un símbolo.
    """
    return client.futures_get_open_orders(symbol=symbol.upper())


@router.get("/orders/all/{symbol}", tags=["futures"])
def list_all_futures_orders(symbol: str):
    """
    Devuelve todas las órdenes (abiertas y cerradas) en Futuros para un símbolo.
    """
    return client.futures_get_all_orders(symbol=symbol.upper(), limit=500)