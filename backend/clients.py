# client.py
import os
from dotenv import load_dotenv
from binance.client import Client

load_dotenv()  # carga .env en la raíz

api_key    = os.getenv("BINANCE_API_KEY")
api_secret = os.getenv("BINANCE_SECRET_KEY")
if not api_key or not api_secret:
    raise RuntimeError("Faltan claves de Binance en .env")

# esta es tu única instancia global del cliente
client = Client(api_key, api_secret)