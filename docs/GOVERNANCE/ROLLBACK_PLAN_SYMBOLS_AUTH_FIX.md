# ROLLBACK PLAN - Available Symbols Authorization Fix
> **RECOVERY PLAN** - Frontend Authentication Synchronization

---

## 📋 **RESUMEN EJECUTIVO**

### **PROBLEMA IDENTIFICADO:**
- **Endpoint:** `/api/available-symbols` requires authentication (DL-008)
- **Frontend:** Line 117 calls without Authorization header
- **Result:** HTTP 401 → Frontend fallback to 7 hardcoded symbols
- **User Impact:** Only 7 symbols instead of 400+ real Binance symbols

### **FIX PROPUESTO:**
- **File:** `frontend/src/components/EnhancedBotCreationModal.jsx`  
- **Line 117:** Add Authorization header following existing pattern
- **Line 150:** Remove hardcode fallback (DL-001 compliance)

---

## 🛡️ **ROLLBACK OPTIONS**

### **OPCIÓN A: CÓDIGO ROLLBACK (INMEDIATO)**
```javascript
// Si el fix falla, revertir a estado funcional temporal
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/available-symbols`);
// Mantener sin auth temporalmente hasta fix completo
```

**Tiempo:** 30 segundos  
**Risk:** Temporal, permite debug

### **OPCIÓN B: GIT ROLLBACK COMPLETO**
```bash
# Revertir commit completo si necesario
git revert <commit_hash> --no-edit
git push
```

**Tiempo:** 2 minutos  
**Risk:** Pierde otros cambios en mismo commit

### **OPCIÓN C: BACKEND ROLLBACK ESPECÍFICO**
```python
# Revertir DL-008 auth requirement en available_symbols.py
@router.get("/available-symbols")
async def get_available_symbols():  # Remove authorization param
```

**Tiempo:** 5 minutos  
**Risk:** Viola DL-008 compliance consistency

---

## ⚡ **ROLLBACK INMEDIATO RECOMENDADO**

### **SI FIX FALLA:**
1. **Immediate recovery:** Revertir líneas modificadas
2. **Restore service:** Confirmar 400+ symbols loading
3. **Debug time:** Investigar error específico
4. **Re-apply:** Con corrección adecuada

### **SUCCESS CRITERIA POST-ROLLBACK:**
- ✅ Frontend carga 400+ símbolos de Binance
- ✅ No hardcode fallback activado
- ✅ Bot creation funciona con símbolos reales
- ✅ No errores "Invalid symbols data format"

---

## 📊 **IMPACT ASSESSMENT**

### **CAMBIO MÍNIMO - RIESGO BAJO:**
- **Surface area:** 2-3 líneas código
- **Dependencies:** Solo localStorage token access
- **Side effects:** Ninguno esperado
- **Rollback time:** <1 minuto

### **CRITICAL PATH PROTECTION:**
- **Bot creation flow:** Protected
- **Exchange functionality:** Unaffected  
- **Authentication system:** Consistent
- **Trading operations:** No impact

---

**ROLLBACK READINESS:** ✅ PREPARED  
**RECOVERY TIME:** <1 minute  
**RISK LEVEL:** LOW

---

*Created: 2025-08-25*  
*Incident: Available Symbols Authentication Sync*  
*Recovery Strategy: Multi-layer rollback options*