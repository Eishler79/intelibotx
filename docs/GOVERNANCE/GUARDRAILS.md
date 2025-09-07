# GUARDRAILS.md · Reglas de Protección Crítica

## 1. Archivos críticos (Prohibido editar/eliminar sin DOBLE confirmación)

### **Core Sistema (Rompe aplicación)**
- backend/main.py
- backend/db/database.py  
- frontend/src/main.jsx
- frontend/src/routes/App.jsx
- frontend/src/pages/BotsAdvanced.jsx *(core bot management + trading operations)*

### **Autenticación y Seguridad**
- backend/services/auth_service.py
- backend/services/encryption_service.py
- backend/routes/auth.py
- backend/routes/exchanges.py *(exchange credentials + user configuration)*
- frontend/src/contexts/AuthContext.jsx

### **Modelos de Datos (SQLModel)**
- backend/models/user.py
- backend/models/bot_config.py
- backend/models/user_exchange.py
- backend/models/trading_order.py

### **Core Trading Engine**
- backend/routes/bots.py *(solo por secciones confirmadas)*
- backend/routes/real_trading_routes.py *(TRADING REAL - ejecuta trades reales)*
- backend/routes/trading_operations.py *(persistencia trading en vivo)*
- backend/routes/trading_history.py *(historial órdenes financieras)*
- backend/routes/execution_metrics.py *(métricas trading críticas)*
- backend/routes/websocket_routes.py *(streaming tiempo real)*
- backend/routes/dashboard_data.py *(balance + PnL datos financieros)*
- backend/services/advanced_algorithm_selector.py
- frontend/src/services/api.ts

### **Deployment y Configuración**
- vercel.json
- railway.json  
- backend/requirements.txt
- frontend/package.json
- Migraciones y esquemas de DB

### **UX/UI Design System (NUEVO)**
- docs/DESIGN/DESIGN_SYSTEM.md *(UX patterns, navigation behavior, visual specifications)*

**Regla:**  
Antes de modificar cualquiera de estos, se debe:
1. Pedir confirmación explícita.
2. Explicar motivo, riesgo y plan de rollback.
3. Citar `SPEC_REF` correspondiente.

---

## 2. Reglas de bloqueo
- Cambios en **contratos de API** requieren:
  - `SPEC_REF`
  - Plan de fallback/rollback documentado.
- Cualquier **borrado** debe listar:
  - Impacto exacto.
  - Archivos alternativos afectados.

---

## 3. Backups y migraciones
- Crear **backup** antes de alterar schema de DB.
- Documentar **toda migración** en `MIGRATIONS.md` con `SPEC_REF`.
- Indicar cómo revertir la migración en caso de fallo.

---

## 4. Validación obligatoria antes de commit
- Ejecutar `python3 scripts/spec_guard.py` para validar:
  - Que existe `SPEC_REF` en el mensaje de commit.
  - Que no se han modificado archivos protegidos sin confirmación previa.
  - Que cualquier cambio en schema está registrado en `MIGRATIONS.md`.

---

## 5. Reglas de dependencias (NUEVO)
- Cambios en `models/` requieren verificar:
  - Todas las rutas que los importan
  - Scripts de migración correspondientes
  - Tests que los referencian
- Cambios en `services/auth_service.py` afectan:
  - Todos los endpoints protegidos 
  - Frontend AuthContext
  - Sistema de permisos
- Cambios en `api.ts` frontend requieren verificar:
  - Todos los componentes que consumen APIs
  - Consistencia con endpoints backend
  - Manejo de errores en UI

---

## 6. Premisas DL-001 COMPLIANCE (CRÍTICO)
### **Reglas Anti-Hardcode y Anti-Simulación**
- **PROHIBIDO:** Hardcode de usuarios, passwords, API keys
- **PROHIBIDO:** Datos temporales, simulados, test/demo
- **PROHIBIDO:** Credenciales admin hardcoded
- **REQUERIDO:** Solo datos reales de usuarios reales
- **REQUERIDO:** Email verification real obligatorio
- **REQUERIDO:** Configuración API keys por usuario individual
- **VALIDACIÓN:** Antes de cualquier test, confirmar compliance DL-001

### **Testing E2E DL-001 Compliant**
- **DATOS LIMPIOS:** Base de datos sin usuarios registrados
- **REGISTRO REAL:** Usuario real con email real verificable
- **API KEYS REALES:** Testnet Binance con credenciales válidas
- **NO TEST USERS:** Prohibido crear usuarios artificiales

---

## 7. Premisas URLs y Endpoints (NUEVO)
### **URLs Railway Production (CRÍTICO)**
- **URL OFICIAL:** `https://intelibotx-production.up.railway.app`
- **PROHIBIDO:** Cambiar URL sin autorización explícita
- **REQUERIDO:** Documentar cualquier cambio de URL con:
  - Motivo del cambio
  - Autorización previa
  - Impacto en sistema
  - Plan de migración
- **VALIDACIÓN:** Siempre confirmar URL antes de testing E2E

---

## 8. Premisas Críticas de Cumplimiento Riguroso (NUEVO)
### **Metodología Obligatoria para Cualquier Cambio**
1. **DIAGNÓSTICO SEGURO**
   - **PROHIBIDO:** Asumir estado o comportamiento
   - **REQUERIDO:** Verificar con herramientas (grep, read, test)
   - **VALIDACIÓN:** Confirmar evidencia antes de proceder

2. **CONFIRMACIÓN LOCAL OBLIGATORIA**
   - **REQUERIDO:** Probar sintaxis localmente ANTES de commit
   - **REQUERIDO:** Validar todas las premisas (DL-001, GUARDRAILS, CLAUDE_BASE)
   - **PROHIBIDO:** Commit sin validación local exitosa

3. **HOMOLOGACIÓN PRD VERIFICADA**
   - **REQUERIDO:** Confirmar deployment completado en PRD
   - **REQUERIDO:** Validar que LOCAL === PRD funcionalmente
   - **PROHIBIDO:** Considerar tarea completa sin homologación PRD

**Regla:** Estos 3 puntos son **CRÍTICOS** y deben aplicarse a **CADA** cambio de código sin excepción.

4. **PROHIBIDO: REDUNDANCIAS DE API SIN JUSTIFICACIÓN**
   - **OBLIGATORIO:** Un solo endpoint por funcionalidad específica
   - **PROHIBIDO:** Múltiples APIs que hacen lo mismo sin justificación técnica clara
   - **VALIDACIÓN:** Antes de crear endpoint, verificar que NO existe funcionalidad similar
   - **EXCEPCIÓN:** Solo permitir redundancia con justificación documentada en DECISION_LOG.md

5. **OBLIGATORIO: SISTEMA DE RESILENCIA PROFESIONAL PARA APIs CRÍTICAS**
   - **REQUERIDO:** Multi-layer failover para endpoints que afectan UX directo
   - **CAPAS MÍNIMAS:** Primary → Alternative → External → Cache → Emergency → Graceful fail
   - **CIRCUIT BREAKER:** Evitar hammering de endpoints fallidos
   - **UX TRANSPARENCY:** Status indicators (Live/Cached/Aproximado/Sin datos)
   - **VALIDACIÓN:** Testear cada layer de failover individualmente
   - **SPEC_REF:** DL-019 professional resilience system

---

## 9. METHODOLOGY VALIDATION & COMPLIANCE - SUCCESS PROVEN (GUARDRAILS P1-P9)

### **🎯 GUARDRAILS P1-P9 METHODOLOGY SUCCESSFULLY APPLIED:**

#### **VALIDATION EVIDENCE - DL-076 + DL-077 + DL-078:**

**P1: DIAGNOSTIC WITH TOOL VERIFICATION** ✅ PROVEN SUCCESSFUL
- **DL-076:** Grep analysis identified `useRealTimeData.js` 413 lines + `useDashboardMetrics.js` 402 lines violations
- **DL-077:** File analysis revealed `BotTemplates.jsx` 377 lines + 168 lines hardcoded templates 
- **DL-078:** Comprehensive analysis found `ExecutionLatencyMonitor.jsx` 386 lines + 41 lines simulation hardcode
- **EVIDENCE:** All diagnostics verified with actual tools vs assumptions
- **LESSON:** Tool verification prevents misalignment between expected vs actual violations

**P2: ROLLBACK PLAN DOCUMENTED AND REVIEWED** ✅ PROVEN SUCCESSFUL
- **DL-076:** Git-based rollback procedures documented + commit-specific instructions
- **DL-077:** Complete rollback plan with emergency 20-minute restoration procedures
- **DL-078:** Rollback plan included build validation + API integration restoration
- **EVIDENCE:** All rollback plans created before implementation, not after
- **LESSON:** Rollback planning before implementation reduces risk and increases confidence

**P3: BUILD VALIDATION BASELINE + FINAL** ✅ PROVEN SUCCESSFUL
- **DL-076:** Baseline established, final validation 3.01s build successful
- **DL-077:** Build validation 2.95s successful without errors or warnings
- **DL-078:** Build validation 3.01s successful, no breaking changes
- **EVIDENCE:** All refactorings maintained build success throughout
- **LESSON:** Build validation catches integration issues early, prevents production breaks

**P4: IMPACT ANALYSIS COMPREHENSIVE** ✅ PROVEN SUCCESSFUL
- **DL-076:** Backwards compatibility analysis + performance impact + testability improvements
- **DL-077:** Strategic paradigm analysis (static templates → Bot Único philosophy alignment)
- **DL-078:** Real-time data impact + hardcode elimination + component architecture analysis
- **EVIDENCE:** Impact analysis revealed strategic benefits beyond just line reduction
- **LESSON:** Comprehensive impact analysis uncovers architectural improvements

**P5: UX TRANSPARENCY REQUIREMENTS CONFIRMED** ✅ PROVEN SUCCESSFUL
- **DL-076:** 100% public API preservation + identical user experience
- **DL-077:** Template selection UX preserved + Bot Único messaging integration
- **DL-078:** Latency monitoring UX identical + real-time data vs simulation transparency
- **EVIDENCE:** All refactorings maintained user experience while improving underlying architecture
- **LESSON:** UX preservation enables architectural improvements without user disruption

**P6: REGRESSION PREVENTION STRATEGY** ✅ PROVEN SUCCESSFUL
- **DL-076:** Specialized hooks pattern prevents future monolithic growth
- **DL-077:** API-driven templates prevent hardcode regression
- **DL-078:** Real API integration prevents simulation code regression
- **EVIDENCE:** All refactorings established patterns that prevent future violations
- **LESSON:** Refactoring should establish sustainable patterns, not just fix current problems

**P7: ERROR HANDLING PRESERVATION** ✅ PROVEN SUCCESSFUL
- **DL-076:** JWT authentication patterns + error handling preserved across specialized hooks
- **DL-077:** Authentication flows + API error handling maintained
- **DL-078:** Real-time data error handling + fallback mechanisms preserved
- **EVIDENCE:** No error handling regressions introduced during refactoring
- **LESSON:** Error handling patterns must be explicitly preserved during component extraction

**P8: MONITORING PLAN + VALIDATION EXECUTED** ✅ PROVEN SUCCESSFUL
- **DL-076:** Build monitoring + backwards compatibility monitoring + performance validation
- **DL-077:** Template functionality monitoring + API integration validation
- **DL-078:** Real-time metrics monitoring + API endpoint validation
- **EVIDENCE:** All monitoring plans executed successfully, validating refactoring success
- **LESSON:** Monitoring plans provide confidence and catch issues before user impact

**P9: DECISION LOG ENTRY + UPDATE TO COMPLETED** ✅ PROVEN SUCCESSFUL
- **DL-076:** Complete entry documented with pattern establishment
- **DL-077:** Strategic paradigm documentation with philosophy alignment
- **DL-078:** Comprehensive documentation with hardcode elimination evidence
- **EVIDENCE:** All decision log entries created with complete documentation
- **LESSON:** Decision log documentation enables knowledge transfer and methodology improvement

### **🚀 METHODOLOGY EFFECTIVENESS METRICS:**
- **SUCCESS RATE:** 100% (3/3 refactorings successful)
- **Build Success:** 100% (0 breaking changes)
- **Backwards Compatibility:** 100% (0 UX disruptions)
- **Line Reduction:** 1,377 lines eliminated (36% progress toward SUCCESS CRITERIA)
- **Pattern Establishment:** DL-076 specialized hooks pattern proven and documented

### **📋 LESSONS LEARNED + IMPROVEMENTS:**

#### **WHAT WORKED EXCEPTIONALLY:**
1. **Tool-Based Diagnostics:** Prevented misalignment, ensured accuracy
2. **Comprehensive Impact Analysis:** Uncovered strategic improvements beyond line reduction  
3. **Specialized Hooks Pattern:** Proven sustainable architecture for future refactoring
4. **Build Validation Gates:** Caught issues early, maintained production stability
5. **Decision Log Documentation:** Enabled knowledge transfer and accountability

#### **REFINEMENTS FOR FUTURE APPLICATION:**
1. **P1 Enhancement:** Add architecture pattern validation to diagnostic phase
2. **P4 Enhancement:** Include security impact analysis for critical components
3. **P8 Enhancement:** Add performance baseline comparison metrics
4. **Pattern Evolution:** DL-076 specialized hooks pattern ready for ultra-critical components

### **🎯 GUARDRAILS METHODOLOGY STATUS:**
- **VALIDATION:** ✅ P1-P9 methodology proven effective across 3 critical refactorings
- **PATTERNS:** ✅ DL-076 specialized hooks pattern established and documented
- **COMPLIANCE:** ✅ All DL-001/DL-008/CLAUDE_BASE requirements maintained
- **READINESS:** ✅ Methodology validated for AuthContext.jsx security foundation refactoring

---

## 10. SPEC_REF CENTRAL - Authentication Pattern (ACTUALIZADO)
### **DL-008 AUTHENTICATION REFACTORING - REFERENCIA ABSOLUTA**
- **SPEC_REF MAESTRO:** `DECISION_LOG.md#DL-008` + `backend/services/auth_service.py:get_current_user_safe()`
- **REGLA:** SIEMPRE consultar DL-008 en DECISION_LOG.md antes de tocar authentication
- **PATRÓN DEFINITIVO:** `get_current_user_safe()` dependency injection - NO más implementaciones manuales
- **PROPÓSITO:** Mantener authentication centralizada bajo DL-003 compliance
- **CRÍTICO:** DL-008 ES LA VERDAD ABSOLUTA para authentication - 43 endpoints ya migrados