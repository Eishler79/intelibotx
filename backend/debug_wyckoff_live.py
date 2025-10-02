#!/usr/bin/env python3
"""
Debug Wyckoff en Vivo - Ver 18 señales y 4 fases en tiempo real
"""

import asyncio
import logging
from datetime import datetime
from services.service_factory import ServiceFactory
from services.binance_real_data import BinanceRealDataService
from models.bot_config import BotConfig
from db.database import get_session
from sqlmodel import select
import pandas as pd

# Configurar logging detallado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def debug_wyckoff_live():
    """Debug Wyckoff en tiempo real con datos de Binance"""

    print("=" * 80)
    print("🔍 DEBUG WYCKOFF EN VIVO - 18 SEÑALES + 4 FASES")
    print("=" * 80)

    # 1. Obtener bot de prueba
    with get_session() as session:
        bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "BTCUSDT")
        ).first()

        if not bot:
            # Crear bot temporal para prueba
            bot = BotConfig(
                id=999,
                symbol="BTCUSDT",
                market_type="SPOT",
                name="Debug Wyckoff",
                user_id=1,
                exchange_id=1,
                base_currency="BTC",
                quote_currency="USDT",
                stake=100.0,
                strategy="SCALPING",
                interval="15m",
                take_profit=2.0,
                stop_loss=1.0,
                active=True,
                status="RUNNING"
            )

    print(f"\n📊 Bot de prueba: {bot.symbol} - {bot.market_type}")

    # 2. Inicializar servicios
    binance_service = ServiceFactory.get_binance_service(bot)
    signal_assessor = ServiceFactory.get_signal_quality_assessor(bot)
    institutional_detector = ServiceFactory.get_institutional_detector(bot)

    # 3. Loop de monitoreo cada 30 segundos
    while True:
        try:
            print(f"\n⏰ {datetime.now().strftime('%H:%M:%S')} - Analizando...")

            # Obtener datos multi-timeframe
            timeframe_data = {}
            for tf in ["5m", "15m", "1h"]:
                df = await binance_service.get_klines(bot.symbol, tf, limit=100)
                if not df.empty:
                    timeframe_data[tf] = {
                        'opens': df['open'].tolist(),
                        'highs': df['high'].tolist(),
                        'lows': df['low'].tolist(),
                        'closes': df['close'].tolist(),
                        'volumes': df['volume'].tolist()
                    }

            if '15m' not in timeframe_data:
                print("❌ No hay datos 15m")
                await asyncio.sleep(30)
                continue

            main_data = timeframe_data['15m']

            # 4. Detectar fase Wyckoff actual
            inst_result = institutional_detector.analyze_institutional_activity(
                symbol=bot.symbol,
                timeframe="15m",
                opens=main_data['opens'],
                highs=main_data['highs'],
                lows=main_data['lows'],
                closes=main_data['closes'],
                volumes=main_data['volumes']
            )

            print(f"\n🏛️ FASE WYCKOFF DETECTADA: {inst_result.wyckoff_phase}")
            print(f"   Manipulación: {inst_result.manipulation_type}")

            # 5. Preparar datos para signal assessor
            price_df = pd.DataFrame({
                'open': main_data['opens'],
                'high': main_data['highs'],
                'low': main_data['lows'],
                'close': main_data['closes'],
                'volume': main_data['volumes']
            })

            # 6. Evaluar calidad de señal con Wyckoff
            result = signal_assessor.assess_signal_quality(
                price_data=price_df,
                volume_data=main_data['volumes'],
                indicators={},
                market_structure={
                    'regime': inst_result.market_regime,
                    'wyckoff_phase': inst_result.wyckoff_phase,
                    'manipulation_detected': inst_result.manipulation_detected,
                    'manipulation_type': inst_result.manipulation_type,
                    'order_blocks': [],
                    'market_phase': inst_result.market_phase.value
                },
                timeframe="15m",
                timeframe_data=timeframe_data  # GAP #4 MTF
            )

            # 7. Mostrar resultados Wyckoff
            wyckoff = result.institutional_confirmations.get('wyckoff_method')
            if wyckoff:
                print(f"\n📈 WYCKOFF METHOD RESULTS:")
                print(f"   Score: {wyckoff.score:.2f}")
                print(f"   Bias: {wyckoff.bias}")
                print(f"   Confidence: {wyckoff.confidence:.2%}")

                if hasattr(wyckoff, 'details') and wyckoff.details:
                    details = wyckoff.details
                    print(f"\n📍 SEÑALES DETECTADAS:")

                    # Verificar qué señales están presentes
                    signals_found = []

                    # Fase Accumulation
                    if 'ps_detected' in details:
                        print(f"   ✅ PS (Preliminary Support): {details.get('ps_detected', False)}")
                        if details.get('ps_detected'): signals_found.append('PS')

                    if 'sc_detected' in details:
                        print(f"   ✅ SC (Selling Climax): {details.get('sc_detected', False)}")
                        if details.get('sc_detected'): signals_found.append('SC')

                    if 'ar_detected' in details:
                        print(f"   ✅ AR (Automatic Rally): {details.get('ar_detected', False)}")
                        if details.get('ar_detected'): signals_found.append('AR')

                    if 'st_detected' in details:
                        print(f"   ✅ ST (Secondary Test): {details.get('st_detected', False)}")
                        if details.get('st_detected'): signals_found.append('ST')

                    if 'lps_detected' in details:
                        print(f"   ✅ LPS (Last Point Support): {details.get('lps_detected', False)}")
                        if details.get('lps_detected'): signals_found.append('LPS')

                    if 'spring_detected' in details:
                        print(f"   ✅ SPRING: {details.get('spring_detected', False)}")
                        if details.get('spring_detected'): signals_found.append('SPRING')

                    # Fase Markup
                    if 'sos_detected' in details:
                        print(f"   ✅ SOS (Sign of Strength): {details.get('sos_detected', False)}")
                        if details.get('sos_detected'): signals_found.append('SOS')

                    if 'bu_markup_detected' in details:
                        print(f"   ✅ BU (Back Up): {details.get('bu_markup_detected', False)}")
                        if details.get('bu_markup_detected'): signals_found.append('BU_MARKUP')

                    if 'joc_markup_detected' in details:
                        print(f"   ✅ JOC (Jump Over Creek): {details.get('joc_markup_detected', False)}")
                        if details.get('joc_markup_detected'): signals_found.append('JOC_MARKUP')

                    # Fase Distribution
                    if 'psy_detected' in details:
                        print(f"   ✅ PSY (Preliminary Supply): {details.get('psy_detected', False)}")
                        if details.get('psy_detected'): signals_found.append('PSY')

                    if 'bc_detected' in details:
                        print(f"   ✅ BC (Buying Climax): {details.get('bc_detected', False)}")
                        if details.get('bc_detected'): signals_found.append('BC')

                    if 'utad_detected' in details:
                        print(f"   ✅ UTAD: {details.get('utad_detected', False)}")
                        if details.get('utad_detected'): signals_found.append('UTAD')

                    if 'lpsy_detected' in details:
                        print(f"   ✅ LPSY (Last Point Supply): {details.get('lpsy_detected', False)}")
                        if details.get('lpsy_detected'): signals_found.append('LPSY')

                    # Fase Markdown
                    if 'sow_detected' in details:
                        print(f"   ✅ SOW (Sign of Weakness): {details.get('sow_detected', False)}")
                        if details.get('sow_detected'): signals_found.append('SOW')

                    if 'bu_markdown_detected' in details:
                        print(f"   ✅ BU Markdown: {details.get('bu_markdown_detected', False)}")
                        if details.get('bu_markdown_detected'): signals_found.append('BU_MARKDOWN')

                    if 'joc_markdown_detected' in details:
                        print(f"   ✅ JOC Markdown: {details.get('joc_markdown_detected', False)}")
                        if details.get('joc_markdown_detected'): signals_found.append('JOC_MARKDOWN')

                    # MTF Confirmation
                    if 'mtf_confirmation_score' in details:
                        print(f"\n🔄 MTF Confirmation Score: {details.get('mtf_confirmation_score', 0)}")

                    # Resumen
                    print(f"\n📊 TOTAL SEÑALES ACTIVAS: {len(signals_found)}/18")
                    if signals_found:
                        print(f"   Señales: {', '.join(signals_found)}")

                    # Información adicional
                    print(f"\n💰 PRECIO ACTUAL: ${main_data['closes'][-1]:.2f}")
                    print(f"📊 VOLUMEN: {main_data['volumes'][-1]:,.0f}")

            else:
                print("❌ No hay datos Wyckoff disponibles")

            # 8. Mostrar otros algoritmos para comparación
            print(f"\n🏛️ OTROS ALGORITMOS INSTITUCIONALES:")
            for algo_name, algo_data in result.institutional_confirmations.items():
                if algo_name != 'wyckoff_method':
                    print(f"   {algo_name}: Score={algo_data.score:.1f}, Bias={algo_data.bias}")

            print(f"\n📈 SCORE TOTAL: {result.overall_score:.2f}")
            print(f"🎯 CONFIDENCE: {result.confidence_level}")

        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

        # Esperar 30 segundos antes del siguiente análisis
        print(f"\n⏳ Esperando 30 segundos para siguiente análisis...")
        print("-" * 80)
        await asyncio.sleep(30)

if __name__ == "__main__":
    print("🚀 Iniciando debug Wyckoff en vivo...")
    print("   Presiona Ctrl+C para detener")
    print()

    try:
        asyncio.run(debug_wyckoff_live())
    except KeyboardInterrupt:
        print("\n\n✋ Debug detenido por el usuario")