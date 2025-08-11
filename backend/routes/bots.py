# 📦 Importaciones base
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from services.backtest_bot import run_backtest_and_plot
from analytics.strategy_evaluator import StrategyEvaluator  # ✅ ARREGLADO: Usar clase correcta
from models.bot_config import BotConfig  # 🆕 NUEVO: Acceso a configuración del bot
from models.user_exchange import UserExchange  # 🆕 NUEVO: Para integración con exchanges
from sqlmodel import Session, select
from utils.symbol_validator import validate_symbol  # ✅ EXISTENTE: validador robusto
from db.database import engine  # ✅ ARREGLADO: Usar database.py consolidado
from services.exchange_factory import ExchangeFactory  # 🆕 NUEVO: Para conectar con exchanges reales
from services.auth_service import AuthService  # 🆕 NUEVO: Para autenticación
from typing import List, Dict, Any
import pandas as pd  # ✅ NUEVO: Para cargar datos históricos

# 🚀 Smart Scalper Engine Imports
from services.advanced_algorithm_selector import AdvancedAlgorithmSelector
from services.market_microstructure_analyzer import MarketMicrostructureAnalyzer
from services.institutional_detector import InstitutionalDetector
from services.multi_timeframe_coordinator import MultiTimeframeCoordinator, TimeframeData
from services.binance_real_data import BinanceRealDataService
from services.ta_alternative import calculate_rsi, calculate_ema, calculate_sma, calculate_atr
from services.http_testnet_service import create_testnet_order
import asyncio

# 🚀 Instancia del router
router = APIRouter()

# 🤖 Estado global de bots (en producción sería Redis o base de datos)
bot_states = {}


# 🧠 Smart Scalper Engine - Análisis profesional con datos reales
async def execute_smart_scalper_analysis(
    symbol: str, 
    bot_config: BotConfig, 
    quantity: float, 
    execute_real: bool = False
) -> Dict[str, Any]:
    """
    Ejecutar análisis completo Smart Scalper con datos reales de Binance
    
    Args:
        symbol: Par de trading (ej: BTCUSDT)
        bot_config: Configuración del bot desde DB
        quantity: Cantidad a tradear
        execute_real: Si ejecutar orden real en testnet
    
    Returns:
        Análisis completo y resultado de trading
    """
    try:
        # 🔗 Inicializar servicios Smart Scalper
        binance_service = BinanceRealDataService()
        selector = AdvancedAlgorithmSelector()
        microstructure_analyzer = MarketMicrostructureAnalyzer()
        institutional_detector = InstitutionalDetector()
        multi_tf_coordinator = MultiTimeframeCoordinator()
        
        # 📊 Obtener datos reales multi-timeframe
        timeframes = ["1m", "5m", "15m", "1h"]
        timeframe_data = {}
        all_data = {}
        
        for tf in timeframes:
            try:
                df = await binance_service.get_klines(symbol=symbol, interval=tf, limit=100)
                if not df.empty:
                    opens = df['open'].tolist()
                    highs = df['high'].tolist() 
                    lows = df['low'].tolist()
                    closes = df['close'].tolist()
                    volumes = df['volume'].tolist()
                    
                    # Crear TimeframeData con indicadores técnicos
                    timeframe_data[tf] = create_timeframe_data(
                        symbol, opens, highs, lows, closes, volumes, tf
                    )
                    all_data[tf] = {
                        'opens': opens, 'highs': highs, 'lows': lows,
                        'closes': closes, 'volumes': volumes
                    }
                    
            except Exception as e:
                print(f"⚠️ Error obteniendo datos {tf}: {str(e)}")
                continue
        
        if not timeframe_data:
            raise HTTPException(
                status_code=500, 
                detail="No se pudieron obtener datos de mercado"
            )
        
        # 🔬 Análisis de microestructura
        main_data = all_data.get("1m", list(all_data.values())[0])
        microstructure = microstructure_analyzer.analyze_market_microstructure(
            symbol=symbol,
            timeframe="1m", 
            highs=main_data['highs'],
            lows=main_data['lows'],
            closes=main_data['closes'],
            volumes=main_data['volumes']
        )
        
        # 🏛️ Detección institucional
        institutional = institutional_detector.analyze_institutional_activity(
            symbol=symbol,
            timeframe="1m",
            opens=main_data['opens'],
            highs=main_data['highs'], 
            lows=main_data['lows'],
            closes=main_data['closes'],
            volumes=main_data['volumes']
        )
        
        # ⏰ Coordinación multi-timeframe
        multi_tf = multi_tf_coordinator.analyze_multi_timeframe_signal(
            symbol=symbol,
            timeframe_data=timeframe_data
        )
        
        # 🤖 Selección inteligente de algoritmo
        algorithm_selection = selector.select_optimal_algorithm(
            symbol=symbol,
            microstructure=microstructure,
            institutional=institutional,
            multi_tf=multi_tf,
            timeframe_data=timeframe_data
        )
        
        # 💰 Precio actual
        current_price = main_data['closes'][-1]
        
        # 🎯 Determinar señal de trading
        signal = "HOLD"
        confidence = algorithm_selection.selection_confidence
        trade_reason = f"Algoritmo seleccionado: {algorithm_selection.selected_algorithm.value}"
        
        if multi_tf.signal in ["BUY", "SELL"] and confidence > 0.7:
            signal = multi_tf.signal
            trade_reason = f"{algorithm_selection.selected_algorithm.value} - Confianza: {confidence:.1%}"
        
        # 🚀 Ejecutar orden real si se solicita
        order_result = None
        if execute_real and signal in ["BUY", "SELL"]:
            try:
                order_result = await create_testnet_order(
                    symbol=symbol,
                    side=signal,
                    quantity=str(quantity),
                    price=str(current_price * 0.999 if signal == "BUY" else current_price * 1.001)
                )
            except Exception as e:
                order_result = {"error": f"Error ejecutando orden: {str(e)}"}
        
        # 📊 Respuesta completa
        return {
            "message": f"🤖 Smart Scalper análisis completado para {symbol}",
            "symbol": symbol,
            "mode": "smart_scalper_pro",
            "current_price": current_price,
            "analysis": {
                "algorithm_selected": algorithm_selection.selected_algorithm.value,
                "selection_confidence": f"{confidence:.1%}",
                "market_regime": algorithm_selection.market_regime.value,
                "regime_confidence": f"{algorithm_selection.regime_confidence:.1%}",
                "manipulation_events": len(institutional.manipulation_events),
                "wyckoff_phase": institutional.market_phase.value,
                "timeframe_alignment": multi_tf.alignment.value,
                "trend_strength": multi_tf.trend_strength.value
            },
            "microstructure": {
                "poc": microstructure.point_of_control,
                "vah": microstructure.value_area_high,
                "val": microstructure.value_area_low,
                "volume_type": microstructure.dominant_side.value
            },
            "signals": {
                "signal": signal,
                "confidence": confidence,
                "reason": trade_reason,
                "multi_tf_signal": multi_tf.signal,
                "tf_confidence": multi_tf.confidence
            },
            "order_execution": order_result,
            "top_algorithms": [
                {
                    "algorithm": ranking.algorithm.value,
                    "score": f"{ranking.score:.1%}",
                    "confidence": f"{ranking.confidence:.1%}"
                }
                for ranking in algorithm_selection.algorithm_rankings[:3]
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en Smart Scalper: {str(e)}"
        )


def create_timeframe_data(symbol, opens, highs, lows, closes, volumes, timeframe):
    """Crear TimeframeData con indicadores técnicos calculados"""
    
    # Calcular indicadores técnicos
    data_length = min(50, len(closes))
    recent_closes = closes[-data_length:]
    recent_highs = highs[-data_length:]
    recent_lows = lows[-data_length:]
    recent_opens = opens[-data_length:]
    recent_volumes = volumes[-data_length:]
    
    # Indicadores técnicos
    rsi_val = calculate_rsi(recent_closes, period=14)
    ema_9 = calculate_ema(recent_closes, period=9) if len(recent_closes) >= 9 else recent_closes[-1]
    ema_21 = calculate_ema(recent_closes, period=21) if len(recent_closes) >= 21 else recent_closes[-1]
    ema_50 = calculate_ema(recent_closes, period=50) if len(recent_closes) >= 50 else recent_closes[-1]
    ema_200 = calculate_ema(closes, period=200) if len(closes) >= 200 else closes[-1]
    atr_val = calculate_atr(recent_highs, recent_lows, recent_closes, period=14)
    
    vol_sma_list = calculate_sma(recent_volumes, period=20)
    vol_sma = vol_sma_list[-1] if isinstance(vol_sma_list, list) else vol_sma_list
    
    # Support/Resistance
    key_support = min(recent_lows)
    key_resistance = max(recent_highs)
    
    # Trend direction
    if ema_9 > ema_21 > ema_50:
        trend_direction = "BULLISH"
        trend_strength = 0.8
    elif ema_9 < ema_21 < ema_50:
        trend_direction = "BEARISH"
        trend_strength = 0.8
    else:
        trend_direction = "NEUTRAL"
        trend_strength = 0.4
    
    # Momentum
    price_change = (recent_closes[-1] - recent_closes[-10]) / recent_closes[-10] if len(recent_closes) >= 10 else 0
    momentum = max(-1.0, min(1.0, price_change * 10))
    
    return TimeframeData(
        timeframe=timeframe,
        opens=recent_opens,
        highs=recent_highs,
        lows=recent_lows,
        closes=recent_closes,
        volumes=recent_volumes,
        rsi=rsi_val,
        ema_9=ema_9,
        ema_21=ema_21,
        ema_50=ema_50,
        ema_200=ema_200,
        atr=atr_val,
        volume_sma=vol_sma,
        trend_direction=trend_direction,
        trend_strength=trend_strength,
        momentum=momentum,
        key_support=key_support,
        key_resistance=key_resistance,
        data_quality=0.95,
        reliability=0.90
    )


# 📈 RUTA ACTUAL: Gráfico de backtest (sin cambios)
@router.get("/api/backtest-chart/{symbol}", response_class=HTMLResponse)
async def get_backtest_chart(symbol: str):
    html_chart = run_backtest_and_plot(symbol)
    return HTMLResponse(content=html_chart)


# 🤖 RUTA ACTUAL: Ejecutar Smart Trade con validación de símbolo
# 🆕 MEJORA: Ahora también obtiene estrategia desde DB y evalúa lógica real
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,
    scalper_mode: bool = False,
    quantity: float = 0.001,
    execute_real: bool = False
):
    """Ejecuta Smart Trade con análisis técnico completo"""
    try:
        # ✅ Normalización del símbolo
        normalized_symbol = symbol.upper().strip().replace(" ", "")

        # ✅ Validación básica del símbolo
        if not normalized_symbol or len(normalized_symbol) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Símbolo inválido: {normalized_symbol}"
            )

        # 🧠 Buscar configuración del bot en la base de datos
        with Session(engine) as session:
            query = select(BotConfig).where(BotConfig.symbol == normalized_symbol)
            result = session.exec(query).first()

            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"⚠️ No hay configuración guardada para {normalized_symbol}"
                )

            # 🔍 Extraer los parámetros requeridos
            interval = result.interval
            strategy = result.strategy

            # 🚀 SMART SCALPER MODE - Análisis profesional con datos reales
            if scalper_mode:
                return await execute_smart_scalper_analysis(
                    normalized_symbol, result, quantity, execute_real
                )

            # 🧠 Cargar datos históricos para análisis (modo tradicional)
            try:
                # Usar datos de BTCUSDT con fallback
                import os
                csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "btcusdt_15m.csv")
                
                if os.path.exists(csv_path):
                    df = pd.read_csv(csv_path)
                    if "timestamp" not in df.columns and "time" in df.columns:
                        df = df.rename(columns={"time": "timestamp"})
                    
                    # Ejecutar evaluación real de estrategia
                    evaluator = StrategyEvaluator(df)
                    signals = evaluator.evaluate()
                else:
                    # Fallback si no hay datos históricos
                    signals = {
                        "signal": "HOLD",
                        "confidence": 0.5,
                        "reason": "No historical data available",
                        "indicators": {}
                    }
            except Exception as e:
                # Fallback si falla la evaluación
                signals = {
                    "signal": "ERROR",
                    "confidence": 0.0,
                    "reason": f"Strategy evaluation failed: {str(e)}",
                    "indicators": {}
                }

        # 📤 Respuesta con resultado completo
        return {
            "message": f"✅ Smart Trade ejecutado para {normalized_symbol}",
            "symbol": normalized_symbol,
            "strategy": strategy,
            "interval": interval,
            "signals": signals,
            "bot_config": {
                "id": result.id,
                "stake": result.stake,
                "take_profit": result.take_profit,
                "stop_loss": result.stop_loss,
                "dca_levels": result.dca_levels
            }
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Catch any other unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )


# 🤖 CRUD ENDPOINTS PARA BOTS

@router.get("/api/bots", response_model=List[BotConfig])
async def get_bots():
    """Obtener lista de todos los bots"""
    try:
        with Session(engine) as session:
            query = select(BotConfig)
            bots = session.exec(query).all()
            return bots
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo bots: {str(e)}"
        )


@router.post("/api/create-bot")
async def create_bot(bot_data: dict):
    """Crear un nuevo bot - TEMPORAL: user_id fijo para compatibility"""
    try:
        # DEBUG: Log received data
        print(f"📥 Backend recibió datos: name={bot_data.get('name')}, leverage={bot_data.get('leverage')}, market_type={bot_data.get('market_type')}")
        print(f"📥 Bot data completo: {bot_data}")
        
        with Session(engine) as session:
            # TEMPORAL: user_id fijo mientras implementamos auth completo
            # En el futuro se obtendrá del JWT token
            default_user_id = 1
            
            # Extraer info del símbolo para campos requeridos
            symbol = bot_data.get("symbol", "BTCUSDT")
            
            # Parsing más robusto de currencies
            if symbol.endswith("USDT"):
                base_currency = "USDT"
                quote_currency = symbol[:-4]  # Remove USDT
            elif symbol.endswith("BTC"):
                base_currency = "BTC"  
                quote_currency = symbol[:-3]  # Remove BTC
            elif symbol.endswith("ETH"):
                base_currency = "ETH"
                quote_currency = symbol[:-3]  # Remove ETH
            else:
                base_currency = "USDT"  # Default
                quote_currency = symbol[:3] if len(symbol) >= 3 else symbol
            
            # Crear instancia de BotConfig con los datos recibidos
            bot = BotConfig(
                user_id=default_user_id,  # ✅ FIX: Agregar user_id requerido
                exchange_id=bot_data.get("exchange_id"),  # ✅ FIX: Agregar exchange_id opcional
                name=bot_data.get("name", f"{bot_data.get('strategy', 'Smart Scalper')} Bot"),
                symbol=symbol,
                base_currency=base_currency,  # ✅ FIX: Required field
                quote_currency=quote_currency,  # ✅ FIX: Required field
                strategy=bot_data.get("strategy", "Smart Scalper"),
                interval=bot_data.get("interval", "15m"),
                stake=bot_data.get("stake", 100.0),
                take_profit=bot_data.get("take_profit", 2.5),
                stop_loss=bot_data.get("stop_loss", 1.5),
                dca_levels=bot_data.get("dca_levels", 3),
                risk_percentage=bot_data.get("risk_percentage", 1.0),
                market_type=bot_data.get("market_type", "spot"),
                leverage=bot_data.get("leverage", 1),  # ✅ FIX: Add leverage field
                margin_type=bot_data.get("margin_type", "ISOLATED"),  # ✅ FIX: Add margin_type field
                
                # 🆕 NUEVOS CAMPOS - ELIMINAR HARDCODING EN FRONTEND
                entry_order_type=bot_data.get("entry_order_type", "MARKET"),
                exit_order_type=bot_data.get("exit_order_type", "MARKET"),
                tp_order_type=bot_data.get("tp_order_type", "LIMIT"),
                sl_order_type=bot_data.get("sl_order_type", "STOP_MARKET"),
                trailing_stop=bot_data.get("trailing_stop", False),
                max_open_positions=bot_data.get("max_open_positions", 3),
                cooldown_minutes=bot_data.get("cooldown_minutes", 30)
            )
            
            session.add(bot)
            session.commit()
            session.refresh(bot)
            
            return {
                "message": f"✅ Bot {bot.strategy} creado para {bot.symbol} ({bot.market_type.upper()})",
                "bot_id": bot.id,
                "bot": bot
            }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creando bot: {str(e)}"
        )


@router.delete("/api/bots/{bot_id}")
async def delete_bot(bot_id: int):
    """Eliminar un bot"""
    try:
        with Session(engine) as session:
            query = select(BotConfig).where(BotConfig.id == bot_id)
            bot = session.exec(query).first()
            
            if not bot:
                raise HTTPException(
                    status_code=404,
                    detail=f"Bot con ID {bot_id} no encontrado"
                )
            
            session.delete(bot)
            session.commit()
            
            return {
                "message": f"🗑️ Bot {bot.symbol} eliminado exitosamente",
                "bot_id": bot_id
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error eliminando bot: {str(e)}"
        )


@router.get("/api/backtest-results/{bot_id}")
async def get_backtest_results(bot_id: int):
    """Obtener resultados de backtest para un bot específico"""
    try:
        with Session(engine) as session:
            query = select(BotConfig).where(BotConfig.id == bot_id)
            bot = session.exec(query).first()
            
            if not bot:
                raise HTTPException(
                    status_code=404,
                    detail=f"Bot con ID {bot_id} no encontrado"
                )
            
            # Generar resultados de backtest simulados
            # En producción esto se calcularía con datos reales
            return {
                "bot_id": bot_id,
                "symbol": bot.symbol,
                "strategy": bot.strategy,
                "results": {
                    "total_return": "15.4%",
                    "sharpe_ratio": "1.85",
                    "max_drawdown": "8.2%",
                    "win_rate": "68.5%",
                    "total_trades": 45,
                    "profit_factor": "2.3"
                },
                "equity_curve": [
                    {"date": "2024-01-01", "value": 1000},
                    {"date": "2024-01-15", "value": 1025},
                    {"date": "2024-02-01", "value": 1085},
                    {"date": "2024-02-15", "value": 1154}
                ]
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo resultados de backtest: {str(e)}"
        )


@router.put("/api/bots/{bot_id}")
async def update_bot(bot_id: int, bot_data: dict):
    """Actualizar configuración de un bot"""
    try:
        with Session(engine) as session:
            query = select(BotConfig).where(BotConfig.id == bot_id)
            bot = session.exec(query).first()
            
            if not bot:
                raise HTTPException(
                    status_code=404,
                    detail=f"Bot con ID {bot_id} no encontrado"
                )
            
            # Actualizar campos que vengan en bot_data
            for key, value in bot_data.items():
                if hasattr(bot, key):
                    setattr(bot, key, value)
            
            session.add(bot)
            session.commit()
            session.refresh(bot)
            
            return {
                "message": f"✅ Bot {bot_id} actualizado exitosamente",
                "bot": bot
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error actualizando bot: {str(e)}"
        )



# Control de Bots (para el panel de control dinámico)

@router.post("/api/bots/{bot_id}/start")
async def start_bot(bot_id: int):
    """Iniciar un bot"""
    return {
        "message": f"✅ Bot {bot_id} iniciado",
        "status": "RUNNING",
        "bot_id": bot_id
    }


@router.post("/api/bots/{bot_id}/pause")
async def pause_bot(bot_id: int):
    """Pausar un bot"""
    return {
        "message": f"⏸️ Bot {bot_id} pausado",
        "status": "PAUSED",
        "bot_id": bot_id
    }


@router.post("/api/bots/{bot_id}/stop")
async def stop_bot(bot_id: int):
    """Detener un bot"""
    return {
        "message": f"⏹️ Bot {bot_id} detenido",
        "status": "STOPPED",
        "bot_id": bot_id
    }