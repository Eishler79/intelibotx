from fastapi import HTTPException
from binance import Client

def get_minimum(client: Client, symbol: str) -> tuple[float, float]:
    info = client.get_symbol_info(symbol.upper())
    if not info:
        raise HTTPException(404, f"Símbolo {symbol} no encontrado")
    f_not = next((f for f in info["filters"] if f["filterType"]=="NOTIONAL"), None)
    f_lot = next((f for f in info["filters"] if f["filterType"]=="LOT_SIZE"), None)
    if not f_not or not f_lot:
        raise HTTPException(400, f"Filtros NOTIONAL/LOT_SIZE no encontrados para {symbol}")
    return float(f_not["minNotional"]), float(f_lot["stepSize"])

def get_minimum_futures(client: Client, symbol: str) -> tuple[float,float]:
    """
    Lee MIN_NOTIONAL y LOT_SIZE de la respuesta de futures_exchange_info()
    para calcular la cantidad mínima (minNotional) y el tamaño de paso (stepSize).
    """
    info = client.futures_exchange_info()
    for s in info["symbols"]:
        if s["symbol"] == symbol.upper():
            f_not = next((f for f in s["filters"] if f["filterType"] == "MIN_NOTIONAL"), None)
            f_lot = next((f for f in s["filters"] if f["filterType"] == "LOT_SIZE"),      None)
            if not f_not or not f_lot:
                raise ValueError(f"Filtros MIN_NOTIONAL/LOT_SIZE no encontrados para {symbol}")
            return float(f_not["minNotional"]), float(f_lot["stepSize"])
    raise ValueError(f"Símbolo {symbol} no encontrado en futuros")