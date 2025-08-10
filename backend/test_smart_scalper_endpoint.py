#!/usr/bin/env python3
"""
🚀 TEST: Smart Scalper Endpoint Integration
Testing del endpoint modificado con Smart Scalper Engine
"""

import requests
import json

# Configuración del servidor
BASE_URL = "http://localhost:8000"

def test_smart_scalper_endpoint():
    """Testing del endpoint Smart Scalper integrado"""
    print("🚀 TESTING: Smart Scalper Endpoint Integration")
    print("=" * 60)
    
    # Test 1: Modo tradicional (sin scalper_mode)
    print("\n1️⃣ Testing modo tradicional...")
    try:
        response = requests.post(f"{BASE_URL}/api/run-smart-trade/BTCUSDT")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Modo tradicional: {data.get('message', 'N/A')}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error conectando: {str(e)}")
    
    # Test 2: Modo Smart Scalper (análisis solamente)
    print("\n2️⃣ Testing Smart Scalper mode (análisis)...")
    try:
        params = {
            "scalper_mode": True,
            "quantity": 0.001,
            "execute_real": False
        }
        response = requests.post(
            f"{BASE_URL}/api/run-smart-trade/BTCUSDT",
            params=params
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Smart Scalper: {data.get('message', 'N/A')}")
            print(f"✅ Algoritmo: {data.get('analysis', {}).get('algorithm_selected', 'N/A')}")
            print(f"✅ Confianza: {data.get('analysis', {}).get('selection_confidence', 'N/A')}")
            print(f"✅ Régimen: {data.get('analysis', {}).get('market_regime', 'N/A')}")
            print(f"✅ Señal: {data.get('signals', {}).get('signal', 'N/A')}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error conectando: {str(e)}")
    
    # Test 3: Modo Smart Scalper con ejecución real (testnet)
    print("\n3️⃣ Testing Smart Scalper con trading real...")
    try:
        params = {
            "scalper_mode": True,
            "quantity": 0.001,
            "execute_real": True
        }
        response = requests.post(
            f"{BASE_URL}/api/run-smart-trade/BTCUSDT",
            params=params
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Smart Scalper + Trading: {data.get('message', 'N/A')}")
            order_result = data.get('order_execution')
            if order_result:
                if 'error' in order_result:
                    print(f"⚠️ Orden: {order_result['error']}")
                else:
                    print(f"🎉 Orden ejecutada: {order_result}")
            else:
                print("ℹ️ No se ejecutó orden (señal HOLD)")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Error conectando: {str(e)}")

if __name__ == "__main__":
    print("🌟 SMART SCALPER ENDPOINT TESTING")
    print("🔗 Asegúrate que el servidor esté ejecutándose en localhost:8000")
    print("="*80)
    
    test_smart_scalper_endpoint()
    
    print("\n🎉 TESTING COMPLETADO")
    print("💡 Si hubo errores, revisa que:")
    print("   1. El servidor esté ejecutándose (uvicorn main:app --reload)")
    print("   2. Exista un bot configurado para BTCUSDT en la base de datos")
    print("   3. Las claves API de Binance testnet estén configuradas")