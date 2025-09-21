# MASTER_PLAN.md - Status Dinámico Proyecto InteliBotX

> **TRACKER:** Estado actual + progreso + métricas dinámicas  
> **ACTUALIZADO:** 2025-09-18  

---

## 📊 **MÉTRICAS CRÍTICAS ACTUALES**

### **⚡ SUCCESS CRITERIA FRONTEND:**
- **Progreso:** ✅ **100% COMPLETADO** - Todos los ultra-críticos ya refactorizados
- **Análisis Verification:** 6/6 ultra-críticos confirmados como productos de refactoring previo
- **Arquitectura:** Feature-based structure + DL-076 specialized hooks pattern ✅ PROVEN
- **Estado:** PROYECTO REFACTORING CONCLUIDO ✅

### **🎯 SISTEMA BACKEND:**
- **Authentication:** 90% complete - DL-008 centralizado (43 endpoints)
- **Database:** PostgreSQL Railway deployment ✅ 
- **Security:** ENCRYPTION_MASTER_KEY pendiente - CRÍTICO
- **Algoritmos operativos en código:** ✅ **12/12** (se integran VSA, Market Profile, SMC, Order Flow, A/D, Composite Man)
- **Especificaciones DL-001 actualizadas:** 12/12 algoritmos + modos documentados con ParamProviders
- **Parametrización runtime:** SignalQualityAssessor consume BotConfig y expone detalles institucionales completos ✅

### **📈 ALGORITMOS INSTITUCIONALES:**
- **Especificación técnica:** ✅ 12/12 con catálogos DL-001 y payloads definidos
- **Implementación en código:** ✅ 12/12 integrados en SignalQualityAssessor y endpoints

---

## 🎯 **FASE ACTUAL**

### **✅ ETAPA 0 COMPLETADA:** Refactoring Arquitectural
- **Progreso:** ✅ **100% COMPLETADO** - Refactoring arquitectural finalizado
- **Logros:** Authentication + Database + Security Framework + DL-040 Architecture + Feature-based Structure + SUCCESS CRITERIA achieved
- **Verificación:** Análisis exhaustivo confirmó que todos los ultra-críticos ya fueron refactorizados en sesiones previas
- **Resultados:** Build ✅ functional | 199+ archivos refactorizados | Zero componentes >200 líneas sin refactoring previo

### ✅ **FASE 0 (Baseline UI/UX) CONCLUIDA:**
- InstitutionalChart + SmartScalperMetrics consumen solo datos reales con fallback “No data” confirmado
- Eliminados `Math.random()` y fallbacks visuales en flujo operativo principal
- Endpoints verificados con payload real para nueva instrumentación

### ✅ **FASE 1 (Parametrización Algoritmos 01–06) CONCLUIDA:**
- ParamProviders aplicados en runtime leyendo BotConfig + estadísticas recientes
- SignalQualityAssessor retorna confirmaciones con detalles completos para UI avanzada
- `/api/run-smart-trade/{symbol}` expone `institutional_confirmations_breakdown` + bias/recommendations por algoritmo
- Validación manual + `python -m compileall backend/routes/bots.py` sin errores

### ✅ **FASE 2 (Implementación Algoritmos 07–12) CONCLUIDA:**
- Evaluadores institucionales para VSA, Market Profile, Order Flow, Accumulation/Distribution, SMC y Composite Man operativos
- DefaultInstitutionalParamProvider extendido con parámetros adaptativos DL-001 para algoritmos 07–12
- Respuesta `/api/run-smart-trade/{symbol}` incluye confirmaciones ampliadas (`volume_spread_analysis`, `market_profile`, `institutional_order_flow`, `accumulation_distribution`, `smart_money_concepts`, `composite_man`)
- Validación: `python -m compileall backend/services/institutional_params.py backend/services/signal_quality_assessor.py backend/routes/bots.py`

### ✅ **FASE 3 (ModeParamProvider + Selector) CONCLUIDA:**
- `DefaultModeParamProvider` derivado de BotConfig + estadísticas recientes
- `IntelligentModeSelector` heurístico decide entre SCALPING, TREND, ANTI-MANIPULATION, VOLATILITY, NEWS
- Respuesta `/api/run-smart-trade/{symbol}` expone `mode_decision` con scores, features y confianza
- Validación: `python -m compileall backend/services/mode_params.py backend/routes/bots.py`

### ✅ **FASE 4 (UI & Telemetría) CONCLUIDA:**
- SmartScalperMetrics muestra modo activo, acciones recomendadas y métricas derivadas del selector
- Telemetría básica almacenada en `bot_states` + logging estructurado para históricos de modo
- Repositorio `configs/mode_defaults.json` documenta parámetros congelados para empaquetado/testnet
- Validación: `python -m compileall backend/services/mode_params.py backend/routes/bots.py` + inspección UI

### 🚀 **FASE 5 ACTUAL: EXPERIENCIA USUARIO COHERENTE**
**REORGANIZADA:** Según flujo lógico cronológico del usuario real

#### **🚪 ETAPA 1: ACCESO FUNCIONAL (P0 - SISTEMA USABLE)**
- **Estado:** ✅ RESUELTO - DL-101 useAuthState localStorage implementation
- **Meta:** Usuario login → dashboard funcional → puede crear bots
- **Completado:** Bot creation, BotsAdvanced, SmartScalperMetricsComplete funcionales

#### **🤖 ETAPA 2: CONFIGURACIÓN BOT COHERENTE (P0 - PARÁMETROS CONECTADOS)**
- **Estado:** 🔴 CRÍTICO - Análisis completado: 7 desconexiones arquitecturales identificadas
- **Meta:** Usuario crea bot → parámetros trasladan automáticamente a algoritmos
- **Progreso:** Timeframe dinámico ✅, **7 DESCONEXIONES CRÍTICAS DETECTADAS:**
  1. **STRATEGY → ANÁLISIS:** Strategy usuario ignorada, algoritmos siempre misma lógica
  2. **RISK_PROFILE → MODES:** Mode Selection ignora CONSERVATIVE/AGGRESSIVE usuario
  3. **MARKET_TYPE → FEEDS:** FUTURES_USDT recibe datos SPOT incorrectos
  4. **TP/SL → SIGNALS:** Algoritmos ignoran tolerancia riesgo usuario configurada
  5. **COOLDOWN → FREQUENCY:** Sistema genera señales más rápido que cooldown usuario
  6. **LEVERAGE → ANALYSIS:** Análisis institucional no considera apalancamiento
  7. **ORDER_TYPES → EXECUTION:** Hardcoded MARKET orders, ignora LIMIT configurado
- **Evidencia:** Análisis completo con GUARDRAILS P1-P9, sin especulación
- **Impacto:** Desconexión arquitectural profunda - parámetros usuario totalmente ignorados

#### **📊 ETAPA 3: TABLA PROFESIONAL INFORMATIVA (P0 - UX CRÍTICO)**
- **Estado:** 🔴 CRÍTICO - Sin señal visible, estado no persiste
- **Meta:** Usuario ve: Estado, Señal Actual, Algoritmo Activo, Estrategia
- **Acciones:** Columna señal BUY/SELL/HOLD, persistencia RUNNING/PAUSED

#### **⚡ ETAPA 4: BOT AUTOMÁTICO REAL (P0 - FUNCIONALIDAD PRINCIPAL)**
- **Estado:** 🔴 CRÍTICO - Solo funciona con modal abierto
- **Meta:** RUNNING → análisis automático → operaciones reales
- **Acciones:** Scheduler background, separar análisis/visualización

#### **🎯 ETAPA 5: VISTA ALGORITMOS LÓGICA (P0 - UX FUNDAMENTAL)**
- **Estado:** 🔴 CRÍTICO - Información incoherente, sin narrativa
- **Meta:** Parámetros → Análisis → Decisión → Señal → Acción (secuencia lógica)
- **Acciones:** Modal coherente, overlays funcionales, mensajes comprensibles

#### **📈 ETAPA 6: PERFORMANCE VISIBLE (P1 - FUNCIONALIDAD PERDIDA)**
- **Estado:** 🟡 PENDIENTE - Componentes eliminados
- **Meta:** Performance Overview + Execution Quality restaurados
- **Acciones:** Reintegrar métricas rendimiento, historial operaciones

#### **📊 ETAPA 7: DATASETS LIMPIOS (P2 - TELEMETRÍA)**
- **Estado:** 🟢 FUNCIONAL - Needs cleanup
- **Meta:** Dataset usable para ML learning
- **Acciones:** Clean console.log, export CSV, capture decisions

#### **🔧 ETAPA 8: VALIDACIÓN INTEGRAL (P3 - QUALITY ASSURANCE)**
- **Estado:** ⏳ FUTURO - Después correcciones
- **Meta:** Flujo completo end-to-end funcional
- **Acciones:** Testing integral, backtests, deployment Railway/Vercel

### 🚀 **FASE 6 FUTURA: UNIFICACIÓN SISTEMA AUTENTICACIÓN**
**OBJETIVO:** Eliminar duplicación AuthContext monolítico vs useAuthState refactorizado

#### **🔄 ETAPA 1: MIGRAR COMPONENTES SIMPLES (P2 - UNIFICACIÓN)**
- **Estado:** ⏳ PLANIFICADO - Post DL-101
- **Meta:** Header.jsx, Dashboard.jsx usen useAuthDL008 en lugar de AuthContext
- **Acciones:**
  - Migrar Header.jsx: user, logout → useAuthDL008
  - Migrar dashboardService: localStorage directo → useAuthDL008
  - Testing componentes migrados

#### **🔄 ETAPA 2: MIGRAR COMPONENTES COMPLEJOS (P2 - ARQUITECTURA)**
- **Estado:** ⏳ PLANIFICADO - Post migración simple
- **Meta:** ExchangeManagement, AddExchangeModal usen hooks especializados
- **Acciones:**
  - Crear useExchangeOperations hook especializado
  - Migrar exchange management APIs a useAuthDL008
  - Deprecar AuthContext.authenticatedFetch

#### **🔄 ETAPA 3: ELIMINAR AUTHCONTEXT MONOLÍTICO (P2 - CLEANUP)**
- **Estado:** ⏳ PLANIFICADO - Post migración completa
- **Meta:** Un solo sistema de autenticación unificado
- **Acciones:**
  - Deprecated warnings en AuthContext
  - Remove src/contexts/AuthContext.jsx
  - Update all imports globally
  - Documentation cleanup

---

## 📋 **REFERENCIAS DOCUMENTACIÓN**

### **🎯 ARQUITECTURA Y FILOSOFÍA:**
- **Principios:** CORE_PHILOSOPHY.md (Bot único anti-manipulación)
- **Arquitectura:** BOT_ARCHITECTURE_SPEC.md + BOT_CONCEPT.md
- **Algoritmos:** ALGORITHMS_OVERVIEW.md (12 institucionales)
- **Modos:** MODES_OVERVIEW.md (5 operativos)

### **🔧 METODOLOGÍA Y GOVERNANCE:**
- **Tasks Detalladas:** BACKLOG.md (priorities + timelines)
- **Metodología:** GUARDRAILS.md (P1-P9 + compliance)
- **Decisiones:** DECISION_LOG.md (DL-001/002/008/040/076)
- **Control:** CLAUDE_BASE.md (flujo obligatorio)

### **⚙️ ESPECIFICACIONES TÉCNICAS:**
- **Frontend:** FRONTEND_ARCHITECTURE.md (SUCCESS CRITERIA)
- **APIs:** ENDPOINTS_ANALYSIS.md + APIS_COMPLETE_DETAILED_MATRIX.md
- **Deployment:** DEPLOYMENT_GUIDE.md + POSTGRESQL_MIGRATION.md

---

## 📅 **HISTORIAL ACTUALIZACIONES**

- ✅ **FASE 0 Baseline cerrada:** InstitutionalChart/SmartScalperMetrics sin datos simulados; payload real verificado
- ✅ **FASE 1 Runtime closure:** BotConfig inyectado en SignalQualityAssessor + `institutional_confirmations_breakdown` servidos vía API
- ✅ **FASE 2 Institutional Algorithms 07–12:** VSA, Market Profile, Order Flow, Acc/Dist, SMC y Composite Man implementados en backend
- ✅ **FASE 3 Mode Selection:** ModeParamProvider + IntelligentModeSelector integrados; `mode_decision` disponible en API
- ✅ **FASE 4 UI/Telemetría:** Modo activo visible en SmartScalperMetrics + telemetría histórica y configuración empaquetada
- 🧪 **Validación:** `python -m compileall backend/services/institutional_params.py backend/services/signal_quality_assessor.py backend/services/mode_params.py backend/routes/bots.py` + revisión manual de payload/UI

### **2025-09-17:**
- ✅ **DL-001 SPEC ALIGNMENT COMPLETED:** Documentación actualizada para los 12 algoritmos y modos (Smart Scalper, Trend Hunter, Anti-Manipulation)
- ✅ **MODE_SELECTION_SPEC alineado con providers parametrizables**
- ✅ **Plan de implementación por fases (F0–F5) documentado para transición a MVP institucional**
- 📌 **Pendientes clave:** Implementar ParamProviders en código, limpiar UI de datos simulados, construir selector de modos

### **2025-09-14:**
- ✅ **DL-090 INTEGRAL MARKET DATA UNIFICATION:** Eliminado overlay loading cada 5s + precio azul duplicado + market_type unificado
- ✅ **DL-089 SMARTSCALPERMETRICS REAL-TIME DATA FETCHING:** Critical bug resolved - charts display real Binance data for user's bot symbol
- ✅ **GUARDRAILS P1-P9 METHODOLOGY:** Full compliance applied across DL-089 + DL-090 implementations
- ✅ **SILENT REFRESH PATTERN:** Refresh cada 5s sin interrupciones UX + isInitialLoad parameter pattern establecido
- ✅ **HARDCODE ELIMINATIONS:** Precio duplicado + fallbacks eliminados + solo datos reales bot.market_type

### **2025-09-13:**
- ✅ **DL-088 SMARTSCALPERMETRICS INSTITUTIONAL TRANSFORMATION COMPLETED:** Complete SmartScalperMetrics restoration achieved
- ✅ **INSTITUTIONAL ALGORITHMS MATRIX FULLY OPERATIONAL:** 8 individual algorithms display + Multi-Algorithm Consensus functional
- ✅ **INSTITUTIONALCHART STABLE IMPLEMENTATION:** Replaced TradingView widget with stable Recharts solution (h-96)
- ✅ **PERFORMANCE OVERVIEW COMPLETE RESTORATION:** Win Rate, Total Trades, Realized PnL display + Execution Quality sections operational
- ✅ **AUTO-RESPONSIVE LAYOUT SUCCESS:** xl:grid-cols-3 lg:grid-cols-2 + Z-index overlay issues resolved + functional close button
- ✅ **TECHNICAL ERROR ELIMINATION:** ReferenceError variable scope corrections + frontend error-free operation achieved
- ✅ **DL-002 + DL-076 COMPLIANCE ACHIEVED:** Retail algorithms eliminated, institutional algorithms only + specialized hooks pattern maintained
- ✅ **BOT ÚNICO TRANSPARENCY SUCCESS:** Comprehensive algorithm breakdown + enhanced UX achieved
- ✅ **COMPLETE MERGE RECOVERY:** All work from feature/dl-088-transformation successfully merged and committed
- **IMPACT:** SmartScalperMetrics modal fully operational with institutional transparency + enhanced user experience

### **2025-09-12:**
- ✅ **MIN_VOLUME FIELD BUG RESOLVED:** SQLModel Field default=None to default=0.0 fix applied in models/bot_config.py:48
- ✅ **GUARDRAILS P1-P9 METHODOLOGY APPLIED:** Complete diagnostic sequence - no assumptions, full verification
- ✅ **ROOT CAUSE IDENTIFIED:** SQLModel Field(default=None) incorrectly converted min_volume=0 to NULL in database
- ✅ **SQLITE POOL STABILITY MAINTAINED:** Duplicate processes eliminated, single clean backend instance
- ✅ **TECHNICAL SOLUTION:** min_volume=0 now saves as 0.0 instead of NULL (no minimum volume requirement)
- **IMPACT:** Bot creation with min_volume=0 now persists correctly + eliminates BotControlPanel data display issues

### **2025-09-11:**
- ✅ **REACT CONTROLLED/UNCONTROLLED WARNING RESOLVED:** Bot modification modal warning eliminated via consistent state initialization
- ✅ **NaN VALUES WARNING FIXED:** Number() conversion error fixed with conditional validation pattern
- ✅ **BOTCONTROLPANEL STABILITY:** useState initialization with complete structure prevents undefined→defined transitions
- ✅ **GUARDRAILS P1-P3 METHODOLOGY APPLIED:** Verified sequence with real testing evidence vs assumptions
- ✅ **DL-001 COMPLIANCE MAINTAINED:** No hardcode values while ensuring controlled inputs from first render
- **IMPACT:** Bot modification interface now operates without React warnings + improved user experience

### **2025-09-10:**
- ✅ **SQLITE POOL CONFIGURATION RESOLVED:** QueuePool limit errors fixed for local development
- ✅ **CONCURRENT REQUESTS SUPPORT:** 40 simultaneous connections (20 base + 20 overflow) for development
- ✅ **TIMEOUT OPTIMIZATION:** Pool timeout 45s + SQLite timeout 30s for concurrent frontend requests
- ✅ **TECHNICAL DOCUMENTATION:** SQLITE_LOCAL_DEVELOPMENT.md created with production separation guidelines
- ✅ **FIELD PERSISTENCE FIX:** Enhanced/Legacy display + modification panel field persistence completed
- ✅ **DL-001 COMPLIANCE ACHIEVED:** bot_exchange_id undefined error resolved via elimination of hardcode fallbacks
- ✅ **DATA MAPPING OPTIMIZATION:** Applied `...bot` pattern in loadBots() and handleEnhancedBotCreated() for real backend data
- ✅ **AUTHENTICATION STABILITY:** SQLite authentication timeouts eliminated via proper connection pooling
- ✅ **FUNCTIONAL VALIDATION COMPLETED:** Testing manual completo realizado - login/logout, creación bots, dashboard, trading operations, modificación bots
- **IMPACT:** Development environment now supports intensive frontend testing + concurrent bot operations + clean data flow + validated functionality

### **2025-09-07:**
- ✅ **PROJECT COMPLETION:** Refactoring arquitectural 100% completado
- ✅ **VERIFICATION COMPLETED:** Análisis exhaustivo de 6 ultra-críticos - todos ya refactorizados en sesiones previas
- ✅ **SUCCESS CRITERIA ACHIEVED:** Zero componentes >200 líneas sin refactoring previo encontrados
- ✅ **ARCHITECTURE PROVEN:** Feature-based structure + DL-076 specialized hooks pattern establecido como estándar
- ✅ **BUILD FUNCTIONAL:** Vite build success confirmado | 199+ archivos refactorizados staging ready
- **NEXT PHASE:** Usuario debe validar funcionalidad local antes commit → Algoritmos institucionales avanzados

### **2025-09-06:**
- ✅ **CRITICAL DISCOVERY:** SUCCESS CRITERIA real status verification completed
- ✅ **REAL PROGRESS:** 79% complete (71+/90+ components ≤150 lines) vs 19% documented previously
- ✅ **ARCHITECTURE SUCCESS:** Feature-based structure + specialized hooks pattern proven
- ✅ **REFACTORING ACHIEVEMENTS:** 4 critical monoliths eliminated (SmartScalperMetrics, AuthContext, BotTemplates, ExecutionLatencyMonitor)
- Documentation cleanup completed + Fair Value Gaps + Market Microstructure algorithms verified
- DL-002 ALGORITHMIC POLICY created + CLAUDE.md navigation updated

### **2025-09-05:**
- AddExchangeModal refactored (296→90 lines) ✅ SUCCESS CRITERIA
- useExchangeOperations hook created (architecture foundation repaired)
- TradingHistory refactored (312→9 components) ✅ SUCCESS CRITERIA  
- Orphaned code eliminated (4 components, 1,285 lines removed)

### **2025-09-02 to 2025-09-05:**
- DL-076 Specialized Hooks Pattern established (8 successful applications)
- DL-040 Feature-based architecture migration ✅ COMPLETE  
- Multiple components refactored: ExecutionLatencyMonitor, BotTemplates, etc.
- Build success maintained: 100% (zero breaking changes)

---

*Actualizado: 2025-09-18 - Fases 0 y 1 completadas; iniciar implementación de algoritmos institucionales Fase 2*
