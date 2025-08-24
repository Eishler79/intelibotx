# ROLLBACK_PLAN.md - Emergency Recovery Procedures

> **GUARDRAILS P2:** Plan de fallback/rollback documentado para cambios críticos

---

## 🚨 Emergency Rollback Procedures

### **ROLLBACK M-002: Critical Error Resolution (Latest)**

**Trigger Scenarios:**
- `/api/bots/{id}/execution-summary` returns 500 errors
- Frontend authentication breaks  
- Security middleware causes server errors
- DL-008 pattern causes authentication failures

**IMMEDIATE ROLLBACK STEPS:**
```bash
# 1. Revert to previous stable commit
git revert 7bc9933 --no-edit

# 2. Force push to trigger Railway redeploy  
git push origin main

# 3. Verify rollback
curl https://intelibotx-production.up.railway.app/api/health
```

**VALIDATION ROLLBACK SUCCESS:**
- ✅ Health endpoint returns 200 OK
- ✅ Frontend can load execution metrics without 500 errors
- ✅ No security middleware errors in logs
- ✅ Authentication flows work normally

**POST-ROLLBACK ACTIONS:**
1. Notify stakeholders via commit message
2. Document issue in DECISION_LOG.md
3. Plan corrective action with GUARDRAILS compliance
4. Test fix in development before re-deploy

---

## 🔄 General Rollback Procedures

### **For Authentication Changes (DL-008 related):**
```bash
# 1. Identify last stable auth commit
git log --grep="authentication" --oneline -n 5

# 2. Rollback to specific commit  
git reset --hard <STABLE_COMMIT_HASH>
git push --force-with-lease origin main
```

### **For Security Middleware Changes:**
```bash
# 1. Check if middleware is causing startup issues
# 2. Temporarily disable in main.py if needed:
# app.add_middleware(SecurityHeadersMiddleware) # DISABLED FOR ROLLBACK

# 3. Deploy fix
git add main.py && git commit -m "EMERGENCY: Disable security middleware"
git push origin main
```

### **For Frontend Authentication Changes:**
```bash
# 1. Revert to basic localStorage auth pattern
# 2. Replace useAuthDL008 calls with direct getAuthHeaders()
# 3. Quick deploy to restore functionality
```

---

## 📋 Pre-Deployment Checklist (GUARDRAILS P2)

**Before ANY critical change deployment:**
- [ ] Backup commit created (git log shows backup)
- [ ] Rollback plan documented in this file
- [ ] SPEC_REF included in commit message  
- [ ] Local testing passed (frontend build + backend syntax)
- [ ] spec_guard.py validation passed
- [ ] Changes documented in MIGRATIONS.md

**CRITICAL FILES Rollback Ready:**
- [ ] main.py (core system)
- [ ] auth_service.py (authentication)  
- [ ] security_middleware.py (security headers)
- [ ] Any DL-008 authentication changes
- [ ] Database migration scripts

---

**EMERGENCY CONTACT:**
- Immediate rollback: Follow steps above
- Extended issues: Check DECISION_LOG.md for context
- Validation required: Run GUARDRAILS compliance checks

---

*Last Updated: 2025-08-24*  
*SPEC_REF: GUARDRAILS.md P2 - Plan de fallback/rollback documentado*