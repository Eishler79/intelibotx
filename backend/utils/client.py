# utils/client.py

import os
from binance.client import Client

# Cargar .env solo si no estamos en Render
if os.getenv("ENV") != "production":
    from dotenv import load_dotenv
    load_dotenv()

# Detectar entorno
USE_TESTNET = os.getenv("USE_TESTNET", "false").lower() == "true"
BINANCE_TESTNET_SPOT_BASE_URL = "https://testnet.binance.vision/api"

# Obtener claves del entorno
if USE_TESTNET:
    API_KEY = os.getenv("BINANCE_TESTNET_API_KEY")
    API_SECRET = os.getenv("BINANCE_TESTNET_API_SECRET")
else:
    API_KEY = os.getenv("BINANCE_API_KEY_MAINNET")
    API_SECRET = os.getenv("BINANCE_SECRET_KEY_MAINNET")

# Validar claves
if not API_KEY or not API_SECRET:
    raise RuntimeError("❌ Faltan claves de Binance en las variables de entorno")

# Crear cliente
client = Client(api_key=API_KEY, api_secret=API_SECRET, testnet=USE_TESTNET)
if USE_TESTNET:
    client.API_URL = BINANCE_TESTNET_SPOT_BASE_URL

# Utilidad
def get_price(symbol: str) -> float:
    ticker = client.get_symbol_ticker(symbol=symbol)
    return float(ticker['price'])