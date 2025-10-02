#!/usr/bin/env python3
"""
Debug Wyckoff Score - Verificar cálculo exacto de puntos
"""

import asyncio
import logging
from services.service_factory import ServiceFactory
from services.binance_real_data import BinanceRealDataService
from models.bot_config import BotConfig
from db.database import get_session
from sqlmodel import select
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_wyckoff_score():
    """Debug para ver exactamente qué señales se detectan y cómo se calcula el score"""

    print("=" * 80)
    print("🔍 DEBUG WYCKOFF SCORE - CÁLCULO DETALLADO")
    print("=" * 80)

    # Obtener bot de prueba
    with get_session() as session:
        bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "BTCUSDT")
        ).first()

        if not bot:
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

    # Inicializar servicios
    binance_service = ServiceFactory.get_binance_service(bot)
    signal_assessor = ServiceFactory.get_signal_quality_assessor(bot)

    # Obtener datos
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
        return

    main_data = timeframe_data['15m']

    # Preparar datos
    price_df = pd.DataFrame({
        'open': main_data['opens'],
        'high': main_data['highs'],
        'low': main_data['lows'],
        'close': main_data['closes'],
        'volume': main_data['volumes']
    })

    # Evaluar señal - Aquí es donde veremos el cálculo real
    result = signal_assessor.assess_signal_quality(
        price_data=price_df,
        volume_data=main_data['volumes'],
        indicators={},
        market_structure={
            'regime': 'NEUTRAL',
            'wyckoff_phase': 'ACCUMULATION',
            'manipulation_detected': False,
            'manipulation_type': None,
            'order_blocks': [],
            'market_phase': 'ACCUMULATION'
        },
        timeframe="15m",
        timeframe_data=timeframe_data
    )

    # Mostrar resultados detallados
    wyckoff = result.institutional_confirmations.get('wyckoff_method')
    if wyckoff:
        print(f"\n📈 WYCKOFF SCORE BREAKDOWN:")
        print(f"   Final Score: {wyckoff.score:.2f}")
        print(f"   Bias: {wyckoff.bias}")
        if hasattr(wyckoff, 'confidence'):
            print(f"   Confidence: {wyckoff.confidence:.2%}")

        if hasattr(wyckoff, 'details') and wyckoff.details:
            details = wyckoff.details
            print(f"\n📍 SEÑALES DETECTADAS:")

            # Contar señales detectadas
            signals_detected = 0

            # Lista completa de 18 señales
            all_signals = [
                # Accumulation (6)
                'ps_detected', 'sc_detected', 'ar_detected',
                'st_detected', 'lps_detected', 'spring_detected',
                # Markup (3)
                'sos_detected', 'bu_markup_detected', 'joc_markup_detected',
                # Distribution (6)
                'psy_detected', 'bc_detected', 'utad_detected',
                'lpsy_detected', 'sow_detected', 'bu_markdown_detected',
                # Markdown (3)
                'joc_markdown_detected', 'follow_through_detected', 'climactic_action_detected'
            ]

            # Verificar wyckoff_signals si existe
            if 'wyckoff_signals' in details:
                wyckoff_signals = details['wyckoff_signals']
                print(f"\n   SEÑALES EN wyckoff_signals dict:")
                for signal_name, signal_data in wyckoff_signals.items():
                    if isinstance(signal_data, dict) and signal_data.get('detected', False):
                        signals_detected += 1
                        print(f"   ✅ {signal_name}: DETECTADA")
                    else:
                        print(f"   ❌ {signal_name}: No detectada")
            else:
                # Buscar señales directamente en details
                for signal in all_signals:
                    if signal in details and details[signal]:
                        signals_detected += 1
                        print(f"   ✅ {signal}: {details[signal]}")

            print(f"\n📊 TOTAL SEÑALES DETECTADAS: {signals_detected}/18")
            print(f"   Puntos por señales (5 pts c/u): {signals_detected * 5}")

            # Otros componentes del score
            print(f"\n🔄 OTROS COMPONENTES DEL SCORE:")
            if 'phase_score' in details:
                print(f"   Phase Score: {details['phase_score']}")
            if 'spring_utad_score' in details:
                print(f"   Spring/UTAD Score: {details['spring_utad_score']}")
            if 'mtf_confirmation_score' in details:
                print(f"   MTF Score: {details['mtf_confirmation_score']}")
            if 'atr_normalized_score' in details:
                print(f"   ATR Score: {details['atr_normalized_score']}")

            # Mostrar detalles raw para debugging
            print(f"\n🔧 RAW DETAILS:")
            import json
            print(json.dumps(details, indent=2, default=str))

    print(f"\n📈 SCORE TOTAL DEL SISTEMA: {result.overall_score:.2f}")
    print(f"🎯 CONFIDENCE: {result.confidence_level}")

    # Mostrar todos los algoritmos
    print(f"\n🏛️ TODOS LOS ALGORITMOS:")
    for algo_name, algo_data in result.institutional_confirmations.items():
        print(f"   {algo_name}: Score={algo_data.score:.1f}, Bias={algo_data.bias}")

if __name__ == "__main__":
    print("🚀 Iniciando debug Wyckoff Score...")
    asyncio.run(debug_wyckoff_score())