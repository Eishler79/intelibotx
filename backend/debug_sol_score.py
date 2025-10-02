#!/usr/bin/env python3
"""
Depuración detallada del score institucional para bot SOL
Análisis completo de por qué el score es 46.38
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from db.database import get_session
from models.bot_config import BotConfig
from services.service_factory import ServiceFactory
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime

async def debug_sol_score():
    """Análisis completo del cálculo del score 46.38"""

    print("=" * 80)
    print("🔍 ANÁLISIS DETALLADO - SCORE INSTITUCIONAL BOT SOL")
    print("=" * 80)

    # 1. Obtener bot SOL
    with get_session() as session:
        sol_bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "SOLUSDT")
        ).first()

    print(f"\n📊 Bot SOL encontrado:")
    print(f"   - Symbol: {sol_bot.symbol}")
    print(f"   - Market Type: {sol_bot.market_type}")
    print(f"   - Status: {sol_bot.status}")

    # 2. Inicializar servicios
    binance_service = ServiceFactory.get_binance_service(sol_bot)
    selector = ServiceFactory.get_algorithm_selector(sol_bot)
    microstructure = ServiceFactory.get_microstructure_analyzer(sol_bot)
    institutional = ServiceFactory.get_institutional_detector(sol_bot)
    multi_tf = ServiceFactory.get_multi_tf_coordinator(sol_bot)
    signal_quality = ServiceFactory.get_signal_quality_assessor(sol_bot)
    mode_selector = ServiceFactory.get_mode_selector(sol_bot)

    print(f"\n✅ Servicios inicializados:")
    print(f"   - BinanceService: {binance_service.market_type}")
    print(f"   - Base URL: {binance_service.base_url}")

    # 3. Obtener datos de mercado
    print(f"\n📈 Obteniendo datos de mercado para {sol_bot.symbol}...")

    # Recolectar datos principales
    main_data = await binance_service.fetch_ohlcv(sol_bot.symbol, "15m", limit=100)

    if not main_data or 'opens' not in main_data:
        print("❌ No se pudieron obtener datos de mercado")
        return

    print(f"   - Datos obtenidos: {len(main_data['closes'])} velas")
    print(f"   - Precio actual: {main_data['closes'][-1]}")

    # 4. Preparar datos para análisis
    price_data = pd.DataFrame({
        'open': main_data['opens'],
        'high': main_data['highs'],
        'low': main_data['lows'],
        'close': main_data['closes'],
        'volume': main_data['volumes']
    })

    # 5. Análisis institucional
    print("\n🏛️ Ejecutando análisis institucional...")

    institutional_analysis = institutional.detect_institutional_activity(
        symbol=sol_bot.symbol,
        prices=main_data['closes'],
        volumes=main_data['volumes'],
        highs=main_data['highs'],
        lows=main_data['lows'],
        opens=main_data['opens']
    )

    market_structure = {
        'regime': 'NEUTRAL',  # Por defecto
        'wyckoff_phase': institutional_analysis.market_phase.value,
        'manipulation_detected': institutional_analysis.manipulation_type.value != 'NONE',
        'manipulation_type': institutional_analysis.manipulation_type.value,
        'order_blocks': institutional_analysis.order_blocks,
        'market_phase': institutional_analysis.market_phase.value
    }

    print(f"   - Wyckoff Phase: {market_structure['wyckoff_phase']}")
    print(f"   - Manipulation: {market_structure['manipulation_type']}")

    # 6. Evaluación de calidad institucional
    print("\n📊 Evaluando calidad institucional...")

    institutional_quality = signal_quality.assess_signal_quality(
        price_data=price_data,
        volume_data=main_data['volumes'],
        indicators={},  # Ignorado - solo algoritmos institucionales
        market_structure=market_structure,
        timeframe="15m"
    )

    print(f"\n🎯 RESULTADO FINAL:")
    print(f"   - Overall Score: {institutional_quality.overall_score:.2f}")
    print(f"   - Confidence Level: {institutional_quality.confidence_level}")
    print(f"   - Recommendation: {institutional_quality.smart_money_recommendation}")

    # 7. Desglose detallado de cada algoritmo
    print("\n📋 DESGLOSE POR ALGORITMO INSTITUCIONAL:")
    print("-" * 60)

    weights = {
        "wyckoff_method": 0.25,
        "market_microstructure": 0.20,
        "order_blocks": 0.20,
        "liquidity_grabs": 0.15,
        "stop_hunting": 0.10,
        "fair_value_gaps": 0.10
    }

    total_weighted = 0
    smart_money_count = 0

    for name, confirmation in institutional_quality.institutional_confirmations.items():
        weight = weights.get(name, 0.15)
        weighted_score = confirmation.score * weight
        total_weighted += weighted_score

        print(f"\n{name.upper()}")
        print(f"   Score: {confirmation.score:.2f}/100")
        print(f"   Weight: {weight:.0%}")
        print(f"   Weighted Score: {weighted_score:.2f}")
        print(f"   Bias: {confirmation.bias}")

        if confirmation.bias == "SMART_MONEY":
            smart_money_count += 1
            print(f"   ✓ Smart Money Signal")

        # Mostrar detalles específicos si existen
        if hasattr(confirmation, 'details') and confirmation.details:
            for key, value in confirmation.details.items():
                if isinstance(value, dict):
                    print(f"   {key}:")
                    for k, v in value.items():
                        if not isinstance(v, (dict, list)):
                            print(f"      - {k}: {v}")
                elif not isinstance(value, (dict, list)):
                    print(f"   - {key}: {value}")

    print("\n" + "=" * 60)
    print(f"📊 RESUMEN CÁLCULO:")
    print(f"   Total Weighted Score: {total_weighted:.2f}")
    print(f"   Smart Money Signals: {smart_money_count}/6")
    print(f"   Threshold para ejecutar: 60")
    print(f"   Consenso mínimo: 3/6 algoritmos con score >= 70")

    # 8. Verificar criterios de bloqueo
    print("\n🚦 CRITERIOS DE EJECUCIÓN:")

    # Contar algoritmos con alta confianza
    high_confidence_algorithms = [
        algo for name, algo in institutional_quality.institutional_confirmations.items()
        if hasattr(algo, 'score') and algo.score >= 70
    ]
    high_confidence_count = len(high_confidence_algorithms)

    print(f"   1. Score institucional >= 60: {'✅' if institutional_quality.overall_score >= 60 else '❌'} ({institutional_quality.overall_score:.2f})")
    print(f"   2. Consenso 3/6 algoritmos >= 70: {'✅' if high_confidence_count >= 3 else '❌'} ({high_confidence_count}/6)")

    if institutional_quality.overall_score < 60:
        print(f"\n❌ BLOQUEO: Score institucional {institutional_quality.overall_score:.2f} < 60")
        print("   Razón: 'Institutional quality below threshold'")
    elif high_confidence_count < 3:
        print(f"\n❌ BLOQUEO: Solo {high_confidence_count}/6 algoritmos con alta confianza")
        print("   Razón: 'Insufficient algorithm confirmations'")
    else:
        print("\n✅ EJECUCIÓN PERMITIDA")

    # 9. Alertas de manipulación
    if institutional_quality.manipulation_alerts:
        print(f"\n⚠️ ALERTAS DE MANIPULACIÓN ({len(institutional_quality.manipulation_alerts)}):")
        for alert in institutional_quality.manipulation_alerts:
            print(f"   - {alert}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    asyncio.run(debug_sol_score())