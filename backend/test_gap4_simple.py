#!/usr/bin/env python3
"""
Test GAP #4 Simplified - Without Database
Direct validation of MTF implementation
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.signal_quality_assessor import SignalQualityAssessor
import pandas as pd
import numpy as np

def test_mtf_implementation():
    """Test MTF confirmation logic directly"""

    print("=" * 80)
    print("🔍 GAP #4 VALIDATION - MTF CONFIRMATION LOGIC")
    print("=" * 80)

    # 1. Initialize SignalQualityAssessor
    assessor = SignalQualityAssessor(bot_config=None)
    print("\n✅ SignalQualityAssessor initialized with bot_config=None")

    # 2. Create sample price data
    np.random.seed(42)
    prices = [100 + i * 0.1 + np.random.randn() * 0.5 for i in range(100)]
    volumes = [1000 + np.random.randint(0, 500) for _ in range(100)]

    price_df = pd.DataFrame({
        'open': prices[:-1] + [prices[-1]],
        'high': [p + abs(np.random.randn() * 0.2) for p in prices],
        'low': [p - abs(np.random.randn() * 0.2) for p in prices],
        'close': prices,
        'volume': volumes
    })

    print(f"\n📊 Sample data created:")
    print(f"   - Candles: {len(price_df)}")
    print(f"   - Price range: ${price_df['close'].min():.2f} - ${price_df['close'].max():.2f}")

    # 3. Create mock timeframe_data
    timeframe_data = {
        '5m': {
            'opens': prices,
            'highs': [p + 0.5 for p in prices],
            'lows': [p - 0.5 for p in prices],
            'closes': prices,
            'volumes': volumes
        },
        '15m': {
            'opens': prices[::3],  # Every 3rd candle
            'highs': [p + 0.7 for p in prices[::3]],
            'lows': [p - 0.7 for p in prices[::3]],
            'closes': prices[::3],
            'volumes': volumes[::3]
        },
        '1h': {
            'opens': prices[::12],  # Every 12th candle
            'highs': [p + 1.0 for p in prices[::12]],
            'lows': [p - 1.0 for p in prices[::12]],
            'closes': prices[::12],
            'volumes': volumes[::12]
        }
    }

    print(f"\n📈 Mock timeframe_data created:")
    for tf, data in timeframe_data.items():
        print(f"   - {tf}: {len(data['closes'])} candles")

    # 4. Test WITH timeframe_data (GAP #4)
    print(f"\n🎯 TEST 1: WITH MTF DATA")

    market_structure = {
        'regime': 'NEUTRAL',
        'wyckoff_phase': 'ACCUMULATION',
        'manipulation_detected': False,
        'manipulation_type': 'NONE',
        'order_blocks': [],
        'market_phase': 'ACCUMULATION'
    }

    try:
        result_with_mtf = assessor.assess_signal_quality(
            price_data=price_df,
            volume_data=volumes,
            indicators={},
            market_structure=market_structure,
            timeframe="15m",
            timeframe_data=timeframe_data  # GAP #4
        )

        print(f"   ✅ Assessment completed with MTF")
        print(f"   - Overall Score: {result_with_mtf.overall_score:.2f}")

        wyckoff = result_with_mtf.institutional_confirmations.get('wyckoff_method')
        if wyckoff and hasattr(wyckoff, 'details'):
            mtf_score = wyckoff.details.get('mtf_confirmation_score', 'N/A')
            print(f"   - Wyckoff Score: {wyckoff.score:.2f}")
            print(f"   - MTF Confirmation: {mtf_score}")

    except Exception as e:
        print(f"   ❌ Error with MTF: {e}")

    # 5. Test WITHOUT timeframe_data
    print(f"\n🎯 TEST 2: WITHOUT MTF DATA")

    try:
        result_no_mtf = assessor.assess_signal_quality(
            price_data=price_df,
            volume_data=volumes,
            indicators={},
            market_structure=market_structure,
            timeframe="15m"
            # NO timeframe_data
        )

        print(f"   ✅ Assessment completed without MTF")
        print(f"   - Overall Score: {result_no_mtf.overall_score:.2f}")

        wyckoff_no_mtf = result_no_mtf.institutional_confirmations.get('wyckoff_method')
        if wyckoff_no_mtf:
            print(f"   - Wyckoff Score: {wyckoff_no_mtf.score:.2f}")

    except Exception as e:
        print(f"   ❌ Error without MTF: {e}")

    # 6. Test _validate_mtf_confirmation directly
    print(f"\n🎯 TEST 3: DIRECT MTF VALIDATION")

    try:
        # Simulate Spring detection
        is_spring = True
        is_utad = False

        mtf_score = assessor._validate_mtf_confirmation(
            is_spring=is_spring,
            is_utad=is_utad,
            timeframe_data=timeframe_data
        )

        print(f"   ✅ Direct validation successful")
        print(f"   - Spring: {is_spring}")
        print(f"   - UTAD: {is_utad}")
        print(f"   - MTF Score: {mtf_score}")

        # Test all scenarios
        scenarios = [
            (True, False, "Spring only"),
            (False, True, "UTAD only"),
            (True, True, "Both Spring & UTAD"),
            (False, False, "No patterns")
        ]

        print(f"\n📋 ALL SCENARIOS:")
        for spring, utad, desc in scenarios:
            score = assessor._validate_mtf_confirmation(spring, utad, timeframe_data)
            print(f"   - {desc}: Score = {score}")

    except Exception as e:
        print(f"   ❌ Error in direct validation: {e}")

    # 7. Error handling test
    print(f"\n🎯 TEST 4: ERROR HANDLING")

    # Test with None
    try:
        score = assessor._validate_mtf_confirmation(True, False, None)
        print(f"   ✅ None handled: Score = {score}")
    except Exception as e:
        print(f"   ❌ Failed with None: {e}")

    # Test with empty dict
    try:
        score = assessor._validate_mtf_confirmation(True, False, {})
        print(f"   ✅ Empty dict handled: Score = {score}")
    except Exception as e:
        print(f"   ❌ Failed with empty dict: {e}")

    # Test with missing timeframes
    try:
        partial_data = {'15m': timeframe_data['15m']}  # Only one timeframe
        score = assessor._validate_mtf_confirmation(True, False, partial_data)
        print(f"   ✅ Partial data handled: Score = {score}")
    except Exception as e:
        print(f"   ❌ Failed with partial data: {e}")

    print("\n" + "=" * 80)
    print("✅ GAP #4 VALIDATION COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    test_mtf_implementation()