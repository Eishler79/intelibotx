#!/usr/bin/env python3
"""
🎯 Real Trading Routes - Endpoints para trading real con análisis técnico
APIs para conectar frontend con sistema de trading real

Eduard Guzmán - InteliBotX
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
from pydantic import BaseModel

# Importar servicios de trading real
from services.technical_analysis_service import TechnicalAnalysisService
from services.real_trading_engine import RealTradingEngine
from services.binance_real_data import BinanceRealDataService
from services.user_trading_service import UserTradingService
from services.auth_service import AuthService
from models.user import User
from db.database import get_session

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear router
router = APIRouter()

# Servicios globales
user_trading_service = UserTradingService()
auth_service = AuthService()

# Servicios globales de fallback (modo testnet seguro)
technical_service = TechnicalAnalysisService(use_testnet=True)
binance_service = BinanceRealDataService(use_testnet=True)

# Modelos Pydantic para requests
class AnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "15m"
    strategy: str = "Smart Scalper"

class TradeRequest(BaseModel):
    symbol: str
    bot_id: int
    exchange_id: int  # ID del exchange configurado del usuario
    strategy: str = "Smart Scalper"
    stake: float = 1000.0
    risk_percentage: float = 1.0

class UserAnalysisRequest(BaseModel):
    symbol: str
    timeframe: str = "15m"
    strategy: str = "Smart Scalper"

@router.get("/api/technical-analysis/{symbol}")
async def get_technical_analysis(
    symbol: str,
    timeframe: str = Query("15m", description="Marco temporal (1m, 5m, 15m, 1h, 4h, 1d)"),
    strategy: str = Query("Smart Scalper", description="Estrategia de análisis")
):
    """
    Obtener análisis técnico completo para un símbolo
    
    **Parámetros:**
    - symbol: Par de trading (ej: BTCUSDT)
    - timeframe: Marco temporal (default: 15m)
    - strategy: Estrategia (Smart Scalper, Trend Hunter, etc.)
    
    **Retorna:**
    - Análisis técnico completo con señales, indicadores y niveles TP/SL
    """
    try:
        logger.info(f"📊 Análisis técnico solicitado: {strategy} {symbol} {timeframe}")
        
        # Validar parámetros
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol es requerido")
        
        valid_timeframes = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d']
        if timeframe not in valid_timeframes:
            raise HTTPException(status_code=400, detail=f"Timeframe debe ser uno de: {valid_timeframes}")
        
        # Obtener análisis según estrategia
        analysis = await technical_service.get_strategy_analysis(
            strategy=strategy,
            symbol=symbol,
            timeframe=timeframe
        )
        
        # Agregar datos de mercado actuales
        market_data = await binance_service.get_current_price(symbol)
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "symbol": symbol.upper(),
                "timeframe": timeframe,
                "strategy": strategy,
                "timestamp": datetime.utcnow().isoformat(),
                "market_data": market_data,
                "analysis": analysis,
                "api_version": "v2.0"
            }
        })
        
    except ValueError as ve:
        logger.error(f"❌ Error de validación: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"❌ Error obteniendo análisis técnico {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@router.get("/api/real-indicators/{symbol}")
async def get_real_indicators(
    symbol: str,
    timeframe: str = Query("15m", description="Marco temporal"),
    limit: int = Query(100, description="Número de períodos", ge=50, le=500)
):
    """
    Obtener indicadores técnicos calculados con datos reales de Binance
    
    **Específico para frontend SmartScalperMetrics**
    """
    try:
        logger.info(f"🎯 Indicadores reales: {symbol} {timeframe}")
        
        # Obtener indicadores técnicos reales
        indicators = await binance_service.calculate_technical_indicators(symbol, timeframe, limit)
        
        # Obtener señal Smart Scalper
        smart_scalper_signal = await binance_service.get_smart_scalper_signal(symbol, timeframe)
        
        # Formatear respuesta específica para SmartScalperMetrics
        response_data = {
            "symbol": symbol.upper(),
            "timestamp": indicators.timestamp,
            "timeframe": timeframe,
            
            # RSI Data
            "rsi": {
                "current": indicators.rsi,
                "status": indicators.rsi_status,
                "signal": indicators.rsi_signal,
                "oversold_threshold": 30,
                "overbought_threshold": 70,
                "trend": "BULLISH" if indicators.rsi > 50 else "BEARISH"
            },
            
            # Volume Data
            "volume": {
                "current_ratio": indicators.volume_ratio,
                "spike_detected": indicators.volume_spike,
                "sma_20_volume": indicators.volume_sma,
                "spike_threshold": 1.5,
                "status": "SPIKE_DETECTED" if indicators.volume_spike else "ELEVATED" if indicators.volume_ratio > 1.2 else "NORMAL"
            },
            
            # Smart Scalper Signal
            "signal": {
                "current": smart_scalper_signal['signal'],
                "confidence": smart_scalper_signal['confidence'],
                "strength": smart_scalper_signal['strength'],
                "conditions_met": smart_scalper_signal['conditions_met'],
                "timestamp": smart_scalper_signal['timestamp'],
                "entry_quality": smart_scalper_signal['quality']
            },
            
            # Additional Technical Data
            "technical": {
                "macd": indicators.macd,
                "macd_signal": indicators.macd_signal,
                "macd_histogram": indicators.macd_histogram,
                "ema_9": indicators.ema_9,
                "ema_21": indicators.ema_21,
                "ema_50": indicators.ema_50,
                "atr": indicators.atr,
                "volatility_pct": indicators.volatility
            },
            
            "data_source": "binance_real_api",
            "algorithm": "Smart Scalper Real v2.1"
        }
        
        return JSONResponse(content={
            "success": True,
            "data": response_data
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo indicadores reales {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo indicadores: {str(e)}")

@router.get("/api/market-data/{symbol}")
async def get_market_data(
    symbol: str,
    timeframe: str = Query("15m", description="Marco temporal"),
    limit: int = Query(100, description="Número de velas", ge=10, le=1000)
):
    """
    Obtener datos OHLCV reales de Binance
    
    **Para gráficos y análisis histórico**
    """
    try:
        logger.info(f"📈 Datos mercado: {symbol} {timeframe} ({limit} velas)")
        
        # Obtener datos OHLCV
        df = await binance_service.get_klines(symbol, timeframe, limit)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No hay datos para {symbol}")
        
        # Convertir DataFrame a formato JSON
        klines_data = []
        for _, row in df.iterrows():
            klines_data.append({
                "timestamp": int(row['timestamp']),
                "datetime": row['datetime'].isoformat(),
                "open": float(row['open']),
                "high": float(row['high']),
                "low": float(row['low']),
                "close": float(row['close']),
                "volume": float(row['volume'])
            })
        
        # Estadísticas básicas
        stats = {
            "total_periods": len(df),
            "price_range": {
                "high": float(df['high'].max()),
                "low": float(df['low'].min()),
                "latest": float(df['close'].iloc[-1])
            },
            "volume": {
                "total": float(df['volume'].sum()),
                "average": float(df['volume'].mean()),
                "latest": float(df['volume'].iloc[-1])
            }
        }
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "symbol": symbol.upper(),
                "timeframe": timeframe,
                "limit": limit,
                "klines": klines_data,
                "statistics": stats,
                "timestamp": datetime.utcnow().isoformat(),
                "source": "binance_api"
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo datos mercado {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo datos: {str(e)}")

@router.post("/api/trading-signals")
async def generate_trading_signals(request: AnalysisRequest):
    """
    Generar señales de trading para múltiples estrategias
    
    **Body:**
    ```json
    {
        "symbol": "BTCUSDT",
        "timeframe": "15m", 
        "strategy": "Smart Scalper"
    }
    ```
    """
    try:
        logger.info(f"🎯 Generando señales: {request.strategy} {request.symbol}")
        
        # Obtener análisis principal
        main_analysis = await technical_service.get_strategy_analysis(
            strategy=request.strategy,
            symbol=request.symbol,
            timeframe=request.timeframe
        )
        
        # Obtener análisis complementario para contexto
        additional_analysis = {}
        
        # Si es Smart Scalper, agregar análisis de manipulación y volatilidad
        if request.strategy == "Smart Scalper":
            manipulation = await technical_service.analyze_manipulation_detector(request.symbol, "5m")
            volatility = await technical_service.analyze_volatility_master(request.symbol, request.timeframe)
            
            additional_analysis = {
                "manipulation_check": manipulation,
                "volatility_analysis": volatility
            }
        
        # Obtener datos de mercado actuales
        market_data = await binance_service.get_current_price(request.symbol)
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "request": {
                    "symbol": request.symbol,
                    "timeframe": request.timeframe,
                    "strategy": request.strategy
                },
                "market_data": market_data,
                "primary_analysis": main_analysis,
                "additional_analysis": additional_analysis,
                "timestamp": datetime.utcnow().isoformat(),
                "recommendation": {
                    "action": main_analysis.get('signal', 'HOLD'),
                    "confidence": main_analysis.get('confidence', 0.0),
                    "risk_level": "LOW" if main_analysis.get('confidence', 0) > 0.8 else "MEDIUM" if main_analysis.get('confidence', 0) > 0.6 else "HIGH"
                }
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error generando señales: {e}")
        raise HTTPException(status_code=500, detail=f"Error generando señales: {str(e)}")

@router.post("/api/execute-trade")
async def execute_trade(request: TradeRequest):
    """
    Ejecutar trade real/simulado basado en análisis
    
    **⚠️ IMPORTANTE: Por defecto en modo simulación**
    
    **Body:**
    ```json
    {
        "symbol": "BTCUSDT",
        "bot_id": 1,
        "strategy": "Smart Scalper",
        "stake": 1000.0,
        "risk_percentage": 1.0
    }
    ```
    """
    try:
        logger.info(f"🚀 Ejecutando trade: {request.strategy} {request.symbol}")
        
        # IMPORTANTE: Por seguridad, usar credenciales dummy (solo simulación)
        trading_engine = RealTradingEngine(
            api_key="dummy_key",
            api_secret="dummy_secret", 
            use_testnet=True,
            enable_real_trading=False  # SIEMPRE False para seguridad
        )
        
        # Ejecutar análisis y trade
        if request.strategy == "Smart Scalper":
            result = await trading_engine.execute_smart_scalper_trade(
                symbol=request.symbol,
                bot_id=request.bot_id,
                stake=request.stake,
                risk_percentage=request.risk_percentage
            )
        else:
            # Para otras estrategias, solo análisis por ahora
            analysis = await technical_service.get_strategy_analysis(
                request.strategy,
                request.symbol
            )
            result = {
                "action": "ANALYSIS_ONLY",
                "strategy": request.strategy,
                "analysis": analysis,
                "note": "Ejecución automática solo disponible para Smart Scalper"
            }
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "request": request.dict(),
                "execution_result": result,
                "timestamp": datetime.utcnow().isoformat(),
                "mode": "SIMULATION",
                "warning": "Modo simulación activo - No se ejecutan órdenes reales"
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error ejecutando trade: {e}")
        raise HTTPException(status_code=500, detail=f"Error ejecutando trade: {str(e)}")

async def get_current_user(session = Depends(get_session), authorization: str = Header(...)) -> User:
    """Dependency para obtener usuario autenticado"""
    try:
        token = auth_service.get_token_from_header(authorization)
        token_data = auth_service.verify_jwt_token(token)
        user_id = token_data.get("user_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return user
    except Exception as e:
        logger.error(f"Error autenticación: {e}")
        raise HTTPException(status_code=401, detail="Error de autenticación")

@router.get("/api/user/trading-status")
async def get_user_trading_status(
    current_user: User = Depends(get_current_user),
    session = Depends(get_session)
):
    """
    Obtener estado de trading del usuario autenticado
    
    **Requiere autenticación JWT**
    
    **Retorna:**
    - Exchanges configurados del usuario
    - Estado de conexiones
    - Permisos disponibles
    """
    try:
        logger.info(f"📊 Estado trading usuario {current_user.id}")
        
        exchange_status = await user_trading_service.get_user_exchange_status(
            current_user.id, 
            session
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "user": {
                    "id": current_user.id,
                    "email": current_user.email,
                    "preferred_exchange": current_user.preferred_exchange,
                    "preferred_mode": current_user.preferred_mode
                },
                "exchanges": exchange_status,
                "trading_available": exchange_status['active_exchanges'] > 0,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error obteniendo estado trading usuario: {e}")
        raise HTTPException(status_code=500, detail=f"Error obteniendo estado: {str(e)}")

@router.post("/api/user/technical-analysis")
async def get_user_technical_analysis(
    request: UserAnalysisRequest,
    current_user: User = Depends(get_current_user),
    session = Depends(get_session)
):
    """
    Análisis técnico usando exchanges configurados del usuario
    
    **Requiere autenticación JWT**
    
    **Body:**
    ```json
    {
        "symbol": "BTCUSDT",
        "timeframe": "15m",
        "strategy": "Smart Scalper"
    }
    ```
    
    **Usa configuración real del usuario (testnet/mainnet)**
    """
    try:
        logger.info(f"🎯 Análisis usuario {current_user.id}: {request.strategy} {request.symbol}")
        
        # Obtener análisis usando configuración del usuario
        analysis = await user_trading_service.get_user_technical_analysis(
            user_id=current_user.id,
            symbol=request.symbol,
            strategy=request.strategy,
            timeframe=request.timeframe,
            session=session
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "request": request.dict(),
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": current_user.id
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error análisis técnico usuario: {e}")
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@router.post("/api/user/execute-trade")
async def execute_user_trade(
    request: TradeRequest,
    current_user: User = Depends(get_current_user),
    session = Depends(get_session)
):
    """
    Ejecutar trade usando exchange configurado del usuario
    
    **Requiere autenticación JWT**
    **⚠️ IMPORTANTE: Usa credenciales reales del usuario**
    
    **Body:**
    ```json
    {
        "symbol": "BTCUSDT",
        "bot_id": 1,
        "exchange_id": 1,
        "strategy": "Smart Scalper",
        "stake": 1000.0,
        "risk_percentage": 1.0
    }
    ```
    """
    try:
        logger.info(f"🚀 Ejecutando trade usuario {current_user.id}: {request.strategy}")
        
        # Ejecutar Smart Scalper trade usando configuración del usuario
        result = await user_trading_service.execute_user_smart_scalper_trade(
            user_id=current_user.id,
            exchange_id=request.exchange_id,
            symbol=request.symbol,
            bot_id=request.bot_id,
            stake=request.stake,
            risk_percentage=request.risk_percentage,
            session=session
        )
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "request": request.dict(),
                "execution_result": result,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": current_user.id,
                "mode": "USER_CONFIGURED_EXCHANGE"
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error ejecutando trade usuario: {e}")
        raise HTTPException(status_code=500, detail=f"Error ejecutando trade: {str(e)}")

@router.get("/api/strategies")
async def get_available_strategies():
    """Obtener lista de estrategias disponibles"""
    strategies = [
        {
            "name": "Smart Scalper",
            "description": "Micro-movimientos con RSI + Volume Spike",
            "timeframes": ["1m", "5m", "15m"],
            "indicators": ["RSI(14)", "Volume SMA(20)", "ATR(14)"],
            "target_return": "2.1:1 Risk/Reward",
            "status": "ACTIVE"
        },
        {
            "name": "Trend Hunter", 
            "description": "Detección tendencias con EMA + MACD",
            "timeframes": ["15m", "1h", "4h"],
            "indicators": ["EMA(9,21,50)", "MACD(12,26,9)"],
            "target_return": "3:1 Risk/Reward",
            "status": "ACTIVE"
        },
        {
            "name": "Manipulation Detector",
            "description": "Protección anti-manipulación mercado",
            "timeframes": ["1m", "5m"],
            "indicators": ["Volume Analysis", "Wick Ratio", "Price Spikes"],
            "target_return": "Protection Tool",
            "status": "ACTIVE"
        },
        {
            "name": "News Sentiment",
            "description": "Trading basado en análisis sentimiento",
            "timeframes": ["1h", "4h"],
            "indicators": ["Sentiment Score", "News Volume"],
            "target_return": "Variable",
            "status": "DEVELOPMENT"
        },
        {
            "name": "Volatility Master",
            "description": "Adaptación dinámica a volatilidad",
            "timeframes": ["15m", "1h"],
            "indicators": ["ATR", "Bollinger Bands", "VIX"],
            "target_return": "Adaptive",
            "status": "ACTIVE"
        }
    ]
    
    return JSONResponse(content={
        "success": True,
        "data": {
            "total_strategies": len(strategies),
            "strategies": strategies,
            "timestamp": datetime.utcnow().isoformat()
        }
    })

@router.get("/api/real-trading/health")
async def health_check():
    """Health check para sistema de trading real"""
    try:
        # Test básico de servicios
        test_symbol = "BTCUSDT"
        
        # Test Binance connection
        price_data = await binance_service.get_current_price(test_symbol)
        binance_status = "OK" if price_data and 'price' in price_data else "ERROR"
        
        # Test Technical Analysis
        try:
            indicators = await binance_service.calculate_technical_indicators(test_symbol, "15m", 50)
            ta_status = "OK" if indicators and indicators.rsi > 0 else "ERROR"
        except:
            ta_status = "ERROR"
        
        return JSONResponse(content={
            "status": "healthy" if binance_status == "OK" and ta_status == "OK" else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "binance_api": binance_status,
                "technical_analysis": ta_status,
                "trading_engine": "SIMULATION_MODE"
            },
            "test_data": {
                "symbol": test_symbol,
                "current_price": price_data.get('price', 0) if price_data else 0,
                "rsi": indicators.rsi if ta_status == "OK" else 0
            },
            "version": "v2.0",
            "mode": "TESTNET_SIMULATION"
        })
        
    except Exception as e:
        logger.error(f"❌ Error en health check: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")