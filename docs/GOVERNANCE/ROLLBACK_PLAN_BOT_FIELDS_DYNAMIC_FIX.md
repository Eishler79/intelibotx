# ROLLBACK PLAN - Bot Creation Fields Dynamic Data Fix
> **RECOVERY PLAN** - DL-001 Compliance Real Implementation

---

## 📋 **RESUMEN EJECUTIVO**

### **CAMPOS IDENTIFICADOS PARA CONVERSION:**
- **Estrategia**: De hardcode 'Smart Scalper' → API real strategies
- **Moneda Base**: De hardcode 'USDT' → Dinámico basado en symbol pair
- **Intervalos Trading**: De opciones fijas → Exchange capabilities API
- **Tipo Margen**: De opciones fijas → Exchange-specific margin types

### **ESTADO ACTUAL:**
- **Funcionando**: Tipo Mercado (market-types API), Exchange data, Símbolos
- **Hardcode**: 4 campos violando DL-001 compliance
- **Risk**: Alto - no romper funcionalidad existente que YA funciona

---

## 🛡️ **ROLLBACK OPTIONS**

### **OPCIÓN A: IMPLEMENTATION INCREMENTAL (RECOMENDADO)**
```javascript
// Fase 1: Solo Moneda Base (safer)
// Extraer de symbol pair: BTCUSDT → Base: BTC, Quote: USDT
const [base, quote] = formData.symbol.match(/^(.+)(USDT|BUSD|BTC|ETH)$/);

// Fase 2: Estrategias (si hay backend API)
// Fase 3: Intervalos (basado en exchange capabilities)  
// Fase 4: Tipo Margen (exchange-specific)
```

**Tiempo:** Fases independientes, rollback individual  
**Risk:** Bajo - cada fase tiene rollback específico

### **OPCIÓN B: MANTENER STATUS QUO**
```javascript
// No hacer cambios - mantener hardcode actual
// Razón: Sistema funciona, riesgo vs beneficio
```

**Tiempo:** 0 minutos  
**Risk:** Mínimo - no toca código funcional

### **OPCIÓN C: ROLLBACK COMPLETO A ESTADO ANTERIOR**
```bash
# Revertir a antes de fc7eda0 (sin campos avanzados)
git revert fc7eda0 --no-edit
```

**Tiempo:** 5 minutos  
**Risk:** Alto - pierde funcionalidad válida de campos avanzados

---

## ⚡ **ESTRATEGIA ROLLBACK RECOMENDADA**

### **IMPLEMENTACIÓN GRADUAL CON ROLLBACK POR FASES:**

#### **FASE 1: MONEDA BASE DINÁMICA (Risk: LOW)**
- Extraer de symbol pair automáticamente
- Fallback a 'USDT' si parsing falla
- Rollback: Revertir a base_currency: 'USDT'

#### **FASE 2: ESTRATEGIAS DINÁMICAS (Risk: MEDIUM)**  
- Solo si existe API backend /api/available-strategies
- Fallback a 'Smart Scalper' si API falla
- Rollback: Revertir a strategy: 'Smart Scalper'

#### **FASE 3: INTERVALOS EXCHANGE-BASED (Risk: HIGH)**
- Basado en exchange capabilities (si API existe)
- Mantener opciones actuales como fallback
- Rollback: Revertir a opciones hardcoded

#### **FASE 4: TIPO MARGEN EXCHANGE-SPECIFIC (Risk: HIGH)**
- Solo para exchanges que soporten (API validation)  
- Mantener CROSS/ISOLATED como fallback
- Rollback: Revertir a opciones hardcoded

---

## 📊 **ROLLBACK INDIVIDUAL POR CAMPO**

### **SI MONEDA BASE FALLA:**
```javascript
// Immediate fallback
base_currency: 'USDT'  // Back to hardcode
```

### **SI ESTRATEGIAS FALLAN:**
```javascript
// Immediate fallback  
strategy: 'Smart Scalper'  // Back to hardcode
```

### **SI INTERVALOS FALLAN:**
```javascript
// Keep current hardcode options
const intervals = ['1m','5m','15m','1h','4h','1d']
```

### **SI TIPO MARGEN FALLA:**
```javascript
// Keep current hardcode options
const marginTypes = ['CROSS','ISOLATED']  
```

---

## 🎯 **SUCCESS CRITERIA PARA NO-ROLLBACK**

### **MUST WORK (NO ROMPER):**
- ✅ Bot creation end-to-end functional
- ✅ Exchange selection working
- ✅ Symbol loading (400+ symbols)  
- ✅ Market types API functional
- ✅ Real-time pricing working

### **ENHANCEMENT CRITERIA:**
- ✅ Moneda base extraída correctamente de symbol
- ✅ Estrategias cargadas desde API (si existe)
- ✅ Intervalos basados en exchange (si API existe)
- ✅ Tipos margen específicos del exchange (si API existe)

---

## ⚠️ **ROLLBACK TRIGGERS**

### **IMMEDIATE ROLLBACK:**
- 🚨 Bot creation broken (can't create bots)
- 🚨 Exchange selection not working  
- 🚨 Symbol loading fails
- 🚨 JavaScript errors in console
- 🚨 Form submission failures

### **PARTIAL ROLLBACK:**
- ⚠️ Solo 1 campo falla → Rollback solo ese campo
- ⚠️ API timeouts → Fallback a hardcode temporal
- ⚠️ User confusion → Revert to simpler options

---

## 📋 **ROLLBACK TESTING CHECKLIST**

### **PRE-IMPLEMENTATION:**
- [ ] Backup current working state
- [ ] Document exact current hardcode values
- [ ] Test current functionality end-to-end
- [ ] Prepare individual field rollbacks

### **POST-IMPLEMENTATION:**
- [ ] Test bot creation end-to-end
- [ ] Verify no broken functionality  
- [ ] Check all existing features work
- [ ] Validate new dynamic behavior
- [ ] Confirm fallbacks work correctly

---

**ROLLBACK STRATEGY:** Gradual implementation con rollback individual por campo  
**PRIORITY:** No romper funcionalidad existente  
**CONTINGENCY:** Rollback inmediato disponible para cada fase

---

*Created: 2025-08-25*  
*Strategy: Incremental with Individual Rollbacks*  
*Risk Tolerance: LOW - Preserve working functionality*