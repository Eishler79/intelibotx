# ROLLBACK PLAN - GAP #1 Wyckoff Spring/UTAD Implementation

## EMERGENCY ROLLBACK PROCEDURE (< 2 minutes)

### Step 1: Restore Original File
```bash
cp backend/services/signal_quality_assessor.py.backup-wyckoff-gap1 backend/services/signal_quality_assessor.py
```

### Step 2: Verify Restoration
```bash
grep -n "is_spring\|is_utad" backend/services/signal_quality_assessor.py
# Expected: No results (these fields didn't exist before)
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
- [ ] No Spring/UTAD fields in response
- [ ] Backend running without errors
- [ ] API endpoint responding correctly
- [ ] No performance degradation

## AFFECTED COMPONENTS
- `signal_quality_assessor.py` lines 138-243
- API endpoint: `/api/run-smart-trade/{symbol}`
- Response fields: `analysis.wyckoff_analysis.details.spring_utad_detection`

## TIME ESTIMATES
- File restoration: 10 seconds
- Backend restart: 30 seconds
- Validation: 60 seconds
- **TOTAL: < 2 minutes**

## EMERGENCY CONTACTS
- Backend logs: `tail -f backend/logs/backend.log`
- Error monitoring: Check Sentry/Railway logs