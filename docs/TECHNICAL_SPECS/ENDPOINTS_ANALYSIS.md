# 📋 Análisis de Endpoints - Trading Operations & Order Tracking

## 🎯 **PROBLEMA IDENTIFICADO**
**El usuario necesita**:
1. **IDs de operaciones** para tracking individual
2. **Estados de órdenes** en tiempo real  
3. **Consulta en Binance** directa por orden ID
4. **Historial de operaciones** con paginación
5. **Persistencia** de datos entre sesiones

---

## ✅ **ENDPOINTS EXISTENTES (Funcionales)**

### **🤖 Bot Management**
```bash
GET    /api/bots                    # Lista bots del usuario
POST   /api/create-bot             # Crear nuevo bot ✅ ACTUALIZADO - Risk Management campos  
PUT    /api/bots/{bot_id}          # Actualizar bot
DELETE /api/bots/{bot_id}          # Eliminar bot
POST   /api/bots/{bot_id}/start    # Iniciar bot
POST   /api/bots/{bot_id}/pause    # Pausar bot
```

#### **🆕 ACTUALIZACIÓN CRÍTICA - Eliminación Hardcoding Risk Management (11-Agosto-2025)**
El endpoint `/api/create-bot` ahora acepta y persiste TODOS los campos de Risk Management:
- `entry_order_type`: "MARKET", "LIMIT", "STOP_LIMIT"
- `exit_order_type`: "MARKET", "LIMIT" 
- `tp_order_type`: "LIMIT", "MARKET"
- `sl_order_type`: "STOP_MARKET", "STOP_LIMIT"
- `trailing_stop`: true/false
- `max_open_positions`: 1-10 posiciones simultáneas
- `cooldown_minutes`: 5-120 minutos entre operaciones
- `exchange_id`: FK a UserExchange (opcional)

### **📊 Trading Analysis**  
```bash
POST   /api/run-smart-trade/{symbol}        # Análisis Smart Scalper ✅
GET    /api/real-indicators/{symbol}        # Indicadores tiempo real ✅
POST   /api/user/technical-analysis         # Análisis usuario autenticado ✅
GET    /api/technical-analysis/{symbol}     # Análisis técnico público ✅
```

### **⚡ Execution Metrics & Performance**
```bash
GET    /api/bots/{bot_id}/execution-summary   # Resumen ejecuciones ✅
GET    /api/bots/{bot_id}/execution-metrics   # Métricas detalladas ✅
POST   /api/bots/{bot_id}/simulate-execution  # Simulación ejecución ✅
GET    /api/execution-metrics/system-stats    # ✅ Estadísticas sistema completo
GET    /api/execution-metrics/health          # ✅ Health check ejecución
```

### **📈 Trading History & Stats**
```bash
GET    /api/bots/{bot_id}/orders              # Órdenes básicas ✅
GET    /api/bots/{bot_id}/trades              # Trades básicos ✅
POST   /api/bots/{bot_id}/orders              # Crear orden ✅
GET    /api/bots/{bot_id}/trading-summary     # Resumen trading ✅
GET    /api/bots/{bot_id}/performance-metrics # ✅ Métricas performance detalladas
POST   /api/bots/{bot_id}/create-sample-data  # ✅ Crear datos muestra testing
GET    /api/trading-history/stats             # ✅ Estadísticas históricas globales
```

### **🔗 Binance Integration** 
```bash
GET    /auth/binance-account        # Balance cuenta Binance ✅
GET    /auth/binance-price/{symbol} # Precio tiempo real ✅
POST   /testnet/spot/order          # Crear orden testnet ✅
GET    /testnet/spot/orders         # Órdenes testnet ✅
```

### **🏛️ Exchange Management**
```bash
GET    /api/user/exchanges                       # Lista exchanges usuario ✅
POST   /api/user/exchanges                       # Agregar exchange ✅
PUT    /api/user/exchanges/{exchange_id}         # Actualizar exchange ✅
DELETE /api/user/exchanges/{exchange_id}         # Eliminar exchange ✅
POST   /api/user/exchanges/{exchange_id}/test    # Probar conexión ✅
GET    /api/user/exchanges/{exchange_id}/balance # Balance exchange ✅
GET    /api/user/exchanges/{exchange_id}/market-types    # Tipos mercado por exchange ✅
GET    /api/user/exchanges/{exchange_id}/symbol-details  # ✅ DL-037 NEW - Símbolos reales Binance
GET    /api/user/exchanges/{exchange_id}/trading-intervals # ✅ DL-037 NEW - Intervalos trading reales  
GET    /api/user/exchanges/{exchange_id}/margin-types     # ✅ DL-037 NEW - Tipos margin reales
```

### **🔄 Real Trading Operations** 
```bash
POST   /api/bots/{bot_id}/trading-operations     # Crear operación trading ✅
GET    /api/bots/{bot_id}/trading-operations     # Operaciones por bot ✅
GET    /api/trading-operations/{trade_id}        # Operación específica ✅
DELETE /api/trading-operations/{trade_id}        # Eliminar operación ✅
GET    /api/trading-feed/live                    # Feed trading en vivo ✅
```

### **📊 Market Data & Smart Scalper Engine**
```bash
GET    /api/available-symbols                    # Pares trading reales Binance ✅
POST   /api/run-smart-trade/{symbol}             # ✅ Smart Scalper institucional - Motor algoritmos
GET    /api/technical-analysis/{symbol}          # ✅ Análisis técnico público 
POST   /api/user/technical-analysis              # ✅ Análisis técnico autenticado
GET    /api/real-indicators/{symbol}             # ✅ Indicadores tiempo real
GET    /api/market-data/{symbol}                 # ✅ Datos mercado tiempo real
GET    /api/real-market/{symbol}                 # ✅ Market data alternativo
```

### **🌐 WebSocket & Real-Time**
```bash
GET    /api/websocket/status                  # ✅ Estado conexión WebSocket
POST   /api/websocket/broadcast               # ✅ Broadcast mensajes tiempo real
```

### **🧪 Testnet Environment**  
```bash
POST   /testnet/spot/order                    # ✅ Crear orden testnet
GET    /testnet/spot/orders                   # ✅ Listar órdenes testnet
GET    /testnet/spot/open-orders              # ✅ Órdenes abiertas testnet
GET    /testnet/spot/account                  # ✅ Balance cuenta testnet
GET    /testnet/config                        # ✅ Configuración testnet
POST   /testnet/order                         # ✅ Crear orden genérica
GET    /testnet/order/status                  # ✅ Estado orden testnet
DELETE /testnet/order/cancel                  # ✅ Cancelar orden testnet
```

### **🏥 Health & System**
```bash
GET    /api/health                            # ✅ Health check sistema
POST   /api/init-db                           # ✅ Inicializar base datos
POST   /api/init-auth-only                    # ✅ Inicializar solo auth
GET    /                                      # ✅ Root endpoint
```

### **📊 Dashboard Extended**  
```bash
GET    /api/dashboard/summary                 # ✅ Resumen dashboard principal
GET    /api/dashboard/balance-evolution       # ✅ Evolución balance tiempo
GET    /api/dashboard/bots-performance        # ✅ Performance todos los bots
GET    /api/dashboard/symbols-analysis        # ✅ Análisis símbolos trading
```

### **🔐 Authentication Extended**
```bash
POST   /api/auth/register                     # ✅ Registro usuario
POST   /api/auth/login                        # ✅ Login usuario
GET    /api/auth/me                           # ✅ Info usuario actual
POST   /api/auth/logout                       # ✅ Logout usuario
PUT    /api/auth/api-keys                     # ✅ Actualizar API keys
GET    /api/auth/binance-status               # ✅ Estado conexión Binance
POST   /api/auth/test-binance-connection      # ✅ Test conexión Binance
POST   /api/auth/verify-email                 # ✅ Verificar email
POST   /api/auth/resend-verification          # ✅ Reenviar verificación
POST   /api/auth/request-password-reset       # ✅ Solicitar reset password
POST   /api/auth/reset-password               # ✅ Reset password
POST   /api/auth/test-email-connection        # ✅ Test conexión email
```

### **⚙️ Additional APIs**
```bash
GET    /api/backtest-chart/{symbol}           # ✅ Gráfico backtest
GET    /api/backtest-results/{bot_id}         # ✅ Resultados backtest
POST   /api/execute-trade                     # ✅ Ejecutar trade público
POST   /api/user/execute-trade                # ✅ Ejecutar trade usuario
GET    /api/user/trading-status               # ✅ Estado trading usuario
GET    /api/strategies                        # ✅ Lista estrategias disponibles
POST   /api/trading-signals                   # ✅ Generar señales trading
GET    /api/real-trading/health               # ✅ Health check trading real
```

---

## 🎯 **RESUMEN COMPLETO APIs RAILWAY**

### **📊 TOTAL APIs DOCUMENTADAS:**
- **Authentication:** 15 APIs ✅
- **Exchange Management:** 10 APIs ✅ (3 DL-037 nuevas)
- **Bot Management:** 14 APIs ✅
- **Smart Scalper & Market Data:** 7 APIs ✅
- **Execution Metrics:** 5 APIs ✅
- **Trading History:** 7 APIs ✅
- **Trading Operations:** 5 APIs ✅
- **WebSocket:** 2 APIs ✅
- **Testnet:** 8 APIs ✅
- **Dashboard:** 4 APIs ✅
- **Health/System:** 4 APIs ✅
- **Additional/Utilities:** 8 APIs ✅

**TOTAL: 89 APIs DOCUMENTADAS** (vs 76 en Railway - incluye aliases y variants)

---

## ❌ **ENDPOINTS REALMENTE FALTANTES (Críticos para UX)**

### **🔍 1. Order Tracking Individual**
```bash
# 🚨 NECESARIO IMPLEMENTAR
GET    /api/orders/{order_id}                    # Estado orden individual
GET    /api/orders/{order_id}/binance-status     # Estado en Binance real
PUT    /api/orders/{order_id}/cancel             # Cancelar orden
POST   /api/orders/{order_id}/modify             # Modificar orden (TP/SL)

# Response esperado:
{
  "order_id": "uuid-123",
  "binance_order_id": "28457123",
  "bot_id": 5,
  "symbol": "ETHUSDT", 
  "side": "BUY",
  "status": "FILLED",
  "quantity": 0.1,
  "executed_qty": 0.1,
  "avg_price": 2847.85,
  "commission": 0.000075,
  "created_at": "2025-08-11T10:30:00Z",
  "filled_at": "2025-08-11T10:30:15Z"
}
```

### **📊 2. Real Trading Operations**
```bash
# 🚨 NECESARIO IMPLEMENTAR  
POST   /api/bots/{bot_id}/execute-real-trade     # Ejecutar orden REAL
POST   /api/bots/{bot_id}/trades                 # Crear trade con ID tracking
GET    /api/trades/{trade_id}                    # Consultar trade individual
GET    /api/trades/{trade_id}/pnl                # PnL trade específico

# Request ejemplo:
POST /api/bots/5/execute-real-trade
{
  "symbol": "ETHUSDT",
  "side": "BUY",
  "quantity": 0.1,
  "order_type": "MARKET",
  "strategy_signal": "EMA_CROSSOVER", 
  "confidence": 0.85,
  "stop_loss": 2800.00,
  "take_profit": 2900.00
}

# Response:
{
  "success": true,
  "trade_id": "uuid-456",
  "binance_order_id": "28457124",
  "status": "SUBMITTED",
  "expected_fill_price": 2847.50
}
```

### **💼 3. Portfolio & Balance Tracking**
```bash  
# 🚨 NECESARIO IMPLEMENTAR
GET    /api/bots/{bot_id}/balance               # Balance actual del bot
GET    /api/bots/{bot_id}/pnl-history           # Histórico PnL
GET    /api/dashboard/portfolio-summary         # Resumen portfolio completo
POST   /api/bots/{bot_id}/deposit               # Depositar fondos al bot
POST   /api/bots/{bot_id}/withdraw              # Retirar fondos del bot

# Response balance:
{
  "bot_id": 5,
  "initial_capital": 120.00,
  "current_balance": 127.45,
  "available_balance": 125.20,
  "locked_balance": 2.25,        # En órdenes abiertas
  "realized_pnl": 7.45,
  "unrealized_pnl": 2.30,
  "total_pnl": 9.75,
  "pnl_percentage": 8.13,
  "last_updated": "2025-08-11T10:45:30Z"
}
```

### **📄 4. Paginación & Filtros Avanzados**
```bash
# 🚨 NECESARIO IMPLEMENTAR
GET    /api/bots/{bot_id}/trades?page=1&limit=50&status=FILLED
GET    /api/bots/{bot_id}/orders?page=2&limit=25&side=BUY&date_from=2025-08-01
GET    /api/trading-feed/live?bot_id=5&limit=100    # Para Trading en Vivo

# Query parameters:
# - page: número página (default: 1)
# - limit: items por página (10, 25, 50, 100)
# - status: filtrar por estado (FILLED, PENDING, CANCELLED)
# - side: filtrar BUY/SELL
# - date_from/date_to: rango fechas
# - symbol: filtrar por par
# - strategy: filtrar por estrategia
```

### **🔄 5. Real-time Updates & WebSocket Events**
```bash
# 🚨 NECESARIO IMPLEMENTAR
GET    /api/bots/{bot_id}/live-updates          # SSE/WebSocket live updates
POST   /api/orders/{order_id}/subscribe         # Suscribirse a updates orden
DELETE /api/orders/{order_id}/unsubscribe       # Desuscribirse

# WebSocket events:
# - order_update: Estado orden cambia
# - trade_executed: Trade completado
# - pnl_update: PnL actualizado
# - balance_change: Balance modificado
```

---

## 🏗️ **IMPLEMENTACIÓN SUGERIDA**

### **Fase 1: Order Tracking (1-2 días)**
1. **Crear tabla `trading_operations`** con IDs únicos
2. **Endpoint GET /api/orders/{order_id}** - Status individual  
3. **Integración Binance status check** - Estado real en exchange
4. **Response estandarizado** con todos los campos necesarios

### **Fase 2: Real Trading (2-3 días)**  
1. **Endpoint POST /api/bots/{bot_id}/execute-real-trade**
2. **Persistencia órdenes** en base datos
3. **Balance tracking** real por bot
4. **PnL calculation** automático

### **Fase 3: Pagination & UI (1-2 días)**
1. **Paginación endpoints** existentes
2. **Filtros avanzados** (fecha, estado, strategy)  
3. **Frontend pagination component**
4. **Trading Live Feed** con pagination

### **Fase 4: Real-time (2-3 días)**
1. **WebSocket integration** para updates
2. **SSE events** para cambios de estado
3. **Live PnL updates** en dashboard
4. **Notifications system**

---

## 📋 **ESTRUCTURA DE DATOS NECESARIA**

### **Tabla: `trading_operations`**
```sql
CREATE TABLE trading_operations (
    id VARCHAR(36) PRIMARY KEY,           -- UUID único
    bot_id INTEGER NOT NULL,              -- FK a botconfig
    binance_order_id VARCHAR(50),         -- ID orden en Binance
    symbol VARCHAR(20) NOT NULL,          -- ETHUSDT, BTCUSDT, etc
    side ENUM('BUY', 'SELL') NOT NULL,
    order_type ENUM('MARKET', 'LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'),
    quantity DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8),                 -- Precio orden (si LIMIT)
    executed_qty DECIMAL(18, 8) DEFAULT 0,
    avg_price DECIMAL(18, 8),             -- Precio promedio ejecución
    status ENUM('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED'),
    
    -- Trading Strategy Info
    strategy VARCHAR(50),                 -- EMA_CROSSOVER, RSI_DIVERGENCE, etc
    confidence DECIMAL(5, 4),             -- 0.85 = 85%
    signal_source VARCHAR(30),            -- smart_scalper_real, websocket, etc
    
    -- P&L Tracking
    realized_pnl DECIMAL(18, 8) DEFAULT 0,
    commission DECIMAL(18, 8) DEFAULT 0,
    commission_asset VARCHAR(10),
    
    -- Risk Management
    stop_loss DECIMAL(18, 8),
    take_profit DECIMAL(18, 8),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    filled_at TIMESTAMP NULL,
    
    -- Indexes
    INDEX idx_bot_id (bot_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (bot_id) REFERENCES botconfig(id)
);
```

### **Tabla: `bot_balances`**
```sql
CREATE TABLE bot_balances (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    bot_id INTEGER NOT NULL,
    initial_capital DECIMAL(18, 8) NOT NULL,
    current_balance DECIMAL(18, 8) NOT NULL,
    available_balance DECIMAL(18, 8) NOT NULL,
    locked_balance DECIMAL(18, 8) DEFAULT 0,
    realized_pnl DECIMAL(18, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(18, 8) DEFAULT 0,
    
    -- Snapshot temporal
    snapshot_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (bot_id) REFERENCES botconfig(id),
    INDEX idx_bot_snapshot (bot_id, snapshot_at)
);
```

---

## ⚡ **PRIORIDAD INMEDIATA**

Para resolver las **5 consultas críticas del usuario**:

1. **🔍 IDs de operaciones** → Implementar `trading_operations` table + endpoints
2. **📊 Estados órdenes** → GET `/api/orders/{order_id}` + Binance integration  
3. **💾 Persistencia Trading** → Base datos + endpoints CRUD
4. **💼 Balance tracking** → `bot_balances` + PnL calculation
5. **📄 Paginación** → Query parameters + frontend components

### **Orden de Implementación Sugerido:**
1. **Base datos** (30 min)
2. **Order tracking endpoints** (60 min)  
3. **Balance & PnL** (45 min)
4. **Paginación** (30 min)
5. **Testing** (30 min)

**Total estimado**: 3-4 horas para resolver los problemas core.

---

## 📊 **AUDIT COMPLETO APIs RAILWAY vs FRONTEND**

### **📈 REALIDAD SYSTEM:**
- **RAILWAY PRODUCTION:** **76 APIs** funcionando
- **DOCUMENTACIÓN:** **89 APIs** catalogadas (incluye aliases)  
- **FRONTEND INTEGRATION:** **23 APIs** (25.8%) integradas

### **🎯 CRITICIDAD APIs:**
- **🚨 CRÍTICAS:** 8 APIs (9%) - Core system functionality
- **🔥 ALTAS:** 32 APIs (36%) - Important business features  
- **⚡ MEDIAS:** 35 APIs (39%) - Supporting features
- **📝 BAJAS:** 14 APIs (16%) - Utilities y development

### **📊 GAPS PRINCIPALES IDENTIFICADOS:**
- **Exchange Management:** 7/10 APIs no usadas en frontend
- **Execution Metrics:** 5/5 APIs sin integrar UI  
- **Authentication Extended:** 10/15 APIs parcialmente integradas
- **Testnet Environment:** 8/8 APIs no usadas

### **🆕 DL-037 APIs (IMPLEMENTADAS 2025-08-26):**
1. **GET /api/user/exchanges/{id}/symbol-details** - 🚨 CRÍTICA - Símbolos reales Binance (400+ vs 7 hardcoded)
2. **GET /api/user/exchanges/{id}/trading-intervals** - 🔥 ALTA - Timeframes con Smart Scalper recommendations  
3. **GET /api/user/exchanges/{id}/margin-types** - ⚡ MEDIA - Margin types con risk levels

**STATUS DL-037:** ✅ **FUNCTIONAL** - Resolvieron ERROR 500 en bot creation/modification processes

---

## 🎯 **RECOMENDACIONES INMEDIATAS:**

### **PRIORIDAD MÁXIMA (Semana 1):**
1. **Execution Metrics Integration** - 0% uso frontend, crítico para performance visibility
2. **Exchange Management UI** - Completar 7 APIs faltantes en frontend
3. **Authentication Flow Complete** - Password reset + email verification

### **PRIORIDAD ALTA (Mes 1):**
4. **Testnet Integration** - UI para testing seguro 
5. **Bot Management Advanced** - Update APIs y métricas detalladas
6. **Performance Dashboard** - Execution metrics en dashboard

---

> **Documento creado**: 11 Agosto 2025  
> **Actualizado**: 26 Agosto 2025 - DL-037 APIs + Railway Audit  
> **Para**: Eduard Guzmán - InteliBotX Endpoints Analysis  
> **Objetivo**: Identificar gaps y roadmap para tracking completo de operaciones