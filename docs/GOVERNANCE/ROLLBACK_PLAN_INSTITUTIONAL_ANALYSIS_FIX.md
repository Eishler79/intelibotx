# ROLLBACK PLAN - InstitutionalAnalysis manipulation_risk Attribute Fix
> **GUARDRAILS P2 COMPLIANCE** - Complete Emergency Recovery Procedures

---

## 🎯 **ROLLBACK OVERVIEW**

### **CHANGE SUMMARY:**
- **File:** `backend/services/institutional_detector.py`
- **Issue:** Missing `manipulation_risk: float` attribute causing AttributeError
- **Fix:** Add manipulation_risk attribute + calculation logic
- **Impact:** Critical - API /run-smart-trade/* fails without this fix

---

## 🚨 **EMERGENCY ROLLBACK PROCEDURES**

### **IMMEDIATE ROLLBACK (< 2 minutes):**

#### **METHOD 1: Git Revert (Recommended)**
```bash
# Navigate to project root
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX

# Identify commit hash of the manipulation_risk fix
git log --oneline -n 5

# Revert the specific commit (replace COMMIT_HASH)
git revert COMMIT_HASH --no-edit

# Push rollback to production
git push

# Verify Railway deployment
curl https://intelibotx-production.up.railway.app/api/health
```

#### **METHOD 2: Manual Code Restoration**
```bash
# Restore original InstitutionalAnalysis dataclass
cp backend/services/institutional_detector.py.backup backend/services/institutional_detector.py

# OR manual edit - remove these lines:
# Line 29: manipulation_risk: float
# Line 56: manipulation_risk=calculated_risk,
# Lines 128-134: _calculate_manipulation_risk method

# Commit rollback
git add backend/services/institutional_detector.py
git commit -m "🚨 ROLLBACK: Remove manipulation_risk attribute fix"
git push
```

---

## 📁 **FILES TO ROLLBACK**

### **PRIMARY FILE:**
```
backend/services/institutional_detector.py
├── Line 29: manipulation_risk: float (REMOVE)
├── Line 56: manipulation_risk=calculated_risk, (REMOVE)  
└── Lines 128-134: _calculate_manipulation_risk method (REMOVE)
```

### **BACKUP CREATION:**
```bash
# Create backup before applying fix
cp backend/services/institutional_detector.py backend/services/institutional_detector.py.backup
```

### **VERIFICATION COMMANDS:**
```bash
# Verify rollback success
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend
python3 -c "from services.institutional_detector import InstitutionalAnalysis; print('Import OK')"

# Verify no manipulation_risk attribute
python3 -c "
from services.institutional_detector import InstitutionalAnalysis, ManipulationType, MarketPhase
import inspect
fields = [f.name for f in inspect.signature(InstitutionalAnalysis).parameters.values()]
print('Fields:', fields)
assert 'manipulation_risk' not in fields, 'ROLLBACK FAILED: manipulation_risk still present'
print('✅ ROLLBACK SUCCESS: manipulation_risk removed')
"
```

---

## ⏱️ **ROLLBACK TIMEFRAMES**

### **CRITICAL TIMELINE:**
- **0-2 minutes:** Execute git revert + push
- **2-3 minutes:** Railway auto-deployment completes  
- **3-5 minutes:** Verify API endpoints functional
- **5-10 minutes:** Monitor error logs for resolution

### **ROLLBACK TRIGGERS:**
```yaml
Automatic_Rollback_IF:
  - Import_Errors: Python import failures
  - Syntax_Errors: Invalid Python syntax
  - Deployment_Failures: Railway deployment fails
  - API_Errors: Higher error rate than pre-fix baseline

Manual_Rollback_Consider_IF:
  - Performance_Degradation: Response times >2x slower
  - Unexpected_Behavior: Algorithm selection anomalies
  - User_Reports: Multiple user-reported issues
```

---

## 🔍 **ROLLBACK VALIDATION**

### **SUCCESS CRITERIA:**
1. ✅ **Import Success:** `from services.institutional_detector import InstitutionalAnalysis`
2. ✅ **No AttributeError:** API /run-smart-trade/BTCUSDT returns success
3. ✅ **Railway Health:** https://intelibotx-production.up.railway.app/api/health responds
4. ✅ **Error Logs:** No manipulation_risk AttributeError in logs

### **POST-ROLLBACK TESTING:**
```bash
# Test API endpoint that was failing
curl -X POST "https://intelibotx-production.up.railway.app/api/run-smart-trade/BTCUSDT?scalper_mode=true" \
  -H "Authorization: Bearer [USER_JWT_TOKEN]" \
  -H "Content-Type: application/json"

# Expected: HTTP 200 with algorithm selection response (not 500 AttributeError)
```

---

## 📊 **ROLLBACK DECISION MATRIX**

| Condition | Action | Timeline |
|-----------|--------|----------|
| 🔥 **Import fails** | Immediate git revert | 0-2 minutes |
| 🔥 **API returns 500** | Immediate git revert | 0-2 minutes |  
| ⚠️ **Performance degraded** | Monitor 5min → rollback | 5-10 minutes |
| ⚠️ **Algorithm anomalies** | Manual investigation → rollback if needed | 10-30 minutes |

---

## 🎯 **POST-ROLLBACK ACTION PLAN**

### **IMMEDIATE (0-10 minutes):**
1. **Verify system stability** - All APIs functional
2. **Monitor error rates** - Return to baseline
3. **Communication** - Update stakeholders on rollback

### **SHORT-TERM (1-4 hours):**
1. **Root cause analysis** - Why did fix fail?
2. **Alternative approach** - Plan different implementation
3. **Testing strategy** - Enhanced local validation before retry

### **ALTERNATIVE SOLUTIONS:**
```python
# Option A: Backward compatible approach
@property
def manipulation_risk(self) -> float:
    return getattr(self, '_manipulation_risk', 0.0)

# Option B: Factory pattern
@classmethod
def create_with_risk(cls, manipulation_risk: float = 0.0, **kwargs):
    instance = cls(**kwargs)
    instance.manipulation_risk = manipulation_risk
    return instance
```

---

## 🛡️ **GUARDRAILS COMPLIANCE**

**GUARDRAILS P2 COMPLETED:** ✅
- **Emergency procedures:** Documented with exact commands
- **File backup strategy:** backup creation before changes  
- **Rollback triggers:** Automatic + manual decision criteria
- **Success validation:** Specific test commands provided
- **Timeline compliance:** <2 minute emergency rollback capability

---

**Last Updated:** 2025-08-25  
**Rollback Plan Version:** 1.0  
**Target Fix:** InstitutionalAnalysis.manipulation_risk attribute