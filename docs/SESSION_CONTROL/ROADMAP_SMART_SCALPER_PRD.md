# ROADMAP SMART SCALPER A PRODUCCIÓN - Ruta Crítica Optimizada

> **OBJETIVO:** Poner Smart Scalper operativo en PRD lo antes posible (2-3 semanas)
> **Fecha:** 2025-10-02
> **Modo/Estrategia:** Smart Scalper (único modo inicial)
> **Algoritmos Mínimos:** Wyckoff (✅) + Order Blocks + Liquidity Grabs (3/12 = 25%)

---

## 🎯 **PREMISA: MÍNIMO VIABLE OPERACIONAL (MVO)**

Para operar Smart Scalper en producción necesitamos:
1. **Algoritmos mínimos:** 3/12 (Wyckoff ✅ + Order Blocks + Liquidity Grabs)
2. **Parámetros consumidos:** 12 críticos de 62 (stake, TP/SL, leverage, interval, cooldown, etc.)
3. **Ejecución automática:** Bot ejecuta trades automáticamente según interval
4. **Backtesting básico:** Validación datos reales antes producción
5. **Seguridad completa:** DL-008 authentication (✅ YA IMPLEMENTADO)

---

## 📋 **ISSUES BLOQUEANTES CRÍTICOS (5)**

Según `06_BOT_RUNNING_CORE_ARCHITECTURE.md` issues identificados:

| # | Issue | Bloquea PRD | Tiempo Fix | Prioridad |
|---|-------|-------------|------------|-----------|
| **#1** | 58/62 parámetros NO consumidos | ✅ SÍ | 3-5 días | 🔥 P0 |
| **#2** | Solo 1/12 algoritmos (Wyckoff) | ✅ SÍ | 2 semanas | 🔥 P0 |
| **#3** | No ejecución automática bot | ✅ SÍ | 2-3 días | 🔥 P0 |
| **#4** | No backtesting datos reales | ✅ SÍ | 1 semana | 🔥 P0 |
| **#5** | Wyckoff parámetros hardcoded | ⚠️ PARCIAL | 2 días | 🟡 P1 |

**TIEMPO TOTAL ISSUES CRÍTICOS:** ~3 semanas paralelo

---

## 🚀 **RUTA CRÍTICA OPTIMIZADA (PARALELO)**

### **SEMANA 1: FUNDAMENTOS OPERACIONALES (5 días hábiles)**

#### **DÍA 1-2: ISSUE #1 - PARÁMETROS CONSUMIDOS (P0 - BLOQUEANTE)**
**Objetivo:** Bot respeta configuración usuario (12 parámetros críticos de 62)

**Archivos a modificar:**
1. `backend/routes/real_trading_routes.py` (486 líneas)
   - **ANTES:** `@router.post("/api/run-smart-trade/{symbol}")`
   - **DESPUÉS:** `@router.post("/api/run-smart-trade/{bot_id}")`
   - **CAMBIO:** Agregar `bot_id: int` parámetro, cargar `BotConfig` desde DB

2. `backend/services/real_trading_engine.py` (234 líneas)
   - **ANTES:** `def execute_smart_trade(self, symbol: str, user_id: int)`
   - **DESPUÉS:** `def execute_smart_trade(self, symbol: str, user_id: int, bot_config: BotConfig)`
   - **CAMBIOS:**
     ```python
     # ✅ Consumir parámetros críticos:
     stake = bot_config.stake                    # Era: hardcoded 100.0
     take_profit = bot_config.take_profit        # Era: hardcoded 1.5
     stop_loss = bot_config.stop_loss            # Era: hardcoded 1.0
     leverage = bot_config.leverage or 1         # Era: hardcoded 1
     interval = bot_config.interval              # Era: hardcoded ["5m","15m","1h"]
     cooldown_minutes = bot_config.cooldown_minutes  # Era: NO existía
     max_open_positions = bot_config.max_open_positions  # Era: NO existía
     entry_order_type = bot_config.entry_order_type  # Era: hardcoded "MARKET"
     margin_type = bot_config.margin_type        # Era: NO existía
     ```

3. `backend/services/signal_quality_assessor.py` (867 líneas)
   - **Agregar:** Pasar `wyckoff_config` dict a detectores Wyckoff
   - **18 parámetros Wyckoff** desde `bot_config.wyckoff_*`

**Plan Implementación:**
```python
# PASO 1: Modificar endpoint (1 hora)
@router.post("/api/run-smart-trade/{bot_id}")
async def run_smart_trade(
    bot_id: int,  # ← NUEVO
    current_user: User = Depends(get_current_user_safe),
    db: Session = Depends(get_db)
):
    # Cargar bot
    bot = db.query(BotConfig).filter(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    ).first()

    if not bot:
        raise HTTPException(404, "Bot no encontrado")

    # Pasar a engine
    result = engine.execute_smart_trade(
        symbol=bot.symbol,
        user_id=current_user.id,
        bot_config=bot  # ← NUEVO
    )
    return result

# PASO 2: Modificar engine (4 horas)
def execute_smart_trade(self, symbol: str, user_id: int, bot_config: BotConfig):
    # Validar max_open_positions
    open_positions = self._count_open_positions(user_id)
    if open_positions >= bot_config.max_open_positions:
        return {"error": "Max open positions reached", "open": open_positions}

    # Validar cooldown
    last_trade = self._get_last_trade_time(user_id, symbol)
    if last_trade and (datetime.now() - last_trade).minutes < bot_config.cooldown_minutes:
        return {"error": "Cooldown active", "wait_minutes": remaining}

    # Usar configuración usuario
    stake = bot_config.stake
    leverage = bot_config.leverage or 1
    quantity = (stake * leverage) / current_price

    # Pasar a signal assessor
    signal = self.signal_assessor.assess_signal_quality(
        symbol=symbol,
        wyckoff_config={
            'prior_trend_bars': bot_config.wyckoff_prior_trend_bars,
            'volume_increase_factor': bot_config.wyckoff_volume_increase_factor,
            # ... 16 parámetros más
        }
    )

# PASO 3: Modificar Wyckoff detectors (4 horas)
# backend/services/wyckoff/accumulation_detector.py
class AccumulationDetector:
    def __init__(self, config: Dict = None):  # ← NUEVO
        self.config = config or {}
        self.volume_increase_factor = self.config.get('volume_increase_factor', 1.5)
        self.spring_volume = self.config.get('spring_volume_increase', 2.0)
        # ... usar config dict para TODOS los parámetros
```

**Validación:**
- ✅ Test: Crear bot con leverage=10x → verificar quantity usa leverage
- ✅ Test: Crear bot con cooldown=30min → verificar NO ejecuta antes 30min
- ✅ Test: max_open_positions=3 → verificar rechaza trade #4

**TIEMPO:** 1.5 días (12 horas trabajo)

---

#### **DÍA 2-3: ISSUE #3 - EJECUCIÓN AUTOMÁTICA (P0 - BLOQUEANTE)**
**Objetivo:** Bot ejecuta trades automáticamente según `bot.interval`

**Problema Actual:** Cambiar status a RUNNING NO inicia ejecución automática

**Solución: Scheduler Backend**

**Archivos a crear/modificar:**
1. `backend/services/bot_scheduler.py` (NUEVO - ~150 líneas)
   ```python
   import asyncio
   from apscheduler.schedulers.asyncio import AsyncIOScheduler

   class BotScheduler:
       def __init__(self, db_session):
           self.scheduler = AsyncIOScheduler()
           self.db = db_session
           self.active_jobs = {}  # {bot_id: job_id}

       def start_bot_execution(self, bot_id: int):
           """Inicia ejecución periódica del bot"""
           bot = self.db.query(BotConfig).filter(BotConfig.id == bot_id).first()

           if not bot or bot.status != 'RUNNING':
               return

           # Convertir interval a minutos
           interval_minutes = self._parse_interval(bot.interval)  # "15m" → 15

           # Crear job periódico
           job = self.scheduler.add_job(
               self._execute_bot_trade,
               'interval',
               minutes=interval_minutes,
               args=[bot_id],
               id=f"bot_{bot_id}"
           )

           self.active_jobs[bot_id] = job.id

       async def _execute_bot_trade(self, bot_id: int):
           """Ejecuta trade del bot (llamado por scheduler)"""
           bot = self.db.query(BotConfig).filter(BotConfig.id == bot_id).first()

           if not bot or bot.status != 'RUNNING':
               self.stop_bot_execution(bot_id)
               return

           # Ejecutar trade
           result = await real_trading_engine.execute_smart_trade(
               symbol=bot.symbol,
               user_id=bot.user_id,
               bot_config=bot
           )

           # Log resultado
           logger.info(f"Bot {bot_id} executed: {result}")

       def stop_bot_execution(self, bot_id: int):
           """Detiene ejecución periódica del bot"""
           if bot_id in self.active_jobs:
               self.scheduler.remove_job(self.active_jobs[bot_id])
               del self.active_jobs[bot_id]
   ```

2. `backend/routes/bots.py` - Modificar endpoint PATCH status
   ```python
   @router.patch("/api/bots/{bot_id}/status")
   async def update_bot_status(
       bot_id: int,
       status_update: BotStatusUpdate,
       current_user: User = Depends(get_current_user_safe),
       db: Session = Depends(get_db)
   ):
       bot = db.query(BotConfig).filter(
           BotConfig.id == bot_id,
           BotConfig.user_id == current_user.id
       ).first()

       if not bot:
           raise HTTPException(404, "Bot no encontrado")

       # Actualizar status
       old_status = bot.status
       bot.status = status_update.status
       db.commit()

       # ✅ NUEVO: Iniciar/detener scheduler
       if status_update.status == 'RUNNING' and old_status != 'RUNNING':
           bot_scheduler.start_bot_execution(bot_id)
       elif status_update.status in ['PAUSED', 'STOPPED'] and old_status == 'RUNNING':
           bot_scheduler.stop_bot_execution(bot_id)

       return {"success": True, "bot": bot}
   ```

3. `backend/main.py` - Iniciar scheduler on startup
   ```python
   from services.bot_scheduler import BotScheduler

   @app.on_event("startup")
   async def startup_event():
       # Iniciar scheduler global
       global bot_scheduler
       bot_scheduler = BotScheduler(db_session)
       bot_scheduler.scheduler.start()

       # Reiniciar bots que estaban RUNNING antes restart
       running_bots = db.query(BotConfig).filter(BotConfig.status == 'RUNNING').all()
       for bot in running_bots:
           bot_scheduler.start_bot_execution(bot.id)
   ```

**Dependencias:**
```bash
pip install apscheduler
```

**Validación:**
- ✅ Test: Bot status=RUNNING interval=5m → ejecuta trade cada 5 minutos
- ✅ Test: Bot status=PAUSED → scheduler detiene ejecución
- ✅ Test: Restart backend → bots RUNNING reinician automáticamente

**TIEMPO:** 1 día (8 horas trabajo)

---

#### **DÍA 4-5: ISSUE #4 - BACKTESTING BÁSICO (P0 - BLOQUEANTE)**
**Objetivo:** Validar estrategia con datos históricos reales antes PRD

**Archivos a crear:**
1. `backend/services/backtesting_engine.py` (NUEVO - ~200 líneas)
   ```python
   class BacktestingEngine:
       async def run_backtest(
           self,
           bot_config: BotConfig,
           start_date: datetime,
           end_date: datetime
       ) -> BacktestResult:
           """
           Ejecuta backtest con datos históricos reales

           SPEC_REF: 06_BOT_RUNNING_CORE_ARCHITECTURE.md Issue #4
           """
           # 1. Cargar datos históricos Binance
           historical_data = await binance_service.get_historical_klines(
               symbol=bot_config.symbol,
               interval=bot_config.interval,
               start_time=start_date,
               end_time=end_date
           )

           # 2. Simular ejecución trades
           trades = []
           capital = bot_config.stake

           for i, candle in enumerate(historical_data):
               # Ejecutar análisis Smart Money
               signal = await self._simulate_smart_scalper(
                   bot_config=bot_config,
                   historical_slice=historical_data[max(0, i-100):i+1]
               )

               if signal['action'] in ['BUY', 'SELL']:
                   # Simular trade
                   trade = self._execute_simulated_trade(
                       signal=signal,
                       entry_price=candle['close'],
                       bot_config=bot_config
                   )
                   trades.append(trade)

           # 3. Calcular métricas
           metrics = self._calculate_backtest_metrics(trades)

           return BacktestResult(
               total_trades=len(trades),
               win_rate=metrics['win_rate'],
               pnl=metrics['total_pnl'],
               sharpe=metrics['sharpe'],
               max_drawdown=metrics['max_drawdown'],
               trades=trades
           )
   ```

2. `backend/routes/backtest_routes.py` (NUEVO)
   ```python
   @router.post("/api/bots/{bot_id}/backtest")
   async def run_bot_backtest(
       bot_id: int,
       backtest_params: BacktestParams,
       current_user: User = Depends(get_current_user_safe),
       db: Session = Depends(get_db)
   ):
       bot = db.query(BotConfig).filter(
           BotConfig.id == bot_id,
           BotConfig.user_id == current_user.id
       ).first()

       if not bot:
           raise HTTPException(404, "Bot no encontrado")

       # Ejecutar backtest
       result = await backtesting_engine.run_backtest(
           bot_config=bot,
           start_date=backtest_params.start_date,
           end_date=backtest_params.end_date
       )

       # Guardar resultado
       db.add(BacktestRecord(
           bot_id=bot_id,
           start_date=backtest_params.start_date,
           end_date=backtest_params.end_date,
           result=result.dict()
       ))
       db.commit()

       return result
   ```

**Frontend: Botón "Backtesting" en BotControlPanel**
```jsx
// frontend/src/components/BotControlPanel.jsx
<button onClick={() => runBacktest(bot.id, {
  start_date: '2024-01-01',
  end_date: '2024-12-31'
})}>
  🧪 Backtesting (1 año)
</button>

// Mostrar resultados
<BacktestResults
  winRate={backtest.win_rate}
  pnl={backtest.pnl}
  sharpe={backtest.sharpe}
  trades={backtest.trades}
/>
```

**Validación:**
- ✅ Test: Backtest Smart Scalper 1 año datos BTC → Win Rate >60%
- ✅ Test: Backtest muestra trades individuales con entry/exit/pnl
- ✅ Test: Comparar backtest vs live → divergencia <10%

**TIEMPO:** 1.5 días (12 horas trabajo)

---

### **SEMANA 2-3: ALGORITMOS SMART SCALPER (10 días hábiles)**

#### **DÍA 6-10: ISSUE #2.1 - ORDER BLOCKS (P0 - BLOQUEANTE)**
**Objetivo:** Implementar Order Blocks (2/12 algoritmos = 16.6%)

**Arquitectura disponible:** `02_ORDER_BLOCKS_ARCHITECTURE.md` (1,286 líneas)

**Archivos a crear:**
1. `backend/services/order_blocks/detector.py` (NUEVO - ~250 líneas)
   ```python
   class OrderBlockDetector:
       """
       Order Blocks institucionales - Zonas de compra/venta Smart Money

       SPEC_REF: 02_ORDER_BLOCKS_ARCHITECTURE.md
       """
       def detect_order_blocks(
           self,
           highs: np.ndarray,
           lows: np.ndarray,
           closes: np.ndarray,
           volumes: np.ndarray,
           config: Dict = None
       ) -> Dict:
           # Parámetros desde config (NO hardcoded)
           self.config = config or {}
           min_block_size = self.config.get('min_block_size', 0.02)
           volume_threshold = self.config.get('volume_threshold', 1.5)

           bullish_blocks = []
           bearish_blocks = []

           # Detectar bloques alcistas (zonas soporte institucional)
           for i in range(10, len(closes)):
               if self._is_bullish_order_block(i, closes, volumes):
                   block = {
                       'price': lows[i],
                       'strength': self._calculate_block_strength(i, volumes),
                       'retest_status': 'PENDING',
                       'age_bars': 0
                   }
                   bullish_blocks.append(block)

           # Detectar bloques bajistas (zonas resistencia institucional)
           for i in range(10, len(closes)):
               if self._is_bearish_order_block(i, closes, volumes):
                   block = {
                       'price': highs[i],
                       'strength': self._calculate_block_strength(i, volumes),
                       'retest_status': 'PENDING',
                       'age_bars': 0
                   }
                   bearish_blocks.append(block)

           # Scoring
           dominant_direction = self._determine_dominant_direction(
               bullish_blocks, bearish_blocks
           )

           return {
               'bullish_blocks': bullish_blocks,
               'bearish_blocks': bearish_blocks,
               'dominant_direction': dominant_direction,  # BULLISH/BEARISH/NEUTRAL
               'confidence': self._calculate_confidence(bullish_blocks, bearish_blocks),
               'signal': self._generate_signal(dominant_direction, bullish_blocks, bearish_blocks)
           }
   ```

2. `backend/services/signal_quality_assessor.py` - Integrar Order Blocks
   ```python
   def assess_signal_quality(self, ...):
       # ✅ Wyckoff (ya implementado)
       wyckoff = self._assess_wyckoff_signals(...)

       # ✅ Order Blocks (NUEVO)
       order_blocks = self._assess_order_blocks(
           highs=timeframe_data['5m'].highs,
           lows=timeframe_data['5m'].lows,
           closes=timeframe_data['5m'].closes,
           volumes=timeframe_data['5m'].volumes,
           config=bot_config.order_blocks_config  # Parámetros usuario
       )

       # Consenso 2/12 algoritmos
       consensus = self._calculate_consensus([wyckoff, order_blocks])

       return {
           'quality_score': consensus,
           'wyckoff': wyckoff,
           'order_blocks': order_blocks,  # NUEVO
           'recommendation': self._generate_recommendation(consensus)
       }
   ```

3. **Frontend:** Visualización Order Blocks en `AdvancedMetrics.jsx`
   ```jsx
   // Mostrar bloques alcistas/bajistas
   <AlgorithmCard
     name="Order Blocks"
     status="active"  // ✅ Ahora implementado
     metrics={{
       bullish_blocks: orderBlocksData.bullish_blocks.length,
       bearish_blocks: orderBlocksData.bearish_blocks.length,
       dominant_direction: orderBlocksData.dominant_direction,
       confidence: orderBlocksData.confidence,
       signal: orderBlocksData.signal
     }}
   />
   ```

**Validación:**
- ✅ Test: Detectar Order Blocks en BTC 1 mes → mínimo 10 bloques
- ✅ Test: Retest de bloque → señal BUY/SELL según dirección
- ✅ Test: Consenso Wyckoff + Order Blocks → mejora Win Rate +5-10%

**TIEMPO:** 4 días (32 horas trabajo)

---

#### **DÍA 11-15: ISSUE #2.2 - LIQUIDITY GRABS (P0 - BLOQUEANTE)**
**Objetivo:** Implementar Liquidity Grabs (3/12 algoritmos = 25%)

**Arquitectura disponible:** `03_LIQUIDITY_GRABS_ARCHITECTURE.md` (787 líneas)

**Archivos a crear:**
1. `backend/services/liquidity_grabs/detector.py` (NUEVO - ~200 líneas)
   ```python
   class LiquidityGrabDetector:
       """
       Liquidity Grabs - Detección manipulación Stop Hunts Smart Money

       SPEC_REF: 03_LIQUIDITY_GRABS_ARCHITECTURE.md
       """
       def detect_liquidity_grabs(
           self,
           highs: np.ndarray,
           lows: np.ndarray,
           closes: np.ndarray,
           volumes: np.ndarray,
           atr: float,
           config: Dict = None
       ) -> Dict:
           # Parámetros configurables
           self.config = config or {}
           grab_threshold_atr = self.config.get('grab_threshold_atr', 1.2)
           reversal_bars = self.config.get('reversal_bars', 3)

           buy_side_grabs = []
           sell_side_grabs = []

           # Detectar Buy-Side Grabs (sweep highs → reversal down)
           for i in range(10, len(closes)):
               if self._is_buy_side_grab(i, highs, closes, atr, grab_threshold_atr):
                   grab = {
                       'price': highs[i],
                       'atr_distance': (highs[i] - highs[i-1]) / atr,
                       'reversal_confirmed': self._check_reversal(i, closes, reversal_bars),
                       'volume_spike': volumes[i] / volumes[i-10:i].mean()
                   }
                   buy_side_grabs.append(grab)

           # Detectar Sell-Side Grabs (sweep lows → reversal up)
           for i in range(10, len(closes)):
               if self._is_sell_side_grab(i, lows, closes, atr, grab_threshold_atr):
                   grab = {
                       'price': lows[i],
                       'atr_distance': (lows[i-1] - lows[i]) / atr,
                       'reversal_confirmed': self._check_reversal(i, closes, reversal_bars),
                       'volume_spike': volumes[i] / volumes[i-10:i].mean()
                   }
                   sell_side_grabs.append(grab)

           # Dirección dominante
           direction = self._determine_grab_direction(buy_side_grabs, sell_side_grabs)

           return {
               'buy_side_grabs': buy_side_grabs,
               'sell_side_grabs': sell_side_grabs,
               'direction': direction,  # BULLISH_GRAB/BEARISH_GRAB/NEUTRAL
               'activity_level': self._calculate_activity(buy_side_grabs, sell_side_grabs),
               'signal': self._generate_signal(direction, buy_side_grabs, sell_side_grabs)
           }
   ```

2. Integrar en `signal_quality_assessor.py`
   ```python
   # Consenso 3/12 algoritmos
   consensus = self._calculate_consensus([
       wyckoff,
       order_blocks,
       liquidity_grabs  # NUEVO
   ])
   ```

**Validación:**
- ✅ Test: Detectar Liquidity Grabs BTC → mínimo 5 grabs/semana
- ✅ Test: Grab confirmado → reversal >70% casos
- ✅ Test: Consenso 3 algoritmos → Win Rate >65%

**TIEMPO:** 4 días (32 horas trabajo)

---

## 📊 **RESUMEN TEMPORAL RUTA CRÍTICA**

| Fase | Días | Paralelo | Crítico |
|------|------|----------|---------|
| **Semana 1: Fundamentos** | 5 días | ✅ | 🔥 |
| - Parámetros consumidos | 1.5 | ✅ | P0 |
| - Ejecución automática | 1.0 | ✅ | P0 |
| - Backtesting básico | 1.5 | ✅ | P0 |
| **Semana 2-3: Algoritmos** | 10 días | ✅ | 🔥 |
| - Order Blocks | 4.0 | ✅ | P0 |
| - Liquidity Grabs | 4.0 | ✅ | P0 |
| **Buffer testing** | 2 días | ❌ | 🟡 |

**TIEMPO TOTAL:** 15-17 días hábiles = **3-3.5 semanas**

---

## ✅ **CRITERIOS ACEPTACIÓN PRD**

### **Mínimo Viable Operacional (MVO):**
1. ✅ **Algoritmos:** 3/12 activos (Wyckoff + Order Blocks + Liquidity Grabs)
2. ✅ **Consenso:** Mínimo 2/3 algoritmos coinciden
3. ✅ **Parámetros:** 12 críticos consumidos (stake, TP/SL, leverage, interval, etc.)
4. ✅ **Ejecución:** Automática según interval configurado
5. ✅ **Backtesting:** Win Rate >60% en 6 meses datos reales
6. ✅ **Seguridad:** DL-008 authentication (✅ YA COMPLETO)
7. ✅ **Modo único:** Smart Scalper únicamente

### **Métricas Éxito PRD:**
- **Win Rate:** >60% (backtest + live primeros 30 días)
- **Sharpe Ratio:** >1.5
- **Max Drawdown:** <15%
- **Uptime:** >99%
- **Latency:** <500ms por análisis

---

## 🎯 **ARQUITECTURAS CONSULTADAS**

### **1. SEGURIDAD (✅ YA COMPLETO):**
- `SECURITY_ARCHITECTURE/01_AUTHENTICATION_SECURITY.md` (1,848 líneas) ✅
- `SECURITY_ARCHITECTURE/02_WEBSOCKET_SECURITY.md` (2,502 líneas) ✅
- `SECURITY_ARCHITECTURE/03_ENCRYPTION_SECURITY.md` (2,200 líneas) ✅
- **Estado:** DL-008 authentication implementada en 43 endpoints

### **2. SOLUCIÓN:**
- `BOT_PANEL_ARCHITECTURE/06_BOT_RUNNING_CORE_ARCHITECTURE.md` (3,661 líneas) ✅
- `BOT_PANEL_ARCHITECTURE/01_CREATE_BOT_ARCHITECTURE.md` ✅
- `BOT_PANEL_ARCHITECTURE/04_PROFESSIONAL_PANEL_ARCHITECTURE.md` ✅
- `BOT_PANEL_ARCHITECTURE/07_ALGORITHMS_VISUALIZATION_ARCHITECTURE.md` ✅
- **Issues Identificados:** 8 (5 críticos bloqueantes)

### **3. ALGORITMOS:**
- `INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/01_WYCKOFF_ARCHITECTURE.md` (1,004 líneas) ✅ IMPLEMENTADO
- `INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/02_ORDER_BLOCKS_ARCHITECTURE.md` (1,286 líneas) ✅ DOCUMENTADO
- `INSTITUTIONAL_ALGORITHMS_ARCHITECTURE/03_LIQUIDITY_GRABS_ARCHITECTURE.md` (787 líneas) ✅ DOCUMENTADO
- **Total arquitecturas disponibles:** 6/12 (6,376 líneas)

### **4. MODOS:**
- `MODE_ARCHITECTURE_TECH/SMART_SCALPER_MODE_ARCHITECTURE.md` (23,947 bytes) ✅
- **Estado:** Modo único inicial, 11 algoritmos pendientes

---

## 🚨 **RIESGOS Y MITIGACIÓN**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Algoritmos no mejoran Win Rate | Media | Alto | Backtesting extensivo antes PRD |
| Bugs ejecución automática | Media | Crítico | Tests + monitoring 24/7 |
| Parámetros consumidos incorrectamente | Baja | Alto | Validación exhaustiva + rollback plan |
| Latencia >500ms | Baja | Medio | Optimización queries + caching |

---

## 📋 **PRÓXIMOS PASOS INMEDIATOS**

1. **HOY (2025-10-02):**
   - Confirmar roadmap con usuario ✅
   - Crear branch `feature/smart-scalper-prd`
   - Iniciar ISSUE #1 (parámetros consumidos)

2. **MAÑANA (2025-10-03):**
   - Completar ISSUE #1
   - Test parámetros consumidos
   - Iniciar ISSUE #3 (scheduler)

3. **SEMANA 1 (Oct 2-6):**
   - Completar fundamentos operacionales
   - Test E2E ejecución automática
   - Iniciar backtesting básico

4. **SEMANA 2-3 (Oct 9-20):**
   - Implementar Order Blocks
   - Implementar Liquidity Grabs
   - Testing integrado 3 algoritmos

5. **SEMANA 4 (Oct 23-27):**
   - Backtesting extensivo (6 meses datos)
   - Fix bugs identificados
   - Deploy PRD Smart Scalper

---

*Creado: 2025-10-02*
*Propósito: Roadmap optimizado Smart Scalper a PRD*
*Tiempo estimado: 3-3.5 semanas*
*Modo: Smart Scalper único (Wyckoff + Order Blocks + Liquidity Grabs)*
*Objetivo: MVO operacional con 3/12 algoritmos, Win Rate >60%*
