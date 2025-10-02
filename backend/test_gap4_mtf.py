#!/usr/bin/env python3
"""
Test GAP #4 Multi-timeframe Confirmation Implementation
DL-113 Wyckoff Method - MTF Validation
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from sqlmodel import Session, select
from db.database import get_session
from models.bot_config import BotConfig
from services.service_factory import ServiceFactory
import pandas as pd
from datetime import datetime

async def test_mtf_confirmation():
    """Test GAP #4 implementation with real data"""

    print("=" * 80)
    print("🔍 TESTING GAP #4 - MULTI-TIMEFRAME CONFIRMATION")
    print("=" * 80)

    # 1. Get SOL bot from database
    with get_session() as session:
        sol_bot = session.exec(
            select(BotConfig).where(BotConfig.symbol == "SOLUSDT")
        ).first()

        if not sol_bot:
            print("❌ SOL bot not found in database")
            return

    print(f"\n📊 Testing with bot:")
    print(f"   - Symbol: {sol_bot.symbol}")
    print(f"   - Market Type: {sol_bot.market_type}")
    print(f"   - Status: {sol_bot.status}")

    # 2. Initialize services with bot_config
    binance_service = ServiceFactory.get_binance_service(sol_bot)
    signal_assessor = ServiceFactory.get_signal_quality_assessor(sol_bot)

    print(f"\n✅ Services initialized:")
    print(f"   - BinanceService: {binance_service.market_type}")
    print(f"   - SignalQualityAssessor: bot_config passed")

    # 3. Get multi-timeframe data
    print(f"\n📈 Fetching multi-timeframe data...")
    timeframe_data = await binance_service.get_multi_timeframe_data(
        sol_bot.symbol,
        ["5m", "15m", "1h"]
    )

    if not timeframe_data:
        print("❌ Failed to fetch timeframe data")
        return

    print(f"   - Timeframes obtained: {list(timeframe_data.keys())}")

    # 4. Prepare main data for assessment
    main_data = timeframe_data.get("15m", {})

    if not main_data or 'closes' not in main_data:
        print("❌ No 15m data available")
        return

    print(f"   - 15m candles: {len(main_data['closes'])}")
    print(f"   - Current price: ${main_data['closes'][-1]:.2f}")

    # 5. Create DataFrame for signal assessment
    price_df = pd.DataFrame({
        'open': main_data['opens'],
        'high': main_data['highs'],
        'low': main_data['lows'],
        'close': main_data['closes'],
        'volume': main_data['volumes']
    })

    # 6. Test Wyckoff with MTF - GAP #4
    print(f"\n🎯 Testing Wyckoff with MTF confirmation...")

    market_structure = {
        'regime': 'NEUTRAL',
        'wyckoff_phase': 'ACCUMULATION',
        'manipulation_detected': False,
        'manipulation_type': 'NONE',
        'order_blocks': [],
        'market_phase': 'ACCUMULATION'
    }

    # Execute assessment WITH timeframe_data (GAP #4)
    result = signal_assessor.assess_signal_quality(
        price_data=price_df,
        volume_data=main_data['volumes'],
        indicators={},
        market_structure=market_structure,
        timeframe="15m",
        timeframe_data=timeframe_data  # GAP #4: Pass MTF data
    )

    print(f"\n📊 RESULTS:")
    print(f"   - Overall Score: {result.overall_score:.2f}")
    print(f"   - Confidence Level: {result.confidence_level}")
    print(f"   - MTF Data Passed: {'✅ Yes' if timeframe_data else '❌ No'}")

    # 7. Check Wyckoff specific results
    wyckoff = result.institutional_confirmations.get('wyckoff_method')
    if wyckoff:
        print(f"\n🏛️ WYCKOFF METHOD DETAILS:")
        print(f"   - Score: {wyckoff.score:.2f}")
        print(f"   - Bias: {wyckoff.bias}")

        if hasattr(wyckoff, 'details') and wyckoff.details:
            mtf_score = wyckoff.details.get('mtf_confirmation_score', 'NOT FOUND')
            print(f"   - MTF Confirmation Score: {mtf_score}")

            if mtf_score != 'NOT FOUND':
                print(f"   - MTF Impact: +{mtf_score} points to Wyckoff score")

                # Analyze what was detected
                if 'spring_detected' in wyckoff.details:
                    print(f"   - Spring Detected: {wyckoff.details['spring_detected']}")
                if 'utad_detected' in wyckoff.details:
                    print(f"   - UTAD Detected: {wyckoff.details['utad_detected']}")

    # 8. Test without MTF for comparison
    print(f"\n📊 COMPARISON TEST (Without MTF):")

    result_no_mtf = signal_assessor.assess_signal_quality(
        price_data=price_df,
        volume_data=main_data['volumes'],
        indicators={},
        market_structure=market_structure,
        timeframe="15m"
        # NO timeframe_data parameter
    )

    wyckoff_no_mtf = result_no_mtf.institutional_confirmations.get('wyckoff_method')
    if wyckoff_no_mtf:
        print(f"   - Wyckoff Score (No MTF): {wyckoff_no_mtf.score:.2f}")

    # 9. Calculate difference
    if wyckoff and wyckoff_no_mtf:
        diff = wyckoff.score - wyckoff_no_mtf.score
        print(f"\n✨ MTF IMPACT: {'+' if diff >= 0 else ''}{diff:.2f} points")

        if diff > 0:
            print(f"   ✅ MTF confirmation improved Wyckoff score")
        elif diff == 0:
            print(f"   ℹ️ No Spring/UTAD patterns found to confirm")
        else:
            print(f"   ⚠️ Unexpected: MTF reduced score")

    # 10. Performance test
    import time
    print(f"\n⏱️ PERFORMANCE TEST:")

    start = time.time()
    for _ in range(5):
        _ = signal_assessor.assess_signal_quality(
            price_data=price_df,
            volume_data=main_data['volumes'],
            indicators={},
            market_structure=market_structure,
            timeframe="15m",
            timeframe_data=timeframe_data
        )
    elapsed = (time.time() - start) / 5

    print(f"   - Average execution time: {elapsed*1000:.2f}ms")
    print(f"   - Performance target: <100ms")
    print(f"   - Status: {'✅ PASS' if elapsed < 0.1 else '❌ FAIL'}")

    print("\n" + "=" * 80)
    print("✅ GAP #4 TEST COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_mtf_confirmation())