#!/usr/bin/env python3
"""Script para verificar estado de todos los bots en la DB"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from db.database import get_session
from models.bot_config import BotConfig

def check_all_bots():
    print("=" * 60)
    print("📊 VERIFICANDO TODOS LOS BOTS EN LA BASE DE DATOS")
    print("=" * 60)

    with get_session() as session:
        bots = session.exec(select(BotConfig)).all()

        if not bots:
            print("⚠️ No hay bots en la base de datos")
            return

        print(f"\n✅ Total de bots encontrados: {len(bots)}\n")

        for bot in bots:
            print(f"Bot ID: {bot.id}")
            print(f"  📌 Nombre: {bot.name}")
            print(f"  💱 Symbol: {bot.symbol}")
            print(f"  🎯 Status: {bot.status}")
            print(f"  📊 Market Type: {bot.market_type}")
            print(f"  💰 Leverage: {bot.leverage}")
            print(f"  🔧 Strategy: {bot.strategy}")
            print(f"  ⏰ Interval: {bot.interval}")
            print(f"  📅 Created: {bot.created_at}")
            print(f"  🔄 Updated: {bot.updated_at}")
            print("-" * 40)

        # Estadísticas
        print("\n📈 RESUMEN DE ESTADOS:")
        stopped = len([b for b in bots if b.status == "STOPPED"])
        running = len([b for b in bots if b.status == "RUNNING"])
        paused = len([b for b in bots if b.status == "PAUSED"])

        print(f"  🔴 STOPPED: {stopped}")
        print(f"  🟢 RUNNING: {running}")
        print(f"  🟡 PAUSED: {paused}")

        print("\n📊 RESUMEN DE MARKET TYPES:")
        spot = len([b for b in bots if b.market_type == "SPOT"])
        futures = len([b for b in bots if b.market_type == "FUTURES"])

        print(f"  💵 SPOT: {spot}")
        print(f"  📈 FUTURES: {futures}")

        print("=" * 60)

if __name__ == "__main__":
    check_all_bots()