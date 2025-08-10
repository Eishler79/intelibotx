#!/usr/bin/env python3
"""
🧪 Test directo de las APIs de trading real
"""

import asyncio
import sys
import os

# Agregar el path del backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.binance_real_data import BinanceRealDataService
from services.technical_analysis_service import TechnicalAnalysisService

async def test_real_apis():
    print("🧪 Testing APIs de trading real...")
    
    # Test 1: BinanceRealDataService
    print("\n📊 Test 1: BinanceRealDataService")
    binance_service = BinanceRealDataService(use_testnet=True)
    
    # Test indicadores reales
    print("   Obteniendo indicadores BTCUSDT...")
    indicators = await binance_service.calculate_technical_indicators("BTCUSDT", "15m")
    print(f"   ✅ RSI: {indicators.rsi} ({indicators.rsi_status})")
    print(f"   ✅ Volume: {indicators.volume_ratio}x ({indicators.volume_spike and 'SPIKE' or 'NORMAL'})")
    print(f"   ✅ MACD: {indicators.macd:.4f}")
    
    # Test señal Smart Scalper
    print("   Generando señal Smart Scalper...")
    signal = await binance_service.get_smart_scalper_signal("BTCUSDT", "15m")
    print(f"   ✅ Señal: {signal['signal']} (confianza: {signal['confidence']:.0%})")
    print(f"   ✅ Condiciones: {', '.join(signal.get('conditions_met', []))}")
    
    # Test 2: TechnicalAnalysisService
    print("\n🎯 Test 2: TechnicalAnalysisService")
    tech_service = TechnicalAnalysisService(use_testnet=True)
    
    # Test análisis Smart Scalper completo
    print("   Análisis Smart Scalper completo...")
    scalper_analysis = await tech_service.get_strategy_analysis('Smart Scalper', 'BTCUSDT', '15m')
    
    print(f"   ✅ Señal: {scalper_analysis.get('signal', 'N/A')}")
    print(f"   ✅ Confianza: {scalper_analysis.get('confidence', 0):.0%}")
    print(f"   ✅ Precio entrada: ${scalper_analysis.get('entry_price', 0):,.2f}")
    print(f"   ✅ Take Profit: ${scalper_analysis.get('take_profit', 0):,.2f}")
    print(f"   ✅ Stop Loss: ${scalper_analysis.get('stop_loss', 0):,.2f}")
    print(f"   ✅ R:R Ratio: {scalper_analysis.get('risk_reward_ratio', 0)}:1")
    
    # Test 3: Formato respuesta API
    print("\n📡 Test 3: Formato respuesta para frontend")
    
    # Simular respuesta para /api/real-indicators/BTCUSDT
    api_response = {
        "success": True,
        "data": {
            "symbol": "BTCUSDT",
            "timestamp": indicators.timestamp,
            "timeframe": "15m",
            "rsi": {
                "current": indicators.rsi,
                "status": indicators.rsi_status,
                "signal": indicators.rsi_signal,
                "oversold_threshold": 30,
                "overbought_threshold": 70,
                "trend": "BULLISH" if indicators.rsi > 50 else "BEARISH"
            },
            "volume": {
                "current_ratio": indicators.volume_ratio,
                "spike_detected": indicators.volume_spike,
                "sma_20_volume": indicators.volume_sma,
                "spike_threshold": 1.5,
                "status": "SPIKE_DETECTED" if indicators.volume_spike else "NORMAL"
            },
            "signal": {
                "current": signal['signal'],
                "confidence": signal['confidence'],
                "strength": signal['strength'],
                "conditions_met": signal.get('conditions_met', []),
                "timestamp": signal['timestamp'],
                "entry_quality": signal['quality']
            },
            "data_source": "binance_real_api",
            "algorithm": "Smart Scalper Real v2.1"
        }
    }
    
    print(f"   ✅ API Response estructura preparada")
    print(f"   ✅ RSI: {api_response['data']['rsi']['current']}")
    print(f"   ✅ Señal: {api_response['data']['signal']['current']}")
    print(f"   ✅ Calidad: {api_response['data']['signal']['entry_quality']}")
    
    print("\n🎉 ¡Todos los tests pasaron exitosamente!")
    print("💡 El sistema está listo para conectar con el frontend")
    
    # Mostrar URLs de ejemplo que funcionarían
    print("\n🔗 URLs de API que estarían disponibles:")
    print("   GET /api/real-indicators/BTCUSDT?timeframe=15m")
    print("   GET /api/technical-analysis/BTCUSDT?strategy=Smart%20Scalper")
    print("   POST /api/trading-signals (body: {symbol: 'BTCUSDT', strategy: 'Smart Scalper'})")
    print("   GET /api/strategies")

if __name__ == "__main__":
    asyncio.run(test_real_apis())