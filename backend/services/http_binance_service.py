import hmac
import time
import hashlib
import requests
from urllib.parse import urlencode
from os import getenv
from dotenv import load_dotenv

load_dotenv()

API_KEY = getenv("BINANCE_API_KEY")
API_SECRET = getenv("BINANCE_SECRET_KEY")
BASE_URL = "https://api.binance.com"

def sign_payload(payload: dict) -> str:
    query_string = urlencode(payload)
    return hmac.new(API_SECRET.encode(), query_string.encode(), hashlib.sha256).hexdigest()

def signed_request(method: str, path: str, params: dict = {}):
    params["timestamp"] = int(time.time() * 1000)
    params["signature"] = sign_payload(params)
    headers = {"X-MBX-APIKEY": API_KEY}
    url = f"{BASE_URL}{path}"

    if method == "GET":
        return requests.get(url, headers=headers, params=params).json()
    elif method == "POST":
        return requests.post(url, headers=headers, params=params).json()
    elif method == "DELETE":
        return requests.delete(url, headers=headers, params=params).json()