# config/settings.py

import os
from dotenv import load_dotenv
from pathlib import Path

# Cargar .env desde la raíz del proyecto
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Parámetro de entorno
USE_TESTNET = os.getenv("USE_TESTNET", "false").lower() == "true"

# API Keys desde .env
BINANCE_TESTNET_API_KEY = os.getenv("BINANCE_TESTNET_API_KEY")
BINANCE_TESTNET_API_SECRET = os.getenv("BINANCE_TESTNET_API_SECRET")
BINANCE_MAINNET_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_MAINNET_API_SECRET = os.getenv("BINANCE_SECRET_KEY")

# URLs por entorno
BINANCE_TESTNET_SPOT_BASE_URL = "https://testnet.binance.vision/api"
BINANCE_TESTNET_FUTURES_BASE_URL = "https://testnet.binancefuture.com"

BINANCE_SPOT_BASE_URL = "https://api.binance.com"
BINANCE_FUTURES_BASE_URL = "https://fapi.binance.com"

# Selección dinámica de entorno
if USE_TESTNET:
    API_KEY = BINANCE_TESTNET_API_KEY
    API_SECRET = BINANCE_TESTNET_API_SECRET
    SPOT_BASE_URL = BINANCE_TESTNET_SPOT_BASE_URL
    FUTURES_BASE_URL = BINANCE_TESTNET_FUTURES_BASE_URL
else:
    API_KEY = BINANCE_MAINNET_API_KEY
    API_SECRET = BINANCE_MAINNET_API_SECRET
    SPOT_BASE_URL = BINANCE_SPOT_BASE_URL
    FUTURES_BASE_URL = BINANCE_FUTURES_BASE_URL

