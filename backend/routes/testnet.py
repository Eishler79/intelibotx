from fastapi import APIRouter, Header
from pydantic import BaseModel
from fastapi import Query
from services.http_testnet_service import create_testnet_order, get_testnet_order_status, cancel_testnet_order, get_open_orders, signed_request, get_all_testnet_orders
import os
from dotenv import load_dotenv


router = APIRouter()

@router.post("/testnet/spot/order")
async def test_order(authorization: str = Header(None)):
    """DL-008 Authentication: Create test order (duplicate endpoint 1)"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await create_testnet_order(
            symbol="BTCUSDT",
            side="BUY",
            quantity="0.001",
            price="30000"
        )
    except Exception as e:
        return {"error": f"Authentication or order creation failed: {str(e)}"}

class TestOrderRequest(BaseModel):
    symbol: str
    side: str
    quantity: str
    price: str

@router.post("/testnet/spot/order")
async def test_order(data: TestOrderRequest, authorization: str = Header(None)):
    """DL-008 Authentication: Create test order with data (duplicate endpoint 2)"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await create_testnet_order(
            symbol=data.symbol,
            side=data.side,
            quantity=data.quantity,
            price=data.price
        )
    except Exception as e:
        return {"error": f"Authentication or order creation failed: {str(e)}"}
@router.post("/testnet/order")
async def test_order(authorization: str = Header(None)):
    """DL-008 Authentication: Simple test order"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await create_testnet_order("BTCUSDT", "BUY", "0.001", "30000")
    except Exception as e:
        return {"error": f"Authentication or order creation failed: {str(e)}"}

@router.get("/testnet/order/status")
async def order_status(symbol: str, orderId: int, authorization: str = Header(None)):
    """DL-008 Authentication: Get order status"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await get_testnet_order_status(symbol, orderId)
    except Exception as e:
        return {"error": f"Authentication or status check failed: {str(e)}"}

@router.delete("/testnet/order/cancel")
async def cancel_order(symbol: str, orderId: int, authorization: str = Header(None)):
    """DL-008 Authentication: Cancel test order"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await cancel_testnet_order(symbol, orderId)
    except Exception as e:
        return {"error": f"Authentication or cancellation failed: {str(e)}"}

@router.get("/testnet/spot/open-orders")
async def open_orders(symbol: str = None, authorization: str = Header(None)):
    """DL-008 Authentication: Get open orders"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await get_open_orders(symbol)
    except Exception as e:
        return {"error": f"Authentication or open orders check failed: {str(e)}"}

@router.get("/testnet/spot/orders")
async def list_orders(symbol: str = Query(..., description="Símbolo como BTCUSDT"), authorization: str = Header(None)):
    """DL-008 Authentication: List all test orders"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        
        # DL-008: Authentication pattern
        current_user = await get_current_user_safe(authorization)
        return await get_all_testnet_orders(symbol)
    except Exception as e:
        return {"error": f"Authentication or orders list failed: {str(e)}"}

@router.get("/testnet/config")
def test_config(authorization: str = Header(None)):
    """DL-008 Authentication: Get testnet configuration"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        import asyncio
        
        # DL-008: Authentication pattern (sync function, need async call)
        try:
            loop = asyncio.get_event_loop()
            current_user = loop.run_until_complete(get_current_user_safe(authorization))
        except RuntimeError:
            # If no event loop, create one
            current_user = asyncio.run(get_current_user_safe(authorization))
        
        # Verificar configuración de testnet sin hacer llamadas externas
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
    except Exception as e:
        return {"error": f"Authentication or config check failed: {str(e)}"}

@router.get("/testnet/spot/account")
def test_account_info(authorization: str = Header(None)):
    """DL-008 Authentication: Get testnet account info"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        import asyncio
        
        # DL-008: Authentication pattern (sync function, need async call)
        try:
            loop = asyncio.get_event_loop()
            current_user = loop.run_until_complete(get_current_user_safe(authorization))
        except RuntimeError:
            # If no event loop, create one
            current_user = asyncio.run(get_current_user_safe(authorization))
        
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
    except Exception as e:
        return {"error": f"Authentication or config check failed: {str(e)}"}

@router.get("/testnet/spot/account")
def test_account_info(authorization: str = Header(None)):
    """DL-008 Authentication: Get testnet account info"""
    try:
        # DL-003: Lazy imports to avoid psycopg2 dependency at module level
        from services.auth_service import get_current_user_safe
        import asyncio
        
        # DL-008: Authentication pattern (sync function, need async call)
        try:
            loop = asyncio.get_event_loop()
            current_user = loop.run_until_complete(get_current_user_safe(authorization))
        except RuntimeError:
            # If no event loop, create one
            current_user = asyncio.run(get_current_user_safe(authorization))
            
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
        
        return signed_request("GET", "/api/v3/account")
    except Exception as e:
        return {"error": f"Authentication or account info failed: {str(e)}", "details": "Check API keys validity"}