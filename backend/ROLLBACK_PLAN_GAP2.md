# ROLLBACK PLAN - GAP #2 ATR Normalization Implementation

## EMERGENCY ROLLBACK PROCEDURE (< 2 minutes)

### Step 1: Restore Original File
```bash
cp backend/services/signal_quality_assessor.py.backup-atr-gap2 backend/services/signal_quality_assessor.py
```

### Step 2: Verify Restoration
```bash
grep -n "atr = 0.01" backend/services/signal_quality_assessor.py
# Expected: Line 168 shows "atr = 0.01" (placeholder restored)
```

### Step 3: Restart Backend
```bash
pkill -f "python main.py"
cd backend && python main.py &
```

### Step 4: Validate API Response
```bash
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT \
  -H "Content-Type: application/json" \
  | jq '.analysis.wyckoff_analysis'
```

## ROLLBACK VALIDATION CHECKLIST
- [ ] Original file restored
- [ ] ATR placeholder (0.01) back in place
- [ ] Backend running without errors
- [ ] API endpoint responding correctly
- [ ] Spring/UTAD detection still working

## AFFECTED COMPONENTS
- `signal_quality_assessor.py` line 168 (ATR calculation)
- `signal_quality_assessor.py` lines 175-179 (range_height_atr calculation)
- API endpoint: `/api/run-smart-trade/{symbol}`

## TIME ESTIMATES
- File restoration: 10 seconds
- Backend restart: 30 seconds
- Validation: 60 seconds
- **TOTAL: < 2 minutes**

## EMERGENCY CONTACTS
- Backend logs: `tail -f backend/logs/backend.log`
- Error monitoring: Check for "calculate_atr" errors