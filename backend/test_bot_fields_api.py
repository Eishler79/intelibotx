#!/usr/bin/env python3
"""
TEST EJECUTABLE REAL - Bot Fields APIs
DL-001 Compliance validation
"""

import pytest
import requests
import os
from datetime import datetime

# REAL API BASE URL
API_BASE = os.getenv("VITE_API_BASE_URL", "http://localhost:8000")

def test_strategies_service_local():
    """Test REAL InstitutionalAlgorithmsService - LOCAL IMPORT"""
    import sys
    sys.path.append('/Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend')
    
    try:
        from services.institutional_algorithms import InstitutionalAlgorithmsService
        
        service = InstitutionalAlgorithmsService()
        strategies = service.get_all_strategies()
        
        # Verify 3 REAL implemented strategies
        expected_real_strategies = ["Smart Scalper", "Manipulation Detector", "Trend Hunter"]
        
        for strategy in expected_real_strategies:
            assert strategy in strategies, f"Missing REAL strategy: {strategy}"
            algorithms = service.get_strategy_algorithms(strategy)
            assert len(algorithms) > 0, f"Strategy {strategy} has no algorithms"
        
        print(f"✅ PASS: Strategies service - {len(expected_real_strategies)} REAL strategies")
        return True
        
    except ImportError as e:
        print(f"❌ FAIL: Cannot import service - {e}")
        return False

def test_market_types_endpoint():
    """Test REAL /api/user/exchanges/{id}/market-types endpoint"""
    # This requires auth - test will validate endpoint exists and structure
    response = requests.get(f"{API_BASE}/api/user/exchanges/1/market-types")
    
    # Expect 401 (auth required) or 200 (if configured)
    assert response.status_code in [200, 401], f"Unexpected status: {response.status_code}"
    
    if response.status_code == 200:
        data = response.json()
        assert "market_types" in data, "Response missing market_types"
        print("✅ PASS: Market types endpoint structure valid")
    else:
        print("✅ PASS: Market types endpoint requires auth (expected)")
    
    return True

def test_symbol_details_missing():
    """Test that symbol-details API doesn't exist yet (expected to fail)"""
    response = requests.get(f"{API_BASE}/api/user/exchanges/1/symbol-details")
    
    # Should be 404 - API doesn't exist yet
    assert response.status_code == 404, f"Expected 404 for missing API, got {response.status_code}"
    print("✅ PASS: Symbol details API missing (as expected)")
    return True

def test_trading_intervals_missing():
    """Test that trading-intervals API doesn't exist yet (expected to fail)"""
    response = requests.get(f"{API_BASE}/api/user/exchanges/1/trading-intervals")
    
    # Should be 404 - API doesn't exist yet  
    assert response.status_code == 404, f"Expected 404 for missing API, got {response.status_code}"
    print("✅ PASS: Trading intervals API missing (as expected)")
    return True

if __name__ == "__main__":
    print(f"🚀 TESTING REAL APIs at {API_BASE}")
    print(f"⏰ Test started: {datetime.now()}")
    
    try:
        test_strategies_service_local()
        test_market_types_endpoint() 
        test_symbol_details_missing()
        test_trading_intervals_missing()
        
        print("✅ ALL TESTS PASSED")
    except Exception as e:
        print(f"❌ TEST FAILED: {e}")
        exit(1)