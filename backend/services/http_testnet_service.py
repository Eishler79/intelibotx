import httpx
import time
import os
from dotenv import load_dotenv
from utils.signature import sign_request
import hmac
import hashlib
from urllib.parse import urlencode
import requests

load_dotenv()

API_KEY = os.getenv("BINANCE_TESTNET_API_KEY")
API_SECRET = os.getenv("BINANCE_TESTNET_SECRET_KEY")
BASE_URL = "https://testnet.binance.vision"

async def create_testnet_order(symbol: str, side: str, quantity: str, price: str):
    timestamp = int(time.time() * 1000)
    
    # Parámetros base
    params = {
        "symbol": symbol.upper(),
        "side": side.upper(),
        "type": "LIMIT",
        "timeInForce": "GTC",
        "quantity": quantity,
        "price": price,
        "timestamp": timestamp,
    }
    
    # Firmar
    signature = sign_request(params, API_SECRET)

    # Adjuntar firma
    full_params = params.copy()
    full_params["signature"] = signature

    # Headers
    headers = {"X-MBX-APIKEY": API_KEY}

    # Imprimir debug
    print("📦 PARAMS FINALES CON FIRMA:", full_params)
    print("📨 FULL URL:", f"{BASE_URL}/api/v3/order", full_params)

    # Enviar request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/v3/order",
                params=full_params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print("❌ ERROR STATUS:", e.response.status_code)
            print("❌ ERROR TEXT:", e.response.text)
            return {"error": e.response.text}


async def get_open_orders(symbol: str = None):
    params = {}
    if symbol:
        params["symbol"] = symbol.upper()

    params["timestamp"] = int(time.time() * 1000)
    query_string = urlencode(params)
    signature = hmac.new(
        API_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    params["signature"] = signature
    headers = {"X-MBX-APIKEY": API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v3/openOrders",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print("❌ ERROR STATUS:", e.response.status_code)
            print("❌ ERROR TEXT:", e.response.text)
            return {"error": e.response.text}

async def get_testnet_order_status(symbol: str, order_id: int):
    timestamp = int(time.time() * 1000)
    params = {
        "symbol": symbol.upper(),
        "orderId": order_id,
        "timestamp": timestamp
    }
    signature = sign_request(params, API_SECRET)
    params["signature"] = signature
    headers = {"X-MBX-APIKEY": API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v3/order",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print("❌ ERROR:", e.response.text)
            return {"error": e.response.text}

async def cancel_testnet_order(symbol: str, order_id: int):
    timestamp = int(time.time() * 1000)
    params = {
        "symbol": symbol.upper(),
        "orderId": order_id,
        "timestamp": timestamp
    }
    signature = sign_request(params, API_SECRET)
    params["signature"] = signature
    headers = {"X-MBX-APIKEY": API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.delete(
                f"{BASE_URL}/api/v3/order",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print("❌ ERROR:", e.response.text)
            return {"error": e.response.text}

async def get_all_testnet_orders(symbol: str):
    params = {
        "symbol": symbol.upper(),
        "timestamp": int(time.time() * 1000)
    }
    params["signature"] = sign_request(params, API_SECRET)
    headers = {"X-MBX-APIKEY": API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{BASE_URL}/api/v3/allOrders",
                params=params,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print("❌ ERROR STATUS:", e.response.status_code)
            print("❌ ERROR TEXT:", e.response.text)
            return {"error": e.response.text}

def signed_request(method: str, path: str, params: dict = None):
    if params is None:
        params = {}

    params["timestamp"] = int(time.time() * 1000)
    query_string = urlencode(params)
    signature = hmac.new(
        API_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    url = f"{BASE_URL}{path}?{query_string}&signature={signature}"
    headers = {"X-MBX-APIKEY": API_KEY}
    response = requests.request(method, url, headers=headers)
    response.raise_for_status()
    return response.json()