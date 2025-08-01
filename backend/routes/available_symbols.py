from fastapi import APIRouter
from binance.client import Client
import os

router = APIRouter()

# Usa tus claves del entorno para inicializar el cliente
client = Client(os.getenv("BINANCE_TESTNET_API_KEY"), os.getenv("BINANCE_TESTNET_API_SECRET"))

@router.get("/available-symbols")  # ✅ sin duplicar /api
async def get_available_symbols():
    try:
        print("🔄 Solicitando exchange_info a Binance...")
        exchange_info = client.get_exchange_info()
        print("✅ exchange_info recibido")

        symbols = [
            s["symbol"] for s in exchange_info["symbols"]
            if s["status"] == "TRADING" and s["isSpotTradingAllowed"]
        ]
        print(f"🔢 Total símbolos válidos: {len(symbols)}")
        return {"symbols": symbols}

    except Exception as e:
        print(f"❌ Error al obtener símbolos: {e}")
        return {"error": f"Error al obtener símbolos disponibles: {str(e)}"}