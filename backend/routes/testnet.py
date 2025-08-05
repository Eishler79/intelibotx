from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import Query
from services.http_testnet_service import create_testnet_order, get_testnet_order_status, cancel_testnet_order, get_open_orders, signed_request, get_all_testnet_orders
import os
from dotenv import load_dotenv


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

@router.get("/testnet/config")
def test_config():
    """Verificar configuración de testnet sin hacer llamadas externas"""
    load_dotenv()
    
    api_key = os.getenv("BINANCE_TESTNET_API_KEY")
    api_secret = os.getenv("BINANCE_TESTNET_API_SECRET")
    
    return {
        "testnet_configured": bool(api_key and api_secret),
        "api_key_present": bool(api_key),
        "api_secret_present": bool(api_secret),
        "api_key_prefix": api_key[:8] + "..." if api_key else None,
        "note": "Las claves de testnet pueden expirar. Genere nuevas en: https://testnet.binance.vision/"
    }

@router.get("/testnet/spot/account")
def test_account_info():
    load_dotenv()
    
    api_key = os.getenv("BINANCE_TESTNET_API_KEY")
    api_secret = os.getenv("BINANCE_TESTNET_API_SECRET")
    
    # Debug: verificar que las claves se carguen
    if not api_key or not api_secret:
        return {
            "error": "API keys not configured",
            "api_key_present": bool(api_key),
            "api_secret_present": bool(api_secret)
        }
    
    try:
        return signed_request("GET", "/api/v3/account")
    except Exception as e:
        return {"error": f"Request failed: {str(e)}", "details": "Check API keys validity"}