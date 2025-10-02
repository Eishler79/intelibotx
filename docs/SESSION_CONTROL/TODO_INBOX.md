# TODO_INBOX.md · Pendientes sin depurar

> **Regla:** Aquí NO se ejecuta nada.
> Sólo se traslada a `BACKLOG.md` si hay contexto + `SPEC_REF`.
> **Actualizado:** 2025-09-23

---

## 🔄 ITEMS PENDIENTES

### 🔴 AUDITORÍA CRÍTICA - COMPONENTES ROTOS [2025-09-27]

#### **1. COMPONENTES CON DATOS FALSOS (Math.random)**
- **BotsContext.jsx:368** → `isWin = Math.random()` - PnL FALSO
- **BotsAdvanced.jsx:525** → `isWin = Math.random()` - PnL FALSO duplicado
- **AdvancedMetrics.jsx:94-96** → `mockReturns`, `mockEquity`, `mockTrades` - Métricas FALSAS
- **AdvancedMetrics.jsx:130** → `currentStreak: Math.random()` - Racha FALSA
- **LatencyMonitor.jsx:95-118** → 5 usos de Math.random para latencia FALSA

#### **2. COMPONENTES CON FALLBACKS PELIGROSOS**
- **BotsContext.jsx:361** → `confidence || 0.75` - Confianza DEFAULT
- **BotsContext.jsx:363** → `current_price || 50000` - Precio $50,000 HARDCODE
- **BotsContext.jsx:364** → `stake || 1000` - Stake $1000 HARDCODE
- **BotsContext.jsx:365** → `risk || 1` - Riesgo 1% HARDCODE

#### **3. COMPONENTES CON MOCK DATA**
- **BotsEnhanced.jsx:71** → `mockBotData` - Bot FALSO
- **AdvancedMetrics.jsx:94-100** → `mockReturns`, `mockEquity`, `mockTrades`
- **LatencyMonitor.jsx:52-89** → `simulateLatencyMetrics()` - Latencia SIMULADA

#### **4. COMPONENTES CON HARDCODES DE INTERVALOS**
- **BotsContext.jsx:345-349** → Intervalos hardcodeados:
  - Smart Scalper: 45000ms (ignora bot.interval)
  - Trend Hunter: 120000ms (ignora bot.interval)
  - Manipulation Detector: 180000ms (ignora bot.interval)
  - News Sentiment: 300000ms (ignora bot.interval)
  - Volatility Master: 60000ms (ignora bot.interval)

#### **5. BACKEND HARDCODES**
- **routes/bots.py:611** → `interval="1m"` hardcodeado (ignora bot.interval)
- **routes/bots.py:78** → `timeframes = ["1m", "5m", "15m", "1h"]` hardcodeado

#### **RESUMEN: 22 COMPONENTES ROTOS CRÍTICOS**
- 15 instancias de Math.random() generando datos falsos
- 4 fallbacks con valores peligrosos ($50,000, $1000)
- 5 intervalos hardcodeados ignorando configuración
- 3 componentes con mock/simulate data
- 58 de 62 parámetros del bot son ignorados

**IMPACTO:** Sistema muestra datos FALSOS al usuario, ejecuta con parámetros INCORRECTOS

---

### 🔴 ANÁLISIS DE FLUJO - COMPONENTES DUPLICADOS [2025-09-27]

#### **FLUJO COMPLETO DE DATOS FALSOS**

**1. ORIGEN (Backend → Frontend)**
- Backend `/api/run-smart-trade/{symbol}` retorna análisis REAL
- Frontend `runSmartTrade()` (api.ts:63) recibe datos correctos

**2. PROCESAMIENTO - CÓDIGO 100% DUPLICADO**
- **BotsContext.jsx:368** → PnL con Math.random() (parece no usarse)
- **BotsAdvanced.jsx:525** → PnL con Math.random() (ACTIVO - se usa)

**3. DESTINO (Frontend → Backend)**
- Ambos llaman `createTradingOperation()` (api.ts:114)
- Se guarda en BD: `/api/bots/{bot_id}/trading-operations`
- PnL FALSO permanece en base de datos

#### **COMPONENTES DUPLICADOS**
| Funcionalidad | BotsContext.jsx | BotsAdvanced.jsx | Estado |
|--------------|-----------------|------------------|--------|
| Math.random() PnL | Línea 368 | Línea 525 | DUPLICADO |
| Fallback $50,000 | Línea 363 | Línea 519 | DUPLICADO |
| Fallback $1,000 | Línea 364 | Línea 520 | DUPLICADO |
| Intervalos hardcode | Líneas 345-349 | Líneas 499-503 | DUPLICADO |
| startBotTrading() | Línea 336 | Línea 490 | DUPLICADO |
| updateBotMetricsFromDB() | Línea 414 | Línea 567 | DUPLICADO |

#### **QUIEN USA QUÉ**
- **BotsContext.jsx**: Exporta `useBotsContext` pero NO se encuentra ningún import
- **BotsAdvanced.jsx**: Componente activo, renderizado en App.jsx
- **Conclusión**: Código 100% duplicado, BotsContext parece abandonado

**IMPACTO:** Sistema muestra datos FALSOS al usuario, ejecuta con parámetros INCORRECTOS

---

### 🔴 ARQUITECTURA INCORRECTA - BOT SCHEDULER EN FRONTEND [2025-10-01]

#### **PROBLEMA: SetInterval en Frontend (Arquitectura Incorrecta)**

**EVIDENCIA DEL PROBLEMA:**
- **Archivo:** `/frontend/src/features/bots/hooks/useBotOperations.js:147`
- **Código:** `const interval = setInterval(executeTradeAnalysis, strategyConfig.frequency);`
- **Problema:** Scheduler vive en memoria del navegador

**CONSECUENCIAS CRÍTICAS:**
1. ❌ **Refresh resetea contador:** Bot con 58min de 1h → refresh → espera 1h de nuevo
2. ❌ **Sin visibilidad:** Usuario NO ve "Próximo análisis en: 2m 30s"
3. ❌ **Conexión perdida = Bot detenido:** Si página se cierra, bot deja de operar
4. ❌ **No persistencia:** Estado del scheduler no se guarda en DB

**ARQUITECTURA ACTUAL (INCORRECTA):**
```
Frontend (setInterval) → Llama /api/run-smart-trade cada X min
                      ↓
                   Backend responde
```

**ARQUITECTURA CORRECTA REQUERIDA:**
```
Backend Scheduler → Proceso independiente que ejecuta cada X min
                 → Persiste: next_execution_time, last_execution_time en DB
                 → Continúa aunque frontend caiga

Frontend → Solo OBSERVA estado desde backend
        → Muestra countdown: "Próximo análisis en: 2m 30s"
        → Consulta /api/bots/{id}/scheduler-status
```

#### **FIX REQUERIDO:**

**Backend:**
1. Crear servicio scheduler persistente (Celery, APScheduler, o cron jobs)
2. DB Schema: Agregar campos a `bot_config` table:
   - `last_execution_timestamp` (datetime)
   - `next_execution_timestamp` (datetime)
   - `execution_count` (int)
3. Endpoint nuevo: `GET /api/bots/{id}/scheduler-status`
   - Devuelve: `{next_execution_in_seconds: 150, last_execution: "2025-10-01T10:30:00"}`
4. Scheduler ejecuta `run-smart-trade` automáticamente según `bot.interval`

**Frontend:**
1. Eliminar `setInterval` de `useBotOperations.js`
2. Crear `useSchedulerStatus` hook que consulta estado cada 5 segundos
3. Componente `SchedulerCountdown` que muestra: "Próximo análisis en: 2m 30s"
4. Actualizar `ProfessionalBotsTable` para mostrar countdown

#### **IMPACTO:**
- **Crítico:** Bots actuales NO persisten ejecución al refrescar
- **UX:** Usuario no tiene visibilidad de cuándo ejecutará próximo análisis
- **Confiabilidad:** Sistema depende de que página esté abierta

#### **PRIORIDAD:** ALTA - Afecta funcionalidad core del sistema

#### **ESTIMACIÓN:**
- Backend scheduler: 4-6 horas
- Frontend countdown UI: 2-3 horas
- Testing completo: 2 horas
- **Total:** ~10 horas

#### **SPEC_REF:** Pendiente - Requiere documento de arquitectura scheduler

---

## 🏗️ **PROYECTO MASTER: ARQUITECTURAS E2E COMPLETAS** [2025-10-01]

### **CONTEXTO CRÍTICO:**
Después de meses reparando daños, improvisaciones y cosas a medias, necesito MAPEAR COMPLETO todo el sistema E2E para:
1. ✅ Tener visión clara del estado real del proyecto
2. ✅ Consolidar 20+ planes de ajuste dispersos
3. ✅ Preparar salida a producción con claridad
4. ✅ Retomar rumbo óptimo de desarrollo

### **OBJETIVO:**
Crear 7 arquitecturas completas (nivel detalle `01_WYCKOFF_ARCHITECTURE.md`) que documenten CADA sección del sistema E2E.

### **REORGANIZACIÓN ESTRUCTURA:**
```
docs/TECHNICAL_SPECS/
└── ARCHITECTURE/ (NUEVO)
    ├── INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/ (MOVER)
    │   └── [6 documentos existentes]
    │
    ├── MODE_ARCHITECTURE_TECH/ (MOVER)
    │   └── [documentos existentes]
    │
    ├── MODE_ALGORITHM_REFINEMENTS/ (MOVER)
    │
    └── SOLUTION_ARCHITECTURE/ (NUEVO - 7 ARQUITECTURAS)
        ├── 01_AUTH_ARCHITECTURE.md
        ├── 02_DASHBOARD_ARCHITECTURE.md
        ├── 03_PORTFOLIO_ARCHITECTURE.md
        ├── 04_BOTS_PANEL_ARCHITECTURE.md
        ├── 05_TRADING_LIVE_ARCHITECTURE.md
        ├── 06_EXCHANGE_ARCHITECTURE.md
        └── 07_SECURITY_ARCHITECTURE.md
```

### **ARQUITECTURAS A CREAR (7):**

#### **1. AUTH_ARCHITECTURE.md**
**Scope:** Login, Registro, Verificación Email, Reset Password, Logout, Account Settings
**Componentes:**
- Backend: `/backend/routes/auth.py`
- APIs: login, register, verify-email, forgot-password, reset-password, logout
- Seguridad: JWT, email verification, password hashing
- Interceptor: Token refresh, error handling
- Frontend: `/frontend/src/pages/AuthPage.jsx`
- UI/UX: Login → Registro → Verificación → Reset
- Rutas: `/login`, `/register`, `/verify-email`, `/reset-password`
- **PENDIENTES:**
  - Datos hardcode en auth
  - Account Settings no funcional
  - Seguridad: temas viejos sin resolver

#### **2. DASHBOARD_ARCHITECTURE.md**
**Scope:** Dashboard principal post-login
**Componentes:**
- Backend: `/backend/routes/dashboard_data.py`
- APIs: metrics, balance, PnL, active bots
- Seguridad: DL-008 authentication
- Frontend: `/frontend/src/pages/Dashboard.jsx`
- UI/UX:
  - Login → Dashboard principal
  - Validación exchange configurado
  - Si NO exchange → redirect `/exchanges`
  - Si SÍ exchange → cargar métricas
- Rutas: `/dashboard`
- **FLUJO VALIDACIÓN:**
  ```
  Login exitoso → /dashboard
      ↓
  Check user.has_exchange?
      ↓ NO
  Redirect → /exchanges (configurar)
      ↓ SÍ
  Load → Dashboard completo
  ```

#### **3. PORTFOLIO_ARCHITECTURE.md**
**Scope:** Gestión portfolio
**Componentes:**
- Backend: Endpoint portfolio (IDENTIFICAR)
- APIs: Portfolio data
- Frontend: `/frontend/src/pages/Portfolio.jsx`
- UI/UX: **ACTUALMENTE EN BLANCO**
- Rutas: `/portfolio`
- **PROBLEMA CRÍTICO:**
  - Página completamente vacía
  - Investigar causa raíz
  - Definir funcionalidad esperada

#### **4. BOTS_PANEL_ARCHITECTURE.md (LA MÁS COMPLEJA)**
**Scope:** Panel completo gestión bots
**Sub-arquitecturas (9):**

##### **4a. Crear Bot**
- Backend: POST `/api/bots`
- Frontend: `EnhancedBotCreationModal.jsx`
- UI/UX: Modal → Form → Validación → Submit

##### **4b. Histórico Bot**
- Backend: GET `/api/bots/{id}/trades`
- Frontend: `TradingHistory.jsx`
- UI/UX: Tabla operaciones

##### **4c. Templates Creación**
- Backend: `/api/bot-unique-templates`
- Frontend: `BotTemplates.jsx`
- UI/UX: Selector templates Bot Único
- **ESTADO:** Validar status actual

##### **4d. Panel Professional**
- Frontend: `BotsModular.jsx` + `BotsTableSection.jsx`
- UI/UX: Tabla profesional bots

##### **4e. Datos Generales**
- Backend: `/api/bots/{id}/metrics`
- UI/UX: PnL, Stake, Risk, etc.

##### **4f. Bot RUNNING + Background + MODOS + ALGORITMOS** 🔥
**EL MÁS CRÍTICO - INTEGRACIÓN COMPLETA:**
- Backend:
  - `/backend/routes/real_trading_routes.py`
  - `/backend/services/real_trading_engine.py`
  - `/backend/services/intelligent_mode_selector.py`
  - `/backend/services/signal_quality_assessor.py`
  - **ALGORITMOS:** Solo Wyckoff 100% (DL-113)
  - **PENDIENTES:** 11 algoritmos restantes
- APIs:
  - `/api/run-smart-trade/{symbol}`
  - `/api/trading-operations`
- Frontend:
  - `useBotOperations.js`
  - Background execution
- WebSocket: Real-time updates
- **INTEGRACIÓN:**
  - Smart Scalper MODE completo
  - 12 algoritmos institucionales (1/12 listo)
  - Execution engine
  - Mode selection IA

##### **4g. Visualizar Algoritmos Avanzados**
- Frontend: `SmartScalperMetricsComplete.jsx`
- UI/UX: Modal análisis institucional
- **TABLEROS:** Reajuste según usuario

##### **4h. Modificar Bot**
- Backend: PUT `/api/bots/{id}`
- Frontend: `BotControlPanel.jsx`

##### **4i. Borrar Bot**
- Backend: DELETE `/api/bots/{id}`
- UI/UX: Confirmación

#### **5. TRADING_LIVE_ARCHITECTURE.md**
**Scope:** Trading en vivo
**Componentes:**
- Backend: `/backend/routes/trading_feed.py`
- APIs: `/api/trading-feed/live`
- WebSocket: Real-time feed
- Frontend: Trading feed components
- UI/UX: **ESTADO:** Validar funcionalidad existente
- **OBJETIVO:** Aterrizar expectativa vs realidad

#### **6. EXCHANGE_ARCHITECTURE.md**
**Scope:** Gestión exchanges
**Componentes:**
- Backend: `/backend/routes/exchanges.py`
- APIs: CRUD exchanges, test connection
- Seguridad: Encryption API keys
- Frontend: `ExchangeManagement.jsx`, `AddExchangeModal.jsx`
- UI/UX: `/exchanges` - Gestión credenciales
- Rutas: `/exchanges`

#### **7. SECURITY_ARCHITECTURE.md**
**Scope:** Seguridad global sistema
**Componentes:**
- Auth: JWT system completo
- WebSocket: Seguridad conexiones
- Encriptación: API keys, datos sensibles
- Interceptor: `httpInterceptor.js`
- Middleware: `security_middleware.py`
- **PENDIENTES:** Temas seguridad viejos

### **DATOS REQUERIDOS POR ARQUITECTURA:**
Cada arquitectura debe documentar:
- ✅ **Backend:** Rutas archivos + tamaños + endpoints
- ✅ **APIs:** Lista completa + métodos + schemas
- ✅ **Seguridad:** Auth (DL-008) + encryption + validaciones
- ✅ **Interceptor:** Token management + error handling
- ✅ **WebSocket:** Si aplica + eventos + data flow
- ✅ **Frontend:** Componentes (paths + tamaños) + hooks + services
- ✅ **UI/UX:** **Navegación detallada:** "Lateral → Dashboard → Vista XYZ → Componente ABC"
- ✅ **Rutas:** URLs frontend + mapeo
- ✅ **PENDIENTES:** Issues + planes ajuste + próximos pasos

### **FORMATO ESTÁNDAR:**
Nivel detalle igual a `01_WYCKOFF_ARCHITECTURE.md`:
```markdown
# XX_NOMBRE_ARCHITECTURE.md

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN**
> **Estado:** 🔴/🟡/🟢
> **Prioridad:** CRÍTICA/ALTA/MEDIA

## 📊 ARQUITECTURA ACTUAL VS OBJETIVO
## 🎯 COMPONENTES TÉCNICOS
## 📐 FLUJO DE DATOS
## 🔧 INTEGRACIÓN
## 🎨 DISEÑO UX/UI
## ✅ MAPEO ARQUITECTURA
## 🔥 PENDIENTES IDENTIFICADOS
```

### **ENTREGABLES:**
1. ✅ Reorganización carpetas (ARCHITECTURE/)
2. ✅ 7 arquitecturas nuevas completas
3. ✅ Consolidación planes de ajuste al final de cada arquitectura
4. ✅ **DESPUÉS:** Unificación y validación de todos los planes

### **ESTADO:**
- ✅ **Inventario confirmado:** 2025-10-01
- ✅ **Documentación TODO_INBOX:** COMPLETO
- ✅ **Reorganización estructura:** COMPLETO (ARCHITECTURE/ creado)
- ✅ **HITO 1 COMPLETO:** 01_AUTHENTICATION_SECURITY.md (1,848 líneas)

### **PROGRESO ARQUITECTURAS (2/5 subsistemas - SECURITY + BOT_PANEL parcial):**

#### ✅ **SECURITY_ARCHITECTURE/ (Subsistema completo - 5 documentos)**
- ✅ **README.md** (422 líneas) - Índice master + 22 issues críticos identificados (Auth: 12, WebSocket: 10)
- ✅ **01_AUTHENTICATION_SECURITY.md** (1,848 líneas) - Sistema auth E2E completo
  - **Metodología:** GUARDRAILS P1-P9 aplicada sin excepciones
  - **Archivos leídos:** 25+ archivos (~2,500 líneas código)
  - **Issues:** 12 identificados (5 críticos, 4 medios, 3 bajos)
  - **Evidencia:** 18 imports AuthContext antigua, 1 import refactorizada (DashboardPage)
  - **Plan migración:** FASE 1-4 completo con rollback plan
  - **Deuda técnica:** 990 líneas refactorizadas DL-076 NO usadas + 474 líneas código huérfano
- ✅ **02_WEBSOCKET_SECURITY.md** (2,502 líneas) - Sistema WebSocket E2E completo **COMPLETADO 2025-10-02**
  - **Metodología:** GUARDRAILS P1-P9 aplicada sin excepciones
  - **Archivos leídos:** 14 archivos completos (4,600+ líneas código)
  - **Issues:** 10 identificados (3 críticos, 4 altos, 3 medios/bajos)
  - **Evidencia crítica:**
    - useWebSocketConnection.js:26 NO envía token auth
    - useWebSocketRealtime.js (285 líneas) correcto pero NO usado
    - DL-110 violation: binance_websocket_service.py usa retail algorithms (RSI/MACD/EMA)
  - **Plan migración:** FASE 1-5 completo (WebSocket auth fix + DL-002 compliance + infrastructure)
  - **Arquitectura gaps:** Sistema 60% funcional (backend OK, frontend sin auth, infraestructura configurada no integrada)
- ✅ **03_ENCRYPTION_SECURITY.md** (2,200 líneas) - Sistema Encryption E2E completo **COMPLETADO 2025-10-02**
  - **Metodología:** GUARDRAILS P1-P9 aplicada sin excepciones
  - **Archivos leídos:** 12 archivos completos (3,200+ líneas código)
  - **Issues:** 9 identificados (2 críticos, 4 altos, 3 medios)
  - **Evidencia crítica:**
    - encryption_service.py:49 master key crash si ENCRYPTION_KEY no existe
    - ExchangeManagement.jsx:150 muestra API keys en logs
    - No rotación automática de master key
  - **Plan migración:** FASE 1-4 completo (master key segura, UI fixes, key rotation, monitoring)
  - **Arquitectura:** Sistema funcional pero con gaps críticos de seguridad
- ⏳ **04_SECURITY_MIDDLEWARE.md** - PENDIENTE (✅ Implementado según README)
- ⏳ **05_NETWORK_SECURITY.md** - PENDIENTE (✅ Implementado según README)

#### 🟡 **BOT_PANEL_ARCHITECTURE/ (1/9 sub-arquitecturas completadas)**
- ✅ **README.md** (223 líneas) - Índice completo 9 sub-arquitecturas + 4 issues transversales
- ⏳ **01_CREATE_BOT_ARCHITECTURE.md** - PENDIENTE
- ⏳ **02_BOT_HISTORY_ARCHITECTURE.md** - PENDIENTE
- ⏳ **03_BOT_TEMPLATES_ARCHITECTURE.md** - PENDIENTE
- ⏳ **04_PROFESSIONAL_PANEL_ARCHITECTURE.md** - PENDIENTE
- ⏳ **05_BOT_METRICS_ARCHITECTURE.md** - PENDIENTE
- ✅ **06_BOT_RUNNING_CORE_ARCHITECTURE.md** (3,661 líneas) - Bot RUNNING + MODOS + ALGORITMOS **COMPLETADO 2025-10-02**
  - **Metodología:** GUARDRAILS P1-P9 aplicada sin excepciones
  - **Archivos leídos:** 30+ archivos (6,000+ líneas código)
  - **Issues:** 8 identificados (5 CRÍTICOS bloqueantes, 3 ALTA/MEDIA)
  - **Evidencia crítica:**
    - 58/62 parámetros bot NO consumidos (93.5% ignorado)
    - Solo 1/12 algoritmos implementados (Wyckoff único)
    - No ejecución automática bot (frontend setInterval incorrecto)
    - No backtesting datos reales (urgente según usuario)
    - Wyckoff parámetros hardcoded (18 params no usados)
  - **Plan corrección:** 7 FASES (Críticos 2-3 semanas → Algoritmos 24 semanas → Refactoring 4 semanas → Modos 8 semanas)
  - **Referencias:** 6 arquitecturas técnicas algoritmos institucionales (6,376 líneas disponibles)
  - **Métricas específicas:** Cada algoritmo con KPIs propios documentados (Wyckoff: 7 métricas, Order Blocks: 7 scoring functions, etc.)
  - **Arquitectura:** BotsModular.jsx (140L) activo DL-001/076 compliant, BotsAdvanced.jsx (990L) descartado
- ⏳ **07_ALGORITHMS_VISUALIZATION_ARCHITECTURE.md** - PENDIENTE
- ⏳ **08_BOT_EDIT_ARCHITECTURE.md** - PENDIENTE
- ⏳ **09_BOT_DELETE_ARCHITECTURE.md** - PENDIENTE

#### ⏳ **SOLUTION_ARCHITECTURE/ (4 arquitecturas funcionales - PENDIENTES)**
- ⏳ **01_DASHBOARD_ARCHITECTURE.md** - PENDIENTE
- ⏳ **02_PORTFOLIO_ARCHITECTURE.md** - PENDIENTE
- ⏳ **03_TRADING_LIVE_ARCHITECTURE.md** - PENDIENTE
- ⏳ **04_EXCHANGE_ARCHITECTURE.md** - PENDIENTE

#### ✅ **INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/ (6/12 algoritmos con arquitectura técnica completa)**
- ✅ **01_WYCKOFF_ARCHITECTURE.md** (1,004 líneas) - IMPLEMENTADO + DOCUMENTADO
- ✅ **02_ORDER_BLOCKS_ARCHITECTURE.md** (1,286 líneas) - DOCUMENTADO (NO implementado)
- ✅ **03_LIQUIDITY_GRABS_ARCHITECTURE.md** (787 líneas) - DOCUMENTADO (NO implementado)
- ✅ **04_STOP_HUNTING_ARCHITECTURE.md** (962 líneas) - DOCUMENTADO (NO implementado)
- ✅ **05_FAIR_VALUE_GAPS_ARCHITECTURE.md** (1,192 líneas) - DOCUMENTADO (NO implementado)
- ✅ **06_MARKET_MICROSTRUCTURE_ARCHITECTURE.md** (1,145 líneas) - DOCUMENTADO (NO implementado)
- ⏳ **07-12:** VSA, Market Profile, SMC, Order Flow, A/D, Composite Man - PENDIENTE ARQUITECTURA

**TOTAL ARQUITECTURAS TÉCNICAS ALGORITMOS:** 6,376 líneas (6 algoritmos documentados completos con modelo matemático, scoring, métricas específicas, UX dashboard, endpoints)

**NOTA:** 07_SECURITY_ARCHITECTURE.md fue movida a SECURITY_ARCHITECTURE/ como subsistema separado.

### **PRÓXIMO PASO (SESIÓN SIGUIENTE):**

#### **OPCIÓN 1: Continuar Arquitecturas BOT_PANEL (8/9 pendientes)**
**Prioridad recomendada:**
1. **01_CREATE_BOT_ARCHITECTURE.md** - Creación bot (EnhancedBotCreationModal 1,452L)
2. **04_PROFESSIONAL_PANEL_ARCHITECTURE.md** - Tabla bots (ProfessionalBotsTable 498L)
3. **05_BOT_METRICS_ARCHITECTURE.md** - Métricas PnL/Stake (DashboardMetrics, AdvancedMetrics)
4. **07_ALGORITHMS_VISUALIZATION_ARCHITECTURE.md** - Visualización algoritmos avanzados
5. **02_BOT_HISTORY_ARCHITECTURE.md** - Histórico operaciones
6. **03_BOT_TEMPLATES_ARCHITECTURE.md** - Templates pre-configurados
7. **08_BOT_EDIT_ARCHITECTURE.md** - Modificar bot
8. **09_BOT_DELETE_ARCHITECTURE.md** - Borrar bot

#### **OPCIÓN 2: Implementar FASE 1 CRÍTICOS Bot Running (2-3 semanas para operar)**
**Usuario indicó:** *"necesito empezar a operar"* + *"es urgente... backtesting datos reales"*
1. Issue #1: Consumir 62 parámetros bot (5 días)
2. Issue #3: Ejecución automática scheduler backend (3 días)
3. Issue #4: Backtesting sistema datos reales (7 días)

#### **OPCIÓN 3: Implementar Algoritmos con Arquitectura Completa (RÁPIDO)**
**5 algoritmos con arquitectura técnica lista para implementar:**
1. Order Blocks (1,286 líneas arquitectura completa)
2. Liquidity Grabs (787 líneas arquitectura completa)
3. Stop Hunting (962 líneas arquitectura completa)
4. Fair Value Gaps (1,192 líneas arquitectura completa)
5. Market Microstructure (1,145 líneas arquitectura completa)

#### **OPCIÓN 4: Completar SECURITY_ARCHITECTURE (2/5 pendientes)**
1. **04_SECURITY_MIDDLEWARE.md** - Middleware seguridad (✅ Implementado según README)
2. **05_NETWORK_SECURITY.md** - Seguridad red (✅ Implementado según README)

#### **OPCIÓN 5: SOLUTION_ARCHITECTURE restantes (4 pendientes)**
1. **01_DASHBOARD_ARCHITECTURE.md** - Dashboard principal post-login
2. **02_PORTFOLIO_ARCHITECTURE.md** - Gestión portfolio (actualmente en blanco)
3. **03_TRADING_LIVE_ARCHITECTURE.md** - Trading feed real-time
4. **04_EXCHANGE_ARCHITECTURE.md** - Gestión exchanges + encryption

**RECOMENDACIÓN TÉCNICA:** OPCIÓN 2 (Implementar FASE 1 Críticos) tiene prioridad MÁXIMA según usuario para poder operar YA.

### **SPEC_REF:**
- Modelo: `docs/TECHNICAL_SPECS/ARCHITECTURE/INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/01_WYCKOFF_ARCHITECTURE.md`
- Decision: DL-122 (Arquitecturas E2E Master Project)
- Documento creado: `docs/TECHNICAL_SPECS/ARCHITECTURE/SECURITY_ARCHITECTURE/01_AUTHENTICATION_SECURITY.md`

---

## 📝 NOTAS

- **2025-10-01:** PROYECTO MASTER - Arquitecturas E2E completas documentado
- **2025-09-23:** Limpieza completa - Todos los items trasladados a BACKLOG y MASTER_PLAN
- Los DL-094 a DL-102 ahora están correctamente documentados en ambos archivos
- Este archivo queda limpio para recibir nuevos items futuros

---

## 🎯 PROCESO DE GESTIÓN

1. **Captura:** Ideas nuevas se registran aquí sin estructura
2. **Análisis:** Se evalúa contexto y prioridad
3. **Traslado:** Si válido → BACKLOG con DL number
4. **Limpieza:** Borrar de aquí una vez trasladado

---

_Este archivo debe mantenerse en `/docs/SESSION_CONTROL/` junto con BACKLOG.md y MASTER_PLAN.md_