#!/usr/bin/env python3
"""
🚀 Smart Scalper Routes - Endpoint independiente para Smart Scalper Pro
Trading inteligente con datos reales sin dependencias de base de datos
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
import asyncio

# Smart Scalper Engine Imports
from services.advanced_algorithm_selector import AdvancedAlgorithmSelector
from services.market_microstructure_analyzer import MarketMicrostructureAnalyzer
from services.institutional_detector import InstitutionalDetector
from services.multi_timeframe_coordinator import MultiTimeframeCoordinator, TimeframeData
from services.binance_real_data import BinanceRealDataService
from services.ta_alternative import calculate_rsi, calculate_ema, calculate_sma, calculate_atr
from services.http_testnet_service import create_testnet_order

router = APIRouter(prefix="/api/smart-scalper", tags=["Smart Scalper Pro"])


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


@router.post("/analyze/{symbol}")
async def analyze_smart_scalper(
    symbol: str,
    quantity: float = Query(0.001, description="Cantidad a tradear"),
    execute_order: bool = Query(False, description="Ejecutar orden real en testnet"),
    confidence_threshold: float = Query(0.7, description="Umbral mínimo de confianza para trade")
) -> Dict[str, Any]:
    """
    🤖 Análisis Smart Scalper Pro con datos reales de Binance
    
    Ejecuta análisis completo:
    - Multi-timeframe analysis (1m, 5m, 15m, 1h)  
    - Detección de manipulación institucional
    - ML-based algorithm selection
    - Microstructure analysis
    - Opcional: Ejecución de orden real en testnet
    """
    try:
        # 🔗 Inicializar servicios Smart Scalper
        binance_service = BinanceRealDataService()
        selector = AdvancedAlgorithmSelector()
        microstructure_analyzer = MarketMicrostructureAnalyzer()
        institutional_detector = InstitutionalDetector()
        multi_tf_coordinator = MultiTimeframeCoordinator()
        
        # 📊 Obtener datos reales multi-timeframe
        print(f"📡 Obteniendo datos reales para {symbol}...")
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
                    print(f"✅ {tf}: {len(closes)} velas - Precio: ${closes[-1]:,.2f}")
                    
            except Exception as e:
                print(f"⚠️ Error obteniendo datos {tf}: {str(e)}")
                continue
        
        if not timeframe_data:
            raise HTTPException(
                status_code=500, 
                detail="No se pudieron obtener datos de mercado de Binance"
            )
        
        # 🔬 Análisis de microestructura
        print("🔬 Ejecutando análisis de microestructura...")
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
        print("🏛️ Ejecutando detección institucional...")
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
        print("⏰ Ejecutando coordinación multi-timeframe...")
        multi_tf = multi_tf_coordinator.analyze_multi_timeframe_signal(
            symbol=symbol,
            timeframe_data=timeframe_data
        )
        
        # 🤖 Selección inteligente de algoritmo
        print("🤖 Ejecutando selección de algoritmo ML-based...")
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
        trade_reason = f"Algoritmo: {algorithm_selection.selected_algorithm.value}"
        
        # Lógica de señal basada en multi-timeframe y confianza
        if multi_tf.signal in ["BUY", "SELL"] and confidence >= confidence_threshold:
            signal = multi_tf.signal
            trade_reason = f"{algorithm_selection.selected_algorithm.value} - Confianza: {confidence:.1%}"
        
        # 🚀 Ejecutar orden real si se solicita y hay señal
        order_result = None
        if execute_order and signal in ["BUY", "SELL"]:
            print(f"🚀 Ejecutando orden {signal} para {symbol}...")
            try:
                # Calcular precio con pequeño ajuste para mayor probabilidad de fill
                order_price = current_price * 0.9995 if signal == "BUY" else current_price * 1.0005
                
                order_result = await create_testnet_order(
                    symbol=symbol,
                    side=signal,
                    quantity=str(quantity),
                    price=str(order_price)
                )
                print(f"✅ Orden enviada: {order_result}")
                
            except Exception as e:
                order_result = {"error": f"Error ejecutando orden: {str(e)}"}
                print(f"❌ Error en orden: {str(e)}")
        
        # 📊 Construir respuesta completa
        response = {
            "success": True,
            "timestamp": timeframe_data["1m"].timeframe,
            "symbol": symbol,
            "current_price": current_price,
            "analysis": {
                "algorithm_selected": algorithm_selection.selected_algorithm.value,
                "selection_confidence": confidence,
                "market_regime": algorithm_selection.market_regime.value,
                "regime_confidence": algorithm_selection.regime_confidence,
                "manipulation_events": len(institutional.manipulation_events),
                "wyckoff_phase": institutional.market_phase.value,
                "timeframe_alignment": multi_tf.alignment.value,
                "trend_strength": multi_tf.trend_strength.value
            },
            "microstructure": {
                "point_of_control": microstructure.point_of_control,
                "value_area_high": microstructure.value_area_high,
                "value_area_low": microstructure.value_area_low,
                "volume_type": microstructure.volume_type.value,
                "buying_pressure": microstructure.buying_pressure,
                "selling_pressure": microstructure.selling_pressure
            },
            "signals": {
                "signal": signal,
                "confidence": confidence,
                "reason": trade_reason,
                "multi_tf_signal": multi_tf.signal,
                "tf_confidence": multi_tf.confidence,
                "threshold_used": confidence_threshold
            },
            "trading": {
                "execute_order": execute_order,
                "quantity": quantity,
                "order_result": order_result
            },
            "top_algorithms": [
                {
                    "algorithm": ranking.algorithm.value,
                    "score": ranking.score,
                    "confidence": ranking.confidence
                }
                for ranking in algorithm_selection.algorithm_rankings[:5]
            ]
        }
        
        print(f"🎉 Análisis completado: {signal} con {confidence:.1%} confianza")
        return response
        
    except Exception as e:
        print(f"❌ Error en Smart Scalper: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error ejecutando Smart Scalper: {str(e)}"
        )


@router.get("/status")
async def smart_scalper_status():
    """Estado del Smart Scalper Engine"""
    return {
        "status": "operational",
        "version": "1.0.0",
        "components": [
            "AdvancedAlgorithmSelector",
            "MarketMicrostructureAnalyzer", 
            "InstitutionalDetector",
            "MultiTimeframeCoordinator",
            "BinanceRealDataService"
        ],
        "supported_timeframes": ["1m", "5m", "15m", "1h"],
        "supported_symbols": ["BTCUSDT", "ETHUSDT", "BNBUSDT"],
        "features": [
            "Real-time market data",
            "ML-based algorithm selection",
            "Anti-manipulation detection",
            "Multi-timeframe analysis",
            "Testnet order execution"
        ]
    }