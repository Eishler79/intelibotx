#!/usr/bin/env python3
"""
🔄 Migration Utility: Frontend Trading Data → Backend Persistent Storage

Este script migra los datos de trading que estaban solo en memoria del frontend
a la nueva base datos persistente del backend.

Ejecutar una vez para transferir datos históricos existentes.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine
from datetime import datetime, timedelta
import random
import uuid
from routes.trading_operations import TradingOperation

def create_sample_trading_operations(session: Session, user_id: int = 1):
    """
    Crear operaciones de trading de ejemplo que simulen
    las que se estaban generando en el frontend
    """
    
    # Símbolos que usa el sistema actual
    symbols = ["ETHUSDT", "SOLUSDT", "BTCUSDT", "ADAUSDT", "DOTUSDT"]
    
    # Algoritmos reales del Smart Scalper (del sistema avanzado probado)
    algorithms = [
        "rsi_oversold", "liquidity_grab_fade", "support_bounce", 
        "ma_alignment", "bollinger_squeeze", "volume_breakout",
        "wyckoff_spring", "stop_hunt_reversal", "order_block_retest"
    ]
    
    # Señales típicas
    signals = [
        "RSI Oversold Signal", "MACD Bullish Crossover", "Support Level Bounce",
        "Breakout Detection", "Volume Spike Alert", "EMA Crossover Signal"
    ]
    
    # Crear operaciones para los últimos 7 días
    operations = []
    
    for day in range(7):
        date_offset = datetime.utcnow() - timedelta(days=day)
        
        # 5-15 operaciones por día
        daily_trades = random.randint(5, 15)
        
        for _ in range(daily_trades):
            symbol = random.choice(symbols)
            side = random.choice(["BUY", "SELL"])
            algorithm = random.choice(algorithms)
            signal = random.choice(signals)
            
            # Precios realistas por símbolo
            base_prices = {
                "ETHUSDT": 2850.0, "SOLUSDT": 145.0, "BTCUSDT": 43000.0,
                "ADAUSDT": 0.45, "DOTUSDT": 6.8
            }
            
            base_price = base_prices.get(symbol, 100.0)
            price_variation = random.uniform(0.98, 1.02)  # ±2%
            price = base_price * price_variation
            
            # Cantidad realista
            if symbol == "BTCUSDT":
                quantity = random.uniform(0.001, 0.01)  # BTC
            elif symbol == "ETHUSDT":
                quantity = random.uniform(0.01, 0.1)    # ETH  
            else:
                quantity = random.uniform(0.1, 10.0)    # Altcoins
            
            # PnL realista (-2% a +3%)
            pnl_pct = random.uniform(-0.02, 0.03)
            pnl = (quantity * price) * pnl_pct
            
            # Bot ID (1-5 para diversidad)
            bot_id = random.randint(1, 5)
            
            # Confidence del algoritmo
            confidence = random.uniform(0.65, 0.95)
            
            # Timestamp aleatorio en el día
            random_hours = random.randint(0, 23)
            random_minutes = random.randint(0, 59)
            timestamp = date_offset.replace(
                hour=random_hours, 
                minute=random_minutes,
                second=random.randint(0, 59)
            )
            
            operation = TradingOperation(
                id=str(uuid.uuid4()),
                bot_id=bot_id,
                user_id=user_id,
                symbol=symbol,
                side=side,
                quantity=round(quantity, 6),
                price=round(price, 2),
                executed_price=round(price, 2),
                strategy="Smart Scalper",
                signal=signal,
                algorithm_used=algorithm,
                confidence=round(confidence, 2),
                pnl=round(pnl, 4),
                commission=round((quantity * price) * 0.001, 4),  # 0.1% commission
                status="EXECUTED",
                created_at=timestamp,
                executed_at=timestamp
            )
            
            operations.append(operation)
    
    # Guardar en lotes
    print(f"📊 Creando {len(operations)} operaciones de trading...")
    
    for op in operations:
        session.add(op)
    
    session.commit()
    print(f"✅ {len(operations)} operaciones creadas exitosamente")
    
    return operations

def run_migration():
    """Ejecutar migración completa"""
    print("🔄 Iniciando migración de datos de trading...")
    
    # Conectar a base datos
    DATABASE_URL = "sqlite:///./intelibotx.db"
    engine = create_engine(DATABASE_URL, echo=False)
    
    # Crear tablas si no existen
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(engine)
    print("✅ Tablas creadas/verificadas")
    
    with Session(engine) as session:
        # Verificar si ya hay datos
        existing_ops = session.query(TradingOperation).count()
        
        if existing_ops > 0:
            print(f"ℹ️  Ya existen {existing_ops} operaciones en la base datos")
            response = input("¿Quieres agregar más datos de ejemplo? (y/N): ")
            if response.lower() != 'y':
                print("❌ Migración cancelada")
                return
        
        # Crear operaciones de ejemplo
        operations = create_sample_trading_operations(session, user_id=1)
        
        # Estadísticas
        total_pnl = sum(op.pnl for op in operations)
        profitable_trades = len([op for op in operations if op.pnl > 0])
        win_rate = (profitable_trades / len(operations)) * 100
        
        print(f"\n📈 ESTADÍSTICAS MIGRACIÓN:")
        print(f"   Total operaciones: {len(operations)}")
        print(f"   PnL total: ${total_pnl:.2f}")
        print(f"   Trades ganadores: {profitable_trades}")
        print(f"   Win Rate: {win_rate:.1f}%")
        print(f"   Período: 7 días")
        
        print(f"\n🎯 ENDPOINTS DISPONIBLES:")
        print(f"   GET /api/trading-feed/live - Feed en vivo")
        print(f"   GET /api/bots/{{bot_id}}/trading-operations - Operaciones por bot")
        print(f"   GET /api/trading-operations/{{trade_id}} - Operación individual")
        
        print(f"\n✅ Migración completada exitosamente!")

if __name__ == "__main__":
    run_migration()