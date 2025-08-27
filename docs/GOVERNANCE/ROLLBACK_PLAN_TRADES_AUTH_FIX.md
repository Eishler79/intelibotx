# ROLLBACK PLAN - Bot Trades API Authorization Fix
> **RECOVERY PLAN** - BotsAdvanced Trading History Authentication

---

## 📋 **RESUMEN EJECUTIVO**

### **PROBLEMA IDENTIFICADO:**
- **Endpoint:** `/api/bots/{bot_id}/trades` requires authentication (DL-008)
- **Frontend:** Line 183 calls without Authorization header  
- **Result:** HTTP 500 "Authorization header required"
- **User Impact:** Bot trading history not loading in BotsAdvanced dashboard

### **FIX PROPUESTO:**
- **File:** `frontend/src/pages/BotsAdvanced.jsx`
- **Line 183:** Add Authorization header to trades API call
- **Line 184:** Add Authorization header to trading-summary API call  
- **Pattern:** Follow existing authentication pattern (line 383)

---

## 🛡️ **ROLLBACK OPTIONS**

### **OPCIÓN A: CÓDIGO ROLLBACK (INMEDIATO)**
```javascript
// Si el fix falla, revertir a llamada sin auth temporalmente
const [tradesResponse, summaryResponse] = await Promise.all([
  fetch(`${BASE_URL}/api/bots/${bot.id}/trades`),
  fetch(`${BASE_URL}/api/bots/${bot.id}/trading-summary`)
]);
```

**Tiempo:** 30 segundos  
**Risk:** Temporal, permite debug

### **OPCIÓN B: BACKEND ROLLBACK ESPECÍFICO**
```python
# Remover auth requirement temporalmente en trading_history.py
@router.get("/api/bots/{bot_id}/trades")
async def get_bot_trades(bot_id: int, limit: int = Query(50, le=200)):
    # Remove authorization parameter temporarily
```

**Tiempo:** 2 minutos  
**Risk:** Viola DL-008 compliance

### **OPCIÓN C: GIT ROLLBACK COMPLETO**
```bash
# Revertir commit completo si necesario
git revert <commit_hash> --no-edit  
git push
```

**Tiempo:** 2 minutos  
**Risk:** Pierde otros cambios en mismo commit

---

## ⚡ **ROLLBACK INMEDIATO RECOMENDADO**

### **SI FIX FALLA:**
1. **Immediate recovery:** Revertir líneas fetch modificadas
2. **Restore dashboard:** Confirmar trading data loading
3. **Debug time:** Investigar error específico auth
4. **Re-apply:** Con corrección adecuada

### **SUCCESS CRITERIA POST-ROLLBACK:**
- ✅ BotsAdvanced dashboard carga trading history
- ✅ No errores HTTP 500 en bot trades
- ✅ Métricas trading visibles para usuario
- ✅ Bot performance data disponible

---

## 📊 **IMPACT ASSESSMENT**

### **CAMBIO MÍNIMO - RIESGO BAJO:**
- **Surface area:** 2-4 líneas código
- **Dependencies:** Solo localStorage token access
- **Side effects:** Ninguno esperado
- **Rollback time:** <1 minuto

### **CRITICAL PATH PROTECTION:**
- **Bot dashboard:** Trading history visible
- **Performance metrics:** Data availability protected
- **User experience:** No blocking dashboard load
- **Trading operations:** No impact on actual trading

---

**ROLLBACK READINESS:** ✅ PREPARED  
**RECOVERY TIME:** <1 minute  
**RISK LEVEL:** LOW

---

*Created: 2025-08-25*  
*Incident: Bot Trades Authentication Sync*  
*Recovery Strategy: Multi-layer rollback options*