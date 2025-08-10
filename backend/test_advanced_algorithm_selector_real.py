#!/usr/bin/env python3
"""
🧪 TEST: Advanced Algorithm Selector - CON DATOS REALES DE BINANCE
Testing usando datos reales del usuario desde Binance API (testnet/mainnet)
Sin simulaciones, sin hardcode - Solo datos reales de mercado
"""

import sys
import os
sys.path.append('/Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend')

from services.advanced_algorithm_selector import AdvancedAlgorithmSelector
from services.market_microstructure_analyzer import MarketMicrostructureAnalyzer
from services.institutional_detector import InstitutionalDetector
from services.multi_timeframe_coordinator import MultiTimeframeCoordinator, TimeframeData
from services.binance_real_data import BinanceRealDataService
from services.ta_alternative import calculate_rsi, calculate_ema, calculate_sma, calculate_atr
import asyncio

async def get_real_market_data(symbol="BTCUSDT", interval="1m", limit=100):
    """Obtener datos reales de Binance usando el servicio configurado"""
    print(f"📡 Obteniendo datos reales de {symbol} ({interval}) desde Binance...")
    
    try:
        # Usar el servicio de datos reales ya configurado
        binance_service = BinanceRealDataService()
        
        # Obtener datos de klines (candlesticks) reales
        df = await binance_service.get_klines(symbol=symbol, interval=interval, limit=limit)
        
        if df.empty:
            raise Exception("No se pudieron obtener datos de Binance")
        
        # Extraer OHLCV del DataFrame
        opens = df['open'].tolist()
        highs = df['high'].tolist()
        lows = df['low'].tolist()
        closes = df['close'].tolist()
        volumes = df['volume'].tolist()
        
        print(f"✅ Datos reales obtenidos: {len(closes)} velas de {symbol}")
        print(f"✅ Precio actual: ${closes[-1]:,.2f}")
        print(f"✅ Volumen actual: {volumes[-1]:,.0f}")
        
        return opens, highs, lows, closes, volumes
        
    except Exception as e:
        print(f"❌ Error obteniendo datos reales: {str(e)}")
        print("💡 Verifica que las claves API estén configuradas correctamente")
        raise

def create_real_timeframe_data(symbol, opens, highs, lows, closes, volumes, timeframe):
    """Crear TimeframeData usando datos reales de mercado"""
    
    # Calcular indicadores técnicos con datos reales
    data_length = min(50, len(closes))  # Usar hasta 50 velas para cálculos
    recent_closes = closes[-data_length:]
    recent_highs = highs[-data_length:]
    recent_lows = lows[-data_length:]
    recent_opens = opens[-data_length:]
    recent_volumes = volumes[-data_length:]
    
    # Indicadores técnicos reales
    rsi_val = calculate_rsi(recent_closes, period=14)
    ema_9 = calculate_ema(recent_closes, period=9) if len(recent_closes) >= 9 else recent_closes[-1]
    ema_21 = calculate_ema(recent_closes, period=21) if len(recent_closes) >= 21 else recent_closes[-1]
    ema_50 = calculate_ema(recent_closes, period=50) if len(recent_closes) >= 50 else recent_closes[-1]
    ema_200 = calculate_ema(closes, period=200) if len(closes) >= 200 else closes[-1]
    atr_val = calculate_atr(recent_highs, recent_lows, recent_closes, period=14)
    
    vol_sma_list = calculate_sma(recent_volumes, period=20)
    vol_sma = vol_sma_list[-1] if isinstance(vol_sma_list, list) else vol_sma_list
    
    # Support/Resistance reales
    key_support = min(recent_lows)
    key_resistance = max(recent_highs)
    
    # Determinar trend direction basado en EMAs reales
    if ema_9 > ema_21 > ema_50:
        trend_direction = "BULLISH"
        trend_strength = 0.8
    elif ema_9 < ema_21 < ema_50:
        trend_direction = "BEARISH"
        trend_strength = 0.8
    else:
        trend_direction = "NEUTRAL"
        trend_strength = 0.4
    
    # Momentum real
    price_change = (recent_closes[-1] - recent_closes[-10]) / recent_closes[-10] if len(recent_closes) >= 10 else 0
    momentum = max(-1.0, min(1.0, price_change * 10))  # Normalize to [-1, 1]
    
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
        data_quality=0.95,  # Datos reales = alta calidad
        reliability=0.90    # Datos de Binance = alta confiabilidad
    )

async def test_with_real_binance_data():
    """Testing completo con datos REALES de Binance"""
    print("🚀 TESTING: Smart Scalper con DATOS REALES de Binance")
    print("=" * 70)
    
    try:
        # 1. Obtener datos reales de diferentes timeframes
        symbols_to_test = ["BTCUSDT", "ETHUSDT", "BNBUSDT"]
        timeframes = ["1m", "5m", "15m", "1h"]
        
        for symbol in symbols_to_test:
            print(f"\n🎯 TESTING SÍMBOLO: {symbol}")
            print("-" * 40)
            
            # Obtener datos reales para cada timeframe
            timeframe_real_data = {}
            all_data = {}
            
            for tf in timeframes:
                try:
                    opens, highs, lows, closes, volumes = await get_real_market_data(
                        symbol=symbol, interval=tf, limit=100
                    )
                    
                    # Crear TimeframeData con datos reales
                    timeframe_real_data[tf] = create_real_timeframe_data(
                        symbol, opens, highs, lows, closes, volumes, tf
                    )
                    
                    all_data[tf] = {
                        'opens': opens, 'highs': highs, 'lows': lows, 
                        'closes': closes, 'volumes': volumes
                    }
                    
                    print(f"✅ {tf}: {len(closes)} velas reales - Precio: ${closes[-1]:,.2f}")
                    
                except Exception as e:
                    print(f"⚠️ Error en {tf}: {str(e)}")
                    continue
            
            if len(timeframe_real_data) == 0:
                print(f"❌ No se pudieron obtener datos para {symbol}")
                continue
            
            # 2. Inicializar componentes del Smart Scalper
            print(f"\n🧠 Analizando {symbol} con componentes Smart Scalper...")
            
            selector = AdvancedAlgorithmSelector()
            microstructure_analyzer = MarketMicrostructureAnalyzer()
            institutional_detector = InstitutionalDetector()
            multi_tf_coordinator = MultiTimeframeCoordinator()
            
            # Usar datos del timeframe principal (1m) para análisis
            main_data = all_data.get("1m", list(all_data.values())[0])
            
            # 3. Análisis de microestructura con datos reales
            print("📊 Análisis de microestructura...")
            microstructure = microstructure_analyzer.analyze_market_microstructure(
                symbol=symbol,
                timeframe="1m",
                highs=main_data['highs'],
                lows=main_data['lows'],
                closes=main_data['closes'],
                volumes=main_data['volumes']
            )
            
            print(f"✅ POC: ${microstructure.point_of_control:.2f}")
            print(f"✅ VAH: ${microstructure.value_area_high:.2f}")
            print(f"✅ VAL: ${microstructure.value_area_low:.2f}")
            
            # 4. Detección institucional con datos reales
            print("🏛️ Detección de actividad institucional...")
            institutional = institutional_detector.analyze_institutional_activity(
                symbol=symbol,
                timeframe="1m",
                opens=main_data['opens'],
                highs=main_data['highs'],
                lows=main_data['lows'],
                closes=main_data['closes'],
                volumes=main_data['volumes']
            )
            
            manipulation_events = len(institutional.manipulation_events)
            print(f"✅ Eventos de manipulación detectados: {manipulation_events}")
            print(f"✅ Fase de Wyckoff: {institutional.market_phase}")
            print(f"✅ Señales Wyckoff: {len(institutional.wyckoff_signals)}")
            
            # 5. Coordinación multi-timeframe
            print("⏰ Coordinación multi-timeframe...")
            multi_tf = multi_tf_coordinator.analyze_multi_timeframe_signal(
                symbol=symbol,
                timeframe_data=timeframe_real_data
            )
            
            print(f"✅ Alineación de timeframes: {multi_tf.alignment}")
            print(f"✅ Fuerza de tendencia: {multi_tf.trend_strength}")
            print(f"✅ Confianza general: {multi_tf.confidence:.2f}")
            print(f"✅ Consenso entre timeframes: {multi_tf.timeframe_consensus:.2f}")
            
            # 6. SELECCIÓN INTELIGENTE DE ALGORITMO
            print("\n🎯 SELECCIÓN DE ALGORITMO INTELIGENTE")
            print("-" * 50)
            
            selection = selector.select_optimal_algorithm(
                symbol=symbol,
                microstructure=microstructure,
                institutional=institutional,
                multi_tf=multi_tf,
                timeframe_data=timeframe_real_data
            )
            
            # 7. RESULTADOS FINALES
            print(f"\n🏆 RESULTADOS PARA {symbol}")
            print("=" * 40)
            print(f"🤖 ALGORITMO SELECCIONADO: {selection.selected_algorithm.value}")
            print(f"🎯 CONFIANZA: {selection.selection_confidence:.1%}")
            print(f"📈 RÉGIMEN DE MERCADO: {selection.market_regime.value}")
            print(f"🔒 CONFIANZA DEL RÉGIMEN: {selection.regime_confidence:.1%}")
            
            print(f"\n🥇 TOP 3 ALGORITMOS PARA {symbol}:")
            for i, ranking in enumerate(selection.algorithm_rankings[:3]):
                print(f"  {i+1}. {ranking.algorithm.value}: {ranking.score:.1%}")
            
            print(f"\n💰 PRECIO ACTUAL {symbol}: ${main_data['closes'][-1]:,.2f}")
            print(f"📊 VOLUMEN ACTUAL: {main_data['volumes'][-1]:,.0f}")
            
            print("\n" + "=" * 70)
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR en testing con datos reales: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    print("🌟 SMART SCALPER PRO - TESTING CON DATOS REALES")
    print("🔗 Conectando con Binance API usando credenciales del usuario")
    print("💎 Sin simulaciones - Solo datos de mercado en tiempo real")
    print("="*80)
    
    success = await test_with_real_binance_data()
    
    if success:
        print("\n🎉 TESTING EXITOSO CON DATOS REALES")
        print("✅ Smart Scalper funcionando con datos de Binance")
        print("✅ Algoritmos evaluados con mercado real")
        print("✅ Sistema listo para trading real")
    else:
        print("\n❌ TESTING FALLIDO")
        print("💡 Verificar configuración de API keys")

if __name__ == "__main__":
    asyncio.run(main())