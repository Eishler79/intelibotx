# ROLLBACK PLAN - Timeframes Homologation 10 Seconds
> **GUARDRAILS P2 COMPLIANCE** - Emergency Recovery Procedure

---

## 🚨 **CAMBIOS A REALIZAR**
**Objetivo:** Homologar todos los timeframes de 30s → 10s para datos tiempo real  
**Archivos Afectados:** 9 archivos (7 frontend, 2 backend)  
**Tipo Cambio:** Critical system performance modification  
**Timestamp:** 2025-08-24  
**Justificación:** Smart Scalper requiere datos reales cada 10s, no 30s obsoletos

---

## 📋 **ARCHIVOS ESPECÍFICOS Y CAMBIOS**

### **FRONTEND CHANGES:**
```
1. frontend/src/components/SmartScalperMetrics.jsx:586
   ANTES: const updateInterval = wsData && wsData.type === 'smart_scalper' ? 30000 : 60000;
   DESPUÉS: const updateInterval = wsData && wsData.type === 'smart_scalper' ? 10000 : 10000;

2. frontend/src/hooks/useRealTimeData.js:236  
   ANTES: const interval = setInterval(fetchRealTimeData, 30000);
   DESPUÉS: const interval = setInterval(fetchRealTimeData, 10000);

3. frontend/src/hooks/useRealTimeData.js:326
   ANTES: export const useSymbolPrice = (exchangeId, symbol, updateInterval = 30000)
   DESPUÉS: export const useSymbolPrice = (exchangeId, symbol, updateInterval = 10000)

4. frontend/src/hooks/useWebSocketRealtime.js:243
   ANTES: const pingInterval = setInterval(ping, 30000);
   DESPUÉS: const pingInterval = setInterval(ping, 10000);

5. frontend/src/components/BotControlPanel.jsx:85
   ANTES: const priceInterval = setInterval(fetchCurrentPrice, 30000);
   DESPUÉS: const priceInterval = setInterval(fetchCurrentPrice, 10000);

6. frontend/src/services/tradingOperationsService.js:254
   ANTES: const interval = setInterval(fetchFeed, 30000);
   DESPUÉS: const interval = setInterval(fetchFeed, 10000);

7. [Additional frontend files with 30000ms patterns]
```

---

## 🔄 **ROLLBACK PROCEDURES**

### **IMMEDIATE ROLLBACK (Git-based):**
```bash
# Step 1: Quick revert to last known good state
git log --oneline -10  # Find commit before timeframe changes
git revert [commit-hash] --no-edit

# Step 2: Push rollback immediately  
git push origin main

# Step 3: Verify deployment
curl -s https://intelibotx-production.up.railway.app/api/health
```

### **MANUAL ROLLBACK (File-by-file):**
```bash
# Critical files to revert manually if git fails:
1. SmartScalperMetrics.jsx:586 → Change 10000 back to 30000
2. useRealTimeData.js:236 → Change 10000 back to 30000  
3. useWebSocketRealtime.js:243 → Change 10000 back to 30000
4. BotControlPanel.jsx:85 → Change 10000 back to 30000
```

### **VALIDATION POST-ROLLBACK:**
```bash
# Verify timeframes reverted correctly:
grep -r "10000" frontend/src/ | grep -v node_modules
# Should return ZERO results if rollback successful

# Verify system stability:
# - Frontend loads without errors
# - API calls working at 30s intervals
# - No rate limiting errors
# - User can access Smart Scalper interface
```

---

## 🚨 **EMERGENCY SCENARIOS**

### **SCENARIO 1: High CPU/Memory Usage**
```
SYMPTOMS: Server CPU > 80%, Memory > 90%
ACTION: Immediate rollback + increase intervals temporarily to 60s
COMMAND: Find all setInterval and setTimeout, change to 60000ms
```

### **SCENARIO 2: Rate Limiting Errors**  
```
SYMPTOMS: 429 errors in backend logs, API rejecting requests
ACTION: Rollback + verify backend rate limits support new frequency
COMMAND: Check backend/utils/rate_limiter.py settings
```

### **SCENARIO 3: WebSocket Connection Issues**
```
SYMPTOMS: WebSocket disconnections, "connection lost" messages
ACTION: Rollback WebSocket-related timeframes only
FILES: useWebSocketRealtime.js, SmartScalperMetrics.jsx WebSocket parts
```

### **SCENARIO 4: Database Connection Pool Exhaustion**
```
SYMPTOMS: "Connection pool exhausted" errors
ACTION: Rollback + verify PostgreSQL connection pool settings
CHECK: backend/db/database.py pool_size configuration
```

---

## 📊 **MONITORING DURING DEPLOYMENT**

### **METRICS TO WATCH:**
```
✅ CPU Usage: Should remain < 70%
✅ Memory Usage: Should remain < 80%  
✅ Response Times: API calls < 2000ms
✅ Error Rates: < 1% 4xx/5xx errors
✅ WebSocket Connections: Stable connections
✅ Database Connections: Within pool limits
```

### **ABORT TRIGGERS:**
```
🚨 CPU > 85% for 5+ minutes → IMMEDIATE ROLLBACK
🚨 Memory > 95% for 2+ minutes → IMMEDIATE ROLLBACK  
🚨 Error rate > 10% → IMMEDIATE ROLLBACK
🚨 API response time > 5s → IMMEDIATE ROLLBACK
```

---

## 🎯 **SUCCESS CRITERIA**

### **ROLLBACK SUCCESS INDICATORS:**
- ✅ All intervals back to 30000ms or original values
- ✅ System performance metrics normalized  
- ✅ No rate limiting errors
- ✅ User interface responds normally
- ✅ Smart Scalper data updates at original frequency

### **SYSTEM HEALTH CHECK:**
```bash
# Complete health validation:
1. Frontend build: npm run build (must succeed)
2. Backend health: curl /api/health (200 OK)
3. Database: No connection pool warnings
4. Logs: No ERROR level messages related to timeframes
```

---

**GUARDRAILS P2 COMPLIANCE:** ✅ **COMPLETED**  
**Emergency Recovery:** Ready for immediate execution  
**Risk Mitigation:** All scenarios documented with specific actions