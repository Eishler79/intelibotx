# GUARDRAILS.md · Reglas de Protección Crítica

## 1. Archivos críticos (Prohibido editar/eliminar sin DOBLE confirmación)

### **Core Sistema (Rompe aplicación)**
- backend/main.py
- backend/db/database.py  
- frontend/src/main.jsx
- frontend/src/routes/App.jsx

### **Autenticación y Seguridad**
- backend/services/auth_service.py
- backend/services/encryption_service.py
- backend/routes/auth.py
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