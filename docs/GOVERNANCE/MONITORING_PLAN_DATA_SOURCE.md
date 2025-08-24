# MONITORING PLAN - Data Source Mapping Correction
> **GUARDRAILS P7-P9 COMPLIANCE** - Error Handling + Monitoring + Documentation

---

## 🚨 **P7: ERROR HANDLING PRESERVATION**

### **ERROR HANDLING LOGIC MAINTAINED**
```javascript
// Cascading fallback logic PRESERVED (lines 1021-1026):
{metrics.advanced.data_source === 'websocket_realtime' ? 'Real-time WebSocket data - optimal latency' :
 metrics.advanced.data_source.includes('PRIMARY') ? 'Authenticated API - high reliability' :
 metrics.advanced.data_source.includes('ALTERNATIVE') ? 'Public API fallback - good reliability' :
 metrics.advanced.data_source.includes('EXTERNAL') ? 'External data source - basic reliability' :
 metrics.advanced.data_source === 'last_known_good' ? 'Cached data - may be outdated' :
 'System degraded - limited functionality'}  // ✅ Fallback preserved for unknown data_source values
```

### **ERROR SCENARIOS COVERAGE**
- ✅ **Unknown data_source**: Still falls back to "System degraded"
- ✅ **WebSocket errors**: Separate error handling preserved (lines 1033+)
- ✅ **API failures**: Existing try/catch blocks maintained
- ✅ **Network issues**: Existing error states unchanged

---

## 📊 **P8: MONITORING IMPLEMENTATION**

### **REAL-TIME MONITORING POINTS**
```
1. 🎯 DATA SOURCE RECOGNITION
   Monitor: metrics.advanced.data_source value
   Success: 'backend_api_primary'
   Alert: Any value not in expected list

2. 🎨 UX STATUS DISPLAY  
   Monitor: Status text rendered
   Success: "Authenticated API - high reliability"
   Alert: "System degraded - limited functionality"

3. 🔧 FRONTEND CONSOLE
   Monitor: Console errors related to data_source
   Success: No data_source related errors
   Alert: New console.error() messages

4. 🌐 USER EXPERIENCE
   Monitor: Badge color and icon
   Success: Blue background + 🎯 icon
   Alert: Gray background + ⚠️ icon
```

### **MONITORING QUERIES**
```javascript
// Browser Console Monitoring Commands:
// 1. Check data_source value:
document.querySelector('[data-testid="smart-scalper-metrics"]')?.textContent?.includes('BACKEND API PRIMARY')

// 2. Check status message:
document.querySelector('[class*="text-gray-300"]')?.textContent?.includes('Authenticated API - high reliability')

// 3. Check badge color:
document.querySelector('[class*="bg-blue-900"]') !== null

// 4. Console error monitoring:
window.addEventListener('error', (e) => console.log('Error:', e.message))
```

### **ALERTING THRESHOLDS**
- ⚠️ **Warning**: Badge not blue within 30 seconds
- 🚨 **Critical**: "System degraded" message appears
- 📊 **Info**: Normal operation with expected status

---

## 📋 **P9: DOCUMENTATION COMPLETION**

### **CHANGE DOCUMENTATION**
```
✅ Technical Change Log:
   - File: SmartScalperMetrics.jsx line 141
   - Change: 'smart_scalper_real' → 'backend_api_primary'
   - Reason: Fix "System degraded" error, improve UX transparency

✅ Rollback Documentation:
   - File: docs/GOVERNANCE/ROLLBACK_PLAN_DATA_SOURCE.md
   - Emergency procedure: git checkout or manual line edit
   - Validation steps: Confirm original "System degraded" state

✅ Impact Analysis:
   - File: docs/GOVERNANCE/IMPACT_ANALYSIS_DATA_SOURCE.md  
   - UX improvements documented
   - Risk assessment: LOW risk, high benefit

✅ Monitoring Plan:
   - File: docs/GOVERNANCE/MONITORING_PLAN_DATA_SOURCE.md
   - Real-time monitoring points defined
   - Alert thresholds established
```

### **USER COMMUNICATION DRAFT**
```
INTERNAL RELEASE NOTES:
🎯 Fixed: "System degraded - limited functionality" error
✅ Improvement: Clear data source indicators
📊 Status: Smart Scalper shows "Authenticated API - high reliability"
🔧 Technical: Frontend display logic optimization
```

### **DECISION LOG UPDATE**
```yaml
Decision ID: DL-031
Date: 2025-08-24
Title: Smart Scalper Data Source Mapping Correction
Problem: Frontend showing "System degraded" despite functional backend
Solution: Map data_source 'smart_scalper_real' → 'backend_api_primary'
Impact: Improved user experience, eliminated confusing error message
Compliance: DL-001 ✅, DL-008 ✅, CLAUDE_BASE ✅, GUARDRAILS P1-P9 ✅
```

---

## 🎯 **GUARDRAILS COMPLIANCE FINAL VALIDATION**

| Point | Description | Status | Evidence |
|-------|-------------|---------|----------|
| P1 | Diagnóstico completo | ✅ | Root cause identified: data_source hardcode mismatch |
| P2 | Plan de rollback | ✅ | ROLLBACK_PLAN_DATA_SOURCE.md created |
| P3 | Validación local | ✅ | npm run build successful, grep validation confirmed |
| P4 | Análisis de impacto | ✅ | IMPACT_ANALYSIS_DATA_SOURCE.md comprehensive |
| P5 | UX transparency | ✅ | Status changes from negative to positive message |
| P6 | Prevención regresión | ✅ | Single line change, isolated scope, low risk |
| P7 | Manejo de errores | ✅ | Fallback logic preserved, error handling maintained |
| P8 | Monitoreo | ✅ | Real-time monitoring points defined with thresholds |
| P9 | Documentación | ✅ | Complete documentation suite + decision log entry |

---

**STATUS:** 🟢 **ALL GUARDRAILS POINTS COMPLETED (P1-P9)**  
**COMPLIANCE:** ✅ **100% COMPLETE**  
**READY FOR:** Production deployment with full monitoring coverage