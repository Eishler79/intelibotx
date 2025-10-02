# MONITORING PLAN - GAP #4 Multi-Timeframe Confirmation
> DL-113 Wyckoff Implementation - MTF Validation

## 🎯 MONITORING POINTS

### 1. **RUNTIME MONITORING**
```python
# backend/services/signal_quality_assessor.py
# Lines 224-242: MTF Integration Point

MONITOR:
- timeframe_data reception (None vs populated)
- Spring/UTAD detection per timeframe
- Confirmation score calculation (0/5/10/20)
- Error handling in _validate_mtf_confirmation
```

### 2. **DATA FLOW MONITORING**
```
routes/bots.py → signal_quality_assessor → _evaluate_wyckoff_analysis → _validate_mtf_confirmation
     ↓                    ↓                           ↓                            ↓
timeframe_data → bot_config passed → timeframe_data → confirmations count
```

### 3. **VALIDATION SCRIPTS**

#### A. Test MTF Confirmation
```python
#!/usr/bin/env python3
# backend/test_gap4_mtf.py

import asyncio
from services.service_factory import ServiceFactory
from models.bot_config import BotConfig

async def test_mtf_confirmation():
    """Test GAP #4 implementation"""

    # Get SOL bot
    sol_bot = BotConfig(id=1, symbol="SOLUSDT", market_type="SPOT")

    # Get services
    binance_service = ServiceFactory.get_binance_service(sol_bot)
    signal_assessor = ServiceFactory.get_signal_quality_assessor(sol_bot)

    # Get multi-timeframe data
    timeframe_data = await binance_service.get_multi_timeframe_data(
        "SOLUSDT", ["5m", "15m", "1h"]
    )

    # Test Wyckoff with MTF
    main_data = timeframe_data.get("15m", {})

    result = signal_assessor.assess_signal_quality(
        price_data=main_data,
        volume_data=main_data.get('volumes', []),
        indicators={},
        market_structure={'wyckoff_phase': 'ACCUMULATION'},
        timeframe="15m",
        timeframe_data=timeframe_data  # GAP #4
    )

    print(f"Wyckoff Score: {result.overall_score}")
    print(f"MTF Confirmation Applied: {timeframe_data is not None}")

    # Check Wyckoff details
    wyckoff = result.institutional_confirmations.get('wyckoff_method')
    if wyckoff and hasattr(wyckoff, 'details'):
        print(f"MTF Score: {wyckoff.details.get('mtf_confirmation_score', 'N/A')}")

if __name__ == "__main__":
    asyncio.run(test_mtf_confirmation())
```

#### B. Monitor Live Trading
```python
# backend/monitor_gap4_live.py

def monitor_wyckoff_mtf(bot_id):
    """Monitor MTF confirmations in real-time"""

    # Query logs for Wyckoff executions
    # Check for mtf_confirmation_score presence
    # Validate score impact on decisions

    EXPECTED:
    - mtf_confirmation_score: 0/5/10/20
    - Spring detection across timeframes
    - UTAD detection across timeframes
    - Proper error handling (no crashes)
```

### 4. **SUCCESS METRICS**

| Metric | Target | Measurement |
|--------|--------|-------------|
| MTF Data Reception | 100% | timeframe_data != None |
| Spring/UTAD Detection | >0 per hour | Count patterns found |
| Confirmation Scores | 0-20 range | Validate score values |
| Error Rate | <1% | Try/except catches |
| Performance Impact | <100ms | Time MTF validation |

### 5. **ALERT TRIGGERS**

```python
ALERTS = {
    "mtf_data_missing": "timeframe_data is None in >10% calls",
    "invalid_scores": "mtf_confirmation_score not in [0,5,10,20]",
    "pattern_mismatch": "Spring in 1h but not in lower TFs",
    "performance_degradation": "MTF validation >100ms",
    "error_spike": "Exception rate >1% in _validate_mtf_confirmation"
}
```

### 6. **LOG ANALYSIS**

```bash
# Check MTF confirmations
grep "mtf_confirmation_score" logs/*.log | tail -20

# Monitor Spring/UTAD detection
grep -E "(Spring detected|UTAD detected)" logs/*.log | wc -l

# Error tracking
grep "ERROR.*_validate_mtf_confirmation" logs/*.log

# Performance metrics
grep "MTF validation time:" logs/*.log | awk '{print $4}' | sort -n
```

### 7. **ROLLBACK TRIGGERS**

Automatic rollback if:
- [ ] MTF causes >5% error rate
- [ ] Score calculation fails >10 times/hour
- [ ] Memory usage increases >20%
- [ ] Response time degrades >200ms

### 8. **VALIDATION CHECKLIST**

Pre-deployment:
- [x] Unit test passes
- [x] Integration test with real data
- [x] Error handling verified
- [x] Performance benchmarked

Post-deployment (1 hour):
- [ ] Monitor error logs
- [ ] Check MTF score distribution
- [ ] Validate Spring/UTAD detection
- [ ] Confirm no regression

Post-deployment (24 hours):
- [ ] Analyze score impact on trades
- [ ] Review performance metrics
- [ ] Check resource utilization
- [ ] Validate business impact

## 📊 EXPECTED OUTCOMES

1. **Wyckoff scores increase by 5-20 points** when MTF confirms patterns
2. **False positives reduce by >30%** with multi-timeframe validation
3. **Spring/UTAD detection accuracy improves** with synchronized confirmation
4. **No performance degradation** (<100ms added latency)
5. **Zero runtime errors** from MTF integration

## 🚨 INCIDENT RESPONSE

If issues detected:
1. Check `backend/ROLLBACK_PLAN_GAP4.md`
2. Execute rollback if critical
3. Analyze logs for root cause
4. Apply hotfix if minor
5. Update monitoring rules

---
*Created: 2025-01-26*
*DL-113 GAP #4 Implementation*
*GUARDRAILS P8 Compliance*