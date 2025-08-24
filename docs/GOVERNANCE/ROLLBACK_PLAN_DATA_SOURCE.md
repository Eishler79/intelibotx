# ROLLBACK PLAN - Data Source Mapping Correction
> **GUARDRAILS P2 COMPLIANCE** - Emergency Recovery Procedure

---

## 🚨 **CAMBIO REALIZADO**
**Archivo:** `/frontend/src/components/SmartScalperMetrics.jsx`  
**Línea:** 141  
**Cambio:** `data_source: 'smart_scalper_real'` → `data_source: 'backend_api_primary'`  
**Timestamp:** 2025-08-24  
**Justificación:** Eliminar "System degraded - limited functionality" error  

---

## 🔄 **ROLLBACK PROCEDURE**

### **STEP 1: Identificar Síntomas de Falla**
```
❌ SÍNTOMAS QUE REQUIEREN ROLLBACK:
- Badge muestra color incorrecto (no azul)
- Status no muestra "Authenticated API - high reliability" 
- Console errors relacionados con data_source
- UX degrada vs estado anterior
```

### **STEP 2: Rollback Command**
```bash
# Comando de rollback inmediato
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX
git checkout -- frontend/src/components/SmartScalperMetrics.jsx

# O edición manual específica línea 141:
# data_source: 'backend_api_primary' → data_source: 'smart_scalper_real'
```

### **STEP 3: Validación Post-Rollback**
```
✅ CONFIRMAR:
- Sistema retorna a "System degraded" (estado anterior conocido)
- No nuevos errores en console
- Funcionalidad básica preservada
- User experience no empeorada vs baseline
```

---

## 📊 **IMPACTO ASSESSMENT**

### **RIESGO DEL CAMBIO:** 🟢 **BAJO**
- Un solo valor string
- No afecta lógica de negocio
- No modifica backend APIs
- Fácilmente reversible

### **DEPENDENCIAS:**
- ✅ Frontend rendering logic (líneas 1021-1026)
- ✅ UX status indicators
- ❌ Backend APIs (no affected)
- ❌ Authentication (no affected)

---

## 🏥 **CONTINGENCY PLAN**

### **SI ROLLBACK FALLA:**
1. **Hard Reset:** `git reset --hard HEAD~1`
2. **Manual Edit:** Restaurar línea 141 manualmente  
3. **Emergency Deploy:** Deploy desde último commit conocido bueno
4. **Escalation:** Contactar admin si persiste

### **MONITORING POST-CHANGE:**
- UX status indicators funcionando
- Console libre de errores data_source
- User feedback positivo vs "System degraded"

---

**GUARDRAILS P2 COMPLIANCE:** ✅ **COMPLETED**  
**Emergency Recovery:** Ready for immediate execution