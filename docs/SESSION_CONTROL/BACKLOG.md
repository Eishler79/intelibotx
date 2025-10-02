# BACKLOG.md - Tareas Pendientes InteliBotX
> **PROPÓSITO:** Solo tareas pendientes por resolver - NO status de proyecto
> **ACTUALIZADO:** 2025-09-26
> **NOTA:** Para status del proyecto ver MASTER_PLAN.md

---

## 🔄 **PROCESO EN CURSO - SESIÓN 2025-09-26**
> **Estado:** Carga inicial CLAUDE.md completada
> **Actividad:** Esperando instrucciones para tareas del día

---

## ✅ **TAREAS COMPLETADAS RECIENTEMENTE**

### **DL-110: Multiple API Calls Control** ✅ **RESUELTO 2025-09-23**
- **PROBLEMA:** 4-6 llamadas API simultáneas por apertura de modal Smart Scalper
- **SOLUCIÓN IMPLEMENTADA:**
  - Frontend: useRef control + validación RUNNING + cooldown + deps 6→3
  - Backend: ServiceFactory singleton + Execution Gate 60% + validaciones defensivas
- **RESULTADO:** Reducido a 1-2 llamadas + protección institucional activa
- **DOCUMENTACIÓN:** DECISION_LOG.md#DL-110 completo con detalles técnicos

---

## 🔥 **TAREAS CRÍTICAS P0 - SISTEMA INOPERATIVO**

### **📋 TAREAS INMEDIATAS P0**

#### **✅ DL-120 (antes DL-112): Database SQLite Workaround** ✅ **WONTFIX - WORKAROUND APLICADO**
- **DECISIÓN:** No modificar get_session() - riesgo en 212+ endpoints
- **WORKAROUND EFECTIVO:**
  ```bash
  # Cuando aparezca "QueuePool limit reached":
  pkill -f "python.*main.py"
  cd backend && python main.py
  ```
- **MEJORES PRÁCTICAS LOCAL:**
  - Solo 1 bot a la vez (máximo 2)
  - Reducir frecuencia análisis a 60s
  - Mantener bots en STOPPED cuando no se prueban
- **PRODUCCIÓN:** PostgreSQL en Railway NO tiene este problema
- **STATUS:** WONTFIX por riesgo/beneficio - Workaround documentado
- **DOCUMENTACIÓN:** DECISION_LOG.md#DL-120

#### **TrendHunterMetricsComplete.jsx - Aplicar mismo fix DL-110** ⚠️ **PENDIENTE**
- **PROBLEMA:** Mismo issue de múltiples API calls que SmartScalperMetrics
- **SOLUCIÓN:** Aplicar mismo patrón: useRef + validación RUNNING + cooldown
- **ARCHIVO:** `/frontend/src/components/TrendHunterMetricsComplete.jsx`
- **TIEMPO:** 30 minutos

- **IMPACTO MEDIDO DL-110 (ANTES DEL FIX):**
  - 5,760 API calls/hora vs 1,440 necesarias (300% overhead)

#### **🔄 DL-113: UNIFICACIÓN FUENTE DE DATOS (GRÁFICOS vs ANÁLISIS)** ⚠️ **STAND BY**
- **PROBLEMA DETECTADO:** Inconsistencia arquitectónica crítica
  - Gráficos usan `/api/market-data` (puede mostrar SPOT)
  - Análisis usa `/api/run-smart-trade` (usa FUTURES correcto del bot)
  - Usuario ve gráfico SPOT pero bot opera FUTURES = CONFUSIÓN TOTAL
- **SOLUCIÓN PROPUESTA:**
  - Gráficos deben nutrirse de `/api/run-smart-trade`
  - Una sola fuente de verdad para visualización y análisis
  - Usuario ve EXACTAMENTE lo que el bot está analizando
- **IMPLICACIONES:**
  - Eliminar redundancia `/api/market-data` (o convertir en proxy)
  - Refactorizar SmartScalperMetrics, BotsAdvanced, useRealTimeData
  - Asegurar que gráficos usen mismo market_type que análisis
- **INSUMO PARA:** Refactorización completa algoritmos Smart Scalper
- **STATUS:** STAND BY - Requiere diseño arquitectónico profundo
- **PRIORIDAD:** P1 - Afecta coherencia pero sistema funciona
  - 34,560 inicializaciones servicios/hora innecesarias
  - 60MB RAM + 800KB network por modal desperdiciados
- **ESTIMACIÓN TOTAL:** 8-12 horas de implementación
- **PRIORIDAD:** P0 - Sistema consumiendo 3x recursos necesarios


#### **⏸️ DL-103: Market Type Data Feeds** ⏸️ **STAND BY**
- **STATUS ACTUAL:**
  - ✅ `run-smart-trade` YA usa market_type correcto (routes/bots.py:376-377)
  - ✅ ServiceFactory YA recibe bot_config (service_factory.py:26-40)
  - ⏸️ 3 endpoints frontend pendientes (market-data, real-indicators, user/technical-analysis)
- **DECISIÓN:** STAND BY - Se abordará junto con DL-113 (unificación fuente de datos)
- **RAZÓN:** Mejor refactorizar todo junto cuando se unifiquen gráficos con análisis
- **PRIORIDAD:** STAND BY - No crítico, sistema funciona
- **DOCUMENTACIÓN:** DECISION_LOG.md#DL-103


### **🚪 ETAPA 1: ACCESO Y DASHBOARD FUNCIONAL**
**Flujo:** Usuario hace login → Ve dashboard → Sistema estable para crear bots


#### **1.2 Autenticación Estable**
- Resolver logout espontáneo por errores backend
- Interceptor debe manejar 500 sin cerrar sesión
- Headers de seguridad compliance

#### **1.3 WebSocket DL-002 Compliance Crítico (P0 - SEGURIDAD)**
- **DL-110: Migrar binance_websocket_service.py a algoritmos institucionales**
  - **PROBLEMA CRÍTICO:** WebSocket usa SmartScalperEngine con algoritmos retail (RSI/MACD/EMA)
  - **VIOLACIÓN DL-002:** Sistema tiempo real contradice filosofía institucional
  - **ACCIÓN REQUERIDA:**
    - Reemplazar `SmartScalperEngine` con servicios institucionales
    - Actualizar `RealtimeTechnicalIndicators` eliminar RSI/MACD/EMA retail
    - Integrar `SignalQualityAssessor` + `InstitutionalDetector` en WebSocket
    - Actualizar `realtime_data_manager.py` para compliance institucional
  - **ARCHIVOS AFECTADOS:**
    - `backend/services/binance_websocket_service.py:28,94,222`
    - `backend/services/realtime_data_manager.py:19,87,98`
  - **EVIDENCIA:** SmartScalperEngine deprecado 2025-09-22 pero WebSocket aún lo referencia
  - **IMPACTO:** Sistema dual contradictorio (institucional + retail simultáneo)

---

### **🤖 ETAPA 2: CREACIÓN Y CONFIGURACIÓN BOT**
**Flujo:** Usuario crea bot → Define parámetros → Parámetros se trasladan automáticamente a análisis

#### **2.1 DL-109: MODE SELECTION → ALGORITHM INTEGRATION** 🔧 **EN IMPLEMENTACIÓN**
- **PROBLEMA:** Frontend recibe mode_decision: undefined
- **SOLUCIÓN:** 5 cambios documentados en DECISION_LOG.md#DL-109
- **Archivo:** `/backend/routes/bots.py` (5 puntos de cambio)
- **Estado:** Implementación iniciada 2025-09-23
- **Tiempo estimado:** 10 minutos

#### **2.2 MARKET_TYPE → DATA FEEDS ARQUITECTURAL FIX (P0 - CRÍTICO)**
- **DL-103: Conectar BotConfig.market_type con binance_real_data.py**
  - FUTURES_USDT → usar futures/um endpoint
  - SPOT → usar api/v3 endpoint
  - Eliminar hardcoded `interval='15m'` sin market_type consideration

  **🚨 CASOS EXCEPCIONALES DETECTADOS (2025-09-22):**
  - **ANTI-PATRÓN:** Aplicación parches/wrappers en lugar de solución arquitectural
  - **VIOLACIÓN DETECTADA:** Agregar parámetros a funciones existentes (wrapper approach)
  - **ROLLBACK EJECUTADO:** Reverted patches - maintain architectural integrity
  - **SOLUCIÓN REQUERIDA:** Dependency injection en constructor, NO function parameters
  - **APRENDIZAJE:** GUARDRAILS P1-P9 debe detectar anti-patrones antes de implementación

  - Modificar `real_trading_engine.py:245` eliminar hardcoded `market_type='spot'`
  - **EVIDENCIA:** Línea 99 binance_real_data.py ignora market_type

#### **2.3 RISK_PROFILE → MODE SELECTION ARQUITECTURAL FIX (P0 - CRÍTICO)**
- **DL-104: Extender DefaultModeParamProvider con risk_profile awareness**
  - CONSERVATIVE → reducir volatility thresholds, aumentar manipulation weights
  - AGGRESSIVE → aumentar volatility thresholds, reducir safety margins
  - Modificar `mode_params.py:52` para acceder bot_config.risk_profile
  - **EVIDENCIA:** Mode Selection ignora risk_profile usuario completamente

#### **2.4 TP/SL → SIGNAL CALCULATION ARQUITECTURAL FIX (P0 - CRÍTICO)**
- **DL-105: Integrar BotConfig TP/SL en signal confidence calculation**
  - take_profit/stop_loss usuario debe afectar algorithm confidence
  - Modificar `institutional_params.py` para usar risk tolerancia
  - Ajustar signal generation considerando user risk parameters
  - **EVIDENCIA:** Línea 328 routes/bots.py usa confidence genérico

#### **2.5 LEVERAGE/FUTURES → ANALYSIS ARQUITECTURAL FIX (P1 - ALTA)**
- **DL-106: Extender DefaultInstitutionalParamProvider con leverage awareness**
  - Cálculo riesgo debe considerar apalancamiento real
  - margin_type (CROSS/ISOLATED) debe afectar algoritmos margin-sensitive
  - **EVIDENCIA:** institutional_params.py sin referencias leverage/margin

#### **2.6 ORDER_TYPES → EXECUTION ENGINE ARQUITECTURAL FIX (P1 - ALTA)**
- **DL-107: Conectar BotConfig order types con trading engine**
  - entry_order_type/exit_order_type usuario debe usarse en execution
  - Eliminar hardcoded order types en real_trading_engine.py
  - **EVIDENCIA:** Hardcoded MARKET orders independiente configuración

#### **2.7 COOLDOWN → EXECUTION FREQUENCY ARQUITECTURAL FIX (P1 - ALTA)**
- **DL-108: Implementar cooldown enforcement en bot execution**
  - Sistema no debe generar señales más rápido que cooldown_minutes
  - Validar frecuencia análisis respeta configuración usuario
  - **EVIDENCIA:** Análisis ejecuta cada modal abierto, ignora cooldown

---

### **📊 ETAPA 3: TABLA PROFESIONAL BOTS INFORMATIVA**
**Flujo:** Usuario ve tabla → Comprende estado/señal actual → Toma decisiones informadas

#### **3.1 DL-094: Señal Definitiva en Tabla (P0 - UX CRÍTICO)** ❌ **PENDIENTE**
- **PROBLEMA:** Tabla de bots no muestra información crítica de trading
- **FALTANTE:**
  - Columna "Señal Actual": BUY/SELL/HOLD + confidence %
  - Colores visuales: Verde (BUY), Rojo (SELL), Amarillo (HOLD)
  - Columna "Algoritmo Activo": Wyckoff, Market Profile, etc.
  - Columna "Modo IA": SCALPING, TREND_FOLLOWING, etc.
- **ARCHIVO:** `/frontend/src/pages/BotsModular.jsx` (ACTIVO) o `/frontend/src/features/bots/components/BotsTableSection.jsx`
- **IMPACTO:** Usuario no puede tomar decisiones informadas


---

### **⚡ ETAPA 4: ACTIVACIÓN BOT Y ANÁLISIS AUTOMÁTICO**
**Flujo:** Usuario activa RUNNING → Bot analiza automáticamente → Decisiones IA en background

#### **4.1 Bot Execution Automático ✅ RESUELTO**
- **DL-093: Background Bot Execution** ✅ **RESUELTO 2025-09-24**
  - Bot ya ejecuta análisis automáticamente cuando está RUNNING
  - No requiere modal abierto para funcionar
  - APIs correctamente asignadas (background vs UI)

#### **4.2 DL-097: Live Trading Feed (P0 - CRÍTICO)** ❌ **PENDIENTE**
- **PROBLEMA:** `/api/trading-feed/live` retorna feed vacío
- **REQUERIDO:**
  - Conectar operaciones reales → UI display tiempo real
  - Persistencia `trading_operations` → visualización
  - WebSocket para updates en tiempo real
- **ARCHIVO:** `/backend/routes/trading_feed.py`
- **IMPACTO:** Usuario no ve operaciones ejecutadas

---

### **🎯 ETAPA 5: VISTA ALGORITMOS AVANZADOS COHERENTE**
**Flujo:** Usuario abre modal → Entiende análisis → Ve decisión lógica → Comprende acción

#### **5.1 DL-096: Smart Scalper Modal Coherente (P0 - UX FUNDAMENTAL)** ❌ **PENDIENTE**
- **PROBLEMA:** Información fragmentada y confusa en modal
- **REQUERIDO - SECUENCIA LÓGICA:**
  1. **Parámetros Bot** (símbolo, timeframe, estrategia seleccionada)
  2. **Análisis Current** (precio real, 12 algoritmos institucionales)
  3. **Decisión IA** (Mode Selection: SCALPING/TREND/etc. con razones)
  4. **Señal Generated** (BUY/SELL/HOLD con confidence y reasoning)
  5. **Acción Tomada** (operación ejecutada o esperando)
- **ARCHIVO:** `/frontend/src/components/SmartScalperMetricsComplete.jsx`
- **TARGET:** Narrativa institucional clara y comprensible

#### **5.2 DL-101: Panel 12 Algoritmos Completo (P1)** ❌ **PENDIENTE**
- **PROBLEMA:** Panel de algoritmos incompleto y sin overlays
- **FALTANTE:**
  - Render dinámico `institutional_confirmations_breakdown`
  - Overlays visuales: solo 3/6 funcionando (Order Blocks, Liquidity Grabs, Stop Hunting)
  - Faltantes: FVG, Market Microstructure, Wyckoff overlays
  - Tooltip explicativo de cada overlay
  - Leyendas dinámicas solo para series con datos
- **ARCHIVO:** `/frontend/src/components/SmartScalperMetricsComplete.jsx`
- **IMPACTO:** Visualización incompleta de análisis institucional

#### **5.3 DL-102: Narrativa UX Explicativa (P1)** ❌ **PENDIENTE**
- **PROBLEMA:** Features técnicas sin traducción comprensible
- **REQUERIDO:**
  - Features raw → mensajes comprensibles ("Volatilidad alta: ATR 3.2%")
  - Top algoritmos con explicación consistente
  - Manipulation alerts → mensajes útiles, no números crudos
  - Smart Money Summary → contexto claro ("Esperando confirmación institucional")
- **ARCHIVO:** `/frontend/src/components/SmartScalperMetricsComplete.jsx`
- **IMPACTO:** Usuario no comprende análisis técnico

---

### **📈 ETAPA 6: PERFORMANCE Y MONITOREO**
**Flujo:** Usuario ve resultados → Evalúa rendimiento → Toma decisiones sobre bot

#### **6.1 DL-099: Performance Metrics Restoration (P1)** ❌ **PENDIENTE**
- **PROBLEMA:** Componentes de performance eliminados/perdidos
- **FALTANTE:**
  - Performance Overview: win rate, total trades, PnL realized
  - Execution Quality: latencia, success rate, slippage
  - Histórico de performance trends
  - Gráficos de evolución rendimiento
- **UBICACIÓN:** SmartScalperMetrics modal o nueva sección dedicada
- **ARCHIVOS:**
  - `/frontend/src/components/SmartScalperMetricsComplete.jsx`
  - `/frontend/src/features/dashboard/components/PerformanceOverview.jsx` (crear)
- **IMPACTO:** Usuario no puede evaluar efectividad del bot

#### **6.2 Historial Operaciones Completo**
- Tabla operaciones recientes con: fecha/hora, side, precio, PnL, reasoning
- Conectar `getBotTradingOperations` con UI display
- "Sin operaciones" → explicar criterios no cumplidos

---

### **📊 ETAPA 7: DATASETS Y TELEMETRÍA**
**Flujo:** Sistema captura datos → Análisis ML → Mejora continua IA

#### **7.1 Dataset Collection Clean**
- Mantener `DATASET_SNAPSHOT` con datos institucionales
- Export CSV/endpoint: `institutional_confirmations`, `mode_decision`, `signals.reason`
- Limpiar console.log residuales para dataset usable

#### **7.2 ML Learning Integration**
- Capturar decisiones vs resultados para IA improvement
- Mode Selection learning de performance real
- Algorithm weighting adjustment basado en success rate

---

### **🔧 ETAPA 8: VALIDACIÓN Y DEPLOYMENT**

#### **8.1 Testing Integral**
- Ejecutar simulaciones/backtests con correcciones
- Validar flujo completo: crear bot → activar → operar → resultados
- QA proceso usuario real end-to-end

#### **8.2 Production Deployment**
- Pruebas latencia Railway/Vercel después validación local
- Check-list testnet deployment (DL-001/002/076 compliance)
- Rollback plan documentado

---

## 🎯 **ORDEN DE EJECUCIÓN CRONOLÓGICO**

1. **ETAPA 1** → Dashboard funcional (base para todo)
2. **ETAPA 2** → Parámetros bot coherentes
3. **ETAPA 3** → Tabla profesional informativa
4. **ETAPA 4** → Bot execution automático
5. **ETAPA 5** → Vista algoritmos coherente
6. **ETAPA 6** → Performance monitoring
7. **ETAPA 7** → Datasets/telemetría
8. **ETAPA 8** → Validación final

---

## 🚀 **TAREAS FUTURAS PLANIFICADAS**

### **FASE 6 - UNIFICACIÓN SISTEMA AUTENTICACIÓN**

### **CONTEXTO:**
- **Problema:** Sistema dividido entre AuthContext monolítico (Header, ExchangeManagement, Dashboard) y useAuthState refactorizado (EnhancedBotCreationModal, BotsAdvanced, SmartScalperMetricsComplete)
- **Objetivo:** Un solo sistema de autenticación unificado y consistente
- **Base:** DL-101 useAuthState localStorage implementation completado

### **📋 TAREAS PENDIENTES:**

#### **ETAPA 1: MIGRAR COMPONENTES SIMPLES**
- [ ] **Migrar Header.jsx a useAuthDL008**
  - Cambiar `useAuth()` → `useAuthDL008()`
  - Mantener funcionalidad: user, logout
  - Testing: navegación, logout funcional

- [ ] **Migrar Dashboard.jsx a useAuthDL008**
  - Cambiar dashboardService localStorage directo → useAuthDL008.authenticatedFetch
  - Actualizar useDashboardData hook
  - Testing: métricas dashboard, datos tiempo real

#### **ETAPA 2: MIGRAR COMPONENTES COMPLEJOS**
- [ ] **Crear useExchangeOperations hook especializado**
  - Extraer exchange management de AuthContext
  - Usar useAuthDL008 internamente
  - Mantener API: addExchange, deleteExchange, testConnection

- [ ] **Migrar ExchangeManagement.jsx**
  - Usar useExchangeOperations en lugar de AuthContext
  - Testing: CRUD exchanges, conexión testing

- [ ] **Migrar AddExchangeModal.jsx**
  - Usar useExchangeOperations para API calls
  - Testing: creación, validación, testing conexión

#### **ETAPA 3: ELIMINACIÓN AUTHCONTEXT MONOLÍTICO**
- [ ] **Deprecation warnings**
  - Agregar console.warn en AuthContext methods
  - Documentation sobre migración

- [ ] **Remove AuthContext.jsx**
  - Eliminar src/contexts/AuthContext.jsx
  - Update imports across codebase
  - Remove from App.jsx provider

- [ ] **Documentation cleanup**
  - Update DECISION_LOG.md con migración completa
  - Update MASTER_PLAN.md estado final
  - Update arquitectura docs

### **PRIORIDAD:** P2 (Post FASE 5 completion)
### **ESTIMACIÓN:** 2-3 sesiones
### **SPEC_REF:** DL-101 + MASTER_PLAN.md#FASE-6

---

### **DL-121: LatencyMonitor Critical Component Reintegration** ⏳ **PENDIENTE P1**
- **PROBLEMA DETECTADO:** LatencyMonitor desconectado, usa Math.random(), 1000+ líneas sin usar
- **PROPÓSITO ORIGINAL:** Monitor crítico para estrategias scalping con requisito <50ms latencia
- **ECOSISTEMA:** 11+ archivos, 4 hooks, 5 componentes UI, servicios backend existentes
- **DECISIÓN:** Reintegrar después de completar migración BotsAdvanced + 6 algoritmos
- **PLAN IMPLEMENTACIÓN:**
  - Eliminar Math.random() (5 lugares: líneas 95, 96, 106, 107, 118)
  - Conectar `/api/bots/{bot_id}/execution-summary` real
  - Integrar en dashboard principal con métricas críticas
  - Validar latencia <50ms para scalping operations
- **RIESGOS SIN IMPLEMENTAR:**
  - Scalping operando ciego sin métricas latencia
  - Slippage no detectado en ejecuciones críticas
  - Stop losses retrasados por latencia desconocida
- **ARCHIVOS AFECTADOS:**
  - `/frontend/src/components/LatencyMonitor.jsx` (386 líneas)
  - `/backend/routes/execution_metrics.py` (endpoints existentes)
  - 9+ archivos adicionales del ecosistema
- **PRIORIDAD:** P1 después de migración actual
- **ESTIMACIÓN:** 2-3 días refactorización completa
- **SPEC_REF:** DECISION_LOG.md#DL-121

### **FASE 7 - FRONTEND ARCHITECTURE COMPONENT PARITY**

#### **COMPONENTES STRATEGY-SPECIFIC PENDIENTES:**

- [ ] **ManipulationDetectorMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/ManipulationDetectorMetrics.jsx`
  - Crear panels: `ManipulationDetectorAnalysisPanel.jsx`, `ManipulationDetectorPerformanceView.jsx`
  - Integrar en `BotsModular.jsx` routing (ACTIVO) o `BotsDetailsModal.jsx`
  - Backend: `/api/run-smart-trade/{symbol}?anti_manipulation_mode=true`

- [ ] **NewsAnalyzerMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/NewsAnalyzerMetrics.jsx`
  - Crear panels: `NewsAnalyzerAnalysisPanel.jsx`, `NewsAnalyzerPerformanceView.jsx`
  - Integrar en `BotsModular.jsx` routing (ACTIVO) o `BotsDetailsModal.jsx`
  - Backend: `/api/run-smart-trade/{symbol}?news_sentiment_mode=true`

- [ ] **VolatilityAdaptiveMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/VolatilityAdaptiveMetrics.jsx`
  - Crear panels: `VolatilityAdaptiveAnalysisPanel.jsx`, `VolatilityAdaptivePerformanceView.jsx`
  - Integrar en `BotsModular.jsx` routing (ACTIVO) o `BotsDetailsModal.jsx`
  - Backend: `/api/run-smart-trade/{symbol}?volatility_adaptive_mode=true`

### **PRIORIDAD:** P1 (Architecture consistency)
### **ESTIMACIÓN:** 1-2 sesiones
### **SPEC_REF:** FRONTEND_ARCHITECTURE.md + Strategy-specific docs

---

---

## 🔥 **SMART SCALPER - PENDIENTES CRÍTICOS**

### **📋 ISSUES TÉCNICOS PENDIENTES:**

#### **2. DL-110: WebSocket SmartScalperEngine Deprecation** ❌ **PENDIENTE CRÍTICO**
- **VIOLACIÓN DL-002:** WebSocket usa algoritmos retail (RSI/MACD/EMA)
- **ARCHIVO:** `/backend/services/binance_websocket_service.py:28`
- **EVIDENCIA:** `from services.smart_scalper_algorithms import SmartScalperEngine`
- **ACCIÓN:** Reemplazar con SignalQualityAssessor + InstitutionalDetector
- **PRIORIDAD:** P0 - Compliance crítico

#### **3. Bot_Config Services Disconnection** ❌ **PENDIENTE ARQUITECTURAL**
- **PROBLEMA:** Servicios inicializados sin parámetros bot_config
- **ARCHIVO:** `/backend/routes/bots.py:51-56`
- **EVIDENCIA CÓDIGO:**
  ```python
  # ACTUAL (BROKEN):
  binance_service = BinanceRealDataService()           # Sin market_type
  selector = AdvancedAlgorithmSelector()               # Sin risk_profile
  mode_selector = IntelligentModeSelector()            # Sin parámetros
  ```
- **REQUERIDO:** Pasar bot_config parameters a todos los services
- **IMPACTO:** DL-103 a DL-108 todos afectados

#### **4. SmartScalperMetricsComplete.jsx Component Size** ❌ **PENDIENTE DL-076**
- **VIOLACIÓN:** 723 lines > 150 lines máximo (DL-076)
- **ARCHIVO:** `/frontend/src/components/SmartScalperMetricsComplete.jsx`
- **REQUERIDO:** Refactor con specialized hooks pattern
- **TARGET:** Múltiples components <150 lines cada uno

#### **5. Missing Institutional Algorithms** ❌ **PENDIENTE 11/12**
- **IMPLEMENTADO 100%:** Wyckoff (DL-113 completado 2025-09-26)
- **PENDIENTES:** Order Blocks, Liquidity Grabs, Stop Hunting, FVG, Market Microstructure, VSA, Market Profile, SMC, Order Flow, A/D, Composite Man
- **ARCHIVO:** `/backend/services/signal_quality_assessor.py`
- **NOTA:** Stubs pueden existir en código pero NO están operativos
- **META:** 12/12 algoritmos institucionales completos siguiendo metodología DL-113

#### **6. Algorithm Selection Scope Limited** ❌ **PENDIENTE P1**
- **PROBLEMA:** Solo 3 algoritmos aparecen vs 8-12 esperados
- **APARECEN:** wyckoff_spring, stop_hunt_reversal, fair_value_gap
- **FALTANTES:** liquidity_grab_fade, order_block_retest, ma_alignment, volume_breakout, higher_high_formation
- **ARCHIVO:** `/backend/services/advanced_algorithm_selector.py:189-244`
- **CAUSA:** Incomplete algorithm_characteristics registry
- **EVIDENCIA:** algorithm_characteristics solo define 4/8 algorithms

#### **7. RuntimeWarning Signal Quality** ❌ **PENDIENTE P2**
- **PROBLEMA:** `Mean of empty slice` warnings en signal analysis
- **ARCHIVO:** `/backend/services/signal_quality_assessor.py:275,289`
- **CAUSA:** Array division por volumes vacíos
- **IMPACTO:** Datos institucionales inconsistentes

#### **8. Consenso 3/6 Algorithm Confirmation NO IMPLEMENTADO** ❌ **PENDIENTE P1**
- **PROBLEMA:** Regla documentada "minimum N/6 algorithm confirmation" no implementada
- **SPEC_REF:** `SCALPING_MODE.md#multi-algorithm-confirmation` líneas 164-167
- **FALTANTE:** Lógica explícita consenso 3/6 confirmations ≥ 70%
- **ARCHIVO:** `/backend/services/signal_quality_assessor.py`
- **IMPACTO:** Sistema no respeta regla fundamental Smart Scalper

#### **9. VSA + Market Profile Implementation** ❌ **PENDIENTE P0**
- **PROBLEMA:** Algoritmos 7-8/12 requeridos para Smart Scalper no implementados
- **SPEC_REF:** `OPTIMIZATION_MODE_INTELL.md#p2-p3` + `SCALPING_MODE_SPEC.md#fase-2`
- **FALTANTES:** Volume Spread Analysis (VSA) + Market Profile Dedicated Analyzer
- **IMPACTO:** Smart Scalper incompleto según especificaciones técnicas

### **📋 PENDIENTES FUNCIONALIDAD P1:**

#### **5. DL-096: Smart Scalper Modal Coherente** ❌ **PENDIENTE UX**
- **SECUENCIA FALTANTE:** Parámetros → Análisis → Decisión → Señal → Acción
- **ACTUAL:** Información fragmentada y confusa
- **TARGET:** Narrativa lógica institucional clara

#### **6. DL-099: Performance Metrics Restoration** ❌ **PENDIENTE**
- **PERDIDO:** Performance Overview + Execution Quality
- **TARGET:** Win rate, total trades, PnL, latencia, success rate
- **UBICACIÓN:** SmartScalperMetrics modal integration

#### **7. DL-093: Background Bot Execution** ✅ **RESUELTO 2025-09-24**
- Bot ejecuta análisis automáticamente cuando RUNNING
- No requiere modal abierto
- APIs correctamente asignadas

#### **8. DL-097: Live Trading Feed** ❌ **PENDIENTE**
- **PROBLEMA:** `/api/trading-feed/live` feed vacío
- **REQUERIDO:** Operaciones reales → UI display tiempo real
- **TARGET:** Persistencia trading_operations visible

### **ESTIMACIÓN TOTAL PENDIENTES:**
- **P0 Críticos:** 4 tareas, 10-14 días
- **P1 Funcionalidad:** 7 tareas, 12-18 días
- **P2 Optimización:** 1 tarea, 1-2 días
- **TOTAL SMART SCALPER:** 23-34 días trabajo real

---

*Actualizado: 2025-09-24 - Resueltos: DL-109, DL-110, Network Tab Visibility*
*Para status del proyecto y fases completadas ver: MASTER_PLAN.md*
*Metodología: GUARDRAILS P1-P9 + User Journey Mapping + Code Verification*