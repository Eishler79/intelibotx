# 05_BOT_METRICS_ARCHITECTURE - Datos Generales (PnL, Stake, Performance)

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN**
> **Actualizado:** 2025-10-02
> **Estado:** 🟡 FUNCIONAL (Métricas básicas OK, métricas avanzadas limitadas)
> **Prioridad:** 🟡 MEDIA - AMPLIACIÓN REQUERIDA

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
│                    USUARIO (Dashboard Bots)                      │
│  Navegación: Lateral → Bots → Ver Métricas Agregadas           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               FRONTEND - React 18 + TypeScript                   │
│                                                                   │
│  📁 /features/dashboard/components/DashboardMetrics.jsx          │
│  ├─ Componente métricas agregadas todos los bots                 │
│  ├─ 4 cards principales: Bots Activos, PnL Total, Win Rate, Trades│
│  └─ ✅ DL-001 compliant: Sin Math.random()                       │
│                                                                   │
│  📁 /components/AdvancedMetrics.jsx (650 líneas) ⚠️              │
│  ├─ Métricas individuales por bot + algoritmos                   │
│  ├─ PROBLEMA DL-076: 650 líneas (viola <150 líneas)              │
│  └─ Incluye métricas avanzadas (Sharpe, Sortino, Calmar, etc.)   │
│                                                                   │
│  📁 /features/bots/hooks/useBotMetrics.js (78 líneas)            │
│  ├─ Hook obtención métricas bot específico                       │
│  ├─ GET /api/bots/{id}/metrics                                   │
│  └─ Polling cada 10s cuando bot RUNNING                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ GET /api/bots/{id}/metrics
                       │ GET /api/dashboard/metrics (agregadas)
┌──────────────────────▼──────────────────────────────────────────┐
│               BACKEND - FastAPI + Python 3.11                    │
│                                                                   │
│  📁 /routes/bots.py (374 líneas)                                 │
│  ├─ GET /api/bots/{id}/metrics - Métricas bot específico         │
│  └─ ✅ DL-008: get_current_user_safe()                           │
│                                                                   │
│  📁 /routes/dashboard_routes.py                                  │
│  ├─ GET /api/dashboard/metrics - Métricas agregadas              │
│  └─ Calcula totales de todos los bots usuario                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE - SQLite/PostgreSQL                        │
│                                                                   │
│  📊 bot_config.metrics (JSON column)                             │
│  ├─ realizedPnL: float (PnL acumulado)                           │
│  ├─ unrealizedPnL: float (PnL posiciones abiertas)               │
│  ├─ totalTrades: int (Total trades ejecutados)                   │
│  ├─ winningTrades: int (Trades ganadores)                        │
│  ├─ losingTrades: int (Trades perdedores)                        │
│  ├─ winRate: float (% trades ganadores)                          │
│  ├─ sharpe: float (Sharpe ratio)                                 │
│  ├─ sortino: float (Sortino ratio)                               │
│  ├─ maxDrawdown: float (Max drawdown %)                          │
│  ├─ avgWin: float (Ganancia promedio)                            │
│  ├─ avgLoss: float (Pérdida promedio)                            │
│  └─ profitFactor: float (Ratio ganancia/pérdida)                 │
└──────────────────────────────────────────────────────────────────┘

🔴 PROBLEMAS IDENTIFICADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ⚠️  AdvancedMetrics 650 líneas (mezcla métricas + algoritmos)
2. ❌ No hay tabla histórica bot_metrics (solo JSON column)
3. ❌ Métricas avanzadas (Calmar, Sterling) no calculadas
4. ❌ No hay endpoint GET /api/bots/metrics/aggregated
5. ✅ Métricas básicas funcionan correctamente (PnL, Win Rate, Sharpe)
```

### **🟢 ARQUITECTURA OBJETIVO (Ideal - Producción Ready)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Dashboard Bots)                      │
│  Navegación: Lateral → Bots → Métricas Completas               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│            FRONTEND - Feature-Based Architecture                 │
│                                                                   │
│  📁 /features/metrics/components/                                │
│  ├─ DashboardMetricsPanel.jsx (<150 líneas) ✅                  │
│  │  ├─ 6 cards métricas agregadas                                │
│  │  └─ Real-time updates                                         │
│  │                                                                │
│  ├─ BotMetricsCard.jsx (<100 líneas) ✅ NUEVO                   │
│  │  └─ Métricas individuales bot                                 │
│  │                                                                │
│  ├─ PerformanceMetricsTable.jsx (<150 líneas) ✅ NUEVO          │
│  │  └─ Tabla comparativa métricas todos los bots                 │
│  │                                                                │
│  └─ AdvancedMetricsModal.jsx (<150 líneas) ✅ REFACTORED        │
│     └─ Modal métricas avanzadas (Calmar, Sterling, Omega)        │
│                                                                   │
│  📁 /features/metrics/hooks/                                     │
│  ├─ useDashboardMetrics.js (<100 líneas) ✅ NUEVO               │
│  ├─ useBotMetrics.js (78 líneas) ✅ MANTENER                    │
│  └─ useMetricsHistory.js (<80 líneas) ✅ NUEVO                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ 🆕 GET /api/metrics/dashboard (agregadas)
                       │ 🆕 GET /api/metrics/bot/{id} (individuales)
                       │ 🆕 GET /api/metrics/bot/{id}/history
┌──────────────────────▼──────────────────────────────────────────┐
│            BACKEND - Métricas Completas                          │
│                                                                   │
│  📁 /routes/metrics_routes.py (NUEVO) 🆕                         │
│  ├─ GET /api/metrics/dashboard - Métricas agregadas              │
│  ├─ GET /api/metrics/bot/{id} - Métricas bot específico          │
│  ├─ GET /api/metrics/bot/{id}/history - Histórico métricas       │
│  └─ ✅ DL-008: get_current_user_safe()                           │
│                                                                   │
│  📁 /services/metrics_calculator.py (NUEVO) 🆕                   │
│  ├─ Clase: MetricsCalculator                                     │
│  ├─ calculate_basic_metrics() - PnL, Win Rate, Total Trades      │
│  ├─ calculate_risk_metrics() - Sharpe, Sortino, Calmar, Sterling │
│  ├─ calculate_advanced_metrics() - Omega, Kappa, VaR, CVaR       │
│  └─ aggregate_portfolio_metrics() - Métricas totales cartera     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database + Historical Metrics
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE + METRICS STORAGE                          │
│                                                                   │
│  📊 bot_config.metrics (JSON - Mantener para backward compat)    │
│                                                                   │
│  📊 bot_metrics_history (Tabla NUEVA) 🆕                         │
│  ├─ bot_id, timestamp, period (DAILY/WEEKLY/MONTHLY)             │
│  ├─ realized_pnl, unrealized_pnl, total_trades                   │
│  ├─ win_rate, sharpe, sortino, calmar, max_drawdown              │
│  └─ ✅ Histórico métricas tiempo para gráficos                   │
└──────────────────────────────────────────────────────────────────┘

✅ MEJORAS OBJETIVO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ Métricas avanzadas completas (12 métricas vs 6 actuales)
2. ✅ Histórico métricas para gráficos evolución
3. ✅ Endpoints especializados métricas
4. ✅ Componentes <150 líneas (DL-076 compliant)
5. ✅ Cálculo periódico métricas (cronjob)
```

---

## 🎯 **COMPONENTES TÉCNICOS**

### **FRONTEND - Componentes Métricas**

#### **1. /features/dashboard/components/DashboardMetrics.jsx**
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/features/dashboard/components/DashboardMetrics.jsx
// TAMAÑO: ~120 líneas (estimado)
// FUNCIÓN: Métricas agregadas todos los bots

// ✅ DL-076 COMPLIANT: <150 líneas
// ✅ DL-001 COMPLIANT: Sin Math.random()

// CARDS (4):
// 1. Bots Activos: Total bots + breakdown por status
// 2. PnL Total: Suma PnL todos los bots
// 3. Win Rate Promedio: Media win rates ponderada
// 4. Trades Totales: Suma total trades ejecutados
```

**Código DashboardMetrics.jsx (usado en BotsModular):**
```jsx
// Línea 603 de 06_BOT_RUNNING_CORE (BotsModular.jsx):
import DashboardMetrics from '../features/dashboard/components/DashboardMetrics';

// Línea 645 de 06_BOT_RUNNING_CORE (BotsModular.jsx):
<DashboardMetrics dynamicMetrics={dynamicMetrics} />

// Estructura DashboardMetrics:
export default function DashboardMetrics({ dynamicMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Card 1: Bots Activos */}
      <div className="stat">
        <div className="stat-title">Bots Activos</div>
        <div className="stat-value">{dynamicMetrics.activeBots || 0}</div>
        <div className="stat-desc">
          🟢 {dynamicMetrics.runningBots || 0} RUNNING
        </div>
      </div>

      {/* Card 2: PnL Total */}
      <div className="stat">
        <div className="stat-title">PnL Total</div>
        <div className="stat-value text-success">
          +${dynamicMetrics.totalPnL?.toFixed(2) || '0.00'}
        </div>
        <div className="stat-desc">
          Últimas 24h: +${dynamicMetrics.pnl24h || '0.00'}
        </div>
      </div>

      {/* Card 3: Win Rate */}
      <div className="stat">
        <div className="stat-title">Win Rate Promedio</div>
        <div className="stat-value">{dynamicMetrics.avgWinRate || 0}%</div>
        <div className="stat-desc">
          {dynamicMetrics.winningTrades || 0}/{dynamicMetrics.totalTrades || 0} trades
        </div>
      </div>

      {/* Card 4: Trades Totales */}
      <div className="stat">
        <div className="stat-title">Trades Totales</div>
        <div className="stat-value">{dynamicMetrics.totalTrades || 0}</div>
        <div className="stat-desc">
          Hoy: {dynamicMetrics.tradesToday || 0}
        </div>
      </div>
    </div>
  );
}
```

#### **2. /components/AdvancedMetrics.jsx** (650 líneas) ⚠️
```jsx
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/components/AdvancedMetrics.jsx
// TAMAÑO: 650 líneas
// FUNCIÓN: Modal métricas avanzadas + algoritmos

// ⚠️ PROBLEMA DL-076: 650 líneas (viola <150 líneas)
// ⚠️ PROBLEMA: Mezcla métricas + visualización algoritmos

// CONTIENE (2 SECCIONES):
// 1. Métricas Avanzadas (líneas 1-200):
//    - Sharpe, Sortino, Calmar, Sterling
//    - Max Drawdown, Avg Win/Loss, Profit Factor
//
// 2. Algorithm Breakdown (líneas 450-650):
//    - Visualización 12 algoritmos institucionales
//    - ⚠️ ESTA SECCIÓN PERTENECE A 07_ALGORITHMS_VISUALIZATION

// 📋 DEBE SEPARARSE EN:
// - AdvancedMetricsModal.jsx (<150 líneas) - SOLO métricas
// - AlgorithmsVisualizationModal.jsx (<150 líneas) - SOLO algoritmos
```

#### **3. /features/bots/hooks/useBotMetrics.js** (78 líneas) ✅
```javascript
// UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/frontend/src/features/bots/hooks/useBotMetrics.js
// TAMAÑO: 78 líneas
// FUNCIÓN: Hook obtención métricas bot específico

// ✅ DL-076 COMPLIANT: <150 líneas
// ✅ Polling cada 10s cuando bot RUNNING

// ENDPOINTS CONSUMIDOS:
// - GET /api/bots/{id}/metrics

// ESTADO RETORNADO:
export function useBotMetrics(botId) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!botId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/bots/${botId}/metrics`);
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch inicial
    fetchMetrics();

    // Polling cada 10s
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [botId]);

  return { metrics, loading, error };
}
```

---

### **BACKEND - Routes Métricas**

#### **4. /routes/bots.py** (Fragmento métricas)
```python
# UBICACIÓN: /Users/eduardguzman/Documents/TRADING/INTELIBOTX/backend/routes/bots.py
# FUNCIÓN: Endpoint métricas bot específico

@router.get("/api/bots/{bot_id}/metrics")
async def get_bot_metrics(
    bot_id: int,
    current_user: User = Depends(get_current_user_safe),  # DL-008
    db: Session = Depends(get_db)
):
    """Obtiene métricas del bot específico"""
    # Verificar bot pertenece a usuario
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    if not bot:
        raise HTTPException(status_code=404, detail="Bot no encontrado")

    # Retornar métricas desde JSON column
    return bot.metrics or {}
```

#### **5. /routes/dashboard_routes.py** (Fragmento agregadas)
```python
# FUNCIÓN: Endpoint métricas agregadas todos los bots usuario

@router.get("/api/dashboard/metrics")
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user_safe),  # DL-008
    db: Session = Depends(get_db)
):
    """Calcula métricas agregadas de todos los bots del usuario"""
    bots = db.query(BotConfig).filter(
        BotConfig.user_id == current_user.id
    ).all()

    # Calcular métricas agregadas
    total_pnl = sum(bot.metrics.get('realizedPnL', 0) for bot in bots if bot.metrics)
    total_trades = sum(bot.metrics.get('totalTrades', 0) for bot in bots if bot.metrics)
    active_bots = len([b for b in bots if b.status == 'RUNNING'])

    # Win rate promedio ponderado
    weighted_win_rate = 0
    if total_trades > 0:
        for bot in bots:
            if bot.metrics and bot.metrics.get('totalTrades', 0) > 0:
                weight = bot.metrics['totalTrades'] / total_trades
                weighted_win_rate += bot.metrics.get('winRate', 0) * weight

    return {
        "activeBots": active_bots,
        "totalPnL": total_pnl,
        "avgWinRate": round(weighted_win_rate, 2),
        "totalTrades": total_trades,
        "runningBots": len([b for b in bots if b.status == 'RUNNING']),
        "pausedBots": len([b for b in bots if b.status == 'PAUSED']),
        "stoppedBots": len([b for b in bots if b.status == 'STOPPED'])
    }
```

---

## 📐 **FLUJO DE DATOS E2E**

### **FLUJO: Cargar Métricas Dashboard**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Navega a Bots Panel                            │
│ URL: /bots                                                       │
│ Componente: BotsModular.jsx                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - Mount BotsModular                           │
│ Hook: useBotManagement()                                        │
│                                                                  │
│ Ejecuta en paralelo:                                            │
│ a) loadBots() - Carga lista bots                                │
│ b) loadDashboardMetrics() - Carga métricas agregadas            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Frontend - HTTP GET Request                            │
│                                                                  │
│ Request 1:                                                       │
│ GET /api/dashboard/metrics                                      │
│ Headers: Authorization: Bearer {JWT_TOKEN}                      │
│                                                                  │
│ Request 2 (por cada bot):                                       │
│ GET /api/bots/{bot_id}/metrics                                  │
│ Headers: Authorization: Bearer {JWT_TOKEN}                      │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - Calcular Métricas                            │
│ Route: dashboard_routes.py                                      │
│                                                                  │
│ 4a. Autenticación DL-008                                        │
│ 4b. Query bots usuario:                                         │
│     bots = db.query(BotConfig).filter(                          │
│       BotConfig.user_id == current_user.id                      │
│     ).all()                                                      │
│                                                                  │
│ 4c. Agregar métricas:                                           │
│     - total_pnl = sum(bot.metrics.realizedPnL)                  │
│     - total_trades = sum(bot.metrics.totalTrades)               │
│     - avg_win_rate = weighted_average(bot.metrics.winRate)      │
│                                                                  │
│ Response:                                                        │
│ {                                                                │
│   "activeBots": 12,                                             │
│   "totalPnL": 1234.5,                                           │
│   "avgWinRate": 68.5,                                           │
│   "totalTrades": 456,                                           │
│   "runningBots": 5,                                             │
│   "pausedBots": 3,                                              │
│   "stoppedBots": 4                                              │
│ }                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Frontend - Renderizar DashboardMetrics                 │
│ Componente: DashboardMetrics.jsx                                │
│                                                                  │
│ Renderiza 4 cards:                                              │
│ ┌──────────────┐ ┌──────────────┐                              │
│ │ Bots Activos │ │ PnL Total    │                              │
│ │     12       │ │ +$1,234.50   │                              │
│ │ 🟢 5 RUNNING │ │ 24h: +$150   │                              │
│ └──────────────┘ └──────────────┘                              │
│                                                                  │
│ ┌──────────────┐ ┌──────────────┐                              │
│ │ Win Rate     │ │ Trades       │                              │
│ │   68.5%      │ │    456       │                              │
│ │ 312/456      │ │ Hoy: 23      │                              │
│ └──────────────┘ └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘

✅ FIN FLUJO MÉTRICAS DASHBOARD
```

---

## 🔧 **INTEGRACIÓN**

### **MÉTRICAS DISPONIBLES (ACTUAL)**

**Métricas Básicas (✅ Implementadas):**
1. **realizedPnL:** PnL acumulado realizado
2. **unrealizedPnL:** PnL posiciones abiertas
3. **totalTrades:** Total trades ejecutados
4. **winningTrades:** Trades ganadores
5. **losingTrades:** Trades perdedores
6. **winRate:** % trades ganadores

**Métricas Risk-Adjusted (⚠️ Parcialmente):**
7. **sharpe:** Sharpe ratio
8. **sortino:** Sortino ratio (❌ NO calculado)
9. **maxDrawdown:** Maximum drawdown %
10. **avgWin:** Ganancia promedio
11. **avgLoss:** Pérdida promedio
12. **profitFactor:** Ratio ganancia/pérdida

**Métricas Avanzadas (❌ NO Implementadas):**
13. **calmar:** Calmar ratio
14. **sterling:** Sterling ratio
15. **omega:** Omega ratio
16. **kappa:** Kappa 3 ratio
17. **var95:** Value at Risk 95%
18. **cvar95:** Conditional VaR 95%

---

## 🎨 **DISEÑO UX/UI**

### **DASHBOARD METRICS (4 Cards)**

```
┌─────────────────────────────────────────────────────────────────┐
│                      MÉTRICAS DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │ 🤖 BOTS     │  │ 💰 PNL      │  │ 🎯 WIN RATE │  │📊 TRADES││
│  │   ACTIVOS   │  │   TOTAL     │  │   PROMEDIO  │  │  TOTALES││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────┤│
│  │     12      │  │ +$1,234.50  │  │    68.5%    │  │   456   ││
│  │             │  │   🟢 +23.4% │  │             │  │         ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────┤│
│  │ 🟢 5 RUN    │  │ 24h: +$150  │  │ 312/456     │  │ Hoy: 23 ││
│  │ 🟡 3 PAUSE  │  │ 7d: +$780   │  │ ganadores   │  │ 7d: 189 ││
│  │ 🔴 4 STOP   │  │ 30d:+$1,234 │  │             │  │         ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Interacciones:**
1. **Hover Cards:** Muestra tooltip con breakdown detallado
2. **Click Card:** Expande modal con gráfico histórico métrica
3. **Real-Time:** Actualiza cada 10s con efecto fade-in
4. **Color Coding:** Verde PnL positivo, rojo PnL negativo

---

## 🔥 **ISSUES IDENTIFICADOS**

### **📋 RESUMEN EJECUTIVO**

| # | Issue | Severidad | Estado | Bloquea Feature |
|---|-------|-----------|--------|-----------------|
| 1 | AdvancedMetrics mezcla métricas + algoritmos | 🟡 ALTA | ❌ ACTIVO | ❌ NO |
| 2 | Métricas avanzadas no calculadas | 🟡 MEDIA | ❌ ACTIVO | ⚠️ PARCIAL |
| 3 | No tabla histórica bot_metrics | 🟡 BAJA | ❌ ACTIVO | ❌ NO |

---

### **🟡 ISSUE #1: ADVANCEDMETRICS MEZCLA MÉTRICAS + ALGORITMOS**

**SEVERIDAD:** 🟡 ALTA
**IMPACTO:** Componente viola DL-076, mezcla responsabilidades
**BLOQUEA FEATURE:** ❌ NO (funciona pero viola separación)

#### **PLAN CORRECCIÓN:**
Ver **Plan Corrección FASE 1** (separar componentes)

---

## ✅ **PLAN CORRECCIÓN**

### **FASE 1: SEPARAR MÉTRICAS DE ALGORITMOS (3-5 días)**

1. **Crear AdvancedMetricsModal.jsx** (<150 líneas)
   - SOLO métricas avanzadas (Sharpe, Sortino, Calmar, etc.)
   - Sin algoritmos institucionales
   - Gráficos evolución métricas

2. **Mover algoritmos a 07_ALGORITHMS_VISUALIZATION**
   - AlgorithmBreakdown → AlgorithmsVisualizationModal.jsx
   - Separación completa responsabilidades

### **FASE 2: MÉTRICAS AVANZADAS BACKEND (1 semana)**

1. **Implementar MetricsCalculator service**
   - Calmar, Sterling, Omega ratios
   - VaR 95%, CVaR 95%
   - Actualización periódica (cronjob)

2. **Crear tabla bot_metrics_history**
   - Histórico métricas diarias
   - Gráficos evolución tiempo

### **FASE 3: ENDPOINTS ESPECIALIZADOS (3-5 días)**

1. **Crear /routes/metrics_routes.py**
   - GET /api/metrics/dashboard
   - GET /api/metrics/bot/{id}
   - GET /api/metrics/bot/{id}/history

**TIEMPO TOTAL:** 2-3 semanas

---

*Creado: 2025-10-02*
*Última Actualización: 2025-10-02*
*Propósito: Documentación técnica métricas bot panel*
*Objetivo: Separación clara métricas vs algoritmos vs panel profesional*
*Nivel Detalle: EXHAUSTIVO (match 01_AUTHENTICATION_SECURITY 1,848L)*
