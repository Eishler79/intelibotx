# BACKLOG.md - Roadmap Reorganizado por Flujo Lógico de Usuario
> **REORGANIZADO:** Según experiencia cronológica del usuario: Login → Crear Bot → Activar → Monitorear → Operar
> **ACTUALIZADO:** 2025-09-19

---

## ✅ Fases Completadas (F0-F4)

### ✅ **Fase 0 - Baseline UI/UX (CERRADO)**
- InstitutionalChart y SmartScalperMetrics solo muestran datos reales
- Eliminados `Math.random()` y fallbacks en flujo operativo

### ✅ **Fase 1 - Parametrización Algoritmos 01-06 (CERRADO)**
- ParamProviders operativos leyendo BotConfig + estadísticas recientes
- `/api/run-smart-trade/{symbol}` expone `institutional_confirmations_breakdown`

### ✅ **Fase 2 - Algoritmos 07-12 (CERRADO)**
- VSA, Market Profile, Order Flow, Acc/Dist, SMC, Composite Man implementados
- DefaultInstitutionalParamProvider extendido

### ✅ **Fase 3 - ModeParamProvider + Selector (CERRADO)**
- IntelligentModeSelector heurístico integrado
- API incluye `mode_decision` (scores, features, confianza)

### ✅ **Fase 4 - UI/Telemetría (CERRADO)**
- SmartScalperMetrics muestra `mode_decision`
- Telemetría histórica en `bot_states.mode_history`

---

## 🔥 **FASE 5 - EXPERIENCIA USUARIO COHERENTE (REORGANIZADA)**

### **🚪 ETAPA 1: ACCESO Y DASHBOARD FUNCIONAL**
**Flujo:** Usuario hace login → Ve dashboard → Sistema estable para crear bots

#### **1.1 Dashboard Sistema Estable (P0 - CRÍTICO)**
- **DL-095: Corregir Dashboard Endpoints 500 Errors**
  - Fix imports en `/backend/routes/dashboard_data.py` (TradingOperation desde models)
  - Eliminar timeouts/AbortError chains que causan logout espontáneo
  - Implementar session management robusto
  - **EVIDENCIA:** Console logs "Load failed", sistema inutilizable

#### **1.2 Autenticación Estable**
- Resolver logout espontáneo por errores backend
- Interceptor debe manejar 500 sin cerrar sesión
- Headers de seguridad compliance

---

### **🤖 ETAPA 2: CREACIÓN Y CONFIGURACIÓN BOT**
**Flujo:** Usuario crea bot → Define parámetros → Parámetros se trasladan automáticamente a análisis

#### **2.1 STRATEGY → ALGORITHM SELECTION ARQUITECTURAL FIX (P0 - CRÍTICO)**
- **DL-102: Conectar BotConfig.strategy con InstitutionalAlgorithmSelector** ✅ **COMPLETADO**
  - "Smart Scalper" → priorizar VSA + OrderBlocks algorithms ✅ DONE
  - "Trend Hunter" → priorizar SMC + MarketProfile algorithms ✅ DONE
  - Modificar `routes/bots.py:204` para usar strategy mapping ✅ DONE
  - Eliminar hardcoded algorithm selection independiente de strategy ✅ DONE
  - **CRÍTICO RESUELTO:** Field mapping disconnection - frontend logs accessing unmapped fields
  - **FIX:** Updated console logs to use correctly mapped field names (algorithm_used vs algorithm_selected)
  - **MÉTODO APLICABLE:** Systematic GUARDRAILS P1-P9 backend-frontend integration diagnosis

#### **2.1.1 MODE SELECTION → ALGORITHM INTEGRATION ARQUITECTURAL FIX (P0 - CRÍTICO) ✅ COMPLETADO**
- **DL-109: Integrar IntelligentModeSelector con AdvancedAlgorithmSelector** ✅ **COMPLETADO 2025-09-20**
  - **PROBLEMA RESUELTO:** Mode Selection ahora ejecuta ANTES de Algorithm Selection
  - **IMPLEMENTACIÓN APLICADA:**
    - ✅ Reordenado ejecución en `routes/bots.py:142-200` - Mode Selection (línea 175) → Algorithm Selection (línea 200)
    - ✅ Modificado `AdvancedAlgorithmSelector.select_optimal_algorithm()` acepta `mode_decision` parameter
    - ✅ Implementado `_apply_mode_algorithm_boost()` method con mode-specific algorithm weighting
    - ✅ Agregado mode-based boosting en `_score_all_algorithms()` pipeline
  - **EVIDENCIA LOGS:** `Mode selector decision for ETHUSDT → SCALPING (confidence 0.57)` ejecutando correctamente
  - **FLUJO CORRECTO IMPLEMENTADO:** Mode Selection → Algorithm Selection con mode-appropriate weights
  - **ARCHIVOS MODIFICADOS:**
    - ✅ `backend/routes/bots.py:142-200` (execution order + mode_decision passing)
    - ✅ `backend/services/advanced_algorithm_selector.py:109,142,565,575` (mode integration)
  - **MÉTODO APLICADO:** GUARDRAILS P1-P9 systematic implementation + verification testing

#### **2.2 MARKET_TYPE → DATA FEEDS ARQUITECTURAL FIX (P0 - CRÍTICO)**
- **DL-103: Conectar BotConfig.market_type con binance_real_data.py**
  - FUTURES_USDT → usar futures/um endpoint
  - SPOT → usar api/v3 endpoint
  - Eliminar hardcoded `interval='15m'` sin market_type consideration
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

#### **3.1 Información Completa en Tabla (P0 - UX CRÍTICO)**
- **DL-094: Agregar Señal Definitiva en Tabla Profesional**
  - Columna "Señal Actual": BUY/SELL/HOLD + confidence
  - Colores: Verde (BUY), Rojo (SELL), Amarillo (HOLD)
  - Columna "Algoritmo Activo": Wyckoff, Market Profile, etc.
  - Columna "Modo IA": SCALPING, TREND_FOLLOWING, etc.

#### **3.2 Estado Bot Persistente (P0 - CRÍTICO)**
- **DL-098: Estado RUNNING/PAUSED Debe Persistir**
  - Navegación no resetea estado (RUNNING → STOPPED bug)
  - updateBot response persistente en base datos
  - State management robusto frontend/backend

---

### **⚡ ETAPA 4: ACTIVACIÓN BOT Y ANÁLISIS AUTOMÁTICO**
**Flujo:** Usuario activa RUNNING → Bot analiza automáticamente → Decisiones IA en background

#### **4.1 Bot Execution Automático (P0 - ARQUITECTURAL CRÍTICO)**
- **DL-093: Background Bot Execution Implementation**
  - **PROBLEMA FUNDAMENTAL:** Bot solo analiza cuando modal abierto
  - Implementar scheduler automático (cada X minutos según timeframe)
  - Separar análisis automático vs visualización manual
  - `execute_real=true` + `signals.signal=BUY/SELL` → operaciones reales

#### **4.2 Live Trading Feed Conectado (P0 - CRÍTICO)**
- **DL-097: Conectar Live Trading Feed**
  - `/api/trading-feed/live` debe mostrar operaciones reales
  - Persistencia `trading_operations` → UI display
  - Feed vacío → operaciones visibles en tiempo real

---

### **🎯 ETAPA 5: VISTA ALGORITMOS AVANZADOS COHERENTE**
**Flujo:** Usuario abre modal → Entiende análisis → Ve decisión lógica → Comprende acción

#### **5.1 Narrativa Lógica Institucional (P0 - UX FUNDAMENTAL)**
- **DL-096: Smart Scalper Modal Información Coherente**
  - **SECUENCIA LÓGICA:**
    1. **Parámetros Bot** (símbolo, timeframe, estrategia seleccionada)
    2. **Análisis Current** (precio real, 12 algoritmos institucionales)
    3. **Decisión IA** (Mode Selection: SCALPING/TREND/etc. con razones)
    4. **Señal Generated** (BUY/SELL/HOLD con confidence y reasoning)
    5. **Acción Tomada** (operación ejecutada o esperando)

#### **5.2 Gráfico Institucional Funcional**
- **DL-101: Panel 12 Algoritmos Completo**
  - Render dinámico `institutional_confirmations_breakdown`
  - Overlays visibles: Order Blocks, Liquidity Grabs, FVG
  - Tooltip explicativo de cada overlay
  - Leyendas solo para series con datos

#### **5.3 Información Comprensible**
- **DL-102: Narrativa UX Explicativa**
  - Features raw → mensajes comprensibles ("Volatilidad alta: ATR 3.2%")
  - Top algoritmos con explicación (no cambios aleatorios)
  - Manipulation alerts → mensajes útiles, no números crudos
  - Smart Money Summary → contexto claro ("Esperando confirmación institucional")

---

### **📈 ETAPA 6: PERFORMANCE Y MONITOREO**
**Flujo:** Usuario ve resultados → Evalúa rendimiento → Toma decisiones sobre bot

#### **6.1 Métricas Rendimiento Restauradas (P1 - FUNCIONALIDAD PERDIDA)**
- **DL-099: Reintegrar Performance Overview + Execution Quality**
  - Performance Overview: win rate, total trades, PnL realized
  - Execution Quality: latencia, success rate, slippage
  - Ubicación: SmartScalperMetrics modal o nueva sección
  - Histórico performance trends

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

## 🚀 **FASE 6 - UNIFICACIÓN SISTEMA AUTENTICACIÓN (PLANIFICADO)**

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

## 🚀 **FASE 7 - FRONTEND ARCHITECTURE COMPONENT PARITY (EN DESARROLLO)**

### **CONTEXTO:**
- **Problema:** Solo Smart Scalper tiene componente dedicado, otras estrategias usan AdvancedMetrics genérico
- **Objetivo:** Cada estrategia con su propia arquitectura frontend especializada
- **Base:** TrendHunterMetrics completado como modelo

### **📋 TAREAS PENDIENTES:**

#### **ETAPA 1: COMPONENTES STRATEGY-SPECIFIC**
- [x] **TrendHunterMetrics component** ✅ **COMPLETADO 2025-09-20**
  - ✅ Creado `/frontend/src/components/TrendHunterMetrics.jsx`
  - ✅ Creado `/frontend/src/features/dashboard/components/TrendHunterAnalysisPanel.jsx`
  - ✅ Creado `/frontend/src/features/dashboard/components/TrendHunterPerformanceView.jsx`
  - ✅ Integrado en `BotsAdvanced.jsx` con routing condicional
  - ✅ Backend integration via `/api/run-smart-trade/{symbol}?trend_mode=true`

- [ ] **ManipulationDetectorMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/ManipulationDetectorMetrics.jsx`
  - Crear panels: `ManipulationDetectorAnalysisPanel.jsx`, `ManipulationDetectorPerformanceView.jsx`
  - Integrar en `BotsAdvanced.jsx` routing
  - Backend: `/api/run-smart-trade/{symbol}?anti_manipulation_mode=true`

- [ ] **NewsAnalyzerMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/NewsAnalyzerMetrics.jsx`
  - Crear panels: `NewsAnalyzerAnalysisPanel.jsx`, `NewsAnalyzerPerformanceView.jsx`
  - Integrar en `BotsAdvanced.jsx` routing
  - Backend: `/api/run-smart-trade/{symbol}?news_sentiment_mode=true`

- [ ] **VolatilityAdaptiveMetrics component** ⏳ **PENDIENTE**
  - Crear `/frontend/src/components/VolatilityAdaptiveMetrics.jsx`
  - Crear panels: `VolatilityAdaptiveAnalysisPanel.jsx`, `VolatilityAdaptivePerformanceView.jsx`
  - Integrar en `BotsAdvanced.jsx` routing
  - Backend: `/api/run-smart-trade/{symbol}?volatility_adaptive_mode=true`

### **PRIORIDAD:** P1 (Architecture consistency)
### **ESTIMACIÓN:** 1-2 sesiones
### **SPEC_REF:** FRONTEND_ARCHITECTURE.md + Strategy-specific docs

---

*Actualizado: 2025-09-20 - Post DL-101 useAuthState localStorage implementation + TrendHunterMetrics completion*
*Reorganizado: Flujo lógico experiencia usuario + migración sistema auth + component parity*
*Metodología: GUARDRAILS P1-P9 + User Journey Mapping*