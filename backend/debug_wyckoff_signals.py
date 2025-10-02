#!/usr/bin/env python3
"""Debug detallado de señales Wyckoff"""

import asyncio
from services.service_factory import ServiceFactory
from services.binance_real_data import BinanceRealDataService
from models.bot_config import BotConfig
from db.database import get_session
from sqlmodel import select
import pandas as pd
import numpy as np
from services.wyckoff.accumulation import detect_accumulation_signals
from services.ta_alternative import calculate_atr

async def debug_signals():
    """Debug detallado de por qué no se detectan señales"""

    print("=" * 80)
    print("🔍 DEBUG DETALLADO SEÑALES WYCKOFF")
    print("=" * 80)

    # Obtener bot
    with get_session() as session:
        bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "BTCUSDT")
        ).first()

    # Obtener datos reales
    binance_service = ServiceFactory.get_binance_service(bot)
    df = await binance_service.get_klines("BTCUSDT", "15m", limit=100)

    if df.empty:
        print("❌ No hay datos")
        return

    opens = df['open'].values
    highs = df['high'].values
    lows = df['low'].values
    closes = df['close'].values
    volumes = df['volume'].values

    # Calcular ATR
    atr_values = calculate_atr(highs, lows, closes, period=14)
    atr = atr_values if isinstance(atr_values, (int, float)) else atr_values[-1] if len(closes) > 14 else 1.0

    # Calcular rango
    range_low = lows.min()
    range_high = highs.max()

    print(f"\n📊 DATOS DEL MERCADO:")
    print(f"  Precio actual: ${closes[-1]:,.2f}")
    print(f"  ATR: {atr:.2f}")
    print(f"  Rango: ${range_low:,.2f} - ${range_high:,.2f}")
    print(f"  Volumen actual: {volumes[-1]:,.0f}")
    print(f"  Volumen promedio (20): {volumes[-20:].mean():,.0f}")

    print(f"\n🔧 PARÁMETROS BOT:")
    print(f"  wyckoff_prior_trend_bars: {bot.wyckoff_prior_trend_bars}")
    print(f"  wyckoff_volume_increase_factor: {bot.wyckoff_volume_increase_factor}")
    print(f"  wyckoff_support_touches_min: {bot.wyckoff_support_touches_min}")
    print(f"  wyckoff_rebound_threshold: {bot.wyckoff_rebound_threshold}")

    # Detectar señales
    signals = detect_accumulation_signals(
        opens, highs, lows, closes, volumes,
        atr, range_low, range_high, bot
    )

    print(f"\n📍 SEÑALES ACCUMULATION:")
    for signal_name, signal_data in signals.items():
        status = "✅" if signal_data.get('detected', False) else "❌"
        print(f"  {status} {signal_name}: detected={signal_data.get('detected', False)}")
        if signal_data.get('detected'):
            print(f"     price_level: {signal_data.get('price_level', 0):.2f}")
            print(f"     confidence: {signal_data.get('confidence', 0):.2f}")

    # Análisis específico de PS (Preliminary Support)
    print(f"\n🔍 ANÁLISIS PS (Preliminary Support):")

    # 1. Prior downtrend
    if bot.wyckoff_prior_trend_bars <= len(closes):
        prior_closes = closes[-bot.wyckoff_prior_trend_bars:]
        prior_downtrend = prior_closes[0] > prior_closes[-1]
        print(f"  Prior downtrend ({bot.wyckoff_prior_trend_bars} bars): {prior_downtrend}")
        print(f"    Inicio: ${prior_closes[0]:,.2f}, Fin: ${prior_closes[-1]:,.2f}")
    else:
        print(f"  ❌ No hay suficientes datos para prior trend")

    # 2. Volume increase
    recent_vol_avg = volumes[-5:].mean() if len(volumes) >= 5 else volumes[-1]
    vol_increase = volumes[-1] > recent_vol_avg * bot.wyckoff_volume_increase_factor
    print(f"  Volume increase: {vol_increase}")
    print(f"    Vol actual: {volumes[-1]:,.0f}, Avg*{bot.wyckoff_volume_increase_factor}: {recent_vol_avg * bot.wyckoff_volume_increase_factor:,.0f}")

    # 3. Support touches
    support_zone = range_low + atr * bot.wyckoff_atr_factor
    support_touches = sum(1 for low in lows[-20:] if abs(low - range_low) < support_zone - range_low)
    print(f"  Support touches: {support_touches} (min: {bot.wyckoff_support_touches_min})")
    print(f"    Support zone: ${range_low:,.2f} - ${support_zone:,.2f}")

    # 4. Rebound
    if range_low > 0:
        rebound_pct = (closes[-1] - range_low) / range_low
        rebound = rebound_pct > bot.wyckoff_rebound_threshold
        print(f"  Rebound: {rebound} ({rebound_pct:.4f} > {bot.wyckoff_rebound_threshold})")

if __name__ == "__main__":
    print("🚀 Iniciando debug señales Wyckoff...")
    asyncio.run(debug_signals())