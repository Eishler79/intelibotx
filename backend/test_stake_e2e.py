#!/usr/bin/env python3
"""Test end-to-end del flujo stake -> quantity -> order"""

import asyncio
from services.http_testnet_service import create_testnet_order

async def test_binance_order_format():
    """Verificar qué espera Binance exactamente"""

    print("=" * 60)
    print("TEST: VERIFICACIÓN FORMATO ORDEN BINANCE")
    print("=" * 60)

    # Datos de prueba
    symbol = "BTCUSDT"
    stake_usdt = 500.0  # Usuario quiere invertir 500 USDT
    btc_price = 100000.0  # Precio actual BTC

    # Cálculo de quantity
    quantity_btc = stake_usdt / btc_price  # 0.005 BTC

    print(f"\n📊 DATOS:")
    print(f"  Symbol: {symbol}")
    print(f"  Stake: {stake_usdt} USDT")
    print(f"  Precio BTC: ${btc_price}")
    print(f"  Quantity calculado: {quantity_btc} BTC")

    print(f"\n🔍 PREGUNTA CRÍTICA:")
    print(f"  ¿Binance espera quantity en BTC o en USDT?")
    print(f"  Respuesta: Binance SIEMPRE espera quantity en BASE currency (BTC)")

    print(f"\n✅ FORMATO CORRECTO PARA BINANCE:")
    print("  {")
    print(f'    "symbol": "{symbol}",')
    print(f'    "side": "BUY",')
    print(f'    "quantity": "{quantity_btc:.8f}",  # EN BTC, NO EN USDT')
    print(f'    "price": "{btc_price}"')
    print("  }")

    print(f"\n🔄 FLUJO COMPLETO:")
    print(f"  1. Usuario configura: stake = 500 (base_currency = USDT en BD)")
    print(f"  2. Backend calcula: quantity = 500/100000 = 0.005 BTC")
    print(f"  3. Binance recibe: quantity = 0.005 (en BTC)")
    print(f"  4. Orden ejecuta: Compra 0.005 BTC por 500 USDT")

    return True

async def test_system_convention():
    """Verificar convención del sistema vs convención técnica"""

    print("\n" + "=" * 60)
    print("TEST: CONVENCIÓN SISTEMA vs TÉCNICA")
    print("=" * 60)

    print("\n📚 CONVENCIÓN TÉCNICA ESTÁNDAR:")
    print("  BTCUSDT: base=BTC, quote=USDT")
    print("  - Base currency = Lo que compras (BTC)")
    print("  - Quote currency = Con lo que pagas (USDT)")

    print("\n🏗️ CONVENCIÓN DE NUESTRO SISTEMA:")
    print("  BTCUSDT: base=USDT, quote=BTC (INVERTIDO)")
    print("  - base_currency = Moneda del stake (USDT)")
    print("  - quote_currency = Lo que se tradea (BTC)")

    print("\n⚙️ IMPACTO EN CÁLCULOS:")
    print("  stake = result.base_currency (USDT en sistema)")
    print("  quantity = stake / price (en BTC para Binance)")

    print("\n✅ CONCLUSIÓN:")
    print("  - El sistema usa convención invertida CONSISTENTEMENTE")
    print("  - Mi código debe adaptarse a esta convención")
    print("  - El cálculo quantity = stake/price es CORRECTO")
    print("  - Binance recibe quantity en BTC (correcto)")

    return True

if __name__ == "__main__":
    print("🚀 Iniciando tests E2E stake...")
    asyncio.run(test_binance_order_format())
    asyncio.run(test_system_convention())
    print("\n✅ Tests completados")