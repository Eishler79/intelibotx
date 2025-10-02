# SECURITY_ARCHITECTURE - Arquitectura de Seguridad InteliBotX

> **DOCUMENTACIÓN TÉCNICA DE SEGURIDAD E2E**
> **Estado:** 🔴 **ISSUES CRÍTICOS IDENTIFICADOS**
> **Última actualización:** 2025-10-01
> **SPEC_REF:** DL-122 (Arquitecturas E2E Master Project)

---

## 📁 **ESTRUCTURA DOCUMENTACIÓN**

Este directorio contiene la arquitectura de seguridad completa del sistema dividida en 5 subsistemas:

### **01_AUTHENTICATION_SECURITY.md** (JWT + Auth + DL-008)
- JWT tokens (access + refresh)
- `get_current_user_safe()` dependency
- AuthContext frontend
- 43 endpoints protegidos
- **ISSUES:** AuthContext duplicado, localStorage inconsistente

### **02_WEBSOCKET_SECURITY.md** ✅ COMPLETADO (Real-time Security)
- WebSocket authentication flow
- Token validation query params
- Frontend WebSocket connection (useWebSocketRealtime vs useWebSocketConnection)
- Realtime data manager + BinanceWebSocketService
- **ESTADO:** 🟡 Sistema funcional con gaps arquitectónicos críticos
- **ISSUES:** 10 identificados (3 críticos: Auth frontend, DL-110 violation, useWebSocketRealtime no usado)
- **LÍNEAS:** 2,502 (14 archivos analizados, 4,600+ líneas leídas)
- **FECHA:** 2025-10-02

### **03_ENCRYPTION_SECURITY.md** ✅ COMPLETADO (AES-256 + Master Key)
- ENCRYPTION_MASTER_KEY management
- Multi-exchange API keys encryption (Binance, Bybit, OKX)
- Fernet cipher AES-256-GCM implementation
- UserExchange encrypted storage + ExchangeFactory decryption
- Railway production compliance
- **ESTADO:** 🟢 Sistema funcional - PRD Railway con key única configurada ✅
- **ISSUES:** 6 identificados (1 crítico: No health check | 3 medios: Hardcoded key docs, rotation, error handling)
- **LÍNEAS:** 2,200+ (9 archivos analizados, 1,746 líneas leídas)
- **FECHA:** 2025-10-02

### **04_SECURITY_MIDDLEWARE.md** (Headers + Rate Limiting)
- Security headers middleware
- Rate limiting per endpoint
- Request validation
- Suspicious pattern detection
- **ESTADO:** ✅ Implementado y operativo

### **05_NETWORK_SECURITY.md** (CORS + HTTPS + CSP)
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- CORS configuration
- XSS protection headers
- **ESTADO:** ✅ Implementado y operativo

---

## 🚨 **ISSUES CRÍTICOS IDENTIFICADOS (28 TOTALES - Auth: 12 + WebSocket: 10 + Encryption: 6)**

### **🔴 CRÍTICO - SEGURIDAD INMEDIATA (6 issues):**

#### **ISSUE #1: WebSocket sin autenticación frontend** ⚠️ **CRÍTICO**
**Archivo:** `frontend/src/shared/hooks/useWebSocketConnection.js:26`
```javascript
ws.current = new WebSocket(url); // ❌ NO envía token JWT
```
**Backend espera:** `websocket_routes.py:134` → `token = websocket.query_params.get("token")`

**IMPACTO:**
- Conexiones WebSocket NO autenticadas
- Cualquiera puede conectarse sin JWT
- Datos en tiempo real expuestos

**SOLUCIÓN:**
```javascript
const { token } = useAuth();
ws.current = new WebSocket(`${url}?token=${token}`);
```

**PRIORIDAD:** 🔴 **INMEDIATA**

---

#### **ISSUE #2: ENCRYPTION_MASTER_KEY faltante = crash producción** ⚠️ **CRÍTICO**
**Archivo:** `backend/services/encryption_service.py:52`
```python
raise ValueError(f"❌ {error_msg} - Required for Railway production deployment")
```

**IMPACTO:**
- Si falta env var en Railway → **Sistema completo inaccesible**
- Todos los API keys encriptados inaccesibles
- NO hay fallback recovery

**SOLUCIÓN:**
1. Validar ENCRYPTION_MASTER_KEY en deploy Railway
2. Agregar health check `/api/health/encryption-status`
3. Documentar proceso regeneración keys

**PRIORIDAD:** 🔴 **CRÍTICA**

---


#### **ISSUE #4: AuthContext duplicado - refactor incompleto** ⚠️ **ARQUITECTÓNICO**
**Archivos:**
- `contexts/AuthContext.jsx` (372 líneas) - **ACTIVO** en App.jsx
- `features/auth/contexts/AuthContext.jsx` (79 líneas) - Refactorizado DL-076 **NO USADO**

**EVIDENCIA:**
```bash
$ grep -r "from.*contexts/AuthContext" --include="*.jsx" | wc -l
19  # Version antigua usada

$ grep -r "from.*features/auth/contexts" --include="*.jsx" | wc -l
1   # Version refactorizada NO usada
```

**IMPACTO:**
- Refactor DL-076 specialized hooks **NUNCA completado**
- Versión modular mejor (79 líneas vs 372) desperdiciada
- 20 backups sin limpiar indicando múltiples intentos fallidos

**SOLUCIÓN:**
1. Completar migración a `features/auth/contexts/AuthContext.jsx`
2. Actualizar imports en App.jsx
3. Eliminar `contexts/AuthContext.jsx` antigua
4. Limpiar 20 backups

**PRIORIDAD:** 🟡 **ALTA** (deuda técnica crítica)

---

#### **ISSUE #5: localStorage writes duplicados (15 lugares)** ⚠️ **INCONSISTENCIA**
**Archivos afectados:**
- `useAuthState.js:41-49` → `saveAuthState()` function
- `useLogin.js:46-49` → localStorage directo
- `useRegister.js:63-66` → localStorage directo
- `AuthContext.jsx:156-158, 216-218` → localStorage directo

**PROBLEMA:**
```javascript
// 4 lugares diferentes escribiendo lo mismo:
localStorage.setItem('intelibotx_token', accessToken);
localStorage.setItem('intelibotx_user', JSON.stringify(userData));
localStorage.setItem('intelibotx_auth_provider', 'email');
```

**IMPACTO:**
- Race conditions potenciales
- Datos inconsistentes entre hooks
- Dificulta debugging

**SOLUCIÓN:**
- Centralizar en `useAuthState.saveAuthState()` ÚNICAMENTE
- Remover todos los `localStorage.setItem` directos en hooks
- Usar solo setters del estado

**PRIORIDAD:** 🟡 **MEDIA** (mejora arquitectónica)

---

#### **ISSUE #6: Token refresh NO implementado** ⚠️ **UX**
**Estado actual:**
- ✅ Refresh token generado (30 días) - `auth_service.py:68`
- ❌ NO usado - almacenado pero ignorado
- ❌ NO endpoint `/api/auth/refresh`
- ❌ NO auto-refresh antes expiración access token

**IMPACTO:**
- Usuario debe re-login cada 24h (access token expira)
- UX subóptima para usuarios activos
- Refresh token desperdiciado

**SOLUCIÓN:**
```python
# Backend: auth.py
@router.post("/refresh")
async def refresh_token(refresh_data: dict):
    refresh_token = refresh_data.get("refresh_token")
    token_data = auth_service.verify_jwt_token(refresh_token)
    # Generate new access token
    return {"auth": new_access_token}
```

```javascript
// Frontend: httpInterceptor.js
if (response.status === 401) {
  const refreshToken = localStorage.getItem('intelibotx_refresh_token');
  const refreshed = await refreshAccessToken(refreshToken);
  if (refreshed) return fetch(originalRequest);
  logout();
}
```

**PRIORIDAD:** 🟡 **MEDIA** (mejora UX)

---

### **🟡 MEDIO - MEJORAS SEGURIDAD (7 issues):**

#### **ISSUE #7: Token blacklist NO implementado**
**Estado:** Logout limpia localStorage pero token sigue válido 24h

**IMPACTO:** Token robado sigue funcional post-logout

**SOLUCIÓN:**
```python
class TokenBlacklist(SQLModel, table=True):
    token_jti: str
    revoked_at: datetime
    expires_at: datetime
```

**PRIORIDAD:** 🟡 **MEDIA**

---

#### **ISSUE #8: ENCRYPTION_MASTER_KEY hardcoded en docs** ⚠️ **DOCUMENTATION**
**Archivo:** `docs/DEPLOYMENT/DEPLOYMENT_GUIDE.md:21`
**Estado:** ✅ PRD Railway tiene key única configurada correctamente

**PROBLEMA:**
```bash
ENCRYPTION_MASTER_KEY=UzJ2cDRxNnM5djEyeDE1dzhaNHk3QjBGTjBkRzNIODJLZU5mV2pNanNJZz0=
```

**IMPACTO:**
- ⚠️ Key de ejemplo visible en repositorio público
- ⚠️ Nuevos developers pueden copiar/pegar por error
- ✅ **NO impacta PRD actual** - Railway tiene key única diferente

**SOLUCIÓN:**
1. Remover key hardcoded de docs
2. Reemplazar con placeholder + warnings claros
3. Agregar instrucciones generación en `.env.example`

**PRIORIDAD:** 🟡 **MEDIA** (mejora docs)

---

#### **ISSUE #9: No credential rotation mechanism** ⚠️ **SECURITY**
**Estado:** No existe proceso para rotar credentials encriptadas

**PROBLEMA:**
- Una vez credential comprometida → NO hay forma de invalidar viejas versiones
- Re-encryptar todas las credentials requiere downtime
- UserTradingService cachea engines → Credentials stale después de update

**IMPACTO:**
- Credentials comprometidas siguen funcionales indefinidamente
- Security best practice: rotate credentials periódicamente

**SOLUCIÓN:**
1. Endpoint `/api/user/exchanges/{exchange_id}/rotate-credentials`
2. Cache invalidation en UserTradingService después de update
3. Proceso re-encryption batch con nueva ENCRYPTION_MASTER_KEY

**PRIORIDAD:** 🟡 **MEDIA**

---

#### **ISSUE #10: Rate limiting auth endpoints faltante**
**Estado:** Login/Register sin protección brute force

**SOLUCIÓN:** Ya existe `RateLimitMiddleware` - solo falta activar

**PRIORIDAD:** 🟡 **MEDIA**

---

#### **ISSUE #11: WebSocket reconnection NO implementado**
**Archivo:** `useWebSocketConnection.js`

**PROBLEMA:**
```javascript
reconnectTimer = useRef(null); // ❌ Declarado pero NUNCA usado
```

**IMPACTO:** Desconexión = usuario debe refrescar página manualmente

**PRIORIDAD:** 🟡 **MEDIA**

---

#### **ISSUE #12: WebSocket ping/keepalive NO automático**
**Estado:**
- Backend tiene endpoint `action: "ping"` - `websocket_routes.py:272`
- Frontend tiene función `ping()` - `useWebSocketConnection.js:90`
- ❌ NUNCA se ejecuta automáticamente

**IMPACTO:** Conexiones idle timeout sin prevención

**PRIORIDAD:** 🟡 **MEDIA**

---

### **🟢 BAJO - MEJORAS CALIDAD (4 issues):**

#### **ISSUE #13: Email templates básicos**
**Estado:** HTML emails funcionales pero básicos

**PRIORIDAD:** 🟢 **BAJA**

---

#### **ISSUE #14: Audit log NO persistido**
**Estado:** Logging básico consola, NO DB

**PRIORIDAD:** 🟢 **BAJA** (compliance futuro)

---

#### **ISSUE #15: Password validation inconsistente**
**Backend:** `auth_service.py:491` → `len(password) >= 6`
**Frontend:** `usePasswordResetValidation.js:15` → `minLength: 8 + uppercase + lowercase + number`

**IMPACTO:** Usuario puede crear password="123456" en backend pero frontend rechaza

**PRIORIDAD:** 🟢 **BAJA** (UX menor)

---

## 📊 **MATRIZ DE IMPACTO**

| Issue | Sistema | Severidad | Impacto Producción | Esfuerzo Fix |
|-------|---------|-----------|-------------------|--------------|
| #1 WebSocket sin auth | WebSocket | 🔴 CRÍTICO | ALTO | Bajo (1 línea) |
| #2 Master key crash | Encryption | 🔴 CRÍTICO | CRÍTICO | Medio (health check) |
| #3 AuthContext duplicado | Auth | 🟡 ALTO | MEDIO | Alto (migración) |
| #4 localStorage duplicado | Auth | 🟡 MEDIO | BAJO | Medio (refactor) |
| #5 Token refresh | Auth | 🟡 MEDIO | MEDIO (UX) | Medio |
| #6 Token blacklist | Auth | 🟡 MEDIO | MEDIO | Medio |
| #7 Hardcoded key docs | Encryption | 🟡 MEDIO | BAJO (PRD OK) | Bajo (placeholder) |
| #8 Credential rotation | Encryption | 🟡 MEDIO | MEDIO | Medio |
| #9 Rate limiting | Middleware | 🟡 MEDIO | MEDIO | Bajo (activar) |
| #10 WS reconnection | WebSocket | 🟡 MEDIO | MEDIO (UX) | Bajo |
| #11 WS keepalive | WebSocket | 🟡 MEDIO | BAJO | Bajo |
| #12 Email templates | Auth | 🟢 BAJO | BAJO | Alto |
| #13 Audit log | Security | 🟢 BAJO | BAJO | Medio |
| #14 Password validation | Auth | 🟢 BAJO | BAJO | Bajo |

---

## 🎯 **ROADMAP FIXES PRIORIZADO**

### **FASE 1: CRÍTICOS WEBSOCKET (1 día)** 🔴 PRIORIDAD MÁXIMA
1. ⏳ Fix WebSocket auth frontend → Migrar a useWebSocketRealtime (1-2h)
2. ⏳ Backend DL-002 compliance → Reemplazar SmartScalperEngine (2-3h)
3. ⏳ Integrar circuit breaker + rate limiting manual (2-3h)

### **FASE 2: CRÍTICOS ENCRYPTION (4 horas)** 🔴
1. ⏳ Health check encryption status endpoint (2h)
2. ⏳ Remover ENCRYPTION_MASTER_KEY hardcoded de docs (30 min)
3. ⏳ Agregar placeholder + warnings claros en docs (30 min)
4. ⏳ Agregar ENCRYPTION_MASTER_KEY a .env.example (15 min)

### **FASE 3: CRÍTICOS AUTH (1 día)** 🟡
1. ⏳ Completar migración AuthContext refactorizado (1 día)

### **FASE 4: ARQUITECTURA (3-5 días)** 🟡
1. ⏳ Centralizar localStorage writes (4h)
2. ⏳ Implementar token refresh (1 día)
3. ⏳ Activar rate limiting auth endpoints (2h)
4. ⏳ Credential rotation mechanism (2 días)

### **FASE 5: MEJORAS UX (2-3 días)** 🟡
1. ⏳ WebSocket auto-reconnection (4h)
2. ⏳ WebSocket keepalive automático (2h)
3. ⏳ Token blacklist logout (1 día)

### **FASE 6: CALIDAD (Opcional)** 🟢
1. Email templates profesionales
2. Audit log persistente
3. Password validation unificada

---

## 📋 **ARCHIVOS CORE POR SISTEMA**

### **Authentication (15 archivos):**
**Backend:**
- `routes/auth.py` (662 líneas, 15 endpoints)
- `services/auth_service.py` (514 líneas, AuthService class)
- `models/user.py` (118 líneas, 5 models)

**Frontend:**
- `contexts/AuthContext.jsx` (372 líneas) - **ACTIVO**
- `features/auth/contexts/AuthContext.jsx` (79 líneas) - NO USADO
- `features/auth/hooks/` (8 hooks, ~556 líneas)
- `components/auth/` (8 componentes)

### **WebSocket (5 archivos):**
**Backend:**
- `routes/websocket_routes.py` (482 líneas)
- `services/binance_websocket_service.py` (382 líneas)
- `services/realtime_data_manager.py` (487 líneas)

**Frontend:**
- `shared/contexts/WebSocketContext.jsx` (70 líneas)
- `shared/hooks/useWebSocketConnection.js` (129 líneas)

### **Encryption (9 archivos):**
**Backend:**
- `services/encryption_service.py` (208 líneas, EncryptionService class)
- `models/user_exchange.py` (94 líneas, encrypted fields)
- `routes/exchanges.py` (1,009 líneas, encrypt on save)
- `services/exchange_factory.py` (257 líneas, decrypt for use)
- `services/user_trading_service.py` (411 líneas, trading engines)
- `models/user.py` (119 líneas, legacy fields deprecated)

**Documentación:**
- `docs/DEPLOYMENT/DEPLOYMENT_GUIDE.md` (⚠️ HARDCODED KEY)
- `backend/.env.example` (missing ENCRYPTION_MASTER_KEY)

### **Security Middleware (1 archivo):**
**Backend:**
- `utils/security_middleware.py` (497 líneas)

---

## 🔗 **REFERENCIAS CRUZADAS**

### **DL-008 Authentication Pattern:**
- Usado en 43 endpoints
- Documentado en `01_AUTHENTICATION_SECURITY.md`
- Implementación: `services/auth_service.py:328-366`

### **DL-001 No Hardcode:**
- ✅ Verificado en auth (grep ejecutado - 0 hardcodes)
- ✅ Verificado en encryption (env vars)
- ⚠️ ISSUE: Password validation hardcoded diferentes lugares

### **DL-076 Specialized Hooks:**
- ✅ Implementado en `features/auth/` (8 hooks)
- ❌ NO USADO - migración incompleta

---

## ✅ **SISTEMAS FUNCIONANDO 100%**

### **Security Middleware:** 🟢 **OPERATIVO**
- Security headers completos
- Rate limiting configurado
- Request validation activo
- Suspicious pattern detection

### **Encryption Service:** 🟢 **OPERATIVO**
- AES-256 Fernet funcionando
- API keys encriptados correctamente
- ⚠️ DEPENDENCIA CRÍTICA: ENCRYPTION_MASTER_KEY

---

## 📝 **CONVENCIONES DOCUMENTACIÓN**

Cada documento de arquitectura de seguridad incluye:

- ✅ **Estado actual** vs objetivo
- ✅ **Componentes técnicos** (archivos + líneas + tamaños)
- ✅ **Flujo de datos E2E** (diagramas texto)
- ✅ **Issues identificados** (con líneas exactas)
- ✅ **Evidencia herramientas** (grep, read, bash outputs)
- ✅ **Soluciones propuestas** (código + prioridad)
- ✅ **Impacto análisis** (qué rompe si falla)

---

## 🚀 **PRÓXIMOS PASOS**

1. **Revisar:** Leer cada documento de seguridad
2. **Priorizar:** Decidir qué issues atacar primero
3. **Ejecutar:** Implementar fixes Fase 1 (críticos)
4. **Validar:** Tests E2E post-fixes
5. **Monitorear:** Health checks producción

---

**SPEC_REF:** DL-122 (Master E2E Architectures Project)
**Metodología:** GUARDRAILS P1-P9 aplicada
**Análisis:** 8,800+ líneas código leídas completas (Auth 1,848 + WebSocket 2,502 + Encryption 2,200 + mappings 2,250)
**Issues:** 14 identificados con evidencia verificada (Auth: 7, WebSocket: 5, Encryption: 2)
**Severidades:** 2 críticos | 1 alto | 7 medios | 4 bajos
**Documentos:** 3/5 completados (Auth, WebSocket, Encryption)
**Fecha actualización:** 2025-10-02

*Arquitectura de seguridad InteliBotX - Análisis exhaustivo con issues reales identificados.*
