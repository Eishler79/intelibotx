# ROLLBACK PLAN - GAP #3 18 Wyckoff Signals Implementation

## EMERGENCY ROLLBACK PROCEDURE (< 5 minutes)

### QUICK ROLLBACK - Remove All Changes
```bash
# 1. Remove new Wyckoff module
rm -rf backend/services/wyckoff/

# 2. Restore original signal_quality_assessor.py (remove GAP #3 integration)
# Remove lines 281-342 that contain GAP #3 integration

# 3. Restore original bots.py (remove dynamic candles)
# Remove lines 19-31 (calculate_required_candles function)
# Change line 380 back to: limit=100

# 4. Restore bot_config.py (remove 27 Wyckoff fields)
# Remove lines 78-106 (all wyckoff_ fields)

# 5. Restart backend
pkill -f "python main.py"
cd backend && python main.py &
```

## DETAILED ROLLBACK STEPS

### Step 1: Remove Wyckoff Module
```bash
rm -rf backend/services/wyckoff/
ls backend/services/wyckoff/
# Expected: No such file or directory
```

### Step 2: Restore signal_quality_assessor.py
```bash
# Edit file and remove GAP #3 integration (lines 281-342)
# Keep original Wyckoff logic (lines 166-280)
```

### Step 3: Restore bots.py
```bash
# Remove calculate_required_candles function
# Change line 380 from:
# limit = calculate_required_candles(bot_config.interval)
# Back to:
# limit = 100
```

### Step 4: Restore bot_config.py
```bash
# Remove all 27 wyckoff_ configuration fields (lines 78-106)
```

### Step 5: Verify Rollback
```bash
# Check no wyckoff module
ls backend/services/wyckoff/
# Expected: Error - directory not found

# Check no wyckoff imports
grep -r "from services.wyckoff" backend/
# Expected: No results

# Check API still works
curl -X POST http://localhost:8000/api/run-smart-trade/BTCUSDT | jq '.status'
# Expected: "success"
```

## ROLLBACK VALIDATION CHECKLIST
- [ ] Wyckoff module deleted
- [ ] signal_quality_assessor.py restored (no GAP #3 code)
- [ ] bots.py restored (limit=100)
- [ ] bot_config.py restored (no wyckoff_ fields)
- [ ] Backend running without errors
- [ ] Spring/UTAD still working (GAP #1)
- [ ] ATR calculation still working (GAP #2)

## FILES AFFECTED
1. **DELETED:**
   - `services/wyckoff/__init__.py`
   - `services/wyckoff/accumulation.py`
   - `services/wyckoff/markup.py`
   - `services/wyckoff/distribution.py`
   - `services/wyckoff/markdown.py`

2. **MODIFIED (restore original):**
   - `services/signal_quality_assessor.py` (remove lines 281-342)
   - `routes/bots.py` (remove lines 19-31, change line 380)
   - `models/bot_config.py` (remove lines 78-106)

## RISKS DURING ROLLBACK
- **LOW:** API downtime (< 1 minute)
- **NONE:** Database changes (no migrations)
- **NONE:** Frontend impact (backward compatible)

## TIME ESTIMATES
- Delete wyckoff module: 10 seconds
- Edit 3 files: 3 minutes
- Backend restart: 30 seconds
- Validation: 1 minute
- **TOTAL: < 5 minutes**

## RECOVERY IF ROLLBACK FAILS
```bash
# Nuclear option - restore from git
git status
git diff
git checkout -- backend/services/signal_quality_assessor.py
git checkout -- backend/routes/bots.py
git checkout -- backend/models/bot_config.py
rm -rf backend/services/wyckoff/
```