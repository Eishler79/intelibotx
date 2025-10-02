# 07_ALGORITHMS_VISUALIZATION_ARCHITECTURE - Visualización Algoritmos Institucionales

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN**
> **Actualizado:** 2025-10-02
> **Estado:** 🔴 PARCIAL (Solo Wyckoff visualizado, 11 algoritmos pendientes)
> **Prioridad:** 🔥 CRÍTICA - CORE FEATURE

---

## 📋 **ÍNDICE**

1. [Arquitectura Actual vs Objetivo](#arquitectura-actual-vs-objetivo)
2. [Componentes Técnicos](#componentes-técnicos)
3. [Flujo de Datos E2E](#flujo-de-datos-e2e)
4. [Integración](#integración)
5. [Diseño UX/UI](#diseño-uxui)
6. [Issues Identificados](#issues-identificados)
7. [Plan Corrección](#plan-corrección)

---

## 📊 **ARQUITECTURA ACTUAL VS OBJETIVO**

### **🔴 ARQUITECTURA ACTUAL (Estado Real 2025-10-02)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Bots Panel)                          │
│  Navegación: Lateral → Bots → Seleccionar Bot → Ver Algoritmos │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Click ícono 👁️ "Ver Detalles"
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│               FRONTEND - React 18 + TypeScript                   │
│                                                                   │
│  📁 /components/AdvancedMetrics.jsx (650 líneas) ⚠️              │
│  ├─ Componente modal visualización algoritmos                    │
│  ├─ PROBLEMA DL-076: 650 líneas (viola <150 líneas)              │
│  ├─ AlgorithmBreakdown component interno (línea 450-500)         │
│  └─ ✅ DL-001 compliant: Sin Math.random()                       │
│                                                                   │
│  📁 /components/InstitutionalChart.jsx (108 líneas) ✅           │
│  ├─ Gráfico TradingView institucional                            │
│  ├─ DL-076 compliant (<150 líneas)                               │
│  └─ Integración señales algoritmos en gráfico                    │
│                                                                   │
│  📁 /features/bots/hooks/useBotMetrics.js (78 líneas)            │
│  ├─ Hook obtención métricas algoritmos                           │
│  ├─ GET /api/bots/{id}/metrics                                   │
│  └─ Real-time polling metrics actualización                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ GET /api/bots/{id}/metrics
                       │ Response: { wyckoff, order_blocks, ... }
┌──────────────────────▼──────────────────────────────────────────┐
│               BACKEND - FastAPI + Python 3.11                    │
│                                                                   │
│  📁 /routes/bots.py (374 líneas)                                 │
│  ├─ GET /api/bots/{id}/metrics                                   │
│  ├─ ✅ DL-008: get_current_user_safe()                           │
│  └─ Retorna métricas institucionales por bot                     │
│                                                                   │
│  📁 /routes/real_trading_routes.py (486 líneas)                  │
│  ├─ POST /api/run-smart-trade/{symbol}                           │
│  ├─ Ejecuta análisis Smart Money completo                        │
│  └─ ✅ Wyckoff integrado (1/12 algoritmos)                       │
│                                                                   │
│  📁 /services/signal_quality_assessor.py (867 líneas)            │
│  ├─ Clase: SignalQualityAssessor                                 │
│  ├─ assess_signal_quality() - Evalúa señales institucionales     │
│  ├─ _assess_wyckoff_signals() - Analiza Wyckoff ✅               │
│  └─ ❌ PENDIENTE: 11 métodos para algoritmos restantes           │
│                                                                   │
│  📁 /services/wyckoff/ (4 módulos - DL-113) ✅                   │
│  ├─ accumulation_detector.py (Fase acumulación)                  │
│  ├─ distribution_detector.py (Fase distribución)                 │
│  ├─ markup_detector.py (Fase markup)                             │
│  └─ markdown_detector.py (Fase markdown)                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE - SQLite/PostgreSQL                        │
│                                                                   │
│  📊 bot_config (Tabla)                                           │
│  ├─ bot.metrics JSON column                                      │
│  ├─ wyckoff_signals: {...} ✅                                    │
│  └─ order_blocks: null, liquidity_grabs: null (❌ PENDIENTES)    │
└──────────────────────────────────────────────────────────────────┘

🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ❌ Solo 1 de 12 algoritmos visualizado (Wyckoff)
2. ❌ 11 algoritmos muestran status "pending" sin datos
3. ⚠️  AdvancedMetrics.jsx 650 líneas (viola DL-076 <150)
4. ❌ No hay endpoint específico GET /api/algorithms/{bot_id}
5. ❌ AlgorithmBreakdown hardcoded en AdvancedMetrics (debería ser componente separado)
```

### **🟢 ARQUITECTURA OBJETIVO (Ideal - Producción Ready)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Bots Panel)                          │
│  Navegación: Lateral → Bots → Ver Algoritmos → Modal Institucional│
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│            FRONTEND - Feature-Based Architecture                 │
│                                                                   │
│  📁 /features/algorithms/components/                             │
│  ├─ AlgorithmsVisualizationModal.jsx (<150 líneas) ✅           │
│  ├─ AlgorithmBreakdownList.jsx (<150 líneas) ✅                 │
│  ├─ AlgorithmCard.jsx (<100 líneas) ✅                           │
│  ├─ WyckoffMetricsDisplay.jsx (<100 líneas) ✅                   │
│  ├─ OrderBlocksMetricsDisplay.jsx (<100 líneas) 🆕              │
│  ├─ LiquidityGrabsMetricsDisplay.jsx (<100 líneas) 🆕           │
│  └─ ... (9 componentes más para algoritmos restantes)            │
│                                                                   │
│  📁 /features/algorithms/hooks/                                  │
│  ├─ useAlgorithmsData.js (<100 líneas)                           │
│  ├─ useWyckoffMetrics.js (<80 líneas)                            │
│  └─ useInstitutionalSignals.js (<120 líneas)                     │
│                                                                   │
│  📁 /components/InstitutionalChart.jsx (108 líneas) ✅           │
│  └─ Gráfico TradingView institucional (mantener)                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ 🆕 GET /api/bots/{id}/algorithms (completo)
                       │ 🆕 GET /api/algorithms/{bot_id}/wyckoff
                       │ 🆕 GET /api/algorithms/{bot_id}/order-blocks
┌──────────────────────▼──────────────────────────────────────────┐
│            BACKEND - Algoritmos Completos                        │
│                                                                   │
│  📁 /routes/algorithms_routes.py (NUEVO) 🆕                      │
│  ├─ GET /api/bots/{id}/algorithms (todos)                        │
│  ├─ GET /api/algorithms/{bot_id}/wyckoff                         │
│  ├─ GET /api/algorithms/{bot_id}/order-blocks                    │
│  └─ ... (10 endpoints más para algoritmos restantes)             │
│                                                                   │
│  📁 /services/signal_quality_assessor.py (AMPLIADO)              │
│  ├─ ✅ _assess_wyckoff_signals() (implementado)                  │
│  ├─ 🆕 _assess_order_blocks() (nuevo)                            │
│  ├─ 🆕 _assess_liquidity_grabs() (nuevo)                         │
│  ├─ 🆕 _assess_stop_hunting() (nuevo)                            │
│  ├─ 🆕 _assess_fair_value_gaps() (nuevo)                         │
│  ├─ 🆕 _assess_market_microstructure() (nuevo)                   │
│  └─ 🆕 +6 métodos para algoritmos restantes                      │
│                                                                   │
│  📁 /services/ (12 directorios algoritmos) 🆕                    │
│  ├─ wyckoff/ (✅ completo - 4 módulos)                           │
│  ├─ order_blocks/ (🆕 nuevo - 3 módulos)                         │
│  ├─ liquidity_grabs/ (🆕 nuevo - 2 módulos)                      │
│  └─ ... (9 directorios más)                                      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database + Cached Metrics
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE + METRICS STORAGE                          │
│                                                                   │
│  📊 bot_config.metrics (JSON expandido)                          │
│  ├─ wyckoff_signals: {...} ✅                                    │
│  ├─ order_blocks: {...} 🆕                                       │
│  ├─ liquidity_grabs: {...} 🆕                                    │
│  └─ ... (10 algoritmos más con métricas)                         │
│                                                                   │
│  📊 algorithm_signals (Tabla NUEVA) 🆕                           │
│  ├─ bot_id, algorithm_name, timestamp                            │
│  ├─ signal_data JSON, confidence, status                         │
│  └─ ✅ Histórico señales por algoritmo                           │
└──────────────────────────────────────────────────────────────────┘

✅ MEJORAS OBJETIVO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ 12/12 algoritmos visualizados con métricas específicas
2. ✅ Componentes <150 líneas (DL-076 compliant)
3. ✅ Endpoints especializados por algoritmo
4. ✅ Histórico señales algoritmos en database
5. ✅ Real-time updates señales institucionales
6. ✅ AlgorithmCard component reutilizable
```

---

## 🎯 **COMPONENTES TÉCNICOS**

### **FRONTEND - Componentes Visualización**

#### **1. /components/AdvancedMetrics.jsx** (650 líneas) ⚠️
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/components/AdvancedMetrics.jsx
// TAMAÑO: 650 líneas
// FUNCIÓN: Modal visualización algoritmos institucionales

// ⚠️ PROBLEMA DL-076: 650 líneas (viola <150 líneas)
// ✅ DL-001 COMPLIANT: Sin Math.random(), datos reales
// ✅ DL-008 COMPLIANT: useAuthDL008() authentication

// CONTIENE:
// - AlgorithmBreakdown component (línea 450-500)
// - Visualización 12 algoritmos institucionales
// - Referencias arquitecturas técnicas (SPEC_REF)
// - Métricas específicas por algoritmo

// 📋 DEBE DESCOMPONERSE EN:
// - AlgorithmsVisualizationModal.jsx (<150 líneas)
// - AlgorithmBreakdownList.jsx (<150 líneas)
// - AlgorithmCard.jsx (<100 líneas)
// - 12 componentes metrics display específicos (<100 líneas cada uno)
```

**Código AlgorithmBreakdown (CRÍTICO - EXTRAÍDO DE 06_BOT_RUNNING_CORE):**
```jsx
// FILE: frontend/src/components/AdvancedMetrics.jsx:450-500
const AlgorithmBreakdown = ({ bot }) => {
  // ✅ Muestra Wyckoff correctamente CON MÉTRICAS ESPECÍFICAS
  const wyckoffData = bot.metrics?.wyckoff_signals;

  // ❌ 11 algoritmos = null (línea 465)
  // ❌ PROBLEMA: Frontend NO muestra métricas específicas por algoritmo
  return (
    <div className="algorithm-list">
      {/* ✅ CORRECTO: Wyckoff con métricas específicas */}
      <AlgorithmCard
        name="Wyckoff Method"
        status="active"  // ✅ Implementado
        metrics={{
          phase: wyckoffData?.phase,              // "Accumulation Fase C"
          spring_detected: wyckoffData?.spring,   // true/false
          spring_level: wyckoffData?.spring_level, // $42,500
          confidence: wyckoffData?.confidence,     // 78%
          sos_confirmed: wyckoffData?.sos,        // true/false
          cause_effect: wyckoffData?.projection   // "+12% 24h"
        }}
      />

      {/* ❌ INCORRECTO: Algoritmos sin métricas específicas */}
      {/* CUANDO IMPLEMENTADO, CADA UNO DEBE TENER SUS MÉTRICAS: */}

      <AlgorithmCard
        name="Order Blocks"
        status="pending"
        // MÉTRICAS ESPERADAS (ver 02_ORDER_BLOCKS_ARCHITECTURE.md):
        // bullish_blocks: 3, bearish_blocks: 2,
        // dominant_direction: "BULLISH_BLOCKS",
        // confidence: 85%, retest_pending: 2
      />

      <AlgorithmCard
        name="Liquidity Grabs"
        status="pending"
        // MÉTRICAS ESPERADAS (ver 03_LIQUIDITY_GRABS_ARCHITECTURE.md):
        // buy_side_grabs: 8, sell_side_grabs: 5,
        // direction: "BULLISH_LIQUIDITY_GRAB",
        // activity_level: "HIGH"
      />

      <AlgorithmCard
        name="Stop Hunting"
        status="pending"
        // MÉTRICAS ESPERADAS (ver 04_STOP_HUNTING_ARCHITECTURE.md):
        // upward_hunts: 5, downward_hunts: 8,
        // hunt_direction: "BEARISH_SETUP",
        // risk_level: "HIGH", success_rate: 82%
      />

      <AlgorithmCard
        name="Fair Value Gaps"
        status="pending"
        // MÉTRICAS ESPERADAS (ver 05_FAIR_VALUE_GAPS_ARCHITECTURE.md):
        // bullish_fvg: 2, bearish_fvg: 1,
        // gap_status: "OPEN/FILLED/PARTIAL",
        // fill_percentage: 45%, distance: "-1.2%"
      />

      <AlgorithmCard
        name="Market Microstructure"
        status="pending"
        // MÉTRICAS ESPERADAS (ver 06_MARKET_MICROSTRUCTURE_ARCHITECTURE.md):
        // structure: "BULLISH", bos_level: $245,
        // choch: false, trend_strength: 87,
        // hh: $248.50, ll: $236.20
      />

      {/* Resto algoritmos pendientes arquitectura */}
      <AlgorithmCard name="VSA" status="pending" />
      <AlgorithmCard name="Market Profile" status="pending" />
      <AlgorithmCard name="SMC" status="pending" />
      <AlgorithmCard name="Order Flow" status="pending" />
      <AlgorithmCard name="Accumulation/Distribution" status="pending" />
      <AlgorithmCard name="Composite Man" status="pending" />
    </div>
  );
};
```

**NOTA CRÍTICA:** Cada algoritmo tiene métricas/KPIs específicos definidos en sus arquitecturas técnicas. El frontend debe leer y mostrar estas métricas específicas, NO datos genéricos.

**SPEC_REF para métricas por algoritmo:**
- `01_WYCKOFF_ARCHITECTURE.md`: 7 métricas (phase, spring, utad, sos, sow, confidence, cause_effect)
- `02_ORDER_BLOCKS_ARCHITECTURE.md`: 7 scoring functions (block_score, direction, confidence, fvg_confluence, poc_confluence, retest, invalidation)
- `03_LIQUIDITY_GRABS_ARCHITECTURE.md`: 4 scoring weights (depth, reversal, volume, recent_activity)
- `04_STOP_HUNTING_ARCHITECTURE.md`: 6 dynamic thresholds (wick_ratio, volume_spike, reversal, lookback, confirmation, risk_level)
- `05_FAIR_VALUE_GAPS_ARCHITECTURE.md`: 9.2 KPIs (gap_size, type, status, fill%, distance, time, volume, confluence, imbalance)
- `06_MARKET_MICROSTRUCTURE_ARCHITECTURE.md`: 9.2 KPIs (structure, bos, choch, hh/ll, liquidity, trend_strength, confidence)

#### **2. /components/InstitutionalChart.jsx** (108 líneas) ✅
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/components/InstitutionalChart.jsx
// TAMAÑO: 108 líneas
// FUNCIÓN: Gráfico TradingView institucional

// ✅ DL-076 COMPLIANT: <150 líneas
// ✅ DL-001 COMPLIANT: Sin Math.random()
// ✅ Integración señales algoritmos en gráfico

// FEATURES:
// - TradingView chart con velas japonesas
// - Overlay señales Wyckoff (Spring, UTAD, SOS, SOW)
// - Zonas Order Blocks (cuando implementado)
// - Liquidity grab markers (cuando implementado)
// - Fair Value Gaps overlay (cuando implementado)
```

#### **3. /features/bots/hooks/useBotMetrics.js** (78 líneas)
```javascript
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/features/bots/hooks/useBotMetrics.js
// TAMAÑO: 78 líneas
// FUNCIÓN: Hook obtención métricas algoritmos

// ENDPOINTS CONSUMIDOS:
// - GET /api/bots/{id}/metrics

// ESTADO RETORNADO:
// - metrics: { wyckoff, order_blocks, liquidity_grabs, ... }
// - loading: boolean
// - error: string

// POLLING:
// - Actualiza cada 10 segundos (configurable)
// - Solo cuando bot status = RUNNING
```

---

### **BACKEND - Services Algoritmos**

#### **4. /services/signal_quality_assessor.py** (867 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/services/signal_quality_assessor.py
# TAMAÑO: 867 líneas
# FUNCIÓN: 🔥 CORE - Evaluación calidad señales + Integración Wyckoff

# CLASE PRINCIPAL: SignalQualityAssessor
# - assess_signal_quality() - Evalúa señales institucionales
# - _assess_wyckoff_signals() - Analiza señales Wyckoff (✅ IMPLEMENTADO)
# - _calculate_consensus() - Consenso multi-algoritmo

# ✅ WYCKOFF INTEGRADO: Único algoritmo institucional funcional
# ❌ PENDIENTE: 11 algoritmos institucionales restantes
```

**Código relevante signal_quality_assessor.py:**
```python
# Líneas 120-180: Método assess_signal_quality
def assess_signal_quality(self,
                         symbol: str,
                         microstructure: Optional[MarketMicrostructure],
                         institutional: Optional[InstitutionalAnalysis],
                         multi_tf: Optional[MultiTimeframeSignal],
                         timeframe_data: Dict[str, TimeframeData]) -> Dict:

    # ✅ WYCKOFF: Algoritmo implementado
    wyckoff_signals = self._assess_wyckoff_signals(
        institutional, timeframe_data
    )

    # ❌ PENDIENTE: Order Blocks
    # order_blocks = self._assess_order_blocks(...)

    # ❌ PENDIENTE: Liquidity Grabs
    # liquidity_grabs = self._assess_liquidity_grabs(...)

    # ❌ PENDIENTE: Stop Hunting
    # stop_hunting = self._assess_stop_hunting(...)

    # Consenso con solo 1 algoritmo (debería ser 3/6 o 6/12)
    consensus_score = self._calculate_consensus([wyckoff_signals])

    return {
        "quality_score": consensus_score,
        "wyckoff": wyckoff_signals,
        # "order_blocks": None,  # PENDIENTE
        # "liquidity_grabs": None,  # PENDIENTE
    }
```

#### **5. /services/wyckoff/** (4 módulos - DL-113) ✅
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/services/wyckoff/
# FUNCIÓN: Detección fases Wyckoff completa

# 📁 accumulation_detector.py (Fase A-E acumulación)
# - detect_accumulation() - Detecta PS, SC, AR, ST, Spring, LPS, SOS, BU
# - ✅ COMPLETO: 8 eventos Wyckoff acumulación

# 📁 distribution_detector.py (Fase A-E distribución)
# - detect_distribution() - Detecta PSY, BC, AR, ST, UTAD, LPSY, SOW, BU
# - ✅ COMPLETO: 8 eventos Wyckoff distribución

# 📁 markup_detector.py (Fase C markup)
# - detect_markup_phase() - Detecta continuación alcista
# - ✅ COMPLETO: Señales markup

# 📁 markdown_detector.py (Fase C markdown)
# - detect_markdown_phase() - Detecta continuación bajista
# - ✅ COMPLETO: Señales markdown
```

---

## 📐 **FLUJO DE DATOS E2E**

### **FLUJO: Visualizar Algoritmos Institucionales**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Click Ícono 👁️ "Ver Algoritmos"               │
│ Ubicación: ProfessionalBotsTable.jsx → Fila bot → Ícono ojo    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - Abrir Modal AdvancedMetrics                 │
│ Componente: AdvancedMetrics.jsx                                 │
│ Props: { bot: selectedBot, onClose: () => {...} }              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Frontend - Cargar Métricas Algoritmos                  │
│ Hook: useBotMetrics.js                                          │
│                                                                  │
│ Request:                                                         │
│ GET /api/bots/{bot_id}/metrics                                  │
│ Headers:                                                         │
│   Authorization: Bearer {JWT_TOKEN}  // DL-008                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - routes/bots.py                               │
│ Endpoint: GET /api/bots/{bot_id}/metrics                       │
│                                                                  │
│ 4a. Autenticación DL-008                                        │
│ 4b. Verificar bot pertenece a usuario                           │
│ 4c. Cargar bot.metrics JSON column                              │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "wyckoff": {                                                   │
│     "phase": "Accumulation Fase C",                             │
│     "spring_detected": true,                                    │
│     "spring_level": 42500,                                      │
│     "confidence": 0.78,                                         │
│     "sos_confirmed": true,                                      │
│     "projection": "+12% 24h"                                    │
│   },                                                             │
│   "order_blocks": null,  // ❌ PENDIENTE                        │
│   "liquidity_grabs": null,  // ❌ PENDIENTE                     │
│   "stop_hunting": null  // ❌ PENDIENTE                         │
│ }                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Frontend - Renderizar AlgorithmBreakdown               │
│ Componente: AlgorithmBreakdown (interno AdvancedMetrics)       │
│                                                                  │
│ Renderiza:                                                       │
│ - ✅ Wyckoff Method: 7 métricas específicas                     │
│ - ❌ Order Blocks: status "pending"                             │
│ - ❌ Liquidity Grabs: status "pending"                          │
│ - ❌ Stop Hunting: status "pending"                             │
│ - ❌ Fair Value Gaps: status "pending"                          │
│ - ❌ Market Microstructure: status "pending"                    │
│ - ❌ VSA: status "pending"                                      │
│ - ❌ Market Profile: status "pending"                           │
│ - ❌ SMC: status "pending"                                      │
│ - ❌ Order Flow: status "pending"                               │
│ - ❌ Accumulation/Distribution: status "pending"                │
│ - ❌ Composite Man: status "pending"                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Usuario Ve Modal con Algoritmos                        │
│                                                                  │
│ ✅ Wyckoff Method: ACTIVO con métricas                          │
│   - Fase: Acumulación Fase C (85% confidence)                   │
│   - Spring @ $42,500 ✓                                          │
│   - SOS Confirmado @ $43,100                                    │
│   - Señal: BUY (Score: 75/100)                                  │
│   - Cause/Effect: +12% proyección 24h                           │
│                                                                  │
│ ❌ 11 algoritmos restantes: PENDING (sin datos)                 │
└─────────────────────────────────────────────────────────────────┘

✅ FIN FLUJO VISUALIZAR ALGORITMOS
```

---

## 🔧 **INTEGRACIÓN**

### **SPEC_REF: Referencias Arquitecturas Técnicas**

**Arquitecturas Institucionales Disponibles (6/12):**
```
docs/TECHNICAL_SPECS/ARCHITECTURE/INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/
├── 01_WYCKOFF_ARCHITECTURE.md (1,004 líneas) ✅ IMPLEMENTADO
├── 02_ORDER_BLOCKS_ARCHITECTURE.md (1,286 líneas) ❌ PENDIENTE IMPL
├── 03_LIQUIDITY_GRABS_ARCHITECTURE.md (787 líneas) ❌ PENDIENTE IMPL
├── 04_STOP_HUNTING_ARCHITECTURE.md (962 líneas) ❌ PENDIENTE IMPL
├── 05_FAIR_VALUE_GAPS_ARCHITECTURE.md (1,192 líneas) ❌ PENDIENTE IMPL
└── 06_MARKET_MICROSTRUCTURE_ARCHITECTURE.md (1,145 líneas) ❌ PENDIENTE IMPL

TOTAL: 6,376 líneas arquitecturas técnicas documentadas
IMPLEMENTADO: 1,004 líneas (16.7%)
PENDIENTE: 5,372 líneas (83.3%)
```

**Cada arquitectura incluye:**
- ✅ Modelo matemático completo
- ✅ Sistema scoring específico
- ✅ Métricas/KPIs dashboard
- ✅ Endpoints backend propuestos
- ✅ Tests validación
- ✅ Diseño UX/UI visualización

### **DL-001: No Hardcode / No Simulation**

#### **✅ COMPLIANT:**
```jsx
// AdvancedMetrics.jsx - Datos reales desde bot.metrics
const wyckoffData = bot.metrics?.wyckoff_signals;  // ✅ Dato real o undefined

// NO Math.random()
// NO datos simulados
// NO fallback hardcoded values
```

### **DL-076: Components <150 líneas**

#### **❌ VIOLATION:**
- AdvancedMetrics.jsx: **650 líneas** ❌ (4.3x límite)

#### **✅ PLAN DESCOMPOSICIÓN:**
```
AdvancedMetrics.jsx (650 líneas) → SEPARAR EN:
├── AlgorithmsVisualizationModal.jsx (130 líneas) ✅
├── AlgorithmBreakdownList.jsx (90 líneas) ✅
├── AlgorithmCard.jsx (80 líneas) ✅
├── WyckoffMetricsDisplay.jsx (95 líneas) ✅
├── OrderBlocksMetricsDisplay.jsx (95 líneas) 🆕
├── LiquidityGrabsMetricsDisplay.jsx (90 líneas) 🆕
└── ... (6 componentes más <100 líneas cada uno)
```

---

## 🎨 **DISEÑO UX/UI**

### **MODAL: VER ALGORITMOS AVANZADOS (Ojo 👁️)**

```
┌─────────────────────────────────────────────────────────────────┐
│  BTCUSDT - Smart Scalper Análisis                       [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 GRÁFICO INSTITUCIONAL                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              TradingView Chart (Institucional)            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ BTCUSDT  $43,250  +2.5%  🟢 Live  [⟳ 5s]  15m     │  │  │
│  │  ├────────────────────────────────────────────────────┤  │  │
│  │  │                                                     │  │  │
│  │  │         [Velas Japonesas]                          │  │  │
│  │  │            44,000 ┼─────────────                   │  │  │
│  │  │                   │     ▲                           │  │  │
│  │  │            43,500 ┼────╱ ╲──                       │  │  │
│  │  │                   │   ╱   ╲                        │  │  │
│  │  │            43,000 ┼──╱     ╲──                     │  │  │
│  │  │                   │         ╲                      │  │  │
│  │  │            42,500 ┼──────────╲─                    │  │  │
│  │  │                                                     │  │  │
│  │  │  🟢 WIN @ $43,100  🔴 LOSS @ $42,800               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Selección: [📈 Velas ●] [📊 Volumen ○] [🔍 Algoritmos ○]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  🎯 INTELLIGENT MODE SELECTOR                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Modo Actual: Smart Scalper                               │  │
│  │ Confianza: 85%                                           │  │
│  │ Próxima Evaluación: 2min                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  💎 SMART MONEY SUMMARY                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Quality Score: 75/100                                    │  │
│  │ Algoritmos Activos: 1/12                                 │  │
│  │ Consenso: 1/6 (⚠️ Débil)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  🏛️ INSTITUTIONAL ALGORITHM BREAKDOWN                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Wyckoff Method (DL-113) - IMPLEMENTADO                │  │
│  │ │  SPEC_REF: 01_WYCKOFF_ARCHITECTURE.md (1,004 líneas)  │  │
│  │ ├─ Fase: Acumulación Fase C (85% confidence)            │  │
│  │ ├─ Spring @ $42,500 ✓ | UTAD: No detectado              │  │
│  │ ├─ SOS Confirmado @ $43,100 | SOW: No                   │  │
│  │ ├─ Señal: BUY (Score: 75/100)                           │  │
│  │ ├─ Cause/Effect: +12% proyección 24h                    │  │
│  │ ├─ Vol Divergence: -2% precio +10% vol (Acumulación)    │  │
│  │ └─ Parámetros: 18 configurables (⚠️ GAP: NO usados)     │  │
│  │    [Ver Detalles →] [Historial Fases]                   │  │
│  │                                                           │  │
│  │ ❌ Order Blocks - NO IMPLEMENTADO                        │  │
│  │ │  SPEC_REF: 02_ORDER_BLOCKS_ARCHITECTURE.md (1,286L)   │  │
│  │ │  CUANDO IMPLEMENTADO:                                  │  │
│  │ ├─ Bullish Blocks: 3 activos | Bearish Blocks: 2        │  │
│  │ ├─ Block @ $241.50 (85% strength, PENDING retest)       │  │
│  │ ├─ Block @ $248.20 (72% strength, TESTED, 5hrs)         │  │
│  │ ├─ Dominant: BULLISH_BLOCKS (confidence 85%)            │  │
│  │ ├─ Confluence FVG: 78% | Confluence POC: 91%            │  │
│  │ └─ Señal: BUY_ZONE $239.80-$241.50                      │  │
│  │    [Ver Zonas →] [Retest Status]                        │  │
│  │                                                           │  │
│  │ ❌ Liquidity Grabs - NO IMPLEMENTADO                     │  │
│  │ │  SPEC_REF: 03_LIQUIDITY_GRABS_ARCHITECTURE.md (787L)  │  │
│  │ │  CUANDO IMPLEMENTADO:                                  │  │
│  │ ├─ Buy-Side Grabs: 8 | Sell-Side Grabs: 5              │  │
│  │ ├─ Recent: BUY-SIDE @ $242.80 (1.5 ATR, 91% reversal)   │  │
│  │ ├─ Recent: SELL-SIDE @ $238.20 (0.8 ATR, 72% reversal)  │  │
│  │ ├─ Direction: BULLISH_LIQUIDITY_GRAB                    │  │
│  │ ├─ Activity Level: HIGH (13 grabs last hour)            │  │
│  │ ├─ Implication: Institutional buying after sweep        │  │
│  │ └─ Señal: FADE @ $244.50 zona target institucional      │  │
│  │    [Ver Grabs →] [Estadísticas]                         │  │
│  │                                                           │  │
│  │ ❌ Stop Hunting - NO IMPLEMENTADO                        │  │
│  │ │  SPEC_REF: 04_STOP_HUNTING_ARCHITECTURE.md (962L)     │  │
│  │ │  CUANDO IMPLEMENTADO:                                  │  │
│  │ ├─ Upward Hunts: 5 | Downward Hunts: 8                  │  │
│  │ ├─ Hunt @ $242.80 (2.5 ATR wick, YES reversal, 3min)    │  │
│  │ ├─ Hunt @ $238.50 (1.8 ATR wick, YES reversal, 8min)    │  │
│  │ ├─ Direction: BEARISH_SETUP (más downward hunts)        │  │
│  │ ├─ Hunt Risk: HIGH (13 total hunts)                     │  │
│  │ ├─ Safe Zone LONG: Below $237.50 (-1.4%)                │  │
│  │ ├─ Safe Zone SHORT: Above $244.20 (+1.4%)               │  │
│  │ └─ Success Rate: 82% | Avg Reversal: 2.1 ATR            │  │
│  │    [Ver Zones →] [Stop Recommendations]                 │  │
│  │                                                           │  │
│  │ ❌ Fair Value Gaps (FVG) - NO IMPLEMENTADO               │  │
│  │ │  SPEC_REF: 05_FAIR_VALUE_GAPS_ARCHITECTURE.md (1,192L)│  │
│  │ │  CUANDO IMPLEMENTADO:                                  │  │
│  │ ├─ Bullish FVG @ $239.50-$241.00 (OPEN, 0% filled)      │  │
│  │ ├─ Bearish FVG @ $246.80-$248.30 (PARTIAL, 45% filled)  │  │
│  │ ├─ Gap Size: $1.50 (0.62% of price)                     │  │
│  │ ├─ Distance to Price: -1.2% (bullish gap below)         │  │
│  │ ├─ Imbalance Strength: HIGH                             │  │
│  │ ├─ Confluence OB: YES (Order Block + FVG = 85% win)     │  │
│  │ └─ Señal: FILL_ZONE @ $239.50-$241.00 target entry      │  │
│  │    [Ver Gaps →] [Fill Status]                           │  │
│  │                                                           │  │
│  │ ❌ Market Microstructure - NO IMPLEMENTADO               │  │
│  │ │  SPEC_REF: 06_MARKET_MICROSTRUCTURE_ARCHITECTURE.md   │  │
│  │ │  (1,145 líneas)                                        │  │
│  │ │  CUANDO IMPLEMENTADO:                                  │  │
│  │ ├─ Structure: BULLISH (BOS @ $245.00)                   │  │
│  │ ├─ CHoCH: NO detected (trend continúa)                  │  │
│  │ ├─ Higher High: $248.50 | Lower Low: $236.20            │  │
│  │ ├─ Trend Strength: 87/100 (STRONG)                      │  │
│  │ ├─ Internal Liquidity: $243.00, $246.50                 │  │
│  │ ├─ External Liquidity: $250.00 resistance               │  │
│  │ ├─ Last Break: 15min ago (sustained)                    │  │
│  │ └─ Señal: CONTINUATION bias bullish structure           │  │
│  │    [Ver Structure →] [Break History]                    │  │
│  │                                                           │  │
│  │ ❌ Volume Spread Analysis (VSA) - NO IMPLEMENTADO       │  │
│  │ ❌ Market Profile - NO IMPLEMENTADO                      │  │
│  │ ❌ Smart Money Concepts (SMC) - NO IMPLEMENTADO         │  │
│  │ ❌ Institutional Order Flow - NO IMPLEMENTADO           │  │
│  │ ❌ Accumulation/Distribution - NO IMPLEMENTADO          │  │
│  │ ❌ Composite Man Theory - NO IMPLEMENTADO               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  📊 ARQUITECTURAS TÉCNICAS DISPONIBLES:                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Todas las arquitecturas técnicas documentadas:           │  │
│  │ • 6/12 algoritmos con arquitectura completa (6,376 líneas)│
│  │ • Cada arquitectura incluye: modelo matemático, métricas,│  │
│  │   scoring system, UX dashboard, endpoints, tests         │  │
│  │ • Ver: docs/TECHNICAL_SPECS/ARCHITECTURE/                │  │
│  │        INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Cerrar]                                   [Ejecutar Trade]    │
└─────────────────────────────────────────────────────────────────┘
```

**Interacciones UX:**
1. **Real-Time Updates:** Métricas actualizan cada 10s cuando bot RUNNING
2. **Algorithm Cards:** Click en card expande detalles específicos algoritmo
3. **SPEC_REF Links:** Click en "SPEC_REF:" abre documentación arquitectura
4. **Status Indicators:**
   - ✅ Verde = Implementado y funcionando
   - ❌ Rojo = NO implementado (muestra métricas esperadas)
5. **Confidence Badges:** Color basado en confidence % (🟢 >70%, 🟡 50-70%, 🔴 <50%)
6. **Chart Integration:** Click en señal en card → resalta en gráfico TradingView
7. **Historical View:** Botón "Historial Fases" muestra timeline señales pasadas

---

## 🔥 **ISSUES IDENTIFICADOS**

### **📋 RESUMEN EJECUTIVO**

| # | Issue | Severidad | Estado | Bloquea Feature |
|---|-------|-----------|--------|-----------------|
| 1 | Solo 1/12 algoritmos visualizados | 🔴 CRÍTICA | ❌ ACTIVO | ✅ SÍ |
| 2 | AdvancedMetrics 650 líneas | 🟡 ALTA | ❌ ACTIVO | ❌ NO |
| 3 | No endpoints específicos por algoritmo | 🟡 ALTA | ❌ ACTIVO | ⚠️ PARCIAL |
| 4 | AlgorithmBreakdown hardcoded | 🟡 MEDIA | ❌ ACTIVO | ❌ NO |

---

### **🔴 ISSUE #1: SOLO 1/12 ALGORITMOS VISUALIZADOS**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** Usuario solo ve Wyckoff, 11 algoritmos muestran "pending" sin datos
**BLOQUEA FEATURE:** ✅ SÍ (Visualización institucional incompleta)

#### **EVIDENCIA:**
```jsx
// FILE: frontend/src/components/AdvancedMetrics.jsx:465-480
// SOLO Wyckoff tiene datos reales, resto = null
{wyckoffData && <AlgorithmCard name="Wyckoff" metrics={wyckoffData} />}
{!orderBlocksData && <AlgorithmCard name="Order Blocks" status="pending" />}
{!liquidityGrabsData && <AlgorithmCard name="Liquidity Grabs" status="pending" />}
// ... 9 algoritmos más con status="pending"
```

#### **PLAN CORRECCIÓN:**
Ver **Plan Corrección FASE 2-4** (implementar 11 algoritmos restantes)

---

### **🟡 ISSUE #2: ADVANCEDMETRICS 650 LÍNEAS (VIOLA DL-076)**

**SEVERIDAD:** 🟡 ALTA
**IMPACTO:** Componente no mantenible, viola DL-076 <150 líneas
**BLOQUEA FEATURE:** ❌ NO (funciona pero viola estándar)

#### **PLAN CORRECCIÓN:**
Ver **Plan Corrección FASE 5** (refactoring componentes)

---

## ✅ **PLAN CORRECCIÓN**

### **FASE 1: WYCKOFF OPTIMIZACIÓN (1 semana)**
- ✅ Ya implementado
- Optimizar visualización métricas Wyckoff
- Agregar histórico fases Wyckoff

### **FASE 2: ORDER BLOCKS IMPLEMENTACIÓN (2-3 semanas)**
1. Implementar `services/order_blocks/detector.py`
2. Integrar en `signal_quality_assessor.py`
3. Crear `OrderBlocksMetricsDisplay.jsx`
4. Endpoint `GET /api/algorithms/{bot_id}/order-blocks`

### **FASE 3: LIQUIDITY + STOP HUNTING (2-3 semanas)**
1. Implementar `services/liquidity_grabs/detector.py`
2. Implementar `services/stop_hunting/detector.py`
3. Componentes visualización respectivos
4. Endpoints API respectivos

### **FASE 4: FVG + MICROSTRUCTURE (2-3 semanas)**
1. Implementar `services/fair_value_gaps/detector.py`
2. Implementar `services/market_microstructure/analyzer.py`
3. Componentes visualización respectivos
4. Endpoints API respectivos

### **FASE 5: REFACTORING DL-076 (1 semana)**
1. Separar AdvancedMetrics.jsx en 4 componentes
2. Crear AlgorithmCard.jsx reutilizable
3. Crear 12 componentes metrics display específicos

### **FASE 6: ALGORITMOS RESTANTES (4-6 semanas)**
1. VSA, Market Profile, SMC
2. Order Flow, Accumulation/Distribution
3. Composite Man Theory

**TIEMPO TOTAL:** 12-17 semanas para 12 algoritmos completos

---

*Creado: 2025-10-02*
*Última Actualización: 2025-10-02*
*Propósito: Documentación técnica visualización algoritmos institucionales*
*Objetivo: Separación clara arquitectura visualización vs core execution*
*Nivel Detalle: EXHAUSTIVO (match 01_AUTHENTICATION_SECURITY 1,848L)*
