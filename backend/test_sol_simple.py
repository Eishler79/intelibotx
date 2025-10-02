#!/usr/bin/env python3
"""
Prueba simple y directa del bot SOL con DL-103
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from db.database import get_session
from models.bot_config import BotConfig
from services.service_factory import ServiceFactory

print("\n" + "="*60)
print("🎯 PRUEBA SIMPLE DL-103 - BOT SOL")
print("="*60)

# 1. Obtener bot SOL
with get_session() as session:
    sol_bot = session.exec(
        select(BotConfig).where(BotConfig.symbol == "SOLUSDT")
    ).first()

    print(f"\n1️⃣ Bot SOL en DB:")
    print(f"   - ID: {sol_bot.id}")
    print(f"   - Market Type: {sol_bot.market_type}")
    print(f"   - Status: {sol_bot.status}")
    print(f"   - Leverage: {sol_bot.leverage}x")

# 2. Crear servicio con bot_config
binance_service = ServiceFactory.get_binance_service(sol_bot)

print(f"\n2️⃣ BinanceService creado:")
print(f"   - Market Type recibido: {binance_service.market_type}")
print(f"   - URL configurada: {binance_service.base_url}")

# 3. Verificación
print(f"\n3️⃣ VERIFICACIÓN DL-103:")
if "fapi" in binance_service.base_url:
    print("   ✅ CORRECTO: Usando endpoint FUTURES (/fapi/v1/)")
    print("   ✅ DL-103 FUNCIONANDO CORRECTAMENTE")
else:
    print("   ❌ ERROR: Usando endpoint SPOT")
    print("   ❌ DL-103 NO está funcionando")

print("\n" + "="*60)