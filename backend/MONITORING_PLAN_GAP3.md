# MONITORING PLAN - GAP #3 18 Wyckoff Signals

## MONITORING CHECKPOINTS

### 1. FUNCTIONAL VALIDATION
```bash
# Test that 18 signals are being detected
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  -H "Content-Type: application/json" \
  | jq '.analysis.wyckoff_analysis.details.wyckoff_signals | keys | length'
# Expected: 16 (sin Spring/UTAD que ya existen)
```

### 2. SIGNAL STRUCTURE VALIDATION
```python
# Verify each signal has required fields
import requests
response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
data = response.json()
signals = data['analysis']['wyckoff_analysis']['details'].get('wyckoff_signals', {})

for signal_name, signal_data in signals.items():
    assert 'detected' in signal_data
    assert isinstance(signal_data['detected'], bool)
    if 'confidence' in signal_data:
        assert 0.0 <= signal_data['confidence'] <= 1.0
```

### 3. PERFORMANCE MONITORING
```python
# Measure response time with 18 signals
import time
times = []
for i in range(10):
    start = time.time()
    response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
    times.append(time.time() - start)

avg_time = sum(times)/len(times)
print(f"Average response time: {avg_time:.3f}s")
# Expected: < 300ms for any timeframe
```

### 4. DATA SUFFICIENCY CHECK
```bash
# Verify behavior with insufficient data
# Test with new symbol that has < 100 candles
curl -X POST http://localhost:8000/api/run-smart-trade/NEWCOIN \
  | jq '.analysis.wyckoff_analysis.details.wyckoff_signals'
# Expected: {} or minimal signals
```

## MONITORING SCHEDULE
- **Immediate:** After deployment (5 minutes)
- **Short-term:** Every hour for first 24 hours
- **Long-term:** Daily checks for 1 week

## ALERT THRESHOLDS
- Response time > 300ms: WARNING
- Response time > 500ms: CRITICAL
- Less than 10 signals detected: WARNING
- Confidence values outside 0-1: CRITICAL
- Any exception in logs: CRITICAL

## VALIDATION CHECKLIST
- [ ] 16 new signals detected (ps, sc, ar, st, lps, sos, bu_markup, joc_markup, psy, bc, ar_dist, st_dist, lpsy, sow, bu_markdown, joc_markdown)
- [ ] Spring/UTAD still working
- [ ] Response time acceptable
- [ ] No errors with insufficient data
- [ ] Frontend still functioning