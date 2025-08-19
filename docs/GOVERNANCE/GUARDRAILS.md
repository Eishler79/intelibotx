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
- backend/services/advanced_algorithm_selector.py
- frontend/src/services/api.ts

### **Deployment y Configuración**
- vercel.json
- railway.json  
- backend/requirements.txt
- frontend/package.json
- Migraciones y esquemas de DB

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

---

## 9. SPEC_REF CENTRAL - Authentication Pattern (ACTUALIZADO)
### **DL-008 AUTHENTICATION REFACTORING - REFERENCIA ABSOLUTA**
- **SPEC_REF MAESTRO:** `DECISION_LOG.md#DL-008` + `backend/services/auth_service.py:get_current_user_safe()`
- **REGLA:** SIEMPRE consultar DL-008 en DECISION_LOG.md antes de tocar authentication
- **PATRÓN DEFINITIVO:** `get_current_user_safe()` dependency injection - NO más implementaciones manuales
- **PROPÓSITO:** Mantener authentication centralizada bajo DL-003 compliance
- **CRÍTICO:** DL-008 ES LA VERDAD ABSOLUTA para authentication - 43 endpoints ya migrados