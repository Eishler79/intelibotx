"""
Endpoints para bots con datos reales de mercado
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import asyncio
import time

# Importaciones locales
from services.real_market_data import market_service

router = APIRouter()

# Almacén temporal de bots en memoria
active_bots: Dict[int, Dict[str, Any]] = {}

class RealBotRequest(BaseModel):
    symbol: str = "BTCUSDT"
    strategy: str = "Smart Scalper"
    stake: float = 1000
    take_profit: float = 2.5
    stop_loss: float = 1.5
    risk_percentage: float = 1.0
    market_type: str = "spot"
    interval: str = "15m"

@router.post("/api/real-bots/create")
async def create_real_bot(bot_data: RealBotRequest):
    """Crear un bot con datos reales de mercado"""
    try:
        # Generar ID único
        bot_id = int(time.time())
        
        # Obtener datos reales de mercado
        market_data = await market_service.get_market_data_for_bot(bot_data.symbol, bot_data.interval)
        
        if "error" in market_data:
            raise HTTPException(status_code=400, detail=f"Error obteniendo datos de mercado: {market_data['error']}")
        
        # Aplicar estrategia básica
        signal = apply_strategy_logic(bot_data.strategy, market_data)
        confidence = calculate_confidence_level(market_data, signal)
        
        # Crear bot
        bot = {
            "id": bot_id,
            "symbol": bot_data.symbol,
            "strategy": bot_data.strategy,
            "status": "CREATED",
            "balance": bot_data.stake,
            "take_profit": bot_data.take_profit,
            "stop_loss": bot_data.stop_loss,
            "risk_percentage": bot_data.risk_percentage,
            "market_type": bot_data.market_type,
            "interval": bot_data.interval,
            "current_price": market_data.get("current_price", 0),
            "last_signal": signal,
            "confidence": confidence,
            "total_trades": 0,
            "winning_trades": 0,
            "current_pnl": 0.0,
            "created_at": int(time.time() * 1000),
            "last_analysis": market_data,
            "data_source": "binance_testnet_real"
        }
        
        # Almacenar bot
        active_bots[bot_id] = bot
        
        return {
            "message": f"✅ Bot Real {bot_data.strategy} creado para {bot_data.symbol} con datos en vivo",
            "bot_id": bot_id,
            "bot": bot,
            "market_analysis": {
                "price": market_data.get("current_price", 0),
                "signal": signal,
                "confidence": f"{confidence:.1%}",
                "rsi": market_data.get("indicators", {}).get("rsi", 50),
                "price_change_24h": market_data.get("ticker_24h", {}).get("price_change_percent", 0),
                "volume_ratio": calculate_volume_ratio(market_data)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando bot real: {str(e)}")

@router.get("/api/real-bots")
async def get_real_bots():
    """Obtener todos los bots reales"""
    return list(active_bots.values())

@router.get("/api/real-bots/{bot_id}")
async def get_real_bot(bot_id: int):
    """Obtener un bot específico"""
    if bot_id not in active_bots:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    
    return active_bots[bot_id]

@router.post("/api/real-bots/{bot_id}/analyze")
async def analyze_real_bot(bot_id: int):
    """Ejecutar análisis en tiempo real de un bot"""
    if bot_id not in active_bots:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    
    try:
        bot = active_bots[bot_id]
        
        # Obtener datos frescos de mercado
        market_data = await market_service.get_market_data_for_bot(bot["symbol"], bot["interval"])
        
        if "error" in market_data:
            raise HTTPException(status_code=400, detail=f"Error obteniendo datos: {market_data['error']}")
        
        # Aplicar estrategia
        signal = apply_strategy_logic(bot["strategy"], market_data)
        confidence = calculate_confidence_level(market_data, signal)
        
        # Actualizar bot
        bot["current_price"] = market_data.get("current_price", 0)
        bot["last_signal"] = signal
        bot["confidence"] = confidence
        bot["last_analysis"] = market_data
        bot["last_update"] = int(time.time() * 1000)
        
        # Calcular PnL simulado si hay trades previos
        if bot["total_trades"] > 0:
            price_change = ((market_data.get("current_price", 0) - bot.get("entry_price", market_data.get("current_price", 0))) / bot.get("entry_price", market_data.get("current_price", 1))) * 100
            bot["current_pnl"] = price_change * bot["balance"] / 100
        
        return {
            "bot_id": bot_id,
            "symbol": bot["symbol"],
            "strategy": bot["strategy"],
            "analysis": {
                "current_price": market_data.get("current_price", 0),
                "signal": signal,
                "confidence": f"{confidence:.1%}",
                "recommendation": get_recommendation(signal, confidence),
                "market_conditions": {
                    "rsi": round(market_data.get("indicators", {}).get("rsi", 50), 1),
                    "price_change_24h": f"{market_data.get('ticker_24h', {}).get('price_change_percent', 0):.2f}%",
                    "volume_ratio": f"{calculate_volume_ratio(market_data):.1f}x",
                    "volatility": "N/A"  # Simplified - no pandas calculation
                },
                "trading_metrics": {
                    "total_trades": bot["total_trades"],
                    "winning_trades": bot["winning_trades"],
                    "win_rate": f"{(bot['winning_trades'] / max(bot['total_trades'], 1)) * 100:.1f}%",
                    "current_pnl": f"{bot['current_pnl']:.2f}",
                    "balance": bot["balance"]
                }
            },
            "timestamp": int(time.time() * 1000)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando bot: {str(e)}")

@router.post("/api/real-bots/{bot_id}/start")
async def start_real_bot(bot_id: int):
    """Iniciar un bot real"""
    if bot_id not in active_bots:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    
    bot = active_bots[bot_id]
    bot["status"] = "RUNNING"
    bot["started_at"] = int(time.time() * 1000)
    
    # Obtener análisis inicial
    analysis = await analyze_real_bot(bot_id)
    
    return {
        "message": f"🚀 Bot Real {bot['strategy']} iniciado en {bot['symbol']}",
        "bot_id": bot_id,
        "status": "RUNNING",
        "initial_analysis": analysis["analysis"]
    }

@router.post("/api/real-bots/{bot_id}/pause")
async def pause_real_bot(bot_id: int):
    """Pausar un bot real"""
    if bot_id not in active_bots:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    
    bot = active_bots[bot_id]
    bot["status"] = "PAUSED"
    bot["paused_at"] = int(time.time() * 1000)
    
    return {
        "message": f"⏸️ Bot Real {bot['strategy']} pausado",
        "bot_id": bot_id,
        "status": "PAUSED"
    }

@router.delete("/api/real-bots/{bot_id}")
async def delete_real_bot(bot_id: int):
    """Eliminar un bot real"""
    if bot_id not in active_bots:
        raise HTTPException(status_code=404, detail="Bot no encontrado")
    
    bot = active_bots.pop(bot_id)
    
    return {
        "message": f"🗑️ Bot Real {bot['strategy']} eliminado",
        "bot_id": bot_id
    }

@router.get("/api/real-market/{symbol}")
async def get_real_market_data(symbol: str, interval: str = "15m"):
    """Obtener datos de mercado en tiempo real"""
    try:
        market_data = await market_service.get_market_data_for_bot(symbol.upper(), interval)
        
        if "error" in market_data:
            raise HTTPException(status_code=400, detail=f"Error obteniendo datos: {market_data['error']}")
        
        return {
            "symbol": symbol.upper(),
            "data": {
                "current_price": market_data.get("current_price", 0),
                "price_change_24h": market_data.get("ticker_24h", {}).get("price_change_percent", 0),
                "volume_24h": market_data.get("ticker_24h", {}).get("volume", 0),
                "high_24h": market_data.get("ticker_24h", {}).get("high_price", 0),
                "low_24h": market_data.get("ticker_24h", {}).get("low_price", 0),
                "indicators": {
                    "rsi": round(market_data.get("indicators", {}).get("rsi", 50), 2),
                    "ema_9": round(market_data.get("indicators", {}).get("ema_9", 0), 2),
                    "ema_21": round(market_data.get("indicators", {}).get("ema_21", 0), 2),
                    "volume_ratio": calculate_volume_ratio(market_data)
                },
                "order_book": market_data.get("order_book", {}),
                "volatility": 0.0  # Simplified - no pandas calculation
            },
            "timestamp": market_data.get("timestamp", int(time.time() * 1000)),
            "data_source": market_data.get("data_source", "binance_testnet")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos de mercado: {str(e)}")

# Funciones auxiliares
def apply_strategy_logic(strategy: str, market_data: Dict) -> str:
    """Aplicar lógica de estrategia específica"""
    indicators = market_data.get("indicators", {})
    ticker_24h = market_data.get("ticker_24h", {})
    
    rsi = indicators.get("rsi", 50)
    price_change_24h = ticker_24h.get("price_change_percent", 0)
    volume_ratio = calculate_volume_ratio(market_data)
    
    if strategy == "Smart Scalper":
        if rsi < 30 and volume_ratio > 1.5:
            return "BUY"
        elif rsi > 70 and volume_ratio > 1.5:
            return "SELL"
    
    elif strategy == "Trend Hunter":
        ema_9 = indicators.get("ema_9", 0)
        ema_21 = indicators.get("ema_21", 0)
        
        if ema_9 > ema_21 and price_change_24h > 2:
            return "BUY"
        elif ema_9 < ema_21 and price_change_24h < -2:
            return "SELL"
    
    elif strategy == "Manipulation Detector":
        if volume_ratio > 3 and abs(price_change_24h) > 5:
            return "HOLD"  # Evitar manipulación
        elif volume_ratio > 1.5:
            return "BUY" if rsi < 40 else "SELL" if rsi > 60 else "HOLD"
    
    elif strategy == "News Sentiment":
        if price_change_24h > 3 and volume_ratio > 2:
            return "BUY"
        elif price_change_24h < -3 and volume_ratio > 2:
            return "SELL"
    
    elif strategy == "Volatility Master":
        if abs(price_change_24h) > 5:  # Alta volatilidad
            return "BUY" if rsi < 25 else "SELL" if rsi > 75 else "HOLD"
        else:  # Baja volatilidad
            return "BUY" if rsi < 35 else "SELL" if rsi > 65 else "HOLD"
    
    return "HOLD"

def calculate_confidence_level(market_data: Dict, signal: str) -> float:
    """Calcular nivel de confianza en la señal"""
    if signal == "HOLD":
        return 0.5
    
    indicators = market_data.get("indicators", {})
    rsi = indicators.get("rsi", 50)
    volume_ratio = calculate_volume_ratio(market_data)
    
    # Factores de confianza
    rsi_confidence = 0.8 if (rsi < 30 or rsi > 70) else 0.4
    volume_confidence = min(volume_ratio / 2, 0.9)
    
    return min((rsi_confidence + volume_confidence) / 2, 0.95)

def calculate_volume_ratio(market_data: Dict) -> float:
    """Calcular ratio de volumen actual vs promedio"""
    indicators = market_data.get("indicators", {})
    current_volume = indicators.get("current_volume", 0)
    avg_volume = indicators.get("volume_avg", 1)
    
    return current_volume / max(avg_volume, 1)

def get_recommendation(signal: str, confidence: float) -> str:
    """Obtener recomendación basada en señal y confianza"""
    if signal == "HOLD":
        return "Esperar mejores condiciones de mercado"
    elif confidence > 0.8:
        return f"Señal {signal} muy fuerte - Considerar ejecución"
    elif confidence > 0.6:
        return f"Señal {signal} moderada - Evaluar contexto"
    else:
        return f"Señal {signal} débil - Monitorear"