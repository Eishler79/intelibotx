# 06_BOT_RUNNING_CORE_ARCHITECTURE - Motor de Ejecución Bot + Modos + Algoritmos

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN - CORE CRÍTICO**
> **Actualizado:** 2025-10-02
> **Estado:** 🟡 PARCIAL (1/12 algoritmos, 58/62 parámetros no consumidos)
> **Prioridad:** 🔥 CRÍTICA - BLOQUEA OPERACIÓN

---

## 📋 **ÍNDICE**

1. [Arquitectura Actual vs Objetivo](#arquitectura-actual-vs-objetivo)
2. [Componentes Técnicos](#componentes-técnicos)
3. [Flujo de Datos E2E](#flujo-de-datos-e2e)
4. [Integración](#integración)
5. [Diseño UX/UI](#diseño-uxui)
6. [Mapeo Arquitectura](#mapeo-arquitectura)
7. [Issues Identificados](#issues-identificados)
8. [Plan Corrección](#plan-corrección)

---

## 📊 **ARQUITECTURA ACTUAL VS OBJETIVO**

### **🔴 ARQUITECTURA ACTUAL (Estado Real 2025-10-02)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Dashboard)                          │
│  Navegación: Lateral → Bots → Crear/Controlar/Visualizar       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               FRONTEND - React 18 + TypeScript                  │
│                                                                  │
│  📁 /pages/BotsModular.jsx (141 líneas) ✅ ACTIVO               │
│  ├─ Orquestador principal sin Math.random()                    │
│  ├─ DL-001 compliant, DL-076 compliant                          │
│  └─ Estado: PRODUCCIÓN ✅                                        │
│                                                                  │
│  📁 /pages/BotsAdvanced.jsx (990 líneas) ❌ LEGACY              │
│  ├─ Math.random() violations (múltiples)                        │
│  ├─ Hardcoded intervals línea 495                               │
│  ├─ DL-001 violations, DL-076 violations                        │
│  └─ Estado: DEPRECADO - Solo rollback                           │
│                                                                  │
│  📁 /features/bots/hooks/ (Arquitectura modular)                │
│  ├─ useBotManagement.js (174 líneas)                            │
│  ├─ useBotOperations.js (85 líneas)                             │
│  ├─ useBotCrud.js (120 líneas)                                  │
│  ├─ useBotStatus.js (45 líneas)                                 │
│  └─ useBotMetrics.js (78 líneas)                                │
│                                                                  │
│  📁 /components/ (UI Components)                                │
│  ├─ EnhancedBotCreationModal.jsx (1,452 líneas) ⚠️              │
│  ├─ BotControlPanel.jsx (367 líneas)                            │
│  ├─ ProfessionalBotsTable.jsx (498 líneas)                      │
│  └─ InstitutionalChart.jsx (108 líneas)                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ /api/create-bot (POST)
                       │ /api/run-smart-trade/{symbol} (POST)
                       │ /api/bots (GET)
                       │ /api/bots/{id}/status (PATCH)
┌──────────────────────▼──────────────────────────────────────────┐
│               BACKEND - FastAPI + Python 3.11                   │
│                                                                  │
│  📁 /routes/bots.py (374 líneas)                                │
│  ├─ POST /api/create-bot                                        │
│  ├─ GET /api/bots (list user bots)                              │
│  ├─ PATCH /api/bots/{id}/status                                 │
│  ├─ DELETE /api/bots/{id}                                       │
│  └─ ✅ DL-008: get_current_user_safe()                          │
│                                                                  │
│  📁 /routes/real_trading_routes.py (486 líneas)                 │
│  ├─ POST /api/run-smart-trade/{symbol}                          │
│  ├─ 🔥 CORE: Ejecuta trading real-time                          │
│  └─ ⚠️ PROBLEMA: No consume parámetros bot (58/62)              │
│                                                                  │
│  📁 /services/real_trading_engine.py (234 líneas)               │
│  ├─ Clase: RealTradingEngine                                    │
│  ├─ execute_trade() - Motor principal                           │
│  └─ ❌ CRÍTICO: Ignora bot.interval, leverage, cooldown, etc.   │
│                                                                  │
│  📁 /services/signal_quality_assessor.py (867 líneas)           │
│  ├─ Clase: SignalQualityAssessor                                │
│  ├─ assess_signal_quality() - Análisis calidad señal            │
│  ├─ ✅ Wyckoff integrado (1/12 algoritmos)                      │
│  └─ ❌ Falta: 11 algoritmos institucionales pendientes          │
│                                                                  │
│  📁 /services/wyckoff/ (4 módulos - DL-113) ✅                  │
│  ├─ accumulation_detector.py (Fase acumulación)                 │
│  ├─ distribution_detector.py (Fase distribución)                │
│  ├─ markup_detector.py (Fase markup)                            │
│  └─ markdown_detector.py (Fase markdown)                        │
│                                                                  │
│  📁 /services/advanced_algorithm_selector.py (856 líneas)       │
│  ├─ Clase: AdvancedAlgorithmSelector                            │
│  ├─ select_optimal_algorithm() - ML-based selection             │
│  └─ ⚠️ LIMITADO: Solo tiene 4 algoritmos definidos              │
│                                                                  │
│  📁 /services/multi_timeframe_coordinator.py (678 líneas)       │
│  ├─ Clase: MultiTimeframeCoordinator                            │
│  ├─ coordinate_timeframes() - Análisis multi-temporal           │
│  └─ ✅ FUNCIONAL: 3 timeframes (5m, 15m, 1h)                    │
│                                                                  │
│  📁 /models/bot_config.py (113 líneas)                          │
│  ├─ Clase: BotConfig (SQLModel)                                 │
│  ├─ ✅ 62 parámetros configurables definidos                    │
│  ├─ ✅ 18 parámetros Wyckoff específicos                        │
│  └─ ❌ CRÍTICO: Parámetros NO consumidos en ejecución           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ SQLite/PostgreSQL
┌──────────────────────▼──────────────────────────────────────────┐
│                    DATABASE - SQLite/PostgreSQL                 │
│                                                                  │
│  📊 bot_config (Tabla principal)                                │
│  ├─ 62 columnas configurables                                   │
│  ├─ user_id, exchange_id, strategy, interval                    │
│  ├─ stake, take_profit, stop_loss (✅ USADOS)                   │
│  ├─ leverage, margin_type (❌ NO USADOS)                        │
│  ├─ cooldown_minutes, max_open_positions (❌ NO USADOS)         │
│  └─ 18 parámetros Wyckoff (❌ MAYORÍA NO USADOS)                │
└──────────────────────────────────────────────────────────────────┘

🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ❌ 58 de 62 parámetros NO consumidos (93.5% ignorados)
2. ❌ Solo 1 de 12 algoritmos institucionales implementado (Wyckoff)
3. ❌ Backend NO lee bot.interval, leverage, cooldown, margin_type
4. ❌ No existe sistema backtesting datos reales
5. ⚠️  EnhancedBotCreationModal 1,452 líneas (viola DL-076 <150)
6. ⚠️  BotsAdvanced.jsx legacy con Math.random() aún en codebase
```

### **🟢 ARQUITECTURA OBJETIVO (Ideal - Producción Ready)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Dashboard UX)                        │
│  Navegación Optimizada: Lateral → Bots → Panel Control Unificado│
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│            FRONTEND - Feature-Based Architecture                │
│                                                                  │
│  📁 /pages/BotsModular.jsx (141 líneas) ✅                      │
│  └─ Orquestador limpio sin lógica de negocio                    │
│                                                                  │
│  📁 /features/bots/hooks/ (Specialized Hooks)                   │
│  ├─ useBotManagement.js - Orquestación estado                   │
│  ├─ useBotOperations.js - Start/Stop/Pause                      │
│  ├─ useBotCrud.js - Create/Update/Delete                        │
│  ├─ useBotStatus.js - Status real-time                          │
│  ├─ useBotMetrics.js - Métricas performance                     │
│  └─ useBotBacktesting.js - 🆕 Backtesting datos reales          │
│                                                                  │
│  📁 /features/bots/components/ (Descomposición <150 líneas)     │
│  ├─ BotCreationForm.jsx (<150 líneas)                           │
│  ├─ BotConfigurationPanel.jsx (<150 líneas)                     │
│  ├─ BotMetricsCard.jsx (<100 líneas)                            │
│  ├─ BotAlgorithmsVisualization.jsx (<150 líneas)                │
│  └─ BotBacktestingPanel.jsx (<150 líneas) 🆕                    │
│                                                                  │
│  📁 /components/tables/ (Responsive Cards)                      │
│  └─ ProfessionalBotsCards.jsx - Vista tarjetas 8 secciones      │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ 🆕 /api/bots/{id}/execute (POST) - Consume TODOS parámetros
                       │ 🆕 /api/bots/{id}/backtest (POST) - Backtesting
                       │ 🆕 /api/algorithms/available (GET) - 12 algoritmos
┌──────────────────────▼──────────────────────────────────────────┐
│            BACKEND - Smart Parameter Consumption                │
│                                                                  │
│  📁 /routes/bots.py (MEJORADO)                                  │
│  ├─ POST /api/bots/{id}/execute                                 │
│  ├─ ✅ Pasa BotConfig COMPLETO a engine                         │
│  └─ ✅ Valida parámetros antes ejecución                        │
│                                                                  │
│  📁 /services/real_trading_engine.py (REFACTORIZADO)            │
│  ├─ execute_trade(bot: BotConfig, market_data)                  │
│  ├─ ✅ Consume bot.interval para frecuencia                     │
│  ├─ ✅ Consume bot.leverage para cálculo cantidad               │
│  ├─ ✅ Consume bot.cooldown_minutes entre trades                │
│  ├─ ✅ Consume bot.max_open_positions                           │
│  └─ ✅ Pasa parámetros Wyckoff a detectores                     │
│                                                                  │
│  📁 /services/signal_quality_assessor.py (AMPLIADO)             │
│  ├─ ✅ Wyckoff (implementado)                                   │
│  ├─ 🆕 Order Blocks detector                                    │
│  ├─ 🆕 Liquidity Grabs detector                                 │
│  ├─ 🆕 Stop Hunting detector                                    │
│  ├─ 🆕 Fair Value Gaps detector                                 │
│  ├─ 🆕 Market Microstructure analyzer                           │
│  └─ 🆕 +6 algoritmos restantes (12 total)                       │
│                                                                  │
│  📁 /services/backtesting_engine.py (NUEVO) 🔥                  │
│  ├─ run_backtest(bot: BotConfig, historical_data)               │
│  ├─ ✅ Carga datos históricos reales Binance                    │
│  ├─ ✅ Simula ejecución con parámetros exactos                  │
│  ├─ ✅ Calcula métricas: Win Rate, Sharpe, Max DD               │
│  └─ ✅ Genera reporte validación antes producción               │
│                                                                  │
│  📁 /services/parameter_validator.py (NUEVO)                    │
│  ├─ validate_bot_config(bot: BotConfig)                         │
│  ├─ ✅ Verifica leverage compatible con market_type             │
│  ├─ ✅ Valida interval soportado por exchange                   │
│  └─ ✅ Cross-validation parámetros dependientes                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database + Historical Data Storage
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE + HISTORICAL DATA STORAGE                 │
│                                                                  │
│  📊 bot_config (Tabla - TODOS parámetros consumidos)            │
│  ├─ ✅ 62/62 parámetros utilizados en ejecución                 │
│  └─ ✅ 18 parámetros Wyckoff aplicados en detectores            │
│                                                                  │
│  📊 backtest_results (Tabla NUEVA) 🆕                           │
│  ├─ bot_id, symbol, start_date, end_date                        │
│  ├─ win_rate, sharpe_ratio, max_drawdown                        │
│  ├─ total_trades, pnl, roi                                      │
│  └─ ✅ Histórico validaciones antes producción                  │
│                                                                  │
│  📊 historical_market_data (Tabla NUEVA) 🆕                     │
│  ├─ symbol, interval, timestamp                                 │
│  ├─ open, high, low, close, volume                              │
│  └─ ✅ Cache datos Binance para backtesting                     │
└──────────────────────────────────────────────────────────────────┘

✅ MEJORAS OBJETIVO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ 62/62 parámetros consumidos (100% utilización)
2. ✅ 12/12 algoritmos institucionales implementados
3. ✅ Backtesting datos reales antes producción
4. ✅ Validación parámetros automática
5. ✅ Componentes <150 líneas (DL-076 compliant)
6. ✅ BotsAdvanced.jsx eliminado completamente
```

---

## 🎯 **COMPONENTES TÉCNICOS**

### **BACKEND - Archivos Core**

#### **1. /routes/bots.py** (374 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/routes/bots.py
# TAMAÑO: 374 líneas
# FUNCIÓN: CRUD bots + listado usuario + control estado

# ENDPOINTS PRINCIPALES:
# ✅ POST /api/create-bot - Crear bot con validación completa
# ✅ GET /api/bots - Listar bots del usuario (filtrado user_id)
# ✅ PATCH /api/bots/{id}/status - Cambiar estado (RUNNING/PAUSED/STOPPED)
# ✅ DELETE /api/bots/{id} - Eliminar bot
# ✅ GET /api/bots/{id} - Obtener bot específico

# AUTENTICACIÓN: DL-008 compliant
# - Línea 23: @router.post("/api/create-bot")
# - Línea 24: current_user: User = Depends(get_current_user_safe)
```

**Código relevante bots.py:**
```python
# Líneas 23-45: Endpoint crear bot
@router.post("/api/create-bot")
async def create_bot(
    bot_data: BotCreate,
    current_user: User = Depends(get_current_user_safe),  # DL-008
    db: Session = Depends(get_db)
):
    # Validar exchange pertenece al usuario
    if bot_data.exchange_id:
        exchange = db.query(UserExchange).filter(
            UserExchange.id == bot_data.exchange_id,
            UserExchange.user_id == current_user.id
        ).first()

        if not exchange:
            raise HTTPException(status_code=400, detail="Exchange no encontrado")

    # Crear bot con TODOS los parámetros
    new_bot = BotConfig(
        user_id=current_user.id,  # CRÍTICO: Asociar a usuario
        **bot_data.dict()
    )

    db.add(new_bot)
    db.commit()
    db.refresh(new_bot)

    return {"success": True, "bot": new_bot}
```

#### **2. /routes/real_trading_routes.py** (486 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/routes/real_trading_routes.py
# TAMAÑO: 486 líneas
# FUNCIÓN: 🔥 ENDPOINT PRINCIPAL EJECUCIÓN TRADING REAL-TIME

# ENDPOINT CRÍTICO:
# POST /api/run-smart-trade/{symbol}
# - Ejecuta análisis Smart Money completo
# - Coordina algoritmos institucionales
# - Genera señales trading real-time

# ❌ PROBLEMA CRÍTICO: No recibe bot_id, no consume parámetros bot
```

**Código relevante real_trading_routes.py:**
```python
# Líneas 89-150: Endpoint principal trading
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,
    current_user: User = Depends(get_current_user_safe),  # DL-008
    db: Session = Depends(get_db)
):
    # ❌ CRÍTICO: NO recibe bot_id ni BotConfig
    # ❌ PROBLEMA: Usa parámetros hardcoded internos

    # Análisis Wyckoff (único implementado)
    wyckoff_analysis = await wyckoff_analyzer.analyze_market(symbol)

    # Signal Quality Assessment
    signal_quality = signal_assessor.assess_signal_quality(
        symbol=symbol,
        microstructure=microstructure,
        institutional=institutional,
        multi_tf=multi_tf_signal,
        timeframe_data=timeframe_data
    )

    # ⚠️ FALTA: Consumir bot.interval, bot.leverage, bot.cooldown
    # ⚠️ FALTA: Pasar parámetros Wyckoff desde bot config

    return {
        "symbol": symbol,
        "signal_quality": signal_quality,
        "wyckoff": wyckoff_analysis
    }
```

#### **3. /services/real_trading_engine.py** (234 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/services/real_trading_engine.py
# TAMAÑO: 234 líneas
# FUNCIÓN: Motor principal ejecución trades

# CLASE PRINCIPAL: RealTradingEngine
# - execute_trade() - Ejecuta trade en exchange
# - validate_trade() - Valida antes ejecutar
# - calculate_quantity() - Calcula cantidad orden

# ❌ PROBLEMA: No consume parámetros bot
```

**Código relevante real_trading_engine.py:**
```python
# Líneas 50-120: Método execute_trade
class RealTradingEngine:
    async def execute_trade(self, symbol: str, side: str,
                           price: float, exchange_client):
        # ❌ CRÍTICO: NO recibe BotConfig como parámetro
        # ❌ Usa valores hardcoded

        stake = 1000  # ❌ HARDCODE - Debería ser bot.stake
        leverage = 1  # ❌ HARDCODE - Debería ser bot.leverage

        # Cálculo cantidad
        quantity = stake / price  # ❌ IGNORA bot.leverage

        # ⚠️ FALTA: Validar bot.max_open_positions
        # ⚠️ FALTA: Aplicar bot.cooldown_minutes
        # ⚠️ FALTA: Usar bot.entry_order_type (MARKET/LIMIT)

        # Ejecutar orden
        order = await exchange_client.create_order(
            symbol=symbol,
            side=side,
            type='MARKET',  # ❌ HARDCODE - Debería ser bot.entry_order_type
            quantity=quantity
        )

        return order
```

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

# ⚠️ PROBLEMA: Parámetros Wyckoff no configurables desde bot
# bot_config.py líneas 79-109 define 18 parámetros Wyckoff
# ❌ NO se pasan a detectores, usan valores hardcoded internos
```

#### **6. /services/advanced_algorithm_selector.py** (856 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/services/advanced_algorithm_selector.py
# TAMAÑO: 856 líneas
# FUNCIÓN: Selector ML-based algoritmo óptimo

# CLASE: AdvancedAlgorithmSelector
# - select_optimal_algorithm() - Elige mejor algoritmo según mercado
# - _score_all_algorithms() - Scoring ML-based
# - _classify_market_regime() - Clasifica régimen mercado

# ⚠️ LIMITACIÓN: Solo 4 algoritmos definidos en características
# Líneas 199-246: algorithm_characteristics solo incluye:
#   - MA_ALIGNMENT
#   - VOLUME_BREAKOUT
#   - LIQUIDITY_GRAB_FADE
#   - ORDER_BLOCK_RETEST
# ❌ Faltan 8 algoritmos institucionales Smart Money
```

#### **7. /services/multi_timeframe_coordinator.py** (678 líneas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/services/multi_timeframe_coordinator.py
# TAMAÑO: 678 líneas
# FUNCIÓN: Coordinación análisis multi-temporal

# CLASE: MultiTimeframeCoordinator
# - coordinate_timeframes() - Coordina 3 timeframes
# - _analyze_alignment() - Alineación tendencias
# - _calculate_trend_strength() - Fuerza tendencia

# ✅ FUNCIONAL: Analiza 5m, 15m, 1h simultáneamente
# ✅ Detecta alineación multi-temporal
# ⚠️ PROBLEMA: Timeframes hardcoded, debería usar bot.interval
```

#### **8. /models/bot_config.py** (113 líneas) 🔥
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/models/bot_config.py
# TAMAÑO: 113 líneas
# FUNCIÓN: ⚡ CRÍTICO - Modelo SQLModel configuración bot

# CLASE: BotConfig (SQLModel, table=True)
# - 62 parámetros configurables totales
# - 18 parámetros Wyckoff específicos (líneas 79-109)

# PARÁMETROS CLAVE:
```

**Modelo completo bot_config.py:**
```python
# Líneas 1-113: Modelo completo BotConfig
class BotConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # ✅ BÁSICOS (CONSUMIDOS)
    user_id: int = Field(foreign_key="user.id")  # ✅ USADO
    exchange_id: Optional[int] = Field(foreign_key="userexchange.id")  # ✅ USADO
    name: str  # ✅ USADO
    symbol: str  # ✅ USADO
    stake: float  # ✅ USADO
    take_profit: float  # ✅ USADO
    stop_loss: float  # ✅ USADO

    # ❌ CONFIGURACIÓN ESTRATÉGICA (NO CONSUMIDOS)
    strategy: str  # ❌ NO USADO en ejecución
    interval: str  # ❌ NO USADO - Backend usa hardcoded
    base_currency: str  # ⚠️ PARCIALMENTE usado
    quote_currency: str  # ⚠️ PARCIALMENTE usado

    # ❌ GESTIÓN RIESGO AVANZADA (NO CONSUMIDOS)
    dca_levels: int = Field(default=3)  # ❌ NO USADO
    risk_percentage: Optional[float] = Field(default=1.0)  # ❌ NO USADO
    risk_profile: str = Field(default="MODERATE")  # ❌ NO USADO

    # ❌ TIPO MERCADO Y LEVERAGE (CRÍTICO - NO CONSUMIDOS)
    market_type: str  # ❌ NO USADO en ejecución
    leverage: Optional[int]  # ❌ NO USADO - cantidad ignora leverage
    margin_type: Optional[str]  # ❌ NO USADO

    # ❌ CONDICIONES AVANZADAS (NO CONSUMIDOS)
    min_volume: Optional[float] = Field(default=0.0)  # ❌ NO USADO
    min_entry_price: Optional[float]  # ❌ NO USADO
    max_orders_per_pair: int = Field(default=1)  # ❌ NO USADO

    # ❌ TIPOS ÓRDENES (CRÍTICO - NO CONSUMIDOS)
    entry_order_type: str  # ❌ NO USADO - siempre MARKET hardcoded
    exit_order_type: str  # ❌ NO USADO
    tp_order_type: str  # ❌ NO USADO
    sl_order_type: str  # ❌ NO USADO
    trailing_stop: bool  # ❌ NO USADO

    # ❌ CONTROLES OPERACIONALES (CRÍTICO - NO CONSUMIDOS)
    max_open_positions: int  # ❌ NO USADO - sin validación
    cooldown_minutes: int  # ❌ NO USADO - sin cooldown entre trades

    # ❌ WYCKOFF (18 PARÁMETROS - MAYORÍA NO CONSUMIDOS)
    wyckoff_prior_trend_bars: int = Field(default=10)  # ❌ NO USADO
    wyckoff_volume_increase_factor: float = Field(default=1.5)  # ❌ NO USADO
    # ... (16 parámetros más líneas 82-109, TODOS NO USADOS)

    # ✅ ESTADO Y CONTROL (CONSUMIDOS)
    active: bool = Field(default=True)  # ✅ USADO
    status: str = Field(default=BotStatus.STOPPED)  # ✅ USADO

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime]
    last_trade_at: Optional[datetime]

# 📊 RESUMEN PARÁMETROS:
# ✅ CONSUMIDOS: 4 (stake, take_profit, stop_loss, entry_order_type)
# ❌ NO CONSUMIDOS: 58 (93.5% ignorados)
```

---

### **FRONTEND - Componentes Core**

#### **9. /pages/BotsModular.jsx** (141 líneas) ✅
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/pages/BotsModular.jsx
// TAMAÑO: 141 líneas
// FUNCIÓN: Orquestador principal página Bots

// ✅ SUCCESS CRITERIA:
// - <150 líneas (DL-076 compliant)
// - Sin Math.random() (DL-001 compliant)
// - Solo orquestación, lógica en hooks

// NAVEGACIÓN: Lateral → Bots → BotsModular
```

**Código completo BotsModular.jsx:**
```jsx
// Líneas 1-141: Componente completo
import React from 'react';
import { useBotManagement } from '../features/bots/hooks/useBotManagement';
import DashboardMetrics from '../features/dashboard/components/DashboardMetrics';
import BotsTableSection from '../features/bots/components/BotsTableSection';
import BotsDetailsModal from '../features/bots/components/BotsDetailsModal';
import TradingHistory from '../components/TradingHistory';
import BotControlPanel from '../components/BotControlPanel';
import EnhancedBotCreationModal from '../components/EnhancedBotCreationModal';
import BotTemplates from '../components/BotTemplates';

export default function BotsModular() {
  const {
    // Estado desde hook central
    bots, loading, error, activeTab, selectedBotId, selectedBot,
    showCreateModal, controlPanelBot, dynamicMetrics,

    // Setters
    setActiveTab, setSelectedBotId, setSelectedBot,
    setShowCreateModal, setControlPanelBot,

    // Handlers
    handleDeleteBot, handleToggleBotStatus,
    handleUpdateBot, handleCreateBot
  } = useBotManagement();

  if (loading) {
    return <div className="animate-spin">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-intelibot-primary p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1>🤖 InteliBots AI (Modular)</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('history')}>Historial</button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <>
            <DashboardMetrics dynamicMetrics={dynamicMetrics} />
            <BotsTableSection
              bots={bots}
              onSelectBot={setSelectedBotId}
              onDeleteBot={handleDeleteBot}
              onToggleBotStatus={handleToggleBotStatus}
            />
          </>
        )}

        {activeTab === 'history' && selectedBotId && (
          <TradingHistory botId={selectedBotId} />
        )}

        {/* Modales */}
        {controlPanelBot && (
          <BotControlPanel
            bot={controlPanelBot}
            onUpdateBot={handleUpdateBot}
            onClose={() => setControlPanelBot(null)}
          />
        )}

        <EnhancedBotCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onBotCreated={handleCreateBot}
        />
      </div>
    </div>
  );
}

// ✅ 141 líneas totales - DL-076 compliant
// ✅ Sin Math.random() - DL-001 compliant
// ✅ Solo orquestación, lógica delegada a hooks
```

#### **10. /features/bots/hooks/useBotManagement.js** (174 líneas)
```javascript
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/features/bots/hooks/useBotManagement.js
// TAMAÑO: 174 líneas
// FUNCIÓN: Hook central orquestación estado bots

// RESPONSABILIDADES:
// - Gestión estado global bots
// - Coordinación sub-hooks especializados
// - Manejo errores centralizado
// - Real-time updates estado

// INTEGRACIÓN:
// - useBotCrud.js (Create/Update/Delete)
// - useBotOperations.js (Start/Stop/Pause)
// - useBotMetrics.js (Performance metrics)
// - useBotStatus.js (Status tracking)
```

#### **11. /components/EnhancedBotCreationModal.jsx** (1,452 líneas) ⚠️
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/components/EnhancedBotCreationModal.jsx
// TAMAÑO: 1,452 líneas
// FUNCIÓN: Modal creación bot con todos los parámetros

// ⚠️ PROBLEMA DL-076: 1,452 líneas (viola <150 líneas)
// ✅ DL-001 COMPLIANT: Sin Math.random(), datos reales
// ✅ DL-008 COMPLIANT: useAuthDL008() authentication

// FORMULARIO INCLUYE:
// ✅ 62 campos configurables del BotConfig
// ✅ Validación exchange usuario
// ✅ Carga dinámica símbolos, intervals, market types
// ✅ Real-time price data con failover (DL-019)

// 📋 DEBE DESCOMPONERSE EN:
// - BotCreationForm.jsx (<150 líneas)
// - BotBasicConfig.jsx (<100 líneas)
// - BotAdvancedConfig.jsx (<150 líneas)
// - BotRiskConfig.jsx (<100 líneas)
```

#### **12. /components/ProfessionalBotsTable.jsx** (498 líneas)
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/components/ProfessionalBotsTable.jsx
// TAMAÑO: 498 líneas
// FUNCIÓN: Tabla profesional bots + acciones

// CARACTERÍSTICAS:
// - Vista desktop tabla + mobile cards
// - Sorting por columnas
// - 10 columnas datos: Symbol, Status, Capital, PnL, Sharpe, Win Rate, Trades, TP/SL, Max DD, Enhanced
// - 5 acciones: Start/Pause, View Details, History, Settings, Delete

// ⚠️ PROBLEMA DL-076: 498 líneas (viola <150 líneas)
// ✅ DL-001: Sin Math.random(), PnL real desde bot.metrics

// 📋 DEBE TRANSFORMARSE EN:
// - ProfessionalBotsCards.jsx (Vista tarjetas responsive)
// - 8 secciones según requerimientos usuario:
//   a) Datos Generales
//   b) Performance
//   c) Gestión de Mercado
//   d) Gestión de Riesgo
//   e) Gestión de Órdenes
//   f) Configuración Avanzada
//   g) Controles Operacionales
//   h) Acciones
```

---

## 📐 **FLUJO DE DATOS E2E**

### **FLUJO 1: Crear Bot (E2E Completo)**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Click "Crear Bot"                              │
│ Ubicación: Lateral → Bots → Botón "🚀 Crear Bot"              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - BotsModular.jsx                             │
│ Archivo: frontend/src/pages/BotsModular.jsx:57                 │
│ Código: <Button onClick={() => setShowCreateModal(true)}>      │
│ Estado: setShowCreateModal(true)                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Modal EnhancedBotCreationModal.jsx Abierto             │
│ Archivo: frontend/src/components/EnhancedBotCreationModal.jsx  │
│                                                                  │
│ 3a. Carga Exchange Usuario                                      │
│     - useEffect línea 70: loadUserExchanges()                   │
│     - AuthContext.jsx: GET /api/user/exchanges                  │
│     - DL-008: JWT token en headers                              │
│                                                                  │
│ 3b. Carga Símbolos Disponibles                                  │
│     - useEffect línea 101: loadAvailableSymbols()               │
│     - API: GET /api/available-symbols                           │
│     - Response: ~200 pares USDT desde Binance                   │
│     - Código línea 148-189                                      │
│                                                                  │
│ 3c. Carga Market Types                                          │
│     - useEffect línea 108: loadMarketTypes()                    │
│     - API: GET /api/user/exchanges/{id}/market-types            │
│     - Response: [SPOT, FUTURES_USDT, MARGIN_CROSS, etc.]        │
│     - Código línea 192-252                                      │
│                                                                  │
│ 3d. Carga Estrategias                                           │
│     - useEffect línea 115: loadStrategies()                     │
│     - Hardcoded línea 259-263:                                  │
│       - Smart Scalper - Wyckoff + Order Blocks                  │
│       - Manipulation Detector - Anti-Whales                     │
│       - Trend Hunter - SMC + Market Profile                     │
│     - ⚠️ NOTA: Debería venir de API backend                     │
│                                                                  │
│ 3e. Carga Base Currencies (cuando selecciona exchange)          │
│     - useEffect línea 122: loadBaseCurrencies()                 │
│     - API: GET /api/user/exchanges/{id}/symbol-details          │
│     - Response: [USDT, BTC, ETH, BNB, etc.]                     │
│     - Código línea 285-333                                      │
│                                                                  │
│ 3f. Carga Trading Intervals (cuando selecciona exchange)        │
│     - useEffect línea 122: loadTradingIntervals()               │
│     - API: GET /api/user/exchanges/{id}/trading-intervals       │
│     - Response: [1m, 5m, 15m, 1h, 4h, 1d] con recommended       │
│     - Código línea 336-389                                      │
│                                                                  │
│ 3g. Carga Margin Types (cuando selecciona exchange)             │
│     - useEffect línea 122: loadMarginTypes()                    │
│     - API: GET /api/user/exchanges/{id}/margin-types            │
│     - Response: [CROSS, ISOLATED] con descriptions              │
│     - Código línea 392-444                                      │
│                                                                  │
│ 3h. Real-Time Price Data (cuando selecciona symbol)             │
│     - useEffect línea 131: loadRealTimeData()                   │
│     - DL-019 Failover System línea 453-523:                     │
│       LAYER 1: /api/market-data/{symbol}?simple=true            │
│       LAYER 2: /api/real-market/{symbol}                        │
│       LAYER 3: https://api.binance.com/api/v3/ticker/price      │
│     - Muestra precio + status indicator (🟢🔵🟠🔴)              │
│     - Código línea 525-600                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Usuario Llena Formulario (62 campos)                   │
│                                                                  │
│ Campos Básicos (Requeridos):                                    │
│ - name: Nombre del bot                                          │
│ - exchange_id: Exchange seleccionado                            │
│ - symbol: Par trading (ej. BTCUSDT)                             │
│ - stake: Capital por operación                                  │
│ - take_profit: % ganancia objetivo                              │
│ - stop_loss: % pérdida máxima                                   │
│ - strategy: Estrategia IA seleccionada                          │
│ - interval: Timeframe análisis                                  │
│                                                                  │
│ Campos Market (Condicionales):                                  │
│ - market_type: SPOT/FUTURES_USDT/MARGIN                         │
│ - leverage: Si market_type permite (1-125x)                     │
│ - margin_type: Si futures (CROSS/ISOLATED)                      │
│                                                                  │
│ Configuración Avanzada (Colapsable línea 1094):                 │
│ - interval: Intervalo trading                                   │
│ - risk_profile: CONSERVATIVE/MODERATE/AGGRESSIVE                │
│ - risk_percentage: 0.1-10%                                      │
│ - dca_levels: 1-10 niveles                                      │
│ - max_open_positions: 1-20 posiciones                           │
│ - cooldown_minutes: 0-1440 minutos                              │
│ - min_entry_price: Precio mínimo                                │
│ - min_volume: Volumen mínimo 24h                                │
│ - entry_order_type: MARKET/LIMIT/STOP_LIMIT                     │
│ - exit_order_type: MARKET/LIMIT                                 │
│ - tp_order_type: LIMIT/MARKET                                   │
│ - sl_order_type: STOP_MARKET/STOP_LIMIT                         │
│ - trailing_stop: true/false                                     │
│                                                                  │
│ Estado formData línea 41-67                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Usuario Click "Crear Bot"                              │
│ Validaciones Frontend (línea 690-704):                          │
│ - ✅ Nombre no vacío                                            │
│ - ✅ Exchange seleccionado                                      │
│ - ✅ Stake > 0                                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Frontend - HTTP POST Request                           │
│ Archivo: EnhancedBotCreationModal.jsx línea 706-777            │
│                                                                  │
│ Request:                                                         │
│ POST /api/create-bot                                            │
│ Headers:                                                         │
│   Authorization: Bearer {JWT_TOKEN}  // DL-008                  │
│   Content-Type: application/json                                │
│ Body: {                                                          │
│   name, symbol, exchange_id, base_currency, quote_currency,     │
│   stake, strategy, interval, take_profit, stop_loss,            │
│   dca_levels, risk_percentage, risk_profile,                    │
│   market_type, leverage, margin_type,                           │
│   min_volume, min_entry_price, max_orders_per_pair,             │
│   entry_order_type, exit_order_type,                            │
│   tp_order_type, sl_order_type, trailing_stop,                 │
│   max_open_positions, cooldown_minutes                          │
│ }                                                                │
│                                                                  │
│ Hook utilizado: authenticatedFetch() - useAuthDL008             │
│ Código línea 733-736                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: Backend - routes/bots.py                               │
│ Archivo: backend/routes/bots.py línea 23-60                    │
│                                                                  │
│ Endpoint: @router.post("/api/create-bot")                       │
│ Handler: async def create_bot(...)                              │
│                                                                  │
│ 7a. Autenticación DL-008 (línea 24):                            │
│     current_user: User = Depends(get_current_user_safe)         │
│     - Verifica JWT token válido                                 │
│     - Extrae user_id del token                                  │
│     - Raise 401 si token inválido                               │
│                                                                  │
│ 7b. Validación Exchange (línea 28-35):                          │
│     if bot_data.exchange_id:                                    │
│       exchange = db.query(UserExchange).filter(                 │
│         UserExchange.id == bot_data.exchange_id,                │
│         UserExchange.user_id == current_user.id                 │
│       ).first()                                                 │
│       if not exchange:                                          │
│         raise HTTPException(400, "Exchange no encontrado")      │
│                                                                  │
│ 7c. Crear BotConfig (línea 37-45):                              │
│     new_bot = BotConfig(                                        │
│       user_id=current_user.id,  # Asociar a usuario             │
│       **bot_data.dict()  # Todos los 62 parámetros              │
│     )                                                            │
│                                                                  │
│ 7d. Guardar en Database (línea 47-49):                          │
│     db.add(new_bot)                                             │
│     db.commit()                                                 │
│     db.refresh(new_bot)  # Obtener ID generado                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 8: Database - SQLite/PostgreSQL                           │
│ Tabla: bot_config                                               │
│                                                                  │
│ INSERT INTO bot_config (                                        │
│   user_id, exchange_id, name, symbol,                           │
│   base_currency, quote_currency, stake, strategy, interval,     │
│   take_profit, stop_loss, dca_levels, risk_percentage,          │
│   risk_profile, market_type, leverage, margin_type,             │
│   min_volume, min_entry_price, max_orders_per_pair,             │
│   entry_order_type, exit_order_type,                            │
│   tp_order_type, sl_order_type, trailing_stop,                 │
│   max_open_positions, cooldown_minutes,                         │
│   wyckoff_prior_trend_bars, wyckoff_volume_increase_factor,     │
│   ... (18 parámetros Wyckoff),                                  │
│   active, status, created_at                                    │
│ ) VALUES (                                                       │
│   {current_user.id}, {exchange_id}, '{name}', '{symbol}',       │
│   ... (todos los valores del formulario)                        │
│ )                                                                │
│                                                                  │
│ RETURNING id, created_at;                                       │
│                                                                  │
│ Resultado: Bot creado con ID único                              │
│ ✅ 62 parámetros almacenados en database                        │
│ ⚠️ Pero solo 4 serán consumidos en ejecución                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 9: Backend - Response                                     │
│ routes/bots.py línea 51-52                                      │
│                                                                  │
│ return {                                                         │
│   "success": True,                                              │
│   "bot": new_bot  // BotConfig completo con ID                  │
│ }                                                                │
│                                                                  │
│ Status: 200 OK                                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 10: Frontend - Handle Response                            │
│ EnhancedBotCreationModal.jsx línea 738-776                     │
│                                                                  │
│ if (response.ok) {                                              │
│   const result = await response.json();                         │
│   onBotCreated(result);  // Callback a BotsModular              │
│   onClose();  // Cerrar modal                                   │
│   // Reset form                                                 │
│ }                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 11: Frontend - Actualizar Lista Bots                      │
│ BotsModular.jsx → useBotManagement.js                          │
│                                                                  │
│ handleCreateBot() actualiza lista bots:                         │
│ - Agrega nuevo bot a state.bots                                 │
│ - Actualiza métricas dashboard                                  │
│ - Muestra mensaje success                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 12: Usuario Ve Nuevo Bot en Tabla                         │
│ Componente: ProfessionalBotsTable.jsx                          │
│                                                                  │
│ Bot aparece con:                                                │
│ - Estado: STOPPED (default)                                     │
│ - Todas las configuraciones guardadas                           │
│ - Acciones disponibles: Start, View, Settings, Delete          │
└─────────────────────────────────────────────────────────────────┘

✅ FIN FLUJO CREAR BOT
```

---

### **FLUJO 2: Ejecutar Bot (Start Trading) - ACTUAL**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Click "▶️ Start" en Bot                        │
│ Ubicación: ProfessionalBotsTable.jsx línea 330-342             │
│ Componente: Botón Play/Pause                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - Handler onToggleBotStatus                   │
│ ProfessionalBotsTable.jsx línea 338                            │
│ onClick={() => onToggleBotStatus(bot.id, bot.status)}          │
│                                                                  │
│ Llama a: useBotOperations.js → toggleBotStatus()               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Frontend - HTTP PATCH Request                          │
│ Hook: useBotOperations.js                                       │
│                                                                  │
│ Request:                                                         │
│ PATCH /api/bots/{bot_id}/status                                │
│ Headers:                                                         │
│   Authorization: Bearer {JWT_TOKEN}                             │
│ Body: {                                                          │
│   status: "RUNNING"                                             │
│ }                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - routes/bots.py                               │
│ Endpoint: PATCH /api/bots/{bot_id}/status                      │
│                                                                  │
│ 4a. Autenticación DL-008                                        │
│ 4b. Verificar bot pertenece a usuario                           │
│ 4c. Actualizar status en database:                              │
│     bot.status = "RUNNING"                                      │
│     bot.updated_at = datetime.now()                             │
│     db.commit()                                                 │
│                                                                  │
│ Response: {"success": True, "bot": bot}                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: ❌ PROBLEMA - NO HAY EJECUCIÓN AUTOMÁTICA              │
│                                                                  │
│ ⚠️ CRÍTICO: Cambiar status NO inicia trading automático        │
│ ⚠️ FALTA: Loop ejecutión periódica basado en bot.interval      │
│ ⚠️ FALTA: Scheduler que ejecute bot cada X minutos             │
│                                                                  │
│ Estado actual:                                                   │
│ - Bot status = RUNNING en database                              │
│ - Pero NO ejecuta trades automáticamente                        │
│ - Usuario debe llamar /api/run-smart-trade manualmente          │
└─────────────────────────────────────────────────────────────────┘

❌ FIN FLUJO EJECUTAR BOT (INCOMPLETO)
```

---

### **FLUJO 3: Análisis Smart Money (Manual) - ACTUAL**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Frontend - Manual Trigger                              │
│ ⚠️ NOTA: Actualmente NO hay trigger automático                 │
│ Usuario debe llamar manualmente o via cron job externo         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - HTTP POST Request                           │
│                                                                  │
│ Request:                                                         │
│ POST /api/run-smart-trade/{symbol}                             │
│ Headers:                                                         │
│   Authorization: Bearer {JWT_TOKEN}                             │
│ Body: {}  // ❌ NO incluye bot_id, NO incluye bot config        │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Backend - routes/real_trading_routes.py                │
│ Archivo: backend/routes/real_trading_routes.py línea 89-150    │
│                                                                  │
│ Endpoint: @router.post("/api/run-smart-trade/{symbol}")         │
│                                                                  │
│ ❌ PROBLEMA: NO recibe bot_id como parámetro                    │
│ ❌ PROBLEMA: NO tiene acceso a BotConfig                        │
│ ❌ RESULTADO: Usa valores hardcoded internos                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - Cargar Market Data                           │
│ real_trading_routes.py                                          │
│                                                                  │
│ 4a. Obtener klines (velas) de exchange:                         │
│     intervals = ["5m", "15m", "1h"]  // ❌ HARDCODED            │
│     ⚠️ Debería usar bot.interval                                │
│                                                                  │
│ 4b. Crear TimeframeData para cada interval                      │
│     timeframe_data = {                                          │
│       "5m": TimeframeData(...),                                 │
│       "15m": TimeframeData(...),                                │
│       "1h": TimeframeData(...)                                  │
│     }                                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Backend - Análisis Wyckoff                             │
│ services/wyckoff/accumulation_detector.py                      │
│ services/wyckoff/distribution_detector.py                      │
│                                                                  │
│ 5a. Detectar fase acumulación:                                  │
│     - detect_accumulation(timeframe_data)                       │
│     - Detecta: PS, SC, AR, ST, Spring, LPS, SOS, BU             │
│                                                                  │
│ 5b. Detectar fase distribución:                                 │
│     - detect_distribution(timeframe_data)                       │
│     - Detecta: PSY, BC, AR, ST, UTAD, LPSY, SOW, BU             │
│                                                                  │
│ ❌ PROBLEMA: Parámetros Wyckoff hardcoded                       │
│ ⚠️ bot.wyckoff_prior_trend_bars NO usado                        │
│ ⚠️ bot.wyckoff_volume_increase_factor NO usado                  │
│ ⚠️ 18 parámetros Wyckoff ignorados completamente                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Backend - Signal Quality Assessment                    │
│ services/signal_quality_assessor.py                            │
│                                                                  │
│ signal_quality = signal_assessor.assess_signal_quality(         │
│   symbol=symbol,                                                │
│   microstructure=microstructure,                                │
│   institutional=institutional,                                  │
│   multi_tf=multi_tf_signal,                                     │
│   timeframe_data=timeframe_data                                 │
│ )                                                                │
│                                                                  │
│ Resultado:                                                       │
│ {                                                                │
│   "quality_score": 0.75,                                        │
│   "wyckoff": {wyckoff_signals},                                 │
│   "order_blocks": None,  // ❌ NO IMPLEMENTADO                  │
│   "liquidity_grabs": None,  // ❌ NO IMPLEMENTADO               │
│   "stop_hunting": None  // ❌ NO IMPLEMENTADO                   │
│ }                                                                │
│                                                                  │
│ ❌ SOLO 1 de 12 algoritmos institucionales funcionando          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: Backend - Response (NO ejecuta trade)                  │
│                                                                  │
│ return {                                                         │
│   "symbol": symbol,                                             │
│   "signal_quality": signal_quality,                             │
│   "wyckoff": wyckoff_analysis,                                  │
│   "recommendation": "BUY" | "SELL" | "NEUTRAL"                  │
│ }                                                                │
│                                                                  │
│ ⚠️ NOTA: Retorna análisis pero NO ejecuta trade                 │
│ ⚠️ FALTA: Llamar a real_trading_engine.execute_trade()          │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 8: Frontend - Recibe Análisis                             │
│                                                                  │
│ Frontend recibe análisis Smart Money                            │
│ Muestra en InstitutionalChart.jsx o AdvancedMetrics.jsx        │
│                                                                  │
│ ❌ PERO: No ejecutó ningún trade real                           │
│ ❌ Solo análisis, sin acción                                    │
└─────────────────────────────────────────────────────────────────┘

⚠️ FIN FLUJO ANÁLISIS (INCOMPLETO - SIN EJECUCIÓN)
```

---

## 🔧 **INTEGRACIÓN**

### **DL-008: Autenticación JWT (Compliance COMPLETO)**

```python
# IMPLEMENTACIÓN: backend/routes/bots.py
# IMPLEMENTACIÓN: backend/routes/real_trading_routes.py

# TODOS los endpoints protegidos con get_current_user_safe()

@router.post("/api/create-bot")
async def create_bot(
    bot_data: BotCreate,
    current_user: User = Depends(get_current_user_safe),  # ✅ DL-008
    db: Session = Depends(get_db)
):
    # ✅ Token JWT verificado
    # ✅ current_user extraído del token
    # ✅ Asociación bot → usuario automática
    pass

@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,
    current_user: User = Depends(get_current_user_safe),  # ✅ DL-008
    db: Session = Depends(get_db)
):
    # ✅ Solo usuarios autenticados
    pass
```

**Frontend - Hook Centralizado:**
```javascript
// IMPLEMENTACIÓN: frontend/src/shared/hooks/useAuthDL008.js
// IMPLEMENTACIÓN: frontend/src/components/EnhancedBotCreationModal.jsx:19

const { authenticatedFetch } = useAuthDL008();

// Todas las llamadas API usan authenticatedFetch
const response = await authenticatedFetch('/api/create-bot', {
  method: 'POST',
  body: JSON.stringify(formData)
});
// ✅ Automáticamente agrega JWT token en headers
```

**Verificación DL-008:**
- ✅ 43 endpoints protegidos con get_current_user_safe()
- ✅ Frontend usa useAuthDL008() en todos los componentes
- ✅ Token refresh automático
- ✅ Logout automático si token expirado

---

### **DL-001: No Hardcode / No Fallback / No Simulation**

#### **✅ COMPLIANT (Frontend):**

```javascript
// EnhancedBotCreationModal.jsx - Sin Math.random()
// BotsModular.jsx - Sin datos simulados
// ProfessionalBotsTable.jsx - PnL real desde bot.metrics

// Línea 100: PnL real
const rawPnL = bot.metrics?.realizedPnL || 0;  // ✅ Dato real o 0
const pnl = isNaN(rawPnL) ? 0 : Number(rawPnL);  // ✅ Validación
```

#### **❌ VIOLATIONS (Backend):**

```python
# real_trading_engine.py - Valores hardcoded
stake = 1000  # ❌ HARDCODE - Debería ser bot.stake
leverage = 1  # ❌ HARDCODE - Debería ser bot.leverage

# real_trading_routes.py - Intervals hardcoded
intervals = ["5m", "15m", "1h"]  # ❌ HARDCODE - Debería usar bot.interval

# wyckoff detectores - Parámetros hardcoded
volume_factor = 1.5  # ❌ HARDCODE - Debería ser bot.wyckoff_volume_increase_factor
```

**Impacto DL-001 Violations:**
- 58 de 62 parámetros bot ignorados = 93.5% configuración inútil
- Usuario configura leverage pero se ignora
- Usuario configura interval pero backend usa hardcoded
- Wyckoff usa parámetros internos, no configurables por bot

---

### **DL-076: Components <150 líneas**

#### **✅ COMPLIANT:**
- BotsModular.jsx: **141 líneas** ✅
- useBotManagement.js: **174 líneas** (hook, permitido >150)
- useBotCrud.js: **120 líneas** ✅
- useBotOperations.js: **85 líneas** ✅
- InstitutionalChart.jsx: **108 líneas** ✅

#### **❌ VIOLATIONS:**
- EnhancedBotCreationModal.jsx: **1,452 líneas** ❌ (10x límite)
- ProfessionalBotsTable.jsx: **498 líneas** ❌ (3.3x límite)
- BotControlPanel.jsx: **367 líneas** ❌ (2.4x límite)

**Plan Descomposición (Sección 8):**
- EnhancedBotCreationModal → 4 componentes <150 líneas
- ProfessionalBotsTable → Vista tarjetas responsive
- BotControlPanel → 3 componentes especializados

---

### **INTEGRACIÓN WYCKOFF (DL-113)**

```python
# ARQUITECTURA ACTUAL:
# backend/services/wyckoff/
#   ├── accumulation_detector.py (✅ Completo)
#   ├── distribution_detector.py (✅ Completo)
#   ├── markup_detector.py (✅ Completo)
#   └── markdown_detector.py (✅ Completo)

# INTEGRACIÓN EN SIGNAL ASSESSOR:
# backend/services/signal_quality_assessor.py

def assess_signal_quality(self, ...):
    # ✅ Wyckoff integrado
    wyckoff_signals = self._assess_wyckoff_signals(
        institutional, timeframe_data
    )

    # ❌ PROBLEMA: Parámetros NO pasados desde bot_config
    # Detectores usan valores internos hardcoded
```

**Gap Integración Wyckoff:**
```python
# bot_config.py define 18 parámetros Wyckoff (líneas 79-109)
wyckoff_prior_trend_bars: int = Field(default=10)
wyckoff_volume_increase_factor: float = Field(default=1.5)
wyckoff_atr_factor: float = Field(default=0.5)
# ... 15 más

# ❌ PERO: accumulation_detector.py NO recibe estos parámetros
# ❌ USA: Valores internos hardcoded
VOLUME_INCREASE_FACTOR = 1.5  # Hardcoded, debería venir de bot config
ATR_FACTOR = 0.5  # Hardcoded
```

**Solución Requerida:**
```python
# OBJETIVO: Pasar bot_config a detectores

# real_trading_routes.py
bot = db.query(BotConfig).filter(BotConfig.id == bot_id).first()

wyckoff_analysis = await wyckoff_analyzer.analyze_market(
    symbol=symbol,
    bot_config=bot  # ✅ Pasar config completo
)

# accumulation_detector.py
def detect_accumulation(self, timeframe_data, bot_config: BotConfig):
    # ✅ Usar parámetros del bot
    volume_factor = bot_config.wyckoff_volume_increase_factor
    atr_factor = bot_config.wyckoff_atr_factor
    # ...
```

---

### **EXCHANGE INTEGRATION (API Binance/Exchange Usuario)**

```python
# ARQUITECTURA ACTUAL:
# backend/services/binance_service.py (Exchange client)
# backend/routes/exchange_routes.py (CRUD exchanges usuario)

# FLUJO INTEGRACIÓN:
# 1. Usuario configura exchange en Exchange Management
# 2. Credentials encriptadas (DL-003 Encryption)
# 3. Bot asociado a exchange_id
# 4. Trading usa credentials desencriptadas

# EnhancedBotCreationModal.jsx línea 28:
exchange_id: Optional[int] = Field(foreign_key="userexchange.id")

# ✅ Validación exchange pertenece a usuario (bots.py línea 28-35)
```

---

## 🎨 **DISEÑO UX/UI**

### **NAVEGACIÓN COMPLETA USUARIO**

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN / REGISTRO                           │
│  URL: /login                                                     │
│  Componente: Login.jsx                                           │
│  Flujo: Email/Password → JWT Token → Redirect /dashboard        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DASHBOARD PRINCIPAL                            │
│  URL: /dashboard                                                 │
│  Layout: Sidebar (Lateral) + Content Area                       │
│                                                                  │
│  SIDEBAR ITEMS:                                                  │
│  ├── 📊 Dashboard                                               │
│  ├── 💼 Portfolio                                               │
│  ├── 🤖 Bots ◀── AQUÍ INICIA BOT PANEL                         │
│  ├── 📈 Trading Live                                            │
│  ├── 🔌 Exchanges                                               │
│  └── ⚙️ Settings                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ Usuario Click "🤖 Bots"
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              BOTS PANEL - Vista Principal                        │
│  URL: /bots                                                      │
│  Componente: BotsModular.jsx                                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HEADER                                                   │  │
│  │  🤖 InteliBots AI (Modular)                              │  │
│  │                                                           │  │
│  │  [🚀 Crear Bot]  [📋 Templates]                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TABS                                                     │  │
│  │  [Dashboard] [Historial]                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DASHBOARD METRICS                                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │
│  │  │ Bots    │ │ PnL     │ │ Win     │ │ Trades  │       │  │
│  │  │ Activos │ │ Total   │ │ Rate    │ │ Total   │       │  │
│  │  │   12    │ │ +$1,234 │ │  68%    │ │   456   │       │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PROFESSIONAL BOTS TABLE                                  │  │
│  │  (Ver diseño detallado abajo)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### **MODAL: CREAR BOT (EnhancedBotCreationModal.jsx)**

```
┌─────────────────────────────────────────────────────────────────┐
│  CREAR BOT AVANZADO                                      [X]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  COLUMNA IZQUIERDA  │  │  COLUMNA DERECHA    │              │
│  │                     │  │                     │              │
│  │  📝 Nombre Bot      │  │  💰 Capital (Stake) │              │
│  │  [____________]     │  │  [$_____] [USDT ▼] │              │
│  │                     │  │                     │              │
│  │  🔌 Exchange        │  │  🎯 Take Profit (%) │              │
│  │  [Binance ●]        │  │  [2.5%___]          │              │
│  │  [Kraken  ○]        │  │  +$125 ganancia     │              │
│  │                     │  │                     │              │
│  │  💱 Par Trading     │  │  🛡️ Stop Loss (%)   │              │
│  │  [BTCUSDT ▼]        │  │  [1.5%___]          │              │
│  │  200 pares          │  │  -$75 pérdida máx   │              │
│  │                     │  │                     │              │
│  │  🏦 Tipo Mercado    │  │  🎲 Estrategia      │              │
│  │  [SPOT ▼]           │  │  [Smart Scalper ▼]  │              │
│  │  - SPOT             │  │  - Wyckoff + OB     │              │
│  │  - FUTURES USDT     │  │                     │              │
│  │  - MARGIN CROSS     │  │                     │              │
│  │                     │  │                     │              │
│  │  📊 Leverage        │  │  📊 Datos Tiempo    │              │
│  │  [1x - 125x]        │  │  Real               │              │
│  │  (Solo si Futures)  │  │  ┌────────────────┐ │              │
│  │                     │  │  │ BTCUSDT        │ │              │
│  └─────────────────────┘  │  │ $43,250 🟢Live │ │              │
│                           │  │ Balance: $1000 │ │              │
│  ⚙️ CONFIGURACIÓN         │  │ Exchange: BNC  │ │              │
│  AVANZADA [▼]             │  │ Actualiza: 5s  │ │              │
│                           │  └────────────────┘ │              │
│  (Cuando expande)         │                     │              │
│  ┌─────────────────────────────────────────┐   │              │
│  │ 📈 Intervalo: [15m ▼] ⭐                │   │              │
│  │ 🎯 Risk Profile: [MODERATE ▼]           │   │              │
│  │    - Conservative (0.5-1%)              │   │              │
│  │    - Moderate (1-2%)                    │   │              │
│  │    - Aggressive (3-5%)                  │   │              │
│  │                                          │   │              │
│  │ 💹 Risk %: [1.0%] por trade             │   │              │
│  │ 📉 DCA Levels: [3] niveles              │   │              │
│  │ 📊 Max Posiciones: [3] simultáneas      │   │              │
│  │ ⏱️ Cooldown: [15] minutos               │   │              │
│  │                                          │   │              │
│  │ 🔸 Tipo Margen: [ISOLATED ▼] ⭐         │   │              │
│  │ 💵 Precio Min: [$0] (opcional)          │   │              │
│  │ 📊 Volumen Min: [0] 24h                 │   │              │
│  │                                          │   │              │
│  │ 🎛️ TIPOS ÓRDENES:                       │   │              │
│  │   Entrada: [MARKET ▼]                   │   │              │
│  │   Salida:  [MARKET ▼]                   │   │              │
│  │   TP:      [LIMIT ▼]                    │   │              │
│  │   SL:      [STOP_MARKET ▼]              │   │              │
│  │   Trailing Stop: [☑️ Enabled]           │   │              │
│  └─────────────────────────────────────────┘   │              │
│                                                 │              │
│  [Cancelar]                      [Crear Bot]    │              │
└─────────────────────────────────────────────────┘              │
```

**Interacciones UX:**
1. **Auto-load Exchanges:** Al abrir, carga exchanges del usuario
2. **Dynamic Symbols:** Al seleccionar exchange, carga pares disponibles
3. **Market Type Validation:** Leverage solo visible si FUTURES seleccionado
4. **Real-Time Price:** Actualiza cada 5s con indicador estado (🟢🔵🟠🔴)
5. **Monetary Feedback:** Muestra $$ exactos de TP/SL basado en stake
6. **Advanced Config Collapse:** Oculta 13 campos avanzados por defecto
7. **Validation Real-Time:** Valida stake > 0, exchange seleccionado

---

### **TABLA PROFESIONAL BOTS (ProfessionalBotsTable.jsx)**

#### **Vista Desktop (>768px):**

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Bots Activos (12)                                                                 │
├───────┬────────┬────────┬─────────┬────────┬─────────┬────────┬───────┬──────────┤
│ Par / │ Estado │Capital │   PnL   │ Sharpe │Win Rate │ Trades │ TP/SL │ Acciones │
│ Strat │        │        │         │        │         │        │       │          │
├───────┼────────┼────────┼─────────┼────────┼─────────┼────────┼───────┼──────────┤
│ BTC   │   🟢   │ $1,000 │ +$234   │  2.45  │   72%   │   45   │ +2.5% │ ▶️👁️📊⚙️🗑️ │
│ Smart │RUNNING │  USDT  │ +23.4%  │        │         │        │ -1.5% │          │
│Scalper│        │        │         │        │         │        │       │          │
├───────┼────────┼────────┼─────────┼────────┼─────────┼────────┼───────┼──────────┤
│ ETH   │   🟡   │  $500  │  -$45   │  1.23  │   58%   │   12   │ +3.0% │ ▶️👁️📊⚙️🗑️ │
│ Trend │PAUSED  │  USDT  │  -9.0%  │        │         │        │ -2.0% │          │
│Hunter │        │        │         │        │         │        │       │          │
└───────┴────────┴────────┴─────────┴────────┴─────────┴────────┴───────┴──────────┘

LEYENDA ACCIONES:
▶️ = Start/Pause Bot
👁️ = Ver Algoritmos Avanzados (InstitutionalChart)
📊 = Ver Historial Trading específico del bot
⚙️ = Settings/Modificar Bot
🗑️ = Eliminar Bot
```

#### **Vista Mobile (<768px) - TARJETAS:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 BTCUSDT          🟢 RUNNING                              │
│ Smart Scalper · SPOT                                        │
│                                                              │
│ Capital: $1,000 USDT                                        │
│                                                              │
│ PnL: +$234 (+23.4%)  │  Win Rate: 72%                      │
│ Trades: 45           │  Sharpe: 2.45                       │
│                                                              │
│ [▶️ Start] [👁️ Ver] [⚙️ Config]                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🟣 ETHUSDT          🟡 PAUSED                               │
│ Trend Hunter · FUTURES_USDT 10x                            │
│                                                              │
│ Capital: $500 USDT                                          │
│                                                              │
│ PnL: -$45 (-9.0%)    │  Win Rate: 58%                      │
│ Trades: 12           │  Sharpe: 1.23                       │
│                                                              │
│ [▶️ Start] [👁️ Ver] [⚙️ Config]                            │
└─────────────────────────────────────────────────────────────┘
```

---

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

---

## 🔥 **5. ISSUES IDENTIFICADOS**

### **📋 RESUMEN EJECUTIVO**

| # | Issue | Severidad | Estado | Bloquea Operación |
|---|-------|-----------|--------|-------------------|
| 1 | 58/62 parámetros NO consumidos | 🔴 CRÍTICA | ❌ ACTIVO | ✅ SÍ |
| 2 | Solo 1/12 algoritmos implementados | 🔴 CRÍTICA | ❌ ACTIVO | ✅ SÍ |
| 3 | No ejecución automática bot | 🔴 CRÍTICA | ❌ ACTIVO | ✅ SÍ |
| 4 | No backtesting datos reales | 🔴 CRÍTICA | ❌ ACTIVO | ✅ SÍ |
| 5 | Wyckoff parámetros hardcoded | 🔴 CRÍTICA | ❌ ACTIVO | ⚠️ PARCIAL |
| 6 | Componentes violan DL-076 | 🟡 ALTA | ❌ ACTIVO | ❌ NO |
| 7 | BotsAdvanced legacy violations | 🟡 MEDIA | ✅ DESCARTADO | ❌ NO |
| 8 | No validación max_open_positions | 🟡 ALTA | ❌ ACTIVO | ⚠️ PARCIAL |

---

### **🔴 ISSUE #1: 58/62 PARÁMETROS NO CONSUMIDOS (93.5%)**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** Usuario configura 62 parámetros pero el bot ignora 93.5% de la configuración
**BLOQUEA OPERACIÓN:** ✅ SÍ (Bot no respeta configuración usuario)

#### **EVIDENCIA CÓDIGO:**

**1. Parámetros Definidos en Modelo:**
```python
# FILE: backend/models/bot_config.py:1-113
class BotConfig(SQLModel, table=True):
    __tablename__ = "bot_configs"

    # ✅ CONSUMIDOS (4 de 62):
    stake: float = Field(description="Capital por trade")  # ✅ USADO línea trading_engine.py:156
    take_profit: float = Field(description="% ganancia")   # ✅ USADO línea trading_engine.py:203
    stop_loss: float = Field(description="% pérdida")      # ✅ USADO línea trading_engine.py:204
    entry_order_type: str = Field(default="MARKET")        # ✅ USADO línea trading_engine.py:178

    # ❌ NO CONSUMIDOS (58 de 62):
    interval: str = Field(default="15m")                   # ❌ Backend usa hardcoded ["5m","15m","1h"]
    leverage: Optional[int] = Field(default=1)             # ❌ Quantity calc ignora leverage
    margin_type: Optional[str] = Field(default="ISOLATED") # ❌ No hay set_margin_type()
    cooldown_minutes: int = Field(default=5)               # ❌ No hay cooldown enforcement
    max_open_positions: int = Field(default=3)             # ❌ No validación pre-trade
    trailing_stop_percentage: Optional[float]              # ❌ No trailing stop lógica
    position_sizing_method: str = Field(default="FIXED")   # ❌ Siempre usa stake fijo

    # ❌ WYCKOFF (18 parámetros - NO pasados a detectors):
    wyckoff_prior_trend_bars: int = Field(default=10)              # Línea 56
    wyckoff_volume_increase_factor: float = Field(default=1.5)     # Línea 57
    wyckoff_spring_volume_increase: float = Field(default=2.0)     # Línea 58
    wyckoff_upthrust_volume_increase: float = Field(default=2.0)   # Línea 59
    wyckoff_accumulation_duration_min: int = Field(default=5)      # Línea 60
    wyckoff_distribution_duration_min: int = Field(default=5)      # Línea 61
    wyckoff_trading_range_ratio_min: float = Field(default=0.6)    # Línea 62
    wyckoff_trading_range_ratio_max: float = Field(default=1.4)    # Línea 63
    wyckoff_volume_climax_multiplier: float = Field(default=2.5)   # Línea 64
    wyckoff_stopping_volume_multiplier: float = Field(default=2.0) # Línea 65
    wyckoff_test_volume_multiplier: float = Field(default=0.5)     # Línea 66
    wyckoff_sos_volume_multiplier: float = Field(default=2.0)      # Línea 67
    wyckoff_lpsy_retest_tolerance: float = Field(default=0.02)     # Línea 68
    wyckoff_creek_depth_min: float = Field(default=0.03)           # Línea 69
    wyckoff_spring_depth_min: float = Field(default=0.02)          # Línea 70
    wyckoff_upthrust_height_min: float = Field(default=0.02)       # Línea 71
    wyckoff_phase_confidence_threshold: float = Field(default=0.7) # Línea 72
    wyckoff_enable_advanced_patterns: bool = Field(default=True)   # Línea 73
```

**2. Backend NO Recibe bot_id ni BotConfig:**
```python
# FILE: backend/routes/real_trading_routes.py:89-150
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,
    # ❌ CRITICAL: NO bot_id parameter
    # ❌ NO way to access BotConfig
    current_user: User = Depends(get_current_user_safe),  # DL-008 ✅
    db: Session = Depends(get_db)
):
    # ❌ Usa hardcoded intervals (línea 101)
    intervals = ["5m", "15m", "1h"]  # Debería usar bot.interval

    # ❌ No puede acceder a bot.leverage, bot.cooldown, bot.max_open_positions
    # ❌ No puede pasar wyckoff_* params a detectors
```

**3. Trading Engine Ignora Configuración:**
```python
# FILE: backend/services/real_trading_engine.py:145-210
def execute_smart_trade(self, symbol: str, user_id: int):
    # ❌ NO recibe bot_id como parámetro (línea 145)
    # ❌ NO carga BotConfig del database

    # ✅ USA solo estos 4 parámetros (hardcoded defaults):
    stake = 100.0           # Línea 156 - debería venir de bot.stake
    take_profit = 1.5       # Línea 203 - debería venir de bot.take_profit
    stop_loss = 1.0         # Línea 204 - debería venir de bot.stop_loss
    order_type = "MARKET"   # Línea 178 - debería venir de bot.entry_order_type

    # ❌ IGNORA 58 parámetros restantes
```

**4. Wyckoff Detectors NO Reciben Parámetros:**
```python
# FILE: backend/services/wyckoff/phase_a_detector.py:15-45
class PhaseADetector:
    def __init__(self):
        # ❌ NO recibe wyckoff_* params como constructor args
        # ❌ USA hardcoded values internos
        self.volume_increase_factor = 1.5  # Debería venir de bot.wyckoff_volume_increase_factor
        self.prior_trend_bars = 10         # Debería venir de bot.wyckoff_prior_trend_bars
```

```python
# FILE: backend/services/wyckoff/accumulation_detector.py:20-80
class AccumulationDetector:
    def detect_spring(self, data: pd.DataFrame) -> Dict:
        # ❌ Hardcoded thresholds (línea 45)
        volume_threshold = 2.0  # Debería venir de bot.wyckoff_spring_volume_increase
        depth_min = 0.02        # Debería venir de bot.wyckoff_spring_depth_min
```

#### **MAPEO COMPLETO PARÁMETROS:**

| Parámetro | Definido | Consumido | Ubicación Uso | Notas |
|-----------|----------|-----------|---------------|-------|
| **stake** | bot_config.py:28 | ✅ SÍ | real_trading_engine.py:156 | Capital por trade |
| **take_profit** | bot_config.py:29 | ✅ SÍ | real_trading_engine.py:203 | % ganancia objetivo |
| **stop_loss** | bot_config.py:30 | ✅ SÍ | real_trading_engine.py:204 | % pérdida límite |
| **entry_order_type** | bot_config.py:45 | ✅ SÍ | real_trading_engine.py:178 | MARKET/LIMIT |
| **interval** | bot_config.py:32 | ❌ NO | - | Backend usa ["5m","15m","1h"] hardcoded |
| **leverage** | bot_config.py:40 | ❌ NO | - | Cálculo quantity NO multiplica por leverage |
| **margin_type** | bot_config.py:41 | ❌ NO | - | No hay llamada set_margin_type() |
| **cooldown_minutes** | bot_config.py:42 | ❌ NO | - | No hay enforcement cooldown entre trades |
| **max_open_positions** | bot_config.py:43 | ❌ NO | - | No validación pre-trade count positions |
| **trailing_stop_percentage** | bot_config.py:44 | ❌ NO | - | No lógica trailing stop |
| **position_sizing_method** | bot_config.py:46 | ❌ NO | - | Solo usa FIXED (stake), ignora PERCENTAGE |
| **max_daily_loss** | bot_config.py:47 | ❌ NO | - | No circuit breaker diario |
| **max_drawdown_percentage** | bot_config.py:48 | ❌ NO | - | No stop total por drawdown |
| **profit_target_daily** | bot_config.py:49 | ❌ NO | - | No stop diario por profit |
| **partial_take_profit** | bot_config.py:50 | ❌ NO | - | No cierre parcial posiciones |
| **partial_tp_percentage_1** | bot_config.py:51 | ❌ NO | - | - |
| **partial_tp_price_1** | bot_config.py:52 | ❌ NO | - | - |
| **partial_tp_percentage_2** | bot_config.py:53 | ❌ NO | - | - |
| **partial_tp_price_2** | bot_config.py:54 | ❌ NO | - | - |
| **wyckoff_prior_trend_bars** | bot_config.py:56 | ❌ NO | - | Detectors usan 10 hardcoded |
| **wyckoff_volume_increase_factor** | bot_config.py:57 | ❌ NO | - | Detectors usan 1.5 hardcoded |
| **wyckoff_spring_volume_increase** | bot_config.py:58 | ❌ NO | - | Detectors usan 2.0 hardcoded |
| **wyckoff_upthrust_volume_increase** | bot_config.py:59 | ❌ NO | - | Detectors usan 2.0 hardcoded |
| **wyckoff_accumulation_duration_min** | bot_config.py:60 | ❌ NO | - | Detectors usan 5 hardcoded |
| **wyckoff_distribution_duration_min** | bot_config.py:61 | ❌ NO | - | Detectors usan 5 hardcoded |
| **wyckoff_trading_range_ratio_min** | bot_config.py:62 | ❌ NO | - | Detectors usan 0.6 hardcoded |
| **wyckoff_trading_range_ratio_max** | bot_config.py:63 | ❌ NO | - | Detectors usan 1.4 hardcoded |
| **wyckoff_volume_climax_multiplier** | bot_config.py:64 | ❌ NO | - | Detectors usan 2.5 hardcoded |
| **wyckoff_stopping_volume_multiplier** | bot_config.py:65 | ❌ NO | - | Detectors usan 2.0 hardcoded |
| **wyckoff_test_volume_multiplier** | bot_config.py:66 | ❌ NO | - | Detectors usan 0.5 hardcoded |
| **wyckoff_sos_volume_multiplier** | bot_config.py:67 | ❌ NO | - | Detectors usan 2.0 hardcoded |
| **wyckoff_lpsy_retest_tolerance** | bot_config.py:68 | ❌ NO | - | Detectors usan 0.02 hardcoded |
| **wyckoff_creek_depth_min** | bot_config.py:69 | ❌ NO | - | Detectors usan 0.03 hardcoded |
| **wyckoff_spring_depth_min** | bot_config.py:70 | ❌ NO | - | Detectors usan 0.02 hardcoded |
| **wyckoff_upthrust_height_min** | bot_config.py:71 | ❌ NO | - | Detectors usan 0.02 hardcoded |
| **wyckoff_phase_confidence_threshold** | bot_config.py:72 | ❌ NO | - | Detectors usan 0.7 hardcoded |
| **wyckoff_enable_advanced_patterns** | bot_config.py:73 | ❌ NO | - | Detectors siempre True |
| *(... 24 parámetros más NO consumidos)* | - | ❌ NO | - | Ver bot_config.py:75-113 |

**TOTAL:** 4 consumidos ✅ / 58 NO consumidos ❌ = **93.5% IGNORADO**

#### **PLAN CORRECCIÓN ISSUE #1:**

**FASE 1: CONSUMIR 4 PARÁMETROS BÁSICOS (YA FUNCIONAN)**
- ✅ stake, take_profit, stop_loss, entry_order_type

**FASE 2: PARÁMETROS CRÍTICOS PARA OPERACIÓN (URGENTE)**
```python
# FILE: backend/routes/real_trading_routes.py
@router.post("/api/run-smart-trade/{bot_id}")  # ← Agregar bot_id
async def run_smart_trade(
    bot_id: int,  # ← NEW
    symbol: str,
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db)
):
    # ✅ CARGAR BotConfig
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    if not bot:
        raise HTTPException(404, "Bot no encontrado")

    # ✅ PASAR configuración a trading engine
    result = engine.execute_smart_trade(
        symbol=symbol,
        user_id=current_user.id,
        bot_config=bot  # ← NEW
    )
```

```python
# FILE: backend/services/real_trading_engine.py
def execute_smart_trade(
    self,
    symbol: str,
    user_id: int,
    bot_config: BotConfig  # ← NEW
):
    # ✅ USAR configuración usuario
    intervals = [bot_config.interval]  # NO hardcoded
    stake = bot_config.stake
    leverage = bot_config.leverage or 1

    # ✅ VALIDAR max_open_positions
    open_count = self._count_open_positions(user_id)
    if open_count >= bot_config.max_open_positions:
        return {"error": "Max open positions reached"}

    # ✅ PASAR wyckoff params a detectors
    wyckoff_config = {
        'prior_trend_bars': bot_config.wyckoff_prior_trend_bars,
        'volume_increase_factor': bot_config.wyckoff_volume_increase_factor,
        # ... 16 params más
    }

    signal = self.signal_quality_assessor.assess_signal_quality(
        ...,
        wyckoff_config=wyckoff_config  # ← NEW
    )
```

**FASE 3: WYCKOFF PARAMETRIZABLE**
```python
# FILE: backend/services/wyckoff/phase_a_detector.py
class PhaseADetector:
    def __init__(self, config: Dict = None):  # ← NEW
        self.config = config or {}
        self.volume_increase_factor = self.config.get(
            'volume_increase_factor', 1.5
        )
        self.prior_trend_bars = self.config.get(
            'prior_trend_bars', 10
        )
```

**FASE 4: RISK MANAGEMENT COMPLETO**
```python
# Consumir:
# - cooldown_minutes → enforce time between trades
# - trailing_stop_percentage → dynamic stop loss
# - partial_take_profit → close 50% at TP1, 50% at TP2
# - max_daily_loss → circuit breaker
# - max_drawdown_percentage → stop total
```

---

### **🔴 ISSUE #2: SOLO 1/12 ALGORITMOS IMPLEMENTADOS (8.3%)**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** Consenso débil (1/6), alta tasa falsos positivos, no protección anti-manipulación
**BLOQUEA OPERACIÓN:** ✅ SÍ (Bot vulnerable a manipulación sin 12 algoritmos)

#### **EVIDENCIA CÓDIGO:**

**1. Algoritmos Definidos en Filosofía:**
```markdown
# FILE: docs/INTELLIGENT_TRADING/ALGORITHMS_OVERVIEW.md:45-92
12 ALGORITMOS INSTITUCIONALES SMART MONEY:
✅ 01. Wyckoff Method (DL-113) - ÚNICO IMPLEMENTADO
❌ 02. Order Blocks - NO IMPLEMENTADO (✅ ARQUITECTURA COMPLETA: 1,286 líneas)
❌ 03. Liquidity Grabs - NO IMPLEMENTADO (✅ ARQUITECTURA COMPLETA: 787 líneas)
❌ 04. Stop Hunting Detection - NO IMPLEMENTADO (✅ ARQUITECTURA COMPLETA: 962 líneas)
❌ 05. Fair Value Gaps (FVG) - NO IMPLEMENTADO (✅ ARQUITECTURA COMPLETA: 1,192 líneas)
❌ 06. Market Microstructure - NO IMPLEMENTADO (✅ ARQUITECTURA COMPLETA: 1,145 líneas)
❌ 07. Volume Spread Analysis (VSA) - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)
❌ 08. Market Profile - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)
❌ 09. Smart Money Concepts (SMC) - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)
❌ 10. Institutional Order Flow - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)
❌ 11. Accumulation/Distribution - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)
❌ 12. Composite Man Theory - NO IMPLEMENTADO (❌ ARQUITECTURA PENDIENTE)

ARQUITECTURAS TÉCNICAS DISPONIBLES:
✅ 6/12 algoritmos con arquitectura técnica completa (6,376 líneas totales)
✅ Cada arquitectura incluye:
   - Modelo matemático exacto con parámetros dinámicos
   - Sistema de scoring con métricas específicas por algoritmo
   - Integración backend completa (signal_quality_assessor)
   - UX Dashboard completo con diseño + código React
   - Endpoints API y estructura response
   - Plan de tests y validación
✅ Ver: docs/TECHNICAL_SPECS/ARCHITECTURE/INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/
```

**2. Backend Solo Integra Wyckoff:**
```python
# FILE: backend/services/signal_quality_assessor.py:200-280
def assess_signal_quality(
    self,
    institutional: Dict,
    timeframe_data: Dict[str, pd.DataFrame],
    symbol: str
) -> Dict:
    """Evalúa calidad señal con algoritmos institucionales"""

    # ✅ WYCKOFF IMPLEMENTADO (líneas 210-230)
    wyckoff_signals = self._assess_wyckoff_signals(
        institutional,
        timeframe_data
    )

    # ❌ PENDING: 11 algoritmos restantes
    order_blocks_signals = None      # Línea 235
    liquidity_grabs = None           # Línea 236
    stop_hunting = None              # Línea 237
    fvg_signals = None               # Línea 238
    microstructure_signals = None    # Línea 239
    vsa_signals = None               # Línea 240
    market_profile_signals = None    # Línea 241
    smc_signals = None               # Línea 242
    order_flow_signals = None        # Línea 243
    accumulation_distribution = None # Línea 244
    composite_man_signals = None     # Línea 245

    # ❌ CONSENSO DÉBIL: Solo 1 algoritmo (línea 250)
    consensus_score = self._calculate_consensus([
        wyckoff_signals  # Solo 1 de 12
    ])

    return {
        'quality_score': consensus_score,
        'algorithms_active': 1,  # ← Debería ser 12
        'algorithms_total': 12,
        'consensus_ratio': '1/6',  # ← Debería ser 3/6 o 6/12
        'wyckoff': wyckoff_signals,
        # ❌ 11 keys con None
    }
```

**3. Consenso Insuficiente:**
```python
# FILE: backend/services/signal_quality_assessor.py:400-450
def _calculate_consensus(self, algorithm_signals: List[Dict]) -> float:
    """
    CONSENSO ACTUAL: 1/6 algoritmos
    CONSENSO IDEAL: 3/6 (50%) o 6/12 (50%)

    PROBLEMA: Con solo Wyckoff, cualquier señal == 100% consensus
    NO HAY validación cruzada anti-manipulación
    """
    if not algorithm_signals:
        return 0.0

    # ❌ Solo cuenta Wyckoff (línea 420)
    bullish_count = sum(1 for sig in algorithm_signals if sig.get('signal') == 'BUY')
    bearish_count = sum(1 for sig in algorithm_signals if sig.get('signal') == 'SELL')

    # ❌ FALSA CONFIANZA: 1/1 = 100% (debería ser 1/12 = 8.3%)
    consensus = max(bullish_count, bearish_count) / len(algorithm_signals)

    return consensus * 100
```

**4. Frontend Muestra Gap:**
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

#### **IMPACTO OPERACIONAL:**

| Métrica | Actual (1/12) | Ideal (12/12) | Impacto |
|---------|---------------|---------------|---------|
| **Consenso** | 1/6 (16.7%) | 6/12 (50%) | 🔴 Débil, alta incertidumbre |
| **Falsos Positivos** | ~40% | ~10% | 🔴 4x más señales incorrectas |
| **Protección Manipulación** | ❌ NINGUNA | ✅ COMPLETA | 🔴 Vulnerable a stop hunting |
| **Confianza Señal** | 50-60% | 85-95% | 🔴 Trades prematuros |
| **Win Rate Esperado** | 45-55% | 65-75% | 🔴 20% menos ganancia |

#### **PLAN CORRECCIÓN ISSUE #2:**

**FASE 1: ALGORITMOS ANTI-MANIPULACIÓN (URGENTE)**
```
Prioridad: Stop Hunting + Liquidity Grabs
Objetivo: Protección inmediata contra trampas institucionales
Timeline: 2 semanas
```

```python
# FILE: backend/services/algorithms/stop_hunting_detector.py (NUEVO)
class StopHuntingDetector:
    """
    Detecta manipulación de stops antes de movimiento real:
    - Sweep zones con wicks largos + volumen alto
    - Price rejection rápida (< 3 velas)
    - Retorno a rango previo
    """
    def detect_stop_hunt(self, data: pd.DataFrame) -> Dict:
        recent = data.tail(20)

        # Buscar wicks > 60% de vela
        long_wicks = recent['high'] - recent['close'] > (recent['high'] - recent['low']) * 0.6

        # Validar volumen spike
        volume_spike = recent['volume'] > recent['volume'].rolling(10).mean() * 2

        # Detectar rejection rápida
        rejection = (recent['high'].shift(1) > recent['close']) & (recent['close'] > recent['low'])

        hunt_detected = (long_wicks & volume_spike & rejection).any()

        return {
            'detected': hunt_detected,
            'confidence': 0.85 if hunt_detected else 0.0,
            'zones': self._identify_hunt_zones(recent)
        }
```

```python
# FILE: backend/services/algorithms/liquidity_grabs_detector.py (NUEVO)
class LiquidityGrabsDetector:
    """
    Detecta cuando institucionales recolectan liquidez retail:
    - Breakout falso de nivel clave (resistance/support)
    - Volumen alto pero precio NO sustenta
    - Retorno dentro de rango en < 5 velas
    """
    def detect_liquidity_grab(self, data: pd.DataFrame, key_levels: List[float]) -> Dict:
        recent = data.tail(30)
        grabs = []

        for level in key_levels:
            # Detectar breakout
            breakout = (recent['high'] > level) & (recent['close'] < level)

            if breakout.any():
                # Validar retorno rápido
                breakout_idx = breakout.idxmax()
                bars_outside = len(recent.loc[breakout_idx:][recent['close'] > level])

                if bars_outside < 5:
                    grabs.append({
                        'level': level,
                        'type': 'liquidity_grab',
                        'confidence': 0.80,
                        'action': 'AVOID_LONG' if level > recent['close'].iloc[-1] else 'AVOID_SHORT'
                    })

        return {
            'detected': len(grabs) > 0,
            'grabs': grabs
        }
```

**FASE 2: ALGORITMOS CONTEXTO (6 SEMANAS)**
```
Prioridad: Order Blocks + FVG + Market Microstructure
Objetivo: Contexto estructura mercado
Timeline: 6 semanas
```

**FASE 3: ALGORITMOS CONFIRMACIÓN (8 SEMANAS)**
```
Prioridad: VSA + Market Profile + SMC + Order Flow
Objetivo: Confirmación multi-capa señales
Timeline: 8 semanas
```

**FASE 4: ALGORITMOS AVANZADOS (10 SEMANAS)**
```
Prioridad: Accumulation/Distribution + Composite Man
Objetivo: Detección intención institucional largo plazo
Timeline: 10 semanas
```

**INTEGRACIÓN CONSENSO ROBUSTO:**
```python
# FILE: backend/services/signal_quality_assessor.py
def assess_signal_quality(self, ...) -> Dict:
    # ✅ 12 ALGORITMOS
    wyckoff = self._assess_wyckoff_signals(...)
    stop_hunting = self.stop_hunting_detector.detect(...)  # NEW
    liquidity_grabs = self.liquidity_grabs_detector.detect(...)  # NEW
    order_blocks = self.order_blocks_detector.detect(...)  # NEW
    fvg = self.fvg_detector.detect(...)  # NEW
    # ... 7 más

    # ✅ CONSENSO 6/12 (50%) MÍNIMO
    all_signals = [wyckoff, stop_hunting, liquidity_grabs, ...]
    consensus_score = self._calculate_consensus(all_signals)

    # ✅ FILTRO: Solo ejecutar si >= 50% consenso
    if consensus_score < 50:
        return {'signal': 'NEUTRAL', 'reason': 'Consenso insuficiente'}

    return {
        'quality_score': consensus_score,
        'algorithms_active': 12,
        'consensus_ratio': f'{sum(1 for s in all_signals if s["signal"] != "NEUTRAL")}/12',
        # ... 12 algoritmos con data
    }
```

---

### **🔴 ISSUE #3: NO EJECUCIÓN AUTOMÁTICA BOT**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** Bot en estado RUNNING NO ejecuta trades automáticamente, usuario debe llamar manualmente /api/run-smart-trade cada vez
**BLOQUEA OPERACIÓN:** ✅ SÍ (No es bot autónomo, requiere intervención manual constante)

#### **EVIDENCIA CÓDIGO:**

**1. Frontend Cambia Status Pero NO Ejecuta:**
```jsx
// FILE: frontend/src/features/bots/hooks/useBotOperations.js:1-80
export const useBotOperations = () => {
  const startBotTrading = useCallback(async (botId, bot) => {
    console.log(`🚀 Iniciando bot ${botId} - ${bot.symbol}`);

    // ✅ CAMBIA STATUS A RUNNING (línea 25)
    const response = await authenticatedFetch(`/api/bots/${botId}/toggle-status`, {
      method: 'POST'
    });

    // ❌ NO INICIA EJECUCIÓN AUTOMÁTICA
    // ❌ NO HAY scheduler/interval basado en bot.interval
    // ❌ NO HAY llamada a /api/run-smart-trade automática

    return response;
  }, []);

  return { startBotTrading, stopBotTrading };
};
```

**2. Backend Solo Cambia Status DB:**
```python
# FILE: backend/routes/bots.py:200-230
@router.post("/api/bots/{bot_id}/toggle-status")
async def toggle_bot_status(
    bot_id: int,
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db)
):
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    # ✅ CAMBIA STATUS (línea 215)
    new_status = 'RUNNING' if bot.status == 'STOPPED' else 'STOPPED'
    bot.status = new_status
    db.commit()

    # ❌ NO INICIA SCHEDULER
    # ❌ NO CREA BACKGROUND TASK
    # ❌ NO LOOP BASADO EN bot.interval

    return {"status": new_status, "message": f"Bot {new_status.lower()}"}
```

**3. NO Existe Scheduler Service:**
```bash
# Búsqueda en backend/services/
$ ls backend/services/ | grep -i "schedul\|loop\|task\|worker"
# ❌ VACÍO - NO HAY scheduler service
# ❌ NO HAY background worker
# ❌ NO HAY task queue (Celery, RQ, etc.)
```

**4. Usuario Debe Ejecutar Manualmente:**
```python
# FILE: backend/routes/real_trading_routes.py:89
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(symbol: str, ...):
    # ✅ Ejecuta 1 análisis + 1 trade
    # ❌ NO SE EJECUTA AUTOMÁTICAMENTE
    # ❌ Usuario debe llamar manualmente cada vez
```

#### **COMPORTAMIENTO ACTUAL vs IDEAL:**

**ACTUAL (MANUAL):**
```
Usuario → Click "START" → Bot.status = RUNNING (DB) → ...nada más
Usuario → Espera 15min → Click "Ejecutar Trade" → /api/run-smart-trade → 1 análisis
Usuario → Espera 15min → Click "Ejecutar Trade" → /api/run-smart-trade → 1 análisis
...repite indefinidamente
```

**IDEAL (AUTOMÁTICO):**
```
Usuario → Click "START" → Bot.status = RUNNING (DB)
                      ↓
          Backend Scheduler inicia loop:
                      ↓
          Cada bot.interval (15m): /api/run-smart-trade automático
                      ↓
          Si señal BUY/SELL: Ejecuta trade
                      ↓
          Repite hasta Usuario → Click "STOP"
```

#### **PLAN CORRECCIÓN ISSUE #3:**

**OPCIÓN 1: SCHEDULER BACKEND (RECOMENDADO)**
```python
# FILE: backend/services/bot_scheduler.py (NUEVO)
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from typing import Dict
import asyncio

class BotScheduler:
    """
    Scheduler automático para bots RUNNING
    - 1 task por bot activo
    - Intervalo configurable (bot.interval)
    - Auto-stop si bot.status cambia a STOPPED
    """
    def __init__(self, trading_engine, db_session):
        self.scheduler = AsyncIOScheduler()
        self.trading_engine = trading_engine
        self.db = db_session
        self.active_jobs: Dict[int, str] = {}  # bot_id → job_id

    def start_bot_execution(self, bot_id: int, bot_config: BotConfig):
        """Inicia ejecución automática para 1 bot"""
        if bot_id in self.active_jobs:
            print(f"⚠️ Bot {bot_id} ya tiene scheduler activo")
            return

        # Parsear interval (ej: "15m" → 15 minutos)
        interval_minutes = self._parse_interval(bot_config.interval)

        # Crear job con APScheduler
        job = self.scheduler.add_job(
            func=self._execute_bot_trade,
            trigger=IntervalTrigger(minutes=interval_minutes),
            args=[bot_id, bot_config],
            id=f"bot_{bot_id}",
            replace_existing=True
        )

        self.active_jobs[bot_id] = job.id
        print(f"✅ Scheduler iniciado: Bot {bot_id} cada {interval_minutes}min")

    def stop_bot_execution(self, bot_id: int):
        """Detiene ejecución automática para 1 bot"""
        job_id = self.active_jobs.get(bot_id)
        if job_id:
            self.scheduler.remove_job(job_id)
            del self.active_jobs[bot_id]
            print(f"🛑 Scheduler detenido: Bot {bot_id}")

    async def _execute_bot_trade(self, bot_id: int, bot_config: BotConfig):
        """Ejecuta 1 iteración análisis + trade para bot"""
        # Validar bot sigue RUNNING (puede haber cambiado)
        bot = self.db.query(BotConfig).filter(BotConfig.id == bot_id).first()
        if not bot or bot.status != 'RUNNING':
            print(f"⚠️ Bot {bot_id} ya no está RUNNING, deteniendo scheduler")
            self.stop_bot_execution(bot_id)
            return

        # ✅ EJECUTAR TRADE AUTOMÁTICO
        try:
            result = await self.trading_engine.execute_smart_trade(
                symbol=bot_config.symbol,
                user_id=bot_config.user_id,
                bot_config=bot_config
            )
            print(f"✅ Bot {bot_id} ejecutado: {result}")
        except Exception as e:
            print(f"❌ Error ejecutando bot {bot_id}: {e}")

    def _parse_interval(self, interval: str) -> int:
        """Convierte '15m' → 15, '1h' → 60"""
        if interval.endswith('m'):
            return int(interval[:-1])
        elif interval.endswith('h'):
            return int(interval[:-1]) * 60
        elif interval.endswith('d'):
            return int(interval[:-1]) * 1440
        return 15  # default

    def start(self):
        """Inicia scheduler global"""
        self.scheduler.start()
        print("🚀 Bot Scheduler iniciado")

    def shutdown(self):
        """Detiene todos los schedulers"""
        self.scheduler.shutdown()
        print("🛑 Bot Scheduler detenido")
```

**INTEGRACIÓN EN BACKEND:**
```python
# FILE: backend/main.py
from fastapi import FastAPI
from backend.services.bot_scheduler import BotScheduler
from backend.services.real_trading_engine import RealTradingEngine

app = FastAPI()

# ✅ INICIALIZAR SCHEDULER AL STARTUP
@app.on_event("startup")
async def startup_event():
    # Crear scheduler global
    trading_engine = RealTradingEngine()
    scheduler = BotScheduler(trading_engine, get_db())
    app.state.scheduler = scheduler

    # ✅ CARGAR BOTS QUE ESTABAN RUNNING (recovery después de restart)
    db = next(get_db())
    running_bots = db.query(BotConfig).filter(BotConfig.status == 'RUNNING').all()

    for bot in running_bots:
        scheduler.start_bot_execution(bot.id, bot)
        print(f"♻️ Recuperado bot {bot.id} ({bot.symbol}) - {bot.interval}")

    # Iniciar scheduler
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    app.state.scheduler.shutdown()
```

**MODIFICAR ENDPOINT TOGGLE:**
```python
# FILE: backend/routes/bots.py
@router.post("/api/bots/{bot_id}/toggle-status")
async def toggle_bot_status(
    bot_id: int,
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db),
    request: Request  # ← Para acceder a app.state.scheduler
):
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    new_status = 'RUNNING' if bot.status == 'STOPPED' else 'STOPPED'
    bot.status = new_status
    db.commit()

    # ✅ INICIAR/DETENER SCHEDULER
    scheduler = request.app.state.scheduler

    if new_status == 'RUNNING':
        scheduler.start_bot_execution(bot.id, bot)  # ← NEW
        print(f"🚀 Bot {bot.id} iniciado con scheduler cada {bot.interval}")
    else:
        scheduler.stop_bot_execution(bot.id)  # ← NEW
        print(f"🛑 Bot {bot.id} detenido, scheduler removido")

    return {"status": new_status, "message": f"Bot {new_status.lower()}"}
```

**DEPENDENCIAS:**
```bash
# FILE: backend/requirements.txt
# Agregar:
APScheduler==3.10.4  # Scheduler robusto con triggers flexibles
```

---

### **🔴 ISSUE #4: NO BACKTESTING DATOS REALES**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** No se pueden validar algoritmos con datos históricos, deployment a producción = prueba en real con dinero
**BLOQUEA OPERACIÓN:** ✅ SÍ (Usuario indicó: *"es urgente... poder desafiar los algoritmos con datos reales asi sea en local"*)

#### **EVIDENCIA CÓDIGO:**

**1. NO Existe Backtesting Service:**
```bash
$ ls backend/services/ | grep -i "backtest\|historical\|simulation"
# ❌ VACÍO - NO HAY backtesting_engine.py
# ❌ NO HAY historical_data_fetcher.py
# ❌ NO HAY simulation service
```

**2. NO Existe Endpoint Backtesting:**
```bash
$ grep -r "backtest" backend/routes/
# ❌ VACÍO - NO HAY /api/backtest
# ❌ NO HAY /api/historical-analysis
```

**3. NO Existe Modelo DB para Backtests:**
```python
# FILE: backend/models/ (todos los archivos)
# ❌ NO HAY BacktestResult model
# ❌ NO HAY HistoricalTrade model
# ❌ NO HAY SimulationRun model
```

**4. Frontend NO Tiene UI Backtesting:**
```bash
$ find frontend/src -name "*backtest*" -o -name "*historical*" -o -name "*simulation*"
# ❌ VACÍO - NO HAY componente backtesting
# ❌ NO HAY modal histórico
# ❌ NO HAY gráficos performance histórica
```

#### **PROBLEMA ACTUAL:**

```
DESARROLLO ACTUAL:
1. Implementar algoritmo (ej: Wyckoff)
2. Deploy a producción
3. Ejecutar con dinero real
4. ❌ Esperar días/semanas para ver si funciona
5. ❌ Si falla → pérdidas reales
6. ❌ Ajustar parámetros a ciegas

IDEAL CON BACKTESTING:
1. Implementar algoritmo (ej: Wyckoff)
2. ✅ Cargar 6 meses datos históricos Binance
3. ✅ Simular 1000 trades en minutos
4. ✅ Análisis: Win Rate 68%, Sharpe 2.1, Max DD 15%
5. ✅ Optimizar parámetros: wyckoff_spring_volume_increase 1.8 → 2.2
6. ✅ Re-backtest: Win Rate 72%, Sharpe 2.4
7. Deploy a producción CON CONFIANZA
```

#### **PLAN CORRECCIÓN ISSUE #4:**

**FASE 1: BACKTESTING ENGINE CORE (URGENTE - 1 SEMANA)**

```python
# FILE: backend/services/backtesting_engine.py (NUEVO)
import pandas as pd
from typing import Dict, List
from datetime import datetime, timedelta
import ccxt

class BacktestingEngine:
    """
    Motor backtesting con datos reales Binance
    - Carga histórico real (NO simulado)
    - Replay trades como si fueran real-time
    - Calcula métricas: PnL, Win Rate, Sharpe, Max DD
    """

    def __init__(self, signal_quality_assessor, exchange_client):
        self.signal_assessor = signal_quality_assessor
        self.exchange = exchange_client

    async def run_backtest(
        self,
        bot_config: BotConfig,
        start_date: datetime,
        end_date: datetime,
        initial_balance: float = 10000.0
    ) -> Dict:
        """
        Ejecuta backtest completo

        Args:
            bot_config: Configuración bot (usa TODOS los 62 parámetros)
            start_date: Inicio período (ej: 2024-01-01)
            end_date: Fin período (ej: 2024-06-30)
            initial_balance: Capital inicial simulación

        Returns:
            {
                'total_trades': 450,
                'wins': 306,
                'losses': 144,
                'win_rate': 68.0,
                'total_pnl': 2340.50,
                'total_return_pct': 23.4,
                'sharpe_ratio': 2.1,
                'max_drawdown': 15.2,
                'avg_trade_duration': '3h 24min',
                'profit_factor': 1.85,
                'trades_detail': [...]
            }
        """

        print(f"🔍 Cargando datos históricos {bot_config.symbol} ({start_date} → {end_date})")

        # ✅ CARGAR DATOS HISTÓRICOS REALES
        historical_data = await self._fetch_historical_data(
            symbol=bot_config.symbol,
            interval=bot_config.interval,
            start_date=start_date,
            end_date=end_date
        )

        # ✅ INICIALIZAR ESTADO SIMULACIÓN
        balance = initial_balance
        position = None  # None | {'type': 'LONG', 'entry_price': 43000, 'quantity': 0.1, 'entry_time': datetime}
        trades_history = []
        equity_curve = []

        # ✅ REPLAY BAR-BY-BAR (simulando real-time)
        for i in range(len(historical_data)):
            current_bar = historical_data.iloc[i]
            timestamp = current_bar.name

            # Guardar equity actual
            current_equity = balance + (self._calculate_unrealized_pnl(position, current_bar['close']) if position else 0)
            equity_curve.append({'timestamp': timestamp, 'equity': current_equity})

            # ✅ VALIDAR COOLDOWN (usa bot_config.cooldown_minutes)
            if trades_history and self._is_in_cooldown(trades_history[-1], timestamp, bot_config.cooldown_minutes):
                continue

            # ✅ VALIDAR MAX OPEN POSITIONS (usa bot_config.max_open_positions)
            if position and not self._can_open_new_position(position, bot_config.max_open_positions):
                continue

            # ✅ SI HAY POSICIÓN ABIERTA: Verificar TP/SL
            if position:
                exit_result = self._check_exit_conditions(
                    position,
                    current_bar,
                    bot_config.take_profit,
                    bot_config.stop_loss,
                    bot_config.trailing_stop_percentage  # ✅ USA parámetro
                )

                if exit_result['should_exit']:
                    # Cerrar posición
                    pnl = exit_result['pnl']
                    balance += pnl

                    trades_history.append({
                        'entry_time': position['entry_time'],
                        'exit_time': timestamp,
                        'type': position['type'],
                        'entry_price': position['entry_price'],
                        'exit_price': exit_result['exit_price'],
                        'quantity': position['quantity'],
                        'pnl': pnl,
                        'pnl_pct': (pnl / (position['entry_price'] * position['quantity'])) * 100,
                        'duration': timestamp - position['entry_time'],
                        'exit_reason': exit_result['reason']  # 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP'
                    })

                    position = None
                    continue

            # ✅ SI NO HAY POSICIÓN: Buscar señal ENTRY
            if not position:
                # Obtener datos multi-timeframe hasta current bar
                mtf_data = self._get_multi_timeframe_data(historical_data, i, bot_config.interval)

                # ✅ EJECUTAR ANÁLISIS CON TODOS LOS PARÁMETROS
                signal = self.signal_assessor.assess_signal_quality(
                    institutional={},  # Construir de mtf_data
                    timeframe_data=mtf_data,
                    symbol=bot_config.symbol,
                    bot_config=bot_config  # ✅ PASA 62 parámetros (incluye wyckoff_*)
                )

                if signal['signal'] in ['BUY', 'SELL'] and signal['quality_score'] >= 60:
                    # Abrir posición
                    entry_price = current_bar['close']

                    # ✅ CALCULAR QUANTITY CON LEVERAGE (usa bot_config.leverage)
                    quantity = self._calculate_position_size(
                        balance=balance,
                        stake=bot_config.stake,
                        entry_price=entry_price,
                        leverage=bot_config.leverage,  # ✅ USA parámetro
                        position_sizing_method=bot_config.position_sizing_method  # ✅ USA parámetro
                    )

                    position = {
                        'type': signal['signal'],
                        'entry_price': entry_price,
                        'quantity': quantity,
                        'entry_time': timestamp,
                        'signal_quality': signal['quality_score']
                    }

                    print(f"📊 {timestamp} | {signal['signal']} @ ${entry_price} | Qty: {quantity} | Quality: {signal['quality_score']}")

        # ✅ CERRAR POSICIÓN FINAL SI QUEDA ABIERTA
        if position:
            final_bar = historical_data.iloc[-1]
            pnl = self._calculate_unrealized_pnl(position, final_bar['close'])
            balance += pnl
            trades_history.append({
                'entry_time': position['entry_time'],
                'exit_time': final_bar.name,
                'type': position['type'],
                'entry_price': position['entry_price'],
                'exit_price': final_bar['close'],
                'quantity': position['quantity'],
                'pnl': pnl,
                'pnl_pct': (pnl / (position['entry_price'] * position['quantity'])) * 100,
                'duration': final_bar.name - position['entry_time'],
                'exit_reason': 'END_OF_BACKTEST'
            })

        # ✅ CALCULAR MÉTRICAS
        metrics = self._calculate_backtest_metrics(
            trades_history,
            equity_curve,
            initial_balance,
            balance
        )

        return {
            **metrics,
            'trades_detail': trades_history,
            'equity_curve': equity_curve,
            'bot_config_used': {
                'symbol': bot_config.symbol,
                'interval': bot_config.interval,
                'stake': bot_config.stake,
                'leverage': bot_config.leverage,
                'take_profit': bot_config.take_profit,
                'stop_loss': bot_config.stop_loss,
                # ... incluir TODOS los parámetros usados
            }
        }

    async def _fetch_historical_data(
        self,
        symbol: str,
        interval: str,
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """
        Carga datos históricos REALES desde Binance
        NO simulación, NO hardcode
        """
        # Convertir intervalo a ccxt format
        timeframe = interval  # '15m', '1h', etc.

        # Fetch desde Binance
        since = int(start_date.timestamp() * 1000)
        end = int(end_date.timestamp() * 1000)

        all_candles = []
        current_since = since

        while current_since < end:
            candles = await self.exchange.fetch_ohlcv(
                symbol,
                timeframe=timeframe,
                since=current_since,
                limit=1000  # Max Binance
            )

            if not candles:
                break

            all_candles.extend(candles)
            current_since = candles[-1][0] + 1  # Último timestamp + 1ms

        # Convertir a DataFrame
        df = pd.DataFrame(
            all_candles,
            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
        )
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        df.set_index('timestamp', inplace=True)

        print(f"✅ Cargados {len(df)} velas históricas ({df.index[0]} → {df.index[-1]})")

        return df

    def _calculate_backtest_metrics(
        self,
        trades: List[Dict],
        equity_curve: List[Dict],
        initial_balance: float,
        final_balance: float
    ) -> Dict:
        """Calcula todas las métricas performance"""
        if not trades:
            return {
                'total_trades': 0,
                'wins': 0,
                'losses': 0,
                'win_rate': 0.0,
                'total_pnl': 0.0,
                'total_return_pct': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown': 0.0,
                'avg_trade_duration': '0h',
                'profit_factor': 0.0
            }

        wins = [t for t in trades if t['pnl'] > 0]
        losses = [t for t in trades if t['pnl'] <= 0]

        total_pnl = sum(t['pnl'] for t in trades)
        win_rate = (len(wins) / len(trades)) * 100 if trades else 0

        # Sharpe Ratio
        returns = [t['pnl_pct'] for t in trades]
        sharpe = (sum(returns) / len(returns)) / (pd.Series(returns).std() + 1e-10) if returns else 0

        # Max Drawdown
        equity_series = pd.Series([e['equity'] for e in equity_curve])
        running_max = equity_series.cummax()
        drawdown = (equity_series - running_max) / running_max * 100
        max_dd = abs(drawdown.min())

        # Avg Trade Duration
        avg_duration = sum([t['duration'].total_seconds() for t in trades]) / len(trades)
        avg_duration_str = f"{int(avg_duration // 3600)}h {int((avg_duration % 3600) // 60)}min"

        # Profit Factor
        gross_profit = sum(t['pnl'] for t in wins) if wins else 0
        gross_loss = abs(sum(t['pnl'] for t in losses)) if losses else 1
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0

        return {
            'total_trades': len(trades),
            'wins': len(wins),
            'losses': len(losses),
            'win_rate': round(win_rate, 1),
            'total_pnl': round(total_pnl, 2),
            'total_return_pct': round(((final_balance - initial_balance) / initial_balance) * 100, 2),
            'sharpe_ratio': round(sharpe, 2),
            'max_drawdown': round(max_dd, 2),
            'avg_trade_duration': avg_duration_str,
            'profit_factor': round(profit_factor, 2)
        }
```

**FASE 2: ENDPOINT BACKTESTING (1 SEMANA)**

```python
# FILE: backend/routes/backtest_routes.py (NUEVO)
from fastapi import APIRouter, Depends
from datetime import datetime
from backend.services.backtesting_engine import BacktestingEngine

router = APIRouter()

@router.post("/api/backtest/run")
async def run_backtest(
    bot_id: int,
    start_date: str,  # "2024-01-01"
    end_date: str,    # "2024-06-30"
    initial_balance: float = 10000.0,
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db)
):
    """
    Ejecuta backtest con configuración de bot existente
    """
    # Cargar bot config
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    if not bot:
        raise HTTPException(404, "Bot no encontrado")

    # Parsear fechas
    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    # Ejecutar backtest
    engine = BacktestingEngine(signal_quality_assessor, exchange_client)
    result = await engine.run_backtest(bot, start, end, initial_balance)

    # Guardar resultado en DB
    backtest_run = BacktestRun(
        bot_id=bot_id,
        start_date=start,
        end_date=end,
        initial_balance=initial_balance,
        final_balance=initial_balance + result['total_pnl'],
        total_trades=result['total_trades'],
        win_rate=result['win_rate'],
        sharpe_ratio=result['sharpe_ratio'],
        max_drawdown=result['max_drawdown'],
        profit_factor=result['profit_factor'],
        trades_detail=result['trades_detail'],
        created_at=datetime.now()
    )
    db.add(backtest_run)
    db.commit()

    return result

@router.get("/api/backtest/history/{bot_id}")
async def get_backtest_history(
    bot_id: int,
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db)
):
    """
    Retorna historial backtests para 1 bot
    """
    backtests = db.query(BacktestRun).filter(
        BacktestRun.bot_id == bot_id
    ).order_by(BacktestRun.created_at.desc()).limit(20).all()

    return backtests
```

**FASE 3: UI BACKTESTING (1 SEMANA)**

```jsx
// FILE: frontend/src/components/BacktestModal.jsx (NUEVO)
import React, { useState } from 'react';
import { Modal, DatePicker, InputNumber, Button, Table, Line } from 'antd';

export const BacktestModal = ({ bot, visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [config, setConfig] = useState({
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    initialBalance: 10000
  });

  const runBacktest = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/backtest/run', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: bot.id,
          start_date: config.startDate,
          end_date: config.endDate,
          initial_balance: config.initialBalance
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Backtest: ${bot.name} (${bot.symbol})`}
      visible={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
      {/* CONFIGURACIÓN */}
      <div className="backtest-config">
        <DatePicker.RangePicker
          value={[config.startDate, config.endDate]}
          onChange={([start, end]) => setConfig({
            ...config,
            startDate: start.format('YYYY-MM-DD'),
            endDate: end.format('YYYY-MM-DD')
          })}
        />

        <InputNumber
          prefix="$"
          value={config.initialBalance}
          onChange={(val) => setConfig({ ...config, initialBalance: val })}
        />

        <Button
          type="primary"
          loading={loading}
          onClick={runBacktest}
        >
          Ejecutar Backtest
        </Button>
      </div>

      {/* RESULTADOS */}
      {result && (
        <div className="backtest-results">
          {/* MÉTRICAS */}
          <div className="metrics-grid">
            <MetricCard label="Total Trades" value={result.total_trades} />
            <MetricCard label="Win Rate" value={`${result.win_rate}%`} color={result.win_rate >= 60 ? 'green' : 'red'} />
            <MetricCard label="Total PnL" value={`$${result.total_pnl}`} color={result.total_pnl > 0 ? 'green' : 'red'} />
            <MetricCard label="Return" value={`${result.total_return_pct}%`} color={result.total_return_pct > 0 ? 'green' : 'red'} />
            <MetricCard label="Sharpe Ratio" value={result.sharpe_ratio} />
            <MetricCard label="Max Drawdown" value={`${result.max_drawdown}%`} color="red" />
            <MetricCard label="Profit Factor" value={result.profit_factor} />
            <MetricCard label="Avg Duration" value={result.avg_trade_duration} />
          </div>

          {/* EQUITY CURVE */}
          <div className="equity-curve">
            <h3>Equity Curve</h3>
            <Line
              data={{
                labels: result.equity_curve.map(e => e.timestamp),
                datasets: [{
                  label: 'Equity',
                  data: result.equity_curve.map(e => e.equity),
                  borderColor: result.total_pnl > 0 ? 'green' : 'red',
                  fill: false
                }]
              }}
            />
          </div>

          {/* TRADES DETAIL */}
          <div className="trades-table">
            <h3>Trades Detail ({result.total_trades} trades)</h3>
            <Table
              dataSource={result.trades_detail}
              columns={[
                { title: 'Entry Time', dataIndex: 'entry_time', render: (t) => new Date(t).toLocaleString() },
                { title: 'Exit Time', dataIndex: 'exit_time', render: (t) => new Date(t).toLocaleString() },
                { title: 'Type', dataIndex: 'type' },
                { title: 'Entry Price', dataIndex: 'entry_price', render: (p) => `$${p.toFixed(2)}` },
                { title: 'Exit Price', dataIndex: 'exit_price', render: (p) => `$${p.toFixed(2)}` },
                { title: 'PnL', dataIndex: 'pnl', render: (pnl) => (
                  <span style={{ color: pnl > 0 ? 'green' : 'red' }}>
                    ${pnl.toFixed(2)} ({(pnl / config.initialBalance * 100).toFixed(2)}%)
                  </span>
                ) },
                { title: 'Duration', dataIndex: 'duration' },
                { title: 'Exit Reason', dataIndex: 'exit_reason' }
              ]}
              pagination={{ pageSize: 20 }}
              scroll={{ y: 400 }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};
```

**INTEGRACIÓN EN PANEL:**
```jsx
// FILE: frontend/src/components/ProfessionalBotsTable.jsx
// Agregar botón "Backtest" en acciones
<Button
  icon={<HistoryOutlined />}
  onClick={() => setBacktestModal({ visible: true, bot })}
>
  Backtest
</Button>
```

---

### **🔴 ISSUE #5: WYCKOFF PARÁMETROS HARDCODED**

**SEVERIDAD:** 🔴 CRÍTICA
**IMPACTO:** Usuario configura 18 parámetros Wyckoff pero detectors usan valores hardcoded internos
**BLOQUEA OPERACIÓN:** ⚠️ PARCIAL (Wyckoff funciona pero NO es configurable)

#### **EVIDENCIA CÓDIGO:**

**1. Parámetros Definidos en BotConfig:**
```python
# FILE: backend/models/bot_config.py:56-73
wyckoff_prior_trend_bars: int = Field(default=10, description="Velas análisis tendencia previa")
wyckoff_volume_increase_factor: float = Field(default=1.5, description="Factor aumento volumen")
wyckoff_spring_volume_increase: float = Field(default=2.0, description="Volumen Spring")
wyckoff_upthrust_volume_increase: float = Field(default=2.0, description="Volumen Upthrust")
# ... 14 parámetros más (líneas 60-73)
```

**2. Detectors NO Reciben Parámetros:**
```python
# FILE: backend/services/wyckoff/phase_a_detector.py:15
class PhaseADetector:
    def __init__(self):
        # ❌ NO acepta config parameter
        # ❌ Hardcoded values
        pass

    def detect_selling_climax(self, data: pd.DataFrame) -> Dict:
        # ❌ Hardcoded (línea 45)
        volume_threshold = 2.5  # Debería venir de bot.wyckoff_volume_climax_multiplier
        prior_trend_bars = 10   # Debería venir de bot.wyckoff_prior_trend_bars
```

```python
# FILE: backend/services/wyckoff/accumulation_detector.py:20
class AccumulationDetector:
    def __init__(self):
        # ❌ NO acepta config parameter
        pass

    def detect_spring(self, data: pd.DataFrame) -> Dict:
        # ❌ Hardcoded (líneas 55-58)
        volume_increase = 2.0  # Debería venir de bot.wyckoff_spring_volume_increase
        depth_min = 0.02       # Debería venir de bot.wyckoff_spring_depth_min
        retest_tolerance = 0.02  # Debería venir de bot.wyckoff_lpsy_retest_tolerance
```

**3. Signal Assessor NO Pasa Config:**
```python
# FILE: backend/services/signal_quality_assessor.py:210-230
def _assess_wyckoff_signals(self, institutional: Dict, timeframe_data: Dict) -> Dict:
    # ❌ NO recibe bot_config
    # ❌ NO puede pasar parámetros a detectors

    phase_a_detector = PhaseADetector()  # ← Sin config
    accumulation_detector = AccumulationDetector()  # ← Sin config

    # Detectors usan hardcoded values
    results = phase_a_detector.detect_selling_climax(data)
```

#### **PLAN CORRECCIÓN ISSUE #5:**

**PASO 1: Modificar Detectors para Aceptar Config**
```python
# FILE: backend/services/wyckoff/phase_a_detector.py
class PhaseADetector:
    def __init__(self, config: Dict = None):  # ← NEW
        self.config = config or {}

        # ✅ USAR config, fallback a default
        self.volume_climax_multiplier = self.config.get(
            'wyckoff_volume_climax_multiplier', 2.5
        )
        self.prior_trend_bars = self.config.get(
            'wyckoff_prior_trend_bars', 10
        )
        self.volume_increase_factor = self.config.get(
            'wyckoff_volume_increase_factor', 1.5
        )

    def detect_selling_climax(self, data: pd.DataFrame) -> Dict:
        # ✅ USAR self.volume_climax_multiplier (NO hardcoded)
        volume_threshold = self.volume_climax_multiplier
        recent = data.tail(self.prior_trend_bars)
        # ... resto lógica
```

**PASO 2: Signal Assessor Pasa Config**
```python
# FILE: backend/services/signal_quality_assessor.py
def assess_signal_quality(
    self,
    institutional: Dict,
    timeframe_data: Dict,
    symbol: str,
    bot_config: BotConfig = None  # ← NEW
) -> Dict:
    # ✅ EXTRAER wyckoff config
    wyckoff_config = {}
    if bot_config:
        wyckoff_config = {
            'wyckoff_prior_trend_bars': bot_config.wyckoff_prior_trend_bars,
            'wyckoff_volume_increase_factor': bot_config.wyckoff_volume_increase_factor,
            'wyckoff_spring_volume_increase': bot_config.wyckoff_spring_volume_increase,
            'wyckoff_upthrust_volume_increase': bot_config.wyckoff_upthrust_volume_increase,
            'wyckoff_accumulation_duration_min': bot_config.wyckoff_accumulation_duration_min,
            'wyckoff_distribution_duration_min': bot_config.wyckoff_distribution_duration_min,
            'wyckoff_trading_range_ratio_min': bot_config.wyckoff_trading_range_ratio_min,
            'wyckoff_trading_range_ratio_max': bot_config.wyckoff_trading_range_ratio_max,
            'wyckoff_volume_climax_multiplier': bot_config.wyckoff_volume_climax_multiplier,
            'wyckoff_stopping_volume_multiplier': bot_config.wyckoff_stopping_volume_multiplier,
            'wyckoff_test_volume_multiplier': bot_config.wyckoff_test_volume_multiplier,
            'wyckoff_sos_volume_multiplier': bot_config.wyckoff_sos_volume_multiplier,
            'wyckoff_lpsy_retest_tolerance': bot_config.wyckoff_lpsy_retest_tolerance,
            'wyckoff_creek_depth_min': bot_config.wyckoff_creek_depth_min,
            'wyckoff_spring_depth_min': bot_config.wyckoff_spring_depth_min,
            'wyckoff_upthrust_height_min': bot_config.wyckoff_upthrust_height_min,
            'wyckoff_phase_confidence_threshold': bot_config.wyckoff_phase_confidence_threshold,
            'wyckoff_enable_advanced_patterns': bot_config.wyckoff_enable_advanced_patterns
        }

    # ✅ PASAR config a detectors
    phase_a_detector = PhaseADetector(wyckoff_config)
    accumulation_detector = AccumulationDetector(wyckoff_config)
    distribution_detector = DistributionDetector(wyckoff_config)

    wyckoff_signals = self._assess_wyckoff_signals_with_config(
        institutional,
        timeframe_data,
        phase_a_detector,
        accumulation_detector,
        distribution_detector
    )
```

**PASO 3: Trading Engine Pasa bot_config**
```python
# FILE: backend/services/real_trading_engine.py
def execute_smart_trade(
    self,
    symbol: str,
    user_id: int,
    bot_config: BotConfig  # ← Ya agregado en Issue #1
):
    # ✅ PASAR bot_config a signal assessor
    signal = self.signal_quality_assessor.assess_signal_quality(
        institutional=institutional_analysis,
        timeframe_data=timeframe_data,
        symbol=symbol,
        bot_config=bot_config  # ← NEW
    )
```

---

### **🟡 ISSUES ADICIONALES (ALTA/MEDIA)**

#### **ISSUE #6: COMPONENTES VIOLAN DL-076 (<150 LÍNEAS)**

| Componente | Líneas | Límite | Exceso | Prioridad |
|------------|--------|--------|--------|-----------|
| EnhancedBotCreationModal.jsx | 1,452 | 150 | 1,302 (967%) | 🟡 MEDIA |
| ProfessionalBotsTable.jsx | 498 | 150 | 348 (232%) | 🟡 MEDIA |
| AdvancedMetrics.jsx | 650 | 150 | 500 (333%) | 🟡 BAJA |

**Solución**: Ver sub-arquitecturas 01_CREATE_BOT, 04_PROFESSIONAL_PANEL, 05_BOT_METRICS

#### **ISSUE #7: BOTSADVANCED LEGACY CON VIOLATIONS**

**Estado**: ✅ DESCARTADO (solo backup rollback)
**Acción**: NO incluir en arquitectura nueva, usar BotsModular exclusivamente

#### **ISSUE #8: NO VALIDACIÓN MAX_OPEN_POSITIONS**

**Problema**: bot.max_open_positions definido pero NO validado pre-trade
**Impacto**: Bot puede abrir 10 posiciones cuando config dice max 3
**Solución**: Agregar en Issue #1 FASE 2

---

## ✅ **MAPEO ARQUITECTURA - CONCEPTO ↔ IMPLEMENTACIÓN**

| Concepto Inteligente | Estado Actual | Implementación Real | Gap | Prioridad |
|---------------------|---------------|---------------------|-----|-----------|
| **Bot Único Adaptativo** | ⚠️ PARCIAL | BotsModular.jsx (140L) usa hooks especializados | ✅ Estructura correcta, ❌ Falta ejecución automática | 🔴 CRÍTICA |
| **12 Algoritmos Smart Money** | ❌ 8.3% | Solo Wyckoff (DL-113) | ❌ 11 algoritmos pendientes | 🔴 CRÍTICA |
| **Consenso 6/12 (50%)** | ❌ DÉBIL | Consenso 1/6 (16.7%) | ❌ Falsos positivos altos | 🔴 CRÍTICA |
| **62 Parámetros Configurables** | ❌ 6.5% | Solo 4 consumidos (stake, TP, SL, order_type) | ❌ 58 parámetros ignorados | 🔴 CRÍTICA |
| **Ejecución Automática** | ❌ NO | Manual `/api/run-smart-trade` | ❌ No scheduler basado en bot.interval | 🔴 CRÍTICA |
| **Backtesting Datos Reales** | ❌ NO | No existe servicio | ❌ No validación algoritmos | 🔴 CRÍTICA |
| **Wyckoff Configurable** | ❌ NO | 18 params hardcoded en detectors | ❌ Usuario NO puede ajustar | 🔴 CRÍTICA |
| **5 Modos Operativos** | ⚠️ BASE | Smart Scalper funcional | ❌ 4 modos pendientes (Trend, Anti-Manip, News, Volatility) | 🟡 ALTA |
| **Intelligent Mode Selector** | ⚠️ PARCIAL | intelligent_mode_selector.py existe | ⚠️ Revisar integración real | 🟡 ALTA |
| **DL-008 Auth Centralizada** | ✅ OK | get_current_user_safe() en 43 endpoints | ✅ Implementado | ✅ OK |
| **DL-001 No Hardcode** | ⚠️ PARCIAL | BotsModular ✅, BotsAdvanced ❌ | ⚠️ Backend tiene hardcoded intervals | 🟡 ALTA |
| **DL-076 Components <150L** | ❌ VIOLATIONS | EnhancedBotCreationModal 1,452L, ProfessionalBotsTable 498L | ❌ Refactoring pendiente | 🟡 MEDIA |
| **Feature-Based Architecture** | ✅ OK | useBotManagement, useBotCrud, useBotOperations, etc. | ✅ Implementado | ✅ OK |
| **Multi-Timeframe Coordinator** | ✅ OK | multi_timeframe_coordinator.py | ✅ Implementado | ✅ OK |
| **Exchange Management** | ✅ OK | exchange_credentials.py + security_middleware.py | ✅ Implementado | ✅ OK |

---

## 📋 **PLAN CORRECCIÓN CONSOLIDADO**

### **🔴 FASE 1: CRÍTICOS - PARA OPERAR YA (2-3 SEMANAS)**

**Objetivo**: Bot funcional con 62 parámetros + ejecución automática + backtesting

#### **1.1 Consumir 62 Parámetros (Issue #1)**
**Timeline**: 5 días
**Prioridad**: 🔴 MÁXIMA
**Bloquea**: Operación real

**Tareas**:
1. Modificar `/api/run-smart-trade/{bot_id}` para recibir bot_id ✅
2. Cargar BotConfig en trading_engine.py ✅
3. Usar bot.interval (NO hardcoded) ✅
4. Usar bot.leverage en cálculo quantity ✅
5. Validar bot.max_open_positions pre-trade ✅
6. Implementar bot.cooldown_minutes enforcement ✅
7. Pasar wyckoff_* params a detectors (Issue #5) ✅
8. Implementar trailing_stop_percentage ✅
9. Implementar partial_take_profit lógica ✅
10. Implementar circuit breakers (max_daily_loss, max_drawdown) ✅

**Test**: Bot BTCUSDT con leverage=5, interval=5m, cooldown=10min → Validar que respeta todos los parámetros

#### **1.2 Ejecución Automática (Issue #3)**
**Timeline**: 3 días
**Prioridad**: 🔴 MÁXIMA
**Bloquea**: Autonomía bot

**Tareas**:
1. Implementar BotScheduler con APScheduler ✅
2. Integrar en main.py startup event ✅
3. Modificar /api/bots/{bot_id}/toggle-status para start/stop scheduler ✅
4. Recovery bots RUNNING después de restart backend ✅
5. Logs scheduler (inicio, ejecución, errores) ✅

**Test**: Bot con interval=15m → Validar ejecuta automáticamente cada 15min sin intervención manual

#### **1.3 Backtesting Datos Reales (Issue #4)**
**Timeline**: 7 días
**Prioridad**: 🔴 MÁXIMA
**Bloquea**: Validación algoritmos

**Tareas**:
1. Implementar BacktestingEngine core ✅
2. Fetch histórico real Binance (NO simulación) ✅
3. Replay bar-by-bar con TODOS los 62 parámetros ✅
4. Calcular métricas: Win Rate, Sharpe, Max DD, Profit Factor ✅
5. Endpoint /api/backtest/run ✅
6. Modelo DB BacktestRun ✅
7. UI BacktestModal.jsx con equity curve + trades table ✅
8. Integración en ProfessionalBotsTable (botón "Backtest") ✅

**Test**: Backtest Wyckoff 6 meses BTCUSDT 15m → Validar 300+ trades con métricas reales

---

### **🔴 FASE 2: ALGORITMOS ANTI-MANIPULACIÓN (4-6 SEMANAS)**

**Objetivo**: Protección completa contra trampas institucionales

#### **2.1 Stop Hunting Detection (2 semanas)**
**Prioridad**: 🔴 CRÍTICA
**Impacto**: Evitar 30-40% falsos positivos

**Tareas**:
1. Implementar StopHuntingDetector ✅
2. Detectar wicks largos + volumen spike + rejection ✅
3. Identificar hunt zones (resistencias/soportes clave) ✅
4. Integrar en signal_quality_assessor.py ✅
5. Frontend: Mostrar hunt_zones en InstitutionalChart ✅

#### **2.2 Liquidity Grabs Detection (2 semanas)**
**Prioridad**: 🔴 CRÍTICA
**Impacto**: Evitar breakouts falsos

**Tareas**:
1. Implementar LiquidityGrabsDetector ✅
2. Detectar breakout + retorno rápido (<5 velas) ✅
3. Marcar niveles trampa (AVOID_LONG/AVOID_SHORT) ✅
4. Integrar en signal_quality_assessor.py ✅
5. Frontend: Alertas liquidity grabs ✅

#### **2.3 Consenso Robusto (1 semana)**
**Prioridad**: 🔴 CRÍTICA
**Impacto**: Reducir falsos positivos de 40% a 15%

**Tareas**:
1. Modificar _calculate_consensus() para 3/6 mínimo ✅
2. Filtro: Solo ejecutar si consensus >= 50% ✅
3. Logs: Mostrar qué algoritmos votaron BUY/SELL/NEUTRAL ✅

**Test**: Bot con Wyckoff + Stop Hunting + Liquidity Grabs → Consenso 3/6 → Win Rate mejora de 55% a 65%

---

### **🟡 FASE 3: ALGORITMOS CONTEXTO (6-8 SEMANAS)**

**Objetivo**: Estructura mercado completa

#### **3.1 Order Blocks (2 semanas)**
- Detectar zonas institucionales (última vela antes impulso)
- Validar con volumen + rechazo precio

#### **3.2 Fair Value Gaps (FVG) (2 semanas)**
- Detectar gaps sin trade (inefficiencies)
- Esperar fill gaps antes de entrada

#### **3.3 Market Microstructure (2 semanas)**
- Detectar cambios estructura (BOS/CHoCH)
- Confirmar cambio tendencia multi-timeframe

**Test**: Bot con 6 algoritmos → Consenso 3/6 (50%) → Win Rate 70%+

---

### **🟡 FASE 4: ALGORITMOS CONFIRMACIÓN (8-10 SEMANAS)**

**Objetivo**: Validación multi-capa señales

#### **4.1 Volume Spread Analysis (VSA) (2 semanas)**
- Divergencias volumen-precio
- Effort vs Result

#### **4.2 Market Profile (2 semanas)**
- Value Area High/Low
- Point of Control

#### **4.3 Smart Money Concepts (SMC) (2 semanas)**
- Premium/Discount zones
- Optimal Trade Entry (OTE)

#### **4.4 Institutional Order Flow (2 semanas)**
- Delta volumen compra-venta
- Order book imbalances

**Test**: Bot con 10 algoritmos → Consenso 5/10 (50%) → Win Rate 75%+

---

### **🟡 FASE 5: ALGORITMOS AVANZADOS (10-12 SEMANAS)**

**Objetivo**: Intención institucional largo plazo

#### **5.1 Accumulation/Distribution (3 semanas)**
- Chaikin A/D Line
- On-Balance Volume (OBV)

#### **5.2 Composite Man Theory (3 semanas)**
- Mapear comportamiento "Composite Man"
- Detectar fases intención manipulación

**Test**: Bot con 12 algoritmos → Consenso 6/12 (50%) → Win Rate 78%+, Sharpe 2.5+

---

### **🟡 FASE 6: REFACTORING DL-076 (4 SEMANAS)**

**Objetivo**: Todos los componentes <150 líneas

#### **6.1 EnhancedBotCreationModal (2 semanas)**
Ver sub-arquitectura 01_CREATE_BOT_ARCHITECTURE.md

#### **6.2 ProfessionalBotsTable (1 semana)**
Ver sub-arquitectura 04_PROFESSIONAL_PANEL_ARCHITECTURE.md

#### **6.3 AdvancedMetrics (1 semana)**
Ver sub-arquitectura 05_BOT_METRICS_ARCHITECTURE.md

---

### **🟢 FASE 7: MODOS OPERATIVOS COMPLETOS (8 SEMANAS)**

**Objetivo**: 5 modos institucionales funcionales

#### **7.1 Trend Following Mode (2 semanas)**
- SMC + Market Profile + VSA
- Detectar tendencias fuertes

#### **7.2 Anti-Manipulation Mode (2 semanas)**
- Stop Hunting + Liquidity Grabs + Composite Man
- Protección máxima

#### **7.3 News Sentiment Mode (2 semanas)**
- Central Bank events
- Options Flow

#### **7.4 Volatility Adaptive Mode (2 semanas)**
- VSA + Market Profile adaptive
- Ajuste dinámico stop loss

---

## 🎯 **ROADMAP VISUAL**

```
SEMANA 1-3: FASE 1 CRÍTICOS 🔴
├─ Consumir 62 parámetros
├─ Ejecución automática
└─ Backtesting datos reales
    ↓
SEMANA 4-9: FASE 2 ANTI-MANIPULACIÓN 🔴
├─ Stop Hunting Detector
├─ Liquidity Grabs Detector
└─ Consenso robusto 3/6
    ↓
SEMANA 10-17: FASE 3 CONTEXTO 🟡
├─ Order Blocks
├─ Fair Value Gaps
└─ Market Microstructure
    ↓
SEMANA 18-27: FASE 4 CONFIRMACIÓN 🟡
├─ VSA
├─ Market Profile
├─ SMC
└─ Order Flow
    ↓
SEMANA 28-39: FASE 5 AVANZADOS 🟡
├─ Accumulation/Distribution
└─ Composite Man Theory
    ↓
SEMANA 40-43: FASE 6 REFACTORING 🟡
├─ EnhancedBotCreationModal
├─ ProfessionalBotsTable
└─ AdvancedMetrics
    ↓
SEMANA 44-51: FASE 7 MODOS 🟢
├─ Trend Following
├─ Anti-Manipulation
├─ News Sentiment
└─ Volatility Adaptive
```

---

## 📊 **MÉTRICAS ÉXITO**

| Fase | Win Rate Esperado | Sharpe Ratio | Max Drawdown | Consenso | Algoritmos |
|------|-------------------|--------------|--------------|----------|------------|
| **ACTUAL** | 45-55% | 0.8-1.2 | >25% | 1/6 (16.7%) | 1/12 |
| **FASE 1** | 55-60% | 1.2-1.5 | <20% | 1/6 | 1/12 |
| **FASE 2** | 60-70% | 1.5-2.0 | <18% | 3/6 (50%) | 3/12 |
| **FASE 3** | 68-75% | 2.0-2.3 | <15% | 3/6 | 6/12 |
| **FASE 4** | 72-78% | 2.3-2.6 | <12% | 5/10 (50%) | 10/12 |
| **FASE 5 (OBJETIVO)** | 75-82% | 2.5-3.0 | <10% | 6/12 (50%) | 12/12 |

---

## 🔧 **ROLLBACK PLAN**

**Si FASE 1 Falla:**
1. Revertir cambios `/api/run-smart-trade/{bot_id}` → `/api/run-smart-trade/{symbol}`
2. Revertir BotScheduler integration
3. Usar BotsModular.jsx actual (funciona, solo manual)
4. NO usar backtesting hasta debug completo

**Si FASE 2 Falla:**
1. Mantener solo Wyckoff activo
2. Deshabilitar Stop Hunting + Liquidity Grabs en signal_quality_assessor.py
3. Consenso 1/3 temporal (Wyckoff + 2 algoritmos estables)

**Validación Pre-Deploy:**
- ✅ Backtest 6 meses >= 60% Win Rate
- ✅ Sharpe Ratio >= 1.5
- ✅ Max Drawdown <= 20%
- ✅ Paper trading 2 semanas sin errores
- ✅ Tests E2E pasan 100%

---

*FIN SECCIÓN 5 - 06_BOT_RUNNING_CORE_ARCHITECTURE.md COMPLETADA*
*Total Líneas: ~3,200 líneas*
*Nivel Detalle: EXHAUSTIVO (match Wyckoff 34KB, Auth 1,848 líneas)*
*Próximo: Actualizar README.md + Crear 01_CREATE_BOT_ARCHITECTURE.md*