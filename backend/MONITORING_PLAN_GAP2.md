# MONITORING PLAN - GAP #2 ATR Normalization

## MONITORING CHECKPOINTS

### 1. FUNCTIONAL VALIDATION ✅
```bash
# Test ATR calculation is working
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  -H "Content-Type: application/json" \
  | jq '.analysis.wyckoff_analysis.details.spring_utad_detection.atr'
# Expected: Value > 0 and != 0.01
```

### 2. ATR VALUE MONITORING
```python
# Monitor ATR values are reasonable
import requests
response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
data = response.json()
atr = data['analysis']['wyckoff_analysis']['details']['spring_utad_detection']['atr']

# Validation checks
assert atr > 0, "ATR must be positive"
assert atr != 0.01, "ATR should not be placeholder value"
assert 0.0001 < atr < 10000, "ATR in reasonable range for crypto"
print(f"ATR value: {atr}")
```

### 3. RANGE HEIGHT ATR MONITORING
```bash
# Check range_height_atr calculation
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  | jq '.analysis.wyckoff_analysis.details.spring_utad_detection |
        {range_height_atr, atr, stopping_action}'
```

### 4. ERROR MONITORING
```bash
# Check for ATR calculation errors
tail -f backend/logs/backend.log | grep -i "atr calculation failed"
# Expected: No errors
```

### 5. PERFORMANCE MONITORING
```python
# Verify ATR doesn't impact performance significantly
import time
import requests

times_with_atr = []
for i in range(10):
    start = time.time()
    response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
    times_with_atr.append(time.time() - start)

avg_time = sum(times_with_atr)/len(times_with_atr)
print(f"Average response time with ATR: {avg_time:.3f}s")
# Expected: < 1.5s average (similar to GAP #1)
```

### 6. SIGNAL QUALITY VALIDATION
```python
# Verify Spring/UTAD detection still working with real ATR
response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
data = response.json()
detection = data['analysis']['wyckoff_analysis']['details']['spring_utad_detection']

# Should have all fields
required_fields = ['atr', 'range_height_atr', 'is_spring', 'is_utad', 'stopping_action']
for field in required_fields:
    assert field in detection, f"Missing field: {field}"
```

## MONITORING SCHEDULE
- **Immediate:** After deployment (5 minutes)
- **Short-term:** Every 30 minutes for first 6 hours
- **Long-term:** Daily checks for 1 week

## ALERT THRESHOLDS
- ATR = 0.01: CRITICAL (placeholder not replaced)
- ATR = 0: CRITICAL (calculation failed)
- ATR > 100000: WARNING (unrealistic value)
- Response time > 3s: WARNING
- Error rate > 1%: WARNING

## VALIDATION RESULTS CHECKLIST
- [ ] ATR calculation working:
- [ ] No placeholder values (0.01):
- [ ] range_height_atr included:
- [ ] stopping_action calculated:
- [ ] Performance acceptable: