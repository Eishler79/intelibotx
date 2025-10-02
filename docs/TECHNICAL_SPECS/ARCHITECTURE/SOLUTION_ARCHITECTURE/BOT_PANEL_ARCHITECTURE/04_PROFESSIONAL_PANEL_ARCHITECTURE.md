# 04_PROFESSIONAL_PANEL_ARCHITECTURE - Panel Profesional Tabla Bots

> **DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN**
> **Actualizado:** 2025-10-02
> **Estado:** 🟡 FUNCIONAL (Vista Desktop + Mobile, viola DL-076)
> **Prioridad:** 🟡 ALTA - REFACTORING REQUERIDO

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
│  Navegación: Lateral → Bots → Vista Tabla Profesional          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│               FRONTEND - React 18 + TypeScript                   │
│                                                                   │
│  📁 /components/ProfessionalBotsTable.jsx (498 líneas) ⚠️        │
│  ├─ Componente tabla desktop + cards mobile                      │
│  ├─ PROBLEMA DL-076: 498 líneas (viola <150 líneas)              │
│  ├─ ✅ DL-001 compliant: Sin Math.random()                       │
│  ├─ Vista desktop: Tabla 10 columnas + 5 acciones                │
│  └─ Vista mobile: Cards responsive 8 secciones                   │
│                                                                   │
│  📁 /pages/BotsModular.jsx (141 líneas) ✅                       │
│  ├─ Orquestador principal usa ProfessionalBotsTable              │
│  ├─ Pasa props: bots, onSelectBot, onDeleteBot, onToggleStatus   │
│  └─ DL-076 compliant (<150 líneas)                               │
│                                                                   │
│  📁 /features/bots/hooks/useBotManagement.js (174 líneas)        │
│  ├─ Hook central gestión estado bots                             │
│  ├─ Handlers: Delete, ToggleStatus, Update, Create               │
│  └─ Estado: bots[], loading, error, selectedBotId                │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ GET /api/bots
                       │ DELETE /api/bots/{id}
                       │ PATCH /api/bots/{id}/status
┌──────────────────────▼──────────────────────────────────────────┐
│               BACKEND - FastAPI + Python 3.11                    │
│                                                                   │
│  📁 /routes/bots.py (374 líneas)                                 │
│  ├─ GET /api/bots - Listar bots usuario                          │
│  ├─ DELETE /api/bots/{id} - Eliminar bot                         │
│  ├─ PATCH /api/bots/{id}/status - Cambiar estado                 │
│  └─ ✅ DL-008: get_current_user_safe()                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Database
┌──────────────────────▼──────────────────────────────────────────┐
│              DATABASE - SQLite/PostgreSQL                        │
│                                                                   │
│  📊 bot_config (Tabla)                                           │
│  ├─ Columnas visualizadas: symbol, status, stake                 │
│  ├─ metrics JSON: realizedPnL, sharpe, winRate, totalTrades      │
│  └─ Datos acciones: take_profit, stop_loss, max_drawdown         │
└──────────────────────────────────────────────────────────────────┘

🔴 PROBLEMAS IDENTIFICADOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ⚠️  ProfessionalBotsTable.jsx 498 líneas (viola DL-076 <150)
2. ⚠️  Vista desktop tabla + mobile cards en mismo componente
3. ❌ No separación clara Desktop vs Mobile components
4. ❌ Sorting implementado inline (debería ser hook)
```

### **🟢 ARQUITECTURA OBJETIVO (Ideal - Producción Ready)**

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO (Bots Panel)                          │
│  Navegación: Lateral → Bots → Vista Profesional Responsive      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│            FRONTEND - Feature-Based Architecture                 │
│                                                                   │
│  📁 /features/bots/components/                                   │
│  ├─ ProfessionalBotsPanel.jsx (<100 líneas) ✅ NUEVO            │
│  │  └─ Orquestador detecta viewport → Desktop/Mobile            │
│  │                                                                │
│  ├─ BotsDesktopTable.jsx (<150 líneas) ✅ NUEVO                 │
│  │  ├─ Tabla 10 columnas profesional                             │
│  │  ├─ Sorting por columnas                                      │
│  │  └─ 5 acciones por fila                                       │
│  │                                                                │
│  ├─ BotsMobileCards.jsx (<150 líneas) ✅ NUEVO                  │
│  │  ├─ Cards responsive                                           │
│  │  └─ 8 secciones por card                                      │
│  │                                                                │
│  ├─ BotTableRow.jsx (<80 líneas) ✅ NUEVO                       │
│  │  └─ Fila individual desktop                                   │
│  │                                                                │
│  ├─ BotCard.jsx (<100 líneas) ✅ NUEVO                          │
│  │  └─ Card individual mobile                                    │
│  │                                                                │
│  └─ BotActionsMenu.jsx (<80 líneas) ✅ NUEVO                    │
│     └─ Menú acciones reutilizable                                │
│                                                                   │
│  📁 /features/bots/hooks/                                        │
│  ├─ useBotsTable.js (<100 líneas) ✅ NUEVO                      │
│  │  └─ Sorting, filtering, pagination logic                      │
│  │                                                                │
│  └─ useBotManagement.js (174 líneas) ✅ MANTENER                │
│     └─ Gestión estado central                                    │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/JWT (DL-008)
                       │ GET /api/bots
                       │ (Sin cambios backend)
┌──────────────────────▼──────────────────────────────────────────┐
│               BACKEND - Sin Cambios                              │
│  (Endpoints actuales funcionan correctamente)                    │
└──────────────────────────────────────────────────────────────────┘

✅ MEJORAS OBJETIVO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ Componentes <150 líneas (DL-076 compliant)
2. ✅ Separación clara Desktop vs Mobile
3. ✅ Componentes reutilizables (BotCard, BotTableRow)
4. ✅ Hooks especializados (useBotsTable para sorting/filtering)
5. ✅ Mejor mantenibilidad y testing
```

---

## 🎯 **COMPONENTES TÉCNICOS**

### **FRONTEND - Componente Principal Actual**

#### **1. /components/ProfessionalBotsTable.jsx** (498 líneas) ⚠️
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

**Código relevante ProfessionalBotsTable.jsx:**
```jsx
// ESTRUCTURA INTERNA ACTUAL (498 líneas):

// Líneas 1-50: Imports + Estado interno
import React, { useState, useEffect } from 'react';

// Líneas 51-100: Sorting logic
const [sortColumn, setSortColumn] = useState('symbol');
const [sortDirection, setSortDirection] = useState('asc');

// Líneas 101-200: Vista Desktop (Tabla)
const DesktopView = () => (
  <table className="min-w-full">
    <thead>
      <tr>
        <th>Par / Estrategia</th>
        <th>Estado</th>
        <th>Capital</th>
        <th>PnL</th>
        <th>Sharpe</th>
        <th>Win Rate</th>
        <th>Trades</th>
        <th>TP/SL</th>
        <th>Max DD</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      {bots.map(bot => (
        <tr key={bot.id}>
          <td>{bot.symbol}</td>
          <td>{renderStatus(bot.status)}</td>
          <td>${bot.stake} {bot.quote_currency}</td>
          <td>{renderPnL(bot.metrics?.realizedPnL)}</td>
          <td>{bot.metrics?.sharpe || '-'}</td>
          <td>{bot.metrics?.winRate || '-'}%</td>
          <td>{bot.metrics?.totalTrades || 0}</td>
          <td>+{bot.take_profit}% / -{bot.stop_loss}%</td>
          <td>{bot.metrics?.maxDrawdown || '-'}%</td>
          <td>{renderActions(bot)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Líneas 201-350: Vista Mobile (Cards)
const MobileView = () => (
  <div className="space-y-4">
    {bots.map(bot => (
      <div key={bot.id} className="card bg-base-200 shadow-xl">
        {/* Header */}
        <div className="card-header">
          <h3>{bot.symbol}</h3>
          <span>{renderStatus(bot.status)}</span>
        </div>

        {/* Secciones */}
        <div className="card-body">
          {/* a) Datos Generales */}
          <div>Capital: ${bot.stake} {bot.quote_currency}</div>

          {/* b) Performance */}
          <div>
            <div>PnL: {renderPnL(bot.metrics?.realizedPnL)}</div>
            <div>Win Rate: {bot.metrics?.winRate || '-'}%</div>
            <div>Trades: {bot.metrics?.totalTrades || 0}</div>
            <div>Sharpe: {bot.metrics?.sharpe || '-'}</div>
          </div>

          {/* Acciones */}
          <div className="card-actions">
            <button>▶️ Start</button>
            <button>👁️ Ver</button>
            <button>⚙️ Config</button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Líneas 351-450: Funciones helper
function renderStatus(status) {
  const statusIcons = {
    RUNNING: '🟢',
    PAUSED: '🟡',
    STOPPED: '🔴',
    ERROR: '⚠️'
  };
  return statusIcons[status] || '⚪';
}

function renderPnL(pnl) {
  if (!pnl) return '$0 (0%)';
  const color = pnl >= 0 ? 'text-success' : 'text-error';
  const sign = pnl >= 0 ? '+' : '';
  return <span className={color}>{sign}${pnl.toFixed(2)}</span>;
}

function renderActions(bot) {
  return (
    <div className="btn-group">
      <button onClick={() => onToggleBotStatus(bot.id)}>▶️</button>
      <button onClick={() => onViewDetails(bot.id)}>👁️</button>
      <button onClick={() => onViewHistory(bot.id)}>📊</button>
      <button onClick={() => onSettings(bot.id)}>⚙️</button>
      <button onClick={() => onDeleteBot(bot.id)}>🗑️</button>
    </div>
  );
}

// Líneas 451-498: Main component return
return (
  <div className="professional-bots-table">
    <div className="hidden md:block">
      <DesktopView />
    </div>
    <div className="block md:hidden">
      <MobileView />
    </div>
  </div>
);
```

**COLUMNAS DESKTOP (10):**
1. **Par / Estrategia:** Symbol + Strategy name (ej. "BTCUSDT / Smart Scalper")
2. **Estado:** Status icon (🟢 RUNNING, 🟡 PAUSED, 🔴 STOPPED, ⚠️ ERROR)
3. **Capital:** Stake + Currency (ej. "$1,000 USDT")
4. **PnL:** Realized PnL absoluto + % (ej. "+$234 (+23.4%)")
5. **Sharpe:** Sharpe ratio (ej. "2.45")
6. **Win Rate:** % trades ganadores (ej. "72%")
7. **Trades:** Total trades ejecutados (ej. "45")
8. **TP/SL:** Take Profit / Stop Loss % (ej. "+2.5% / -1.5%")
9. **Max DD:** Maximum Drawdown % (ej. "-8.2%")
10. **Acciones:** 5 botones acción

**ACCIONES (5):**
1. **▶️ Start/Pause:** Toggle bot status RUNNING ↔ PAUSED
2. **👁️ Ver Detalles:** Abrir modal algoritmos institucionales (AdvancedMetrics.jsx)
3. **📊 Ver Historial:** Abrir TradingHistory.jsx para bot específico
4. **⚙️ Settings:** Abrir BotControlPanel.jsx para editar configuración
5. **🗑️ Eliminar:** Eliminar bot (con confirmación)

---

## 📐 **FLUJO DE DATOS E2E**

### **FLUJO 1: Listar Bots Usuario**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Navega a Bots                                  │
│ Ubicación: Lateral → Bots                                       │
│ URL: /bots                                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - BotsModular.jsx Mount                       │
│ Componente: pages/BotsModular.jsx                              │
│                                                                  │
│ Hook: useBotManagement()                                        │
│ - useEffect mount → loadBots()                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Frontend - HTTP GET Request                            │
│ Hook: useBotManagement.js                                       │
│                                                                  │
│ Request:                                                         │
│ GET /api/bots                                                    │
│ Headers:                                                         │
│   Authorization: Bearer {JWT_TOKEN}  // DL-008                  │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - routes/bots.py                               │
│ Endpoint: GET /api/bots                                         │
│                                                                  │
│ 4a. Autenticación DL-008:                                       │
│     current_user = Depends(get_current_user_safe)               │
│                                                                  │
│ 4b. Query Database:                                             │
│     bots = db.query(BotConfig).filter(                          │
│       BotConfig.user_id == current_user.id                      │
│     ).all()                                                      │
│                                                                  │
│ Response:                                                        │
│ [                                                                │
│   {                                                              │
│     id: 1,                                                       │
│     symbol: "BTCUSDT",                                          │
│     strategy: "Smart Scalper",                                  │
│     status: "RUNNING",                                          │
│     stake: 1000,                                                │
│     quote_currency: "USDT",                                     │
│     take_profit: 2.5,                                           │
│     stop_loss: 1.5,                                             │
│     metrics: {                                                   │
│       realizedPnL: 234.5,                                       │
│       sharpe: 2.45,                                             │
│       winRate: 72,                                              │
│       totalTrades: 45,                                          │
│       maxDrawdown: -8.2                                         │
│     }                                                            │
│   },                                                             │
│   // ... más bots                                               │
│ ]                                                                │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Frontend - Renderizar ProfessionalBotsTable            │
│ Componente: ProfessionalBotsTable.jsx                          │
│ Props: { bots, onToggleBotStatus, onDeleteBot, ... }           │
│                                                                  │
│ Renderiza:                                                       │
│ - Desktop (>768px): Tabla 10 columnas                           │
│ - Mobile (<768px): Cards 8 secciones                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Usuario Ve Tabla Bots                                  │
│                                                                  │
│ Desktop:                                                         │
│ ┌───────┬────────┬────────┬─────────┬────────┬──────┐          │
│ │  BTC  │   🟢   │ $1,000 │ +$234   │  2.45  │ 72%  │          │
│ │ Smart │RUNNING │  USDT  │ +23.4%  │        │      │          │
│ └───────┴────────┴────────┴─────────┴────────┴──────┘          │
│                                                                  │
│ Mobile:                                                          │
│ ┌─────────────────────────────────────┐                         │
│ │ 🔵 BTCUSDT    🟢 RUNNING            │                         │
│ │ Smart Scalper · SPOT                │                         │
│ │ Capital: $1,000 USDT                │                         │
│ │ PnL: +$234 (+23.4%)                 │                         │
│ │ [▶️ Start] [👁️ Ver] [⚙️ Config]    │                         │
│ └─────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

✅ FIN FLUJO LISTAR BOTS
```

---

### **FLUJO 2: Acciones Bot (Start/Pause/Delete)**

```
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: Usuario Click Acción (ej. ▶️ Start)                   │
│ Ubicación: ProfessionalBotsTable → Fila bot → Botón acción     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend - Handler onToggleBotStatus                   │
│ Componente: ProfessionalBotsTable.jsx                          │
│ onClick={() => onToggleBotStatus(bot.id, bot.status)}          │
│                                                                  │
│ Llama a: useBotManagement.js → toggleBotStatus()               │
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
│ Body: { status: "RUNNING" }                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Backend - routes/bots.py                               │
│ Endpoint: PATCH /api/bots/{bot_id}/status                      │
│                                                                  │
│ 4a. Autenticación DL-008                                        │
│ 4b. Verificar bot pertenece a usuario                           │
│ 4c. Actualizar status:                                          │
│     bot.status = "RUNNING"                                      │
│     bot.updated_at = datetime.now()                             │
│     db.commit()                                                 │
│                                                                  │
│ Response: {"success": True, "bot": bot}                         │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP Response
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: Frontend - Actualizar UI                               │
│ Hook: useBotManagement.js                                       │
│                                                                  │
│ Actualiza state.bots:                                           │
│ - Cambia status del bot específico                              │
│ - Re-render ProfessionalBotsTable                               │
│ - Icono cambia: 🔴 STOPPED → 🟢 RUNNING                        │
└─────────────────────────────────────────────────────────────────┘

✅ FIN FLUJO ACCIÓN BOT
```

---

## 🔧 **INTEGRACIÓN**

### **DL-008: Autenticación JWT**

```javascript
// Frontend - Consumo protegido
const { authenticatedFetch } = useAuthDL008();

const response = await authenticatedFetch('/api/bots', {
  method: 'GET'
});
// ✅ JWT token automático en headers
```

```python
# Backend - Endpoint protegido
@router.get("/api/bots")
async def list_bots(
    current_user: User = Depends(get_current_user_safe),  # ✅ DL-008
    db: Session = Depends(get_db)
):
    bots = db.query(BotConfig).filter(
        BotConfig.user_id == current_user.id
    ).all()
    return bots
```

### **DL-001: No Hardcode / No Simulation**

#### **✅ COMPLIANT:**
```jsx
// ProfessionalBotsTable.jsx - PnL real desde bot.metrics
const rawPnL = bot.metrics?.realizedPnL || 0;  // ✅ Dato real o 0
const pnl = isNaN(rawPnL) ? 0 : Number(rawPnL);  // ✅ Validación

// NO Math.random()
// NO datos simulados
```

### **DL-076: Components <150 líneas**

#### **❌ VIOLATION:**
- ProfessionalBotsTable.jsx: **498 líneas** ❌ (3.3x límite)

#### **✅ PLAN DESCOMPOSICIÓN:**
```
ProfessionalBotsTable.jsx (498 líneas) → SEPARAR EN:
├── ProfessionalBotsPanel.jsx (90 líneas) - Orquestador
├── BotsDesktopTable.jsx (145 líneas) - Vista desktop
├── BotsMobileCards.jsx (135 líneas) - Vista mobile
├── BotTableRow.jsx (75 líneas) - Fila individual
├── BotCard.jsx (95 líneas) - Card individual
└── BotActionsMenu.jsx (70 líneas) - Menú acciones
```

---

## 🎨 **DISEÑO UX/UI**

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
├───────┼────────┼────────┼─────────┼────────┼─────────┼────────┼───────┼──────────┤
│ SOL   │   🔴   │  $250  │   $0    │   -    │    -    │    0   │ +2.0% │ ▶️👁️📊⚙️🗑️ │
│ Anti  │STOPPED │  USDT  │  0.0%   │        │         │        │ -1.0% │          │
│ Manip │        │        │         │        │         │        │       │          │
└───────┴────────┴────────┴─────────┴────────┴─────────┴────────┴───────┴──────────┘

LEYENDA ACCIONES:
▶️ = Start/Pause Bot
👁️ = Ver Algoritmos Avanzados (InstitutionalChart)
📊 = Ver Historial Trading específico del bot
⚙️ = Settings/Modificar Bot
🗑️ = Eliminar Bot

LEYENDA ESTADOS:
🟢 = RUNNING (ejecución activa)
🟡 = PAUSED (pausado temporalmente)
🔴 = STOPPED (detenido)
⚠️ = ERROR (error crítico)
```

**Funcionalidades Desktop:**
1. **Sorting:** Click en header columna → ordena asc/desc
2. **Row Hover:** Resalta fila completa en hover
3. **Color PnL:** Verde si positivo, rojo si negativo
4. **Tooltips:** Hover en Sharpe/MaxDD muestra explicación métrica
5. **Action Hover:** Botones acciones muestran tooltip nombre acción

---

#### **Vista Mobile (<768px) - TARJETAS:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 BTCUSDT          🟢 RUNNING                              │
│ Smart Scalper · SPOT                                        │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 DATOS GENERALES                                    │   │
│ │ Capital: $1,000 USDT                                  │   │
│ │ Par: BTCUSDT                                          │   │
│ │ Tipo: SPOT                                            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 💰 PERFORMANCE                                        │   │
│ │ PnL: +$234 (+23.4%) 🟢                                │   │
│ │ Win Rate: 72%                                         │   │
│ │ Trades: 45                                            │   │
│ │ Sharpe: 2.45                                          │   │
│ │ Max DD: -8.2%                                         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🎯 GESTIÓN RIESGO                                     │   │
│ │ Take Profit: +2.5%                                    │   │
│ │ Stop Loss: -1.5%                                      │   │
│ │ Leverage: 1x                                          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [▶️ Start] [👁️ Ver Algoritmos] [⚙️ Configurar]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🟣 ETHUSDT          🟡 PAUSED                               │
│ Trend Hunter · FUTURES_USDT 10x                            │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📊 DATOS GENERALES                                    │   │
│ │ Capital: $500 USDT                                    │   │
│ │ Par: ETHUSDT                                          │   │
│ │ Tipo: FUTURES_USDT                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 💰 PERFORMANCE                                        │   │
│ │ PnL: -$45 (-9.0%) 🔴                                  │   │
│ │ Win Rate: 58%                                         │   │
│ │ Trades: 12                                            │   │
│ │ Sharpe: 1.23                                          │   │
│ │ Max DD: -15.3%                                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🎯 GESTIÓN RIESGO                                     │   │
│ │ Take Profit: +3.0%                                    │   │
│ │ Stop Loss: -2.0%                                      │   │
│ │ Leverage: 10x                                         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [▶️ Resume] [👁️ Ver Algoritmos] [⚙️ Configurar]            │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades Mobile:**
1. **Swipe Gestures:** Swipe left → Delete, Swipe right → Pause
2. **Expandable Sections:** Tap header sección → expande/colapsa detalles
3. **Quick Actions:** Botones grandes touch-friendly
4. **Status Badge:** Badge superior derecha con estado bot
5. **Color Coding:** Border izquierdo card color según PnL (verde/rojo)

---

## 🔥 **ISSUES IDENTIFICADOS**

### **📋 RESUMEN EJECUTIVO**

| # | Issue | Severidad | Estado | Bloquea Feature |
|---|-------|-----------|--------|-----------------|
| 1 | ProfessionalBotsTable 498 líneas | 🟡 ALTA | ❌ ACTIVO | ❌ NO |
| 2 | Desktop + Mobile mismo componente | 🟡 MEDIA | ❌ ACTIVO | ❌ NO |
| 3 | Sorting inline no reutilizable | 🟡 BAJA | ❌ ACTIVO | ❌ NO |

---

### **🟡 ISSUE #1: PROFESSIONALBOTSTABLE 498 LÍNEAS (VIOLA DL-076)**

**SEVERIDAD:** 🟡 ALTA
**IMPACTO:** Componente difícil de mantener, viola DL-076 <150 líneas
**BLOQUEA FEATURE:** ❌ NO (funciona correctamente)

#### **PLAN CORRECCIÓN:**
Ver **Plan Corrección FASE 1** (refactoring componentes)

---

## ✅ **PLAN CORRECCIÓN**

### **FASE 1: REFACTORING DL-076 (1 semana)**

**Separar ProfessionalBotsTable.jsx en 6 componentes:**

1. **ProfessionalBotsPanel.jsx** (90 líneas)
   - Orquestador detecta viewport
   - Renderiza Desktop o Mobile según breakpoint
   - Pasa props a componentes hijos

2. **BotsDesktopTable.jsx** (145 líneas)
   - Tabla completa 10 columnas
   - Usa hook useBotsTable para sorting
   - Renderiza BotTableRow por cada bot

3. **BotTableRow.jsx** (75 líneas)
   - Fila individual tabla desktop
   - 10 celdas datos
   - BotActionsMenu integrado

4. **BotsMobileCards.jsx** (135 líneas)
   - Grid cards responsive
   - Renderiza BotCard por cada bot
   - Swipe gestures

5. **BotCard.jsx** (95 líneas)
   - Card individual mobile
   - 3 secciones expandibles
   - BotActionsMenu integrado

6. **BotActionsMenu.jsx** (70 líneas)
   - Menú 5 acciones reutilizable
   - Desktop: botones inline
   - Mobile: dropdown menu

### **FASE 2: HOOKS ESPECIALIZADOS (3-5 días)**

1. **useBotsTable.js** (<100 líneas)
   - Sorting multi-columna
   - Filtering por status/strategy
   - Pagination (10/25/50 bots por página)

2. **useBotActions.js** (<80 líneas)
   - Handlers reutilizables acciones
   - Confirmaciones modales
   - Optimistic updates

**TIEMPO TOTAL:** 1.5 semanas

---

*Creado: 2025-10-02*
*Última Actualización: 2025-10-02*
*Propósito: Documentación técnica panel profesional bots*
*Objetivo: Separación clara arquitectura tabla/cards vs core execution*
*Nivel Detalle: EXHAUSTIVO (match 01_AUTHENTICATION_SECURITY 1,848L)*
