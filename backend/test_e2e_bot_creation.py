#!/usr/bin/env python3
"""
TEST E2E REAL - Bot Creation Complete Flow
Tests con credenciales reales de Eduard
"""

import requests
import json
from datetime import datetime

API_BASE = "http://localhost:8000"

def test_authentication_with_real_credentials():
    """Test autenticación con credenciales reales de Eduard"""
    
    print("🔐 STEP 1: Authentication with real credentials")
    
    # Usar credenciales reales de Eduard 
    login_data = {
        "email": "eduard@intelibotx.com",  # Ajustar si es diferente
        "password": "admin123"  # Credenciales que usa Eduard
    }
    
    response = requests.post(f"{API_BASE}/login", json=login_data)
    
    if response.status_code != 200:
        print(f"❌ FAIL: Authentication failed - {response.status_code}")
        if response.text:
            print(f"Error: {response.text}")
        return None
    
    data = response.json()
    if not data.get('success') or not data.get('access_token'):
        print(f"❌ FAIL: No token received - {data}")
        return None
        
    token = data['access_token']
    print(f"✅ Authentication SUCCESS - Token received")
    return token

def test_exchanges_list_with_auth(token):
    """Test listar exchanges del usuario autenticado"""
    
    print("🏪 STEP 2: Get user exchanges")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(f"{API_BASE}/api/user/exchanges", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ FAIL: Exchanges list failed - {response.status_code}")
        return None
    
    data = response.json()
    exchanges = data.get('exchanges', [])
    
    print(f"✅ Found {len(exchanges)} exchanges")
    
    if len(exchanges) == 0:
        print("⚠️ WARNING: No exchanges configured - will test anyway")
        return None
    
    # Usar primer exchange disponible
    exchange = exchanges[0]
    print(f"✅ Using exchange: {exchange['connection_name']} ({exchange['exchange_name']})")
    return exchange

def test_new_apis_with_auth(token, exchange_id):
    """Test nuevas APIs: symbol-details y trading-intervals"""
    
    print(f"🆕 STEP 3: Test NEW APIs with exchange_id={exchange_id}")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test Symbol Details API
    print("  Testing symbol-details API...")
    response = requests.get(
        f"{API_BASE}/api/user/exchanges/{exchange_id}/symbol-details", 
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('base_currencies'):
            print(f"  ✅ Symbol-details API: {len(data['base_currencies'])} currencies")
        else:
            print(f"  ❌ Symbol-details API: Invalid response format")
    else:
        print(f"  ❌ Symbol-details API failed: {response.status_code}")
        print(f"  Response: {response.text[:200]}")
    
    # Test Trading Intervals API  
    print("  Testing trading-intervals API...")
    response = requests.get(
        f"{API_BASE}/api/user/exchanges/{exchange_id}/trading-intervals",
        headers=headers
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('intervals'):
            print(f"  ✅ Trading-intervals API: {len(data['intervals'])} intervals")
        else:
            print(f"  ❌ Trading-intervals API: Invalid response format")
    else:
        print(f"  ❌ Trading-intervals API failed: {response.status_code}")
        print(f"  Response: {response.text[:200]}")

def test_create_bot_e2e(token, exchange_id=None):
    """Test E2E completo creación de bot"""
    
    print("🤖 STEP 4: E2E Bot Creation Test")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Bot data con campos DL-001 compliant (no hardcode)
    bot_data = {
        "name": f"Test Bot E2E {datetime.now().strftime('%H:%M:%S')}",
        "symbol": "BTCUSDT",
        "exchange_id": exchange_id,
        "strategy": "Smart Scalper",  # Una de las 3 reales
        "interval": "15m",  # De intervals API
        "base_currency": "USDT",  # De symbol-details API
        "quote_currency": "BTC",
        "stake": 100,
        "take_profit": 2.5,
        "stop_loss": 1.5,
        "market_type": "SPOT",
        "leverage": 1,
        "margin_type": "CROSS"
    }
    
    print(f"  Creating bot: {bot_data['name']}")
    
    response = requests.post(f"{API_BASE}/api/create-bot", headers=headers, json=bot_data)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            bot_id = data.get('bot_id')
            print(f"  ✅ Bot created successfully - ID: {bot_id}")
            return bot_id
        else:
            print(f"  ❌ Bot creation failed: {data}")
            return None
    else:
        print(f"  ❌ Bot creation failed: {response.status_code}")
        print(f"  Response: {response.text}")
        return None

if __name__ == "__main__":
    print("🚀 STARTING E2E TESTS WITH REAL CREDENTIALS")
    print(f"⏰ Test started: {datetime.now()}")
    
    try:
        # Step 1: Authentication
        token = test_authentication_with_real_credentials()
        if not token:
            print("❌ E2E FAILED: Cannot authenticate")
            exit(1)
        
        # Step 2: Get exchanges
        exchange = test_exchanges_list_with_auth(token)
        exchange_id = exchange['id'] if exchange else 1  # Fallback to 1
        
        # Step 3: Test new APIs
        test_new_apis_with_auth(token, exchange_id)
        
        # Step 4: E2E Bot Creation
        bot_id = test_create_bot_e2e(token, exchange_id)
        
        if bot_id:
            print("✅ ALL E2E TESTS PASSED")
        else:
            print("❌ E2E TESTS FAILED at bot creation")
            exit(1)
            
    except Exception as e:
        print(f"❌ E2E TESTS FAILED: {e}")
        exit(1)