from fastapi import APIRouter, HTTPException
from services.http_testnet_service import signed_request

router = APIRouter(tags=["testnet"])

@router.get("/account")
def get_testnet_account():
    """
    Verifica acceso a la cuenta Binance Testnet con firma manual.
    """
    try:
        response = signed_request("GET", "/api/v3/account")
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))