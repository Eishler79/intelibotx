#!/usr/bin/env python3
"""
DL-103 Verificación SOL Bot (FUTURES)
Script para demostrar que la implementación funciona correctamente
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from db.database import get_session
from models.bot_config import BotConfig
from services.service_factory import ServiceFactory
from services.binance_real_data import BinanceRealDataService
import asyncio
from datetime import datetime

def verificar_bot_sol():
    """Verificación completa del bot SOL con DL-103 implementado"""

    print("=" * 80)
    print("🔍 DL-103 VERIFICACIÓN: BOT SOL (FUTURES)")
    print("=" * 80)

    # 1. OBTENER BOT SOL DE LA DB
    print("\n📊 PASO 1: Obteniendo bot SOL de la base de datos...")
    with get_session() as session:
        sol_bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "SOLUSDT")
        ).first()

        if not sol_bot:
            print("❌ No se encontró bot SOL en la DB")
            return

        print(f"✅ Bot encontrado:")
        print(f"   - ID: {sol_bot.id}")
        print(f"   - Symbol: {sol_bot.symbol}")
        print(f"   - Market Type: {sol_bot.market_type}")
        print(f"   - Status: {sol_bot.status}")
        print(f"   - Leverage: {sol_bot.leverage}")

    # 2. VERIFICAR SERVICE FACTORY
    print("\n📊 PASO 2: Verificando ServiceFactory con bot_config...")
    binance_service = ServiceFactory.get_binance_service(sol_bot)

    print(f"✅ BinanceService creado:")
    print(f"   - Market Type interno: {binance_service.market_type}")
    print(f"   - Instancia ID: {id(binance_service)}")

    # 3. VERIFICAR URL BASE
    print("\n📊 PASO 3: Verificando URLs base...")
    base_url = binance_service.base_url

    print(f"✅ URLs configuradas:")
    print(f"   - Base URL: {base_url}")

    if "fapi" in base_url:
        print("   ✓ Usando endpoint FUTURES (/fapi/v1/)")
    else:
        print("   ❌ ERROR: Usando endpoint SPOT (/api/v3/)")

    # 4. HACER LLAMADA REAL A BINANCE
    print("\n📊 PASO 4: Llamada real a Binance FUTURES...")

    async def test_real_call():
        try:
            # Test ticker price
            ticker = await binance_service.get_ticker_price("SOLUSDT")
            print(f"✅ Ticker price obtenido:")
            print(f"   - Symbol: {ticker.get('symbol', 'N/A')}")
            print(f"   - Price: {ticker.get('price', 'N/A')}")

            # Test klines
            klines = await binance_service.get_klines("SOLUSDT", "1m", limit=1)
            if klines:
                print(f"✅ Klines obtenidas:")
                print(f"   - Última vela: {datetime.fromtimestamp(klines[0][0]/1000)}")
                print(f"   - Open: {klines[0][1]}, Close: {klines[0][4]}")

            # Test order book
            orderbook = await binance_service.get_orderbook("SOLUSDT")
            print(f"✅ Order book obtenido:")
            print(f"   - Bids: {len(orderbook.get('bids', []))} niveles")
            print(f"   - Asks: {len(orderbook.get('asks', []))} niveles")

            return True
        except Exception as e:
            print(f"❌ Error en llamada: {e}")
            return False

    # Ejecutar test async
    success = asyncio.run(test_real_call())

    # 5. COMPARACIÓN SPOT VS FUTURES
    print("\n📊 PASO 5: Comparación SPOT vs FUTURES...")

    # Crear bot SPOT temporal para comparar
    spot_bot = BotConfig()
    spot_bot.id = 999
    spot_bot.market_type = "SPOT"
    spot_bot.symbol = "SOLUSDT"

    spot_service = ServiceFactory.get_binance_service(spot_bot)
    futures_service = ServiceFactory.get_binance_service(sol_bot)

    print("✅ Comparación de servicios:")
    print(f"   SPOT Service:")
    print(f"     - URL: {spot_service.base_url}")
    print(f"     - Market: {spot_service.market_type}")
    print(f"   FUTURES Service:")
    print(f"     - URL: {futures_service.base_url}")
    print(f"     - Market: {futures_service.market_type}")

    if spot_service.base_url != futures_service.base_url:
        print("   ✓ URLs diferentes correctamente")
    else:
        print("   ❌ ERROR: Misma URL para SPOT y FUTURES")

    # 6. VERIFICAR AISLAMIENTO
    print("\n📊 PASO 6: Verificando aislamiento por bot...")

    # Crear otro bot FUTURES
    otro_futures = BotConfig()
    otro_futures.id = 998
    otro_futures.market_type = "FUTURES"
    otro_futures.symbol = "ETHUSDT"

    otro_service = ServiceFactory.get_binance_service(otro_futures)

    print(f"✅ Aislamiento de instancias:")
    print(f"   - SOL FUTURES ID: {id(futures_service)}")
    print(f"   - ETH FUTURES ID: {id(otro_service)}")

    if futures_service is otro_service:
        print("   ✓ Misma instancia para mismo market_type (correcto)")
    else:
        print("   ❌ Diferentes instancias para mismo market_type")

    # RESUMEN FINAL
    print("\n" + "=" * 80)
    print("📊 RESUMEN DL-103 VERIFICACIÓN:")
    print("=" * 80)

    checks = []

    # Check 1: Bot configurado correctamente
    checks.append(("Bot SOL market_type = FUTURES", sol_bot.market_type == "FUTURES"))

    # Check 2: Service recibe market_type
    checks.append(("BinanceService.market_type = FUTURES", binance_service.market_type == "FUTURES"))

    # Check 3: URL correcta
    checks.append(("URL contiene /fapi/v1/", "fapi" in binance_service.base_url))

    # Check 4: Llamada exitosa
    checks.append(("Llamada a Binance exitosa", success))

    # Check 5: Separación SPOT/FUTURES
    checks.append(("SPOT y FUTURES URLs diferentes", spot_service.base_url != futures_service.base_url))

    for check, passed in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {check}")

    total_passed = sum(1 for _, p in checks if p)
    print(f"\n🎯 RESULTADO: {total_passed}/{len(checks)} verificaciones pasadas")

    if total_passed == len(checks):
        print("🎉 DL-103 IMPLEMENTACIÓN FUNCIONANDO CORRECTAMENTE")
    else:
        print("⚠️ Hay verificaciones fallidas")

    print("=" * 80)

if __name__ == "__main__":
    verificar_bot_sol()