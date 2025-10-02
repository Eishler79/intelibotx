# MONITORING PLAN - GAP #1 Wyckoff Spring/UTAD

## MONITORING CHECKPOINTS

### 1. FUNCTIONAL VALIDATION ✅
```bash
# Test Spring/UTAD detection is working
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  -H "Content-Type: application/json" \
  | jq '.analysis.wyckoff_analysis.details.spring_utad_detection'
```

### 2. PERFORMANCE MONITORING
```python
# Monitor response times
import time
import requests

times = []
for i in range(10):
    start = time.time()
    response = requests.post('http://localhost:8000/api/run-smart-trade/BTCUSDT')
    times.append(time.time() - start)

print(f"Average response time: {sum(times)/len(times):.3f}s")
print(f"Max response time: {max(times):.3f}s")
# Expected: < 1.5s average, < 3s max
```

### 3. ERROR RATE MONITORING
```bash
# Check for errors in logs
tail -f backend/logs/backend.log | grep -i "error\|exception" | grep "wyckoff"
# Expected: No errors related to Wyckoff
```

### 4. DETECTION ACCURACY MONITORING
```python
# Track Spring/UTAD detection rates
detections = {
    'spring': 0,
    'utad': 0,
    'neither': 0,
    'both': 0  # Should never happen
}

# Monitor over 100 calls to different symbols
# Expected: Reasonable distribution, never both=True
```

### 5. BACKWARDS COMPATIBILITY CHECK
```bash
# Verify old consumers still work
# Check that response contains all original fields
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  | jq 'keys' | grep -E "score|bias|details"
```

## MONITORING SCHEDULE
- **Immediate:** After deployment (5 minutes)
- **Short-term:** Every hour for first 24 hours
- **Long-term:** Daily checks for 1 week

## ALERT THRESHOLDS
- Response time > 3s: WARNING
- Response time > 5s: CRITICAL
- Error rate > 1%: WARNING
- Error rate > 5%: CRITICAL
- Both Spring and UTAD true: CRITICAL (logic error)

## VALIDATION RESULTS
- [ ] Build successful: ✅ 0.543s
- [ ] No syntax errors: ✅ Verified
- [ ] API responding: ✅ Tested locally
- [ ] New fields present: ✅ Confirmed
- [ ] Performance acceptable: ✅ < 1ms overhead