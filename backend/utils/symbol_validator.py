import requests

BINANCE_EXCHANGE_INFO_URL = "https://api.binance.com/api/v3/exchangeInfo"

def fetch_all_symbols():
    """
    Obtiene todos los símbolos del exchange de Binance.
    """
    try:
        response = requests.get(BINANCE_EXCHANGE_INFO_URL)
        response.raise_for_status()
        data = response.json()
        return data.get("symbols", [])
    except Exception as e:
        print(f"[ERROR] Al obtener exchangeInfo: {e}")
        return []

def get_valid_spot_symbols():
    """
    Devuelve lista de símbolos válidos de tipo SPOT que están habilitados para trading.
    """
    all_symbols = fetch_all_symbols()
    return [
        s["symbol"]
        for s in all_symbols
        if s.get("isSpotTradingAllowed", False) and s.get("status", "") == "TRADING"
    ]

def validate_symbol(symbol: str) -> bool:
    """
    Valida si el símbolo existe y está habilitado para SPOT trading.
    Normaliza el símbolo recibido (mayúsculas, sin espacios).
    """
    normalized = symbol.upper().strip().replace(" ", "")
    valid_symbols = get_valid_spot_symbols()
    return normalized in valid_symbols