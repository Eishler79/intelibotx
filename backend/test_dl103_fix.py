#!/usr/bin/env python3
"""
DL-103 Validation Script - Market Type Data Feeds
Verifica que el market_type se pase correctamente a BinanceRealDataService
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.service_factory import ServiceFactory
from models.bot_config import BotConfig

def test_market_type_passing():
    """Test que market_type se pasa correctamente a través de ServiceFactory"""

    print("🧪 DL-103 Validation - Testing Market Type Passing")
    print("-" * 50)

    # Test 1: SPOT bot config
    spot_bot = BotConfig()
    spot_bot.id = 1
    spot_bot.market_type = "SPOT"
    spot_bot.symbol = "BTCUSDT"

    print("\n✅ Test 1: SPOT Bot Config")
    spot_service = ServiceFactory.get_binance_service(spot_bot)
    print(f"   - Bot market_type: {spot_bot.market_type}")
    print(f"   - Service market_type: {spot_service.market_type}")
    print(f"   - Service base_url: {spot_service.base_url}")
    assert spot_service.market_type == "SPOT", "❌ SPOT market_type not passed correctly!"
    print("   ✓ SPOT test passed")

    # Test 2: FUTURES bot config
    futures_bot = BotConfig()
    futures_bot.id = 2
    futures_bot.market_type = "FUTURES"
    futures_bot.symbol = "BTCUSDT"

    print("\n✅ Test 2: FUTURES Bot Config")
    futures_service = ServiceFactory.get_binance_service(futures_bot)
    print(f"   - Bot market_type: {futures_bot.market_type}")
    print(f"   - Service market_type: {futures_service.market_type}")
    print(f"   - Service base_url: {futures_service.base_url}")
    assert futures_service.market_type == "FUTURES", "❌ FUTURES market_type not passed correctly!"
    print("   ✓ FUTURES test passed")

    # Test 3: None bot_config (should default to SPOT)
    print("\n✅ Test 3: No Bot Config (Default)")
    default_service = ServiceFactory.get_binance_service(None)
    print(f"   - Bot config: None")
    print(f"   - Service market_type: {default_service.market_type}")
    print(f"   - Service base_url: {default_service.base_url}")
    assert default_service.market_type == "SPOT", "❌ Default should be SPOT!"
    print("   ✓ Default test passed")

    # Test 4: Singleton check - same market_type returns same instance
    print("\n✅ Test 4: Singleton Pattern Validation")
    spot_service2 = ServiceFactory.get_binance_service(spot_bot)
    print(f"   - First SPOT instance ID: {id(spot_service)}")
    print(f"   - Second SPOT instance ID: {id(spot_service2)}")
    assert spot_service is spot_service2, "❌ Same market_type should return same instance!"
    print("   ✓ Singleton pattern working correctly")

    # Test 5: Different market_type returns different instance
    print("\n✅ Test 5: Different Market Types = Different Instances")
    print(f"   - SPOT instance ID: {id(spot_service)}")
    print(f"   - FUTURES instance ID: {id(futures_service)}")
    assert spot_service is not futures_service, "❌ Different market_types should have different instances!"
    print("   ✓ Different instances for different market types")

    print("\n" + "=" * 50)
    print("🎉 ALL TESTS PASSED - DL-103 FIX VALIDATED!")
    print("=" * 50)

    return True

if __name__ == "__main__":
    try:
        test_market_type_passing()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)