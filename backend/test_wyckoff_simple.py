#!/usr/bin/env python3
"""Test simple de Wyckoff para ver qué falla"""

import numpy as np
from models.bot_config import BotConfig
from db.database import get_session
from sqlmodel import select

# Verificar que el bot tiene los parámetros
with get_session() as session:
    bot = session.exec(
        select(BotConfig).where(BotConfig.symbol == "BTCUSDT")
    ).first()

    if bot:
        print(f"Bot encontrado: {bot.symbol}")
        print("\nParámetros Wyckoff en el bot:")

        # Verificar cada parámetro crítico
        critical_params = [
            'wyckoff_prior_trend_bars',
            'wyckoff_volume_increase_factor',
            'wyckoff_support_touches_min',
            'wyckoff_vol_increase_factor',
            'wyckoff_rebound_threshold'
        ]

        for param in critical_params:
            try:
                value = getattr(bot, param)
                print(f"  ✅ {param}: {value}")
            except AttributeError:
                print(f"  ❌ {param}: NO EXISTE EN EL MODELO")

        # Ahora probar la función de detección
        print("\nProbando función detect_accumulation_signals:")
        from services.wyckoff.accumulation import detect_accumulation_signals

        # Datos dummy
        opens = np.random.rand(100) * 100 + 100
        highs = opens + np.random.rand(100) * 5
        lows = opens - np.random.rand(100) * 5
        closes = opens + np.random.rand(100) * 2 - 1
        volumes = np.random.rand(100) * 1000000
        atr = 2.5
        range_low = 95
        range_high = 105

        try:
            signals = detect_accumulation_signals(
                opens, highs, lows, closes, volumes,
                atr, range_low, range_high, bot
            )
            print(f"  ✅ Función ejecutada exitosamente")
            print(f"  Señales retornadas: {list(signals.keys())}")

            # Contar señales detectadas
            detected = sum(1 for s in signals.values() if s.get('detected', False))
            print(f"  Señales detectadas: {detected}/5")

        except Exception as e:
            print(f"  ❌ Error en función: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("Bot no encontrado")