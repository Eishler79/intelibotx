# env_loader.py
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("BINANCE_TESTNET_API_KEY")
API_SECRET = os.getenv("BINANCE_TESTNET_API_SECRET")
USE_TESTNET = os.getenv("USE_TESTNET", "false").lower() == "true"

BINANCE_TESTNET_SPOT_BASE_URL = "https://testnet.binance.vision/api"
BINANCE_TESTNET_FUTURES_BASE_URL = "https://testnet.binancefuture.com"
BINANCE_SPOT_BASE_URL = "https://api.binance.com"
BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com"