from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import Query
from services.http_testnet_service import create_testnet_order, get_testnet_order_status, cancel_testnet_order, get_open_orders, signed_request, get_all_testnet_orders


router = APIRouter()

@router.post("/testnet/spot/order")
async def test_order():
    return await create_testnet_order(
        symbol="BTCUSDT",
        side="BUY",
        quantity="0.001",
        price="30000"
    )

class TestOrderRequest(BaseModel):
    symbol: str
    side: str
    quantity: str
    price: str

@router.post("/testnet/spot/order")
async def test_order(data: TestOrderRequest):
    return await create_testnet_order(
        symbol=data.symbol,
        side=data.side,
        quantity=data.quantity,
        price=data.price
    )
@router.post("/testnet/order")
async def test_order():
    return await create_testnet_order("BTCUSDT", "BUY", "0.001", "30000")

@router.get("/testnet/order/status")
async def order_status(symbol: str, orderId: int):
    return await get_testnet_order_status(symbol, orderId)

@router.delete("/testnet/order/cancel")
async def cancel_order(symbol: str, orderId: int):
    return await cancel_testnet_order(symbol, orderId)

@router.get("/testnet/spot/open-orders")
async def open_orders(symbol: str = None):
    return await get_open_orders(symbol)

@router.get("/testnet/spot/orders")
async def list_orders(symbol: str = Query(..., description="Símbolo como BTCUSDT")):
    return await get_all_testnet_orders(symbol)

@router.get("/testnet/spot/account")
def test_account_info():
    return signed_request("GET", "/api/v3/account")