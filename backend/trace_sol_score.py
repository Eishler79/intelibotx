#!/usr/bin/env python3
"""
Trazado exacto del cálculo del score 46.38 para bot SOL
Replica exacta del flujo en routes/bots.py con logging detallado
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

async def trace_sol_score():
    """Trazado completo del cálculo del score con los mismos datos que usa la API"""

    print("=" * 80)
    print("🔍 TRAZADO EXACTO DEL CÁLCULO SCORE 46.38 - BOT SOL")
    print("=" * 80)

    # 1. Obtener bot SOL exactamente como lo hace la API
    with get_session() as session:
        sol_bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "SOLUSDT")
        ).first()

    print(f"\n📊 BOT SOL:")
    print(f"   - ID: {sol_bot.id}")
    print(f"   - Symbol: {sol_bot.symbol}")
    print(f"   - Market Type: {sol_bot.market_type}")
    print(f"   - Status: {sol_bot.status}")

    # 2. Inicializar servicios EXACTAMENTE como en routes/bots.py
    binance_service = ServiceFactory.get_binance_service(sol_bot)
    selector = ServiceFactory.get_algorithm_selector(sol_bot)
    microstructure_analyzer = ServiceFactory.get_microstructure_analyzer(sol_bot)
    institutional_detector = ServiceFactory.get_institutional_detector(sol_bot)
    multi_tf_coordinator = ServiceFactory.get_multi_tf_coordinator(sol_bot)
    signal_quality_assessor = ServiceFactory.get_signal_quality_assessor(sol_bot)
    mode_selector = ServiceFactory.get_mode_selector(sol_bot)

    print(f"\n✅ SERVICIOS INICIALIZADOS:")
    print(f"   - BinanceService market_type: {binance_service.market_type}")
    print(f"   - Base URL: {binance_service.base_url}")

    # 3. Obtener datos EXACTAMENTE como en la API (línea 113-125 de bots.py)
    print(f"\n📈 OBTENIENDO DATOS MULTI-TIMEFRAME...")

    timeframe_data = await binance_service.get_multi_timeframe_data(
        sol_bot.symbol,
        ["5m", "15m", "1h"]
    )

    main_data = timeframe_data.get("15m", {})

    if not main_data or 'closes' not in main_data:
        print("❌ No hay datos disponibles")
        return

    print(f"   - Timeframes obtenidos: {list(timeframe_data.keys())}")
    print(f"   - Velas en 15m: {len(main_data['closes'])}")
    print(f"   - Precio actual: ${main_data['closes'][-1]:.2f}")

    # 4. Análisis Microestructura (línea 128 de bots.py)
    print(f"\n🔬 ANÁLISIS MICROESTRUCTURA...")
    microstructure = microstructure_analyzer.analyze_microstructure(
        prices=main_data['closes'],
        volumes=main_data['volumes'],
        timeframe="15m"
    )
    print(f"   - POC: ${microstructure.point_of_control:.2f}")
    print(f"   - VAH: ${microstructure.value_area_high:.2f}")
    print(f"   - VAL: ${microstructure.value_area_low:.2f}")

    # 5. Detección Institucional (línea 136 de bots.py)
    print(f"\n🏛️ DETECCIÓN INSTITUCIONAL...")
    institutional = institutional_detector.detect_institutional_activity(
        symbol=sol_bot.symbol,
        prices=main_data['closes'],
        volumes=main_data['volumes'],
        highs=main_data['highs'],
        lows=main_data['lows'],
        opens=main_data['opens']
    )
    print(f"   - Market Phase: {institutional.market_phase.value}")
    print(f"   - Manipulation Type: {institutional.manipulation_type.value}")
    print(f"   - Order Blocks: {len(institutional.order_blocks)}")

    # 6. Coordinación Multi-TF (línea 147 de bots.py)
    print(f"\n📊 COORDINACIÓN MULTI-TIMEFRAME...")
    multi_tf = multi_tf_coordinator.analyze_multi_timeframe(timeframe_data)
    print(f"   - Signal: {multi_tf.signal}")
    print(f"   - Confidence: {multi_tf.confidence:.2%}")
    print(f"   - Alignment: {multi_tf.alignment.value}")

    # 7. Selección de Modo (línea 149 de bots.py)
    print(f"\n🎯 SELECCIÓN DE MODO...")
    mode_selected = mode_selector.select_trading_mode(
        market_microstructure=microstructure,
        institutional_activity=institutional,
        multi_tf_analysis=multi_tf
    )
    print(f"   - Modo seleccionado: {mode_selected}")

    # 8. Preparar datos para SignalQualityAssessor (línea 172-178 de bots.py)
    print(f"\n📋 PREPARANDO DATOS PARA EVALUACIÓN DE CALIDAD...")
    main_df = pd.DataFrame({
        'open': main_data['opens'],
        'high': main_data['highs'],
        'low': main_data['lows'],
        'close': main_data['closes'],
        'volume': main_data['volumes']
    })

    # Market structure para evaluación (línea 181-188 de bots.py)
    institutional_market_structure = {
        'regime': 'NEUTRAL',  # Valor por defecto, podría venir de algorithm_selection
        'wyckoff_phase': institutional.market_phase.value,
        'manipulation_detected': institutional.manipulation_type.value != 'NONE',
        'manipulation_type': institutional.manipulation_type.value,
        'order_blocks': institutional.order_blocks,
        'market_phase': institutional.market_phase.value
    }

    print(f"   - DataFrame shape: {main_df.shape}")
    print(f"   - Market structure preparada:")
    for key, value in institutional_market_structure.items():
        if key != 'order_blocks':
            print(f"      • {key}: {value}")

    # 9. EVALUACIÓN DE CALIDAD - AQUÍ SE CALCULA EL SCORE (línea 191-197 de bots.py)
    print(f"\n🎯 EVALUANDO CALIDAD INSTITUCIONAL...")
    print("=" * 60)

    institutional_quality = signal_quality_assessor.assess_signal_quality(
        price_data=main_df,
        volume_data=main_data['volumes'],
        indicators={},  # Ignorado - solo algoritmos institucionales
        market_structure=institutional_market_structure,
        timeframe="15m"
    )

    print(f"\n📊 SCORE FINAL: {institutional_quality.overall_score:.10f}")
    print(f"   - Confidence Level: {institutional_quality.confidence_level}")
    print(f"   - Recommendation: {institutional_quality.smart_money_recommendation}")

    # 10. DESGLOSE DETALLADO DEL CÁLCULO
    print(f"\n📐 DESGLOSE MATEMÁTICO DEL CÁLCULO:")
    print("=" * 60)

    # Pesos definidos en signal_quality_assessor.py línea 935-942
    weights = {
        "wyckoff_method": 0.25,
        "market_microstructure": 0.20,
        "order_blocks": 0.20,
        "liquidity_grabs": 0.15,
        "stop_hunting": 0.10,
        "fair_value_gaps": 0.10
    }

    total_calculated = 0
    print(f"\nFÓRMULA: total_score = Σ(score_i * weight_i)")
    print(f"\nCÁLCULO PASO A PASO:")

    for name, confirmation in institutional_quality.institutional_confirmations.items():
        weight = weights.get(name, 0.15)
        weighted_contribution = confirmation.score * weight
        total_calculated += weighted_contribution

        print(f"\n{name.upper()}:")
        print(f"   Score individual: {confirmation.score:.4f}")
        print(f"   Peso (weight): {weight:.0%}")
        print(f"   Contribución: {confirmation.score:.4f} × {weight} = {weighted_contribution:.4f}")
        print(f"   Bias: {confirmation.bias}")

        # Mostrar los inputs que usó este algoritmo
        if hasattr(confirmation, 'details') and confirmation.details:
            print(f"   INPUTS USADOS:")
            for key, value in confirmation.details.items():
                if isinstance(value, dict):
                    if 'score' in value:
                        print(f"      • {key}: score={value.get('score', 'N/A')}")
                elif key == 'error':
                    print(f"      • ERROR: {value}")
                elif not isinstance(value, (list, dict)):
                    print(f"      • {key}: {value}")

    print(f"\n" + "=" * 60)
    print(f"SUMA TOTAL: {total_calculated:.10f}")
    print(f"SCORE REPORTADO: {institutional_quality.overall_score:.10f}")
    print(f"DIFERENCIA: {abs(total_calculated - institutional_quality.overall_score):.10f}")

    # 11. Verificar criterios de bloqueo
    print(f"\n🚦 CRITERIOS DE BLOQUEO:")
    print(f"   1. Score >= 60: {'✅' if institutional_quality.overall_score >= 60 else '❌'}")
    print(f"      Score actual: {institutional_quality.overall_score:.2f}")
    print(f"      Threshold: 60")
    print(f"      Déficit: {60 - institutional_quality.overall_score:.2f}")

    # Contar algoritmos con alta confianza
    high_confidence_count = sum(1 for _, algo in institutional_quality.institutional_confirmations.items()
                                if hasattr(algo, 'score') and algo.score >= 70)

    print(f"\n   2. Consenso 3/6 algoritmos con score >= 70: {'✅' if high_confidence_count >= 3 else '❌'}")
    print(f"      Algoritmos con score >= 70: {high_confidence_count}/6")

    for name, algo in institutional_quality.institutional_confirmations.items():
        if hasattr(algo, 'score') and algo.score >= 70:
            print(f"      ✓ {name}: {algo.score:.2f}")
        else:
            print(f"      ✗ {name}: {algo.score:.2f}")

    # 12. Conclusión
    print(f"\n" + "=" * 80)
    print(f"💡 CONCLUSIÓN:")

    if institutional_quality.overall_score < 60:
        print(f"   ❌ EJECUCIÓN BLOQUEADA: Score institucional {institutional_quality.overall_score:.2f} < 60")
        print(f"   - El mercado no muestra suficientes señales institucionales")
        print(f"   - Se necesita incrementar el score en {60 - institutional_quality.overall_score:.2f} puntos")
    elif high_confidence_count < 3:
        print(f"   ❌ EJECUCIÓN BLOQUEADA: Solo {high_confidence_count}/6 algoritmos con alta confianza")
        print(f"   - Se requiere consenso de al menos 3 algoritmos")
    else:
        print(f"   ✅ EJECUCIÓN PERMITIDA")

    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(trace_sol_score())