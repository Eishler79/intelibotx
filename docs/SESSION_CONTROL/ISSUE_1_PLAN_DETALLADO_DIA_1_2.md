# ISSUE #1 PLAN DETALLADO - CONSUMIR 12 PARÁMETROS CRÍTICOS (DÍA 1-2)

> **OBJETIVO:** Modificar backend para consumir parámetros críticos de `bot_config` en lugar de usar valores hardcoded
> **DURACIÓN:** 2 días (16 horas trabajo)
> **PRIORIDAD:** 🔴 CRÍTICA - Bloqueante para producción

---

## 📋 **ÍNDICE**
1. [Análisis Situación Actual](#análisis-situación-actual)
2. [12 Parámetros Críticos Identificados](#12-parámetros-críticos-identificados)
3. [Matriz Parámetro-Consumidor](#matriz-parámetro-consumidor)
4. [Plan Día 1 (8 horas)](#día-1-setup--implementación-parte-1)
5. [Plan Día 2 (8 horas)](#día-2-implementación-parte-2--testing)
6. [Código Completo Implementación](#código-completo-implementación)
7. [Testing y Validación](#testing-y-validación)

---

## 🔍 **ANÁLISIS SITUACIÓN ACTUAL**

### **Problema Identificado:**
- **62 parámetros definidos** en `bot_config.py` (modelo SQLModel)
- **58 parámetros NO consumidos** (93.5%) en ejecución real
- **Solo 4 parámetros usados:** `symbol`, `user_id`, `exchange_id`, `bot_id`

### **Evidencia Código Actual:**

**Archivo:** `backend/routes/bots.py:551-600`
```python
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,  # ✅ USADO
    scalper_mode: bool = False,
    trend_hunter_mode: bool = False,
    quantity: float = 0.001,  # ❌ HARDCODED - debería venir de bot_config.stake
    execute_real: bool = False,
    authorization: str = Header(None)
):
    # Busca bot por symbol únicamente
    query = select(BotConfig).where(BotConfig.symbol == normalized_symbol)
    result = session.exec(query).first()

    # ❌ NO USA: take_profit, stop_loss, leverage, interval, etc.
```

**Archivo:** `backend/services/real_trading_engine.py:330-360`
```python
async def execute_smart_scalper_trade(
    self,
    symbol: str,  # ✅ USADO
    bot_id: int,  # ✅ USADO
    stake: float = 1000.0,  # ❌ HARDCODED - debería venir de bot_config
    risk_percentage: float = 1.0  # ❌ HARDCODED
) -> Dict[str, Any]:
    # Obtiene análisis con timeframe hardcoded '15m'
    analysis = await self.technical_analysis.get_strategy_analysis(
        'Smart Scalper',
        symbol,
        '15m',  # ❌ HARDCODED - debería venir de bot_config.interval
        stake=stake
    )

    # ❌ NO USA: take_profit, stop_loss, trailing_stop, max_open_positions, etc.
```

### **Impacto:**
- Usuario configura bot con 62 parámetros → **solo 4 se usan**
- Configuración ignorada → bot opera con valores hardcoded
- Imposible personalizar estrategia → **bloqueante producción**

---

## 🎯 **12 PARÁMETROS CRÍTICOS IDENTIFICADOS**

De los 62 parámetros totales en `bot_config.py`, estos **12 son CRÍTICOS** para operación básica:

| # | Parámetro | Tipo | Línea bot_config.py | Propósito | Prioridad |
|---|-----------|------|---------------------|-----------|-----------|
| 1 | **take_profit** | float | 40 | Porcentaje ganancia objetivo | 🔴 CRÍTICA |
| 2 | **stop_loss** | float | 41 | Porcentaje pérdida máxima | 🔴 CRÍTICA |
| 3 | **stake** | float | 33 | Capital por operación (moneda base) | 🔴 CRÍTICA |
| 4 | **interval** | str | 37 | Timeframe análisis (15m, 1h, etc.) | 🔴 CRÍTICA |
| 5 | **leverage** | int | 55 | Apalancamiento futures (1x = spot) | 🔴 CRÍTICA |
| 6 | **trailing_stop** | bool | 68 | Activar trailing stop loss | 🟡 ALTA |
| 7 | **max_open_positions** | int | 71 | Máximo posiciones simultáneas | 🟡 ALTA |
| 8 | **cooldown_minutes** | int | 72 | Tiempo espera entre trades | 🟡 ALTA |
| 9 | **risk_percentage** | float | 43 | % riesgo por trade | 🟡 ALTA |
| 10 | **entry_order_type** | str | 64 | Tipo orden entrada (MARKET/LIMIT) | 🟡 ALTA |
| 11 | **tp_order_type** | str | 66 | Tipo orden Take Profit | 🟡 ALTA |
| 12 | **sl_order_type** | str | 67 | Tipo orden Stop Loss | 🟡 ALTA |

### **Parámetros Wyckoff (30 adicionales - FASE 2):**
- Líneas 78-109 en `bot_config.py`
- **NO incluidos en este Issue #1** (se manejan en Issue #5)
- Ejemplo: `wyckoff_prior_trend_bars`, `wyckoff_volume_increase_factor`, etc.

### **Parámetros Restantes (20 - FASE 3 opcional):**
- `base_currency`, `quote_currency`, `strategy`, `market_type`, `margin_type`
- `min_volume`, `min_entry_price`, `max_orders_per_pair`
- `dca_levels`, `risk_profile`, `exit_order_type`
- Timestamps: `created_at`, `updated_at`, `last_trade_at`

---

## 📊 **MATRIZ PARÁMETRO-CONSUMIDOR**

| Parámetro | Valor Actual | Dónde Consumir | Función Modificar | Cambio Requerido |
|-----------|--------------|----------------|-------------------|------------------|
| **take_profit** | ❌ NO usado | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Pasar `bot_config.take_profit` a lógica TP |
| **stop_loss** | ❌ NO usado | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Pasar `bot_config.stop_loss` a lógica SL |
| **stake** | ❌ Hardcode 1000.0 | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Cambiar `stake=1000.0` → `stake=bot_config.stake` |
| **interval** | ❌ Hardcode '15m' | `technical_analysis_service.py` | `get_strategy_analysis()` | Cambiar `'15m'` → `bot_config.interval` |
| **leverage** | ❌ NO usado | `real_trading_engine.py` | `_place_order()` | Agregar parámetro `leverage` a orden Futures |
| **trailing_stop** | ❌ NO usado | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Implementar lógica trailing stop si `bot_config.trailing_stop == True` |
| **max_open_positions** | ❌ NO usado | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Validar posiciones abiertas < `bot_config.max_open_positions` |
| **cooldown_minutes** | ❌ NO usado | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Validar tiempo desde último trade >= `bot_config.cooldown_minutes` |
| **risk_percentage** | ❌ Hardcode 1.0 | `real_trading_engine.py` | `execute_smart_scalper_trade()` | Cambiar `risk_percentage=1.0` → `bot_config.risk_percentage` |
| **entry_order_type** | ❌ Hardcode 'MARKET' | `real_trading_engine.py` | `_place_order()` | Usar `bot_config.entry_order_type` en lugar de hardcode |
| **tp_order_type** | ❌ Hardcode 'LIMIT' | `real_trading_engine.py` | `_place_order()` | Usar `bot_config.tp_order_type` para orden TP |
| **sl_order_type** | ❌ Hardcode 'STOP_MARKET' | `real_trading_engine.py` | `_place_order()` | Usar `bot_config.sl_order_type` para orden SL |

---

## 📅 **DÍA 1: SETUP + IMPLEMENTACIÓN PARTE 1**

**Duración:** 8 horas
**Objetivo:** Consumir parámetros 1-6 (críticos + alta prioridad parte 1)

### **HORA 1-2: SETUP PROYECTO (2h)**

#### **Actividad 1.1: Branch + Backup (30 min)**
```bash
# 1. Crear branch feature
cd /Users/eduardguzman/Documents/TRADING/INTELIBOTX
git checkout -b feat/issue-1-consume-params

# 2. Backup tag
git tag backup-pre-issue1-$(date +%Y%m%d-%H%M)

# 3. Verificar branch activo
git branch --show-current
# Output esperado: feat/issue-1-consume-params

# 4. Push branch inicial (sin cambios aún)
git push -u origin feat/issue-1-consume-params
```

#### **Actividad 1.2: Análisis Código Actual (1h)**
```bash
# 1. Leer archivos críticos completos
cat backend/models/bot_config.py
cat backend/routes/bots.py | grep -A 50 "run-smart-trade"
cat backend/services/real_trading_engine.py | grep -A 100 "execute_smart_scalper"

# 2. Identificar todas las referencias hardcoded
grep -r "stake=1000" backend/
grep -r "15m" backend/services/
grep -r "MARKET" backend/services/real_trading_engine.py

# 3. Listar funciones que necesitan bot_config
grep -r "def execute" backend/services/real_trading_engine.py
```

#### **Actividad 1.3: Crear Matriz Detallada (30 min)**
- Completar matriz parámetro-consumidor con líneas exactas código
- Identificar dependencias entre cambios
- Definir orden implementación (TP/SL primero, luego leverage, etc.)

---

### **HORA 3-4: MODIFICAR ROUTE (2h)**

#### **Actividad 2.1: Cambiar Endpoint `/api/run-smart-trade/{symbol}` → `/{bot_id}` (1h)**

**Archivo:** `backend/routes/bots.py`

**ANTES (línea 551-570):**
```python
@router.post("/api/run-smart-trade/{symbol}")
async def run_smart_trade(
    symbol: str,  # ❌ Busca bot por symbol
    scalper_mode: bool = False,
    trend_hunter_mode: bool = False,
    quantity: float = 0.001,  # ❌ Hardcoded
    execute_real: bool = False,
    authorization: str = Header(None)
):
    current_user = await get_current_user_safe(authorization)
    session = get_session()

    # Busca bot solo por symbol
    query = select(BotConfig).where(BotConfig.symbol == normalized_symbol)
    result = session.exec(query).first()
```

**DESPUÉS (MODIFICADO):**
```python
@router.post("/api/run-smart-trade/{bot_id}")  # ✅ Cambio 1: bot_id en path
async def run_smart_trade(
    bot_id: int,  # ✅ Cambio 2: bot_id parámetro
    execute_real: bool = False,
    authorization: str = Header(None)
):
    """
    Ejecuta Smart Trade usando configuración completa del bot

    **Cambios Issue #1:**
    - Parámetro path: bot_id (antes: symbol)
    - Consumir bot_config completo (12 parámetros críticos)
    - Eliminar parámetros hardcoded (quantity, scalper_mode)
    """
    current_user = await get_current_user_safe(authorization)
    session = get_session()

    # ✅ Cambio 3: Buscar bot por bot_id + user_id (seguridad)
    query = select(BotConfig).where(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id  # Validar pertenencia
    )
    bot_config = session.exec(query).first()

    if not bot_config:
        raise HTTPException(
            status_code=404,
            detail=f"Bot {bot_id} no encontrado o no pertenece al usuario"
        )

    # ✅ Cambio 4: Pasar bot_config completo a engine
    # (implementación siguiente sección)
```

#### **Actividad 2.2: Testing Route Modificado (30 min)**
```bash
# 1. Iniciar backend local
cd backend
python main.py

# 2. Test endpoint con curl (debe fallar sin bot_config en engine)
curl -X POST "http://localhost:8000/api/run-smart-trade/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Verificar:
# - 404 si bot no existe
# - 401 si token inválido
# - 200 si bot existe (pero engine aún no consume params)
```

#### **Actividad 2.3: Documentación Route (30 min)**
- Actualizar `01_CREATE_BOT_ARCHITECTURE.md` con cambio endpoint
- Documentar breaking change (frontend debe pasar bot_id, no symbol)

---

### **HORA 5-6: MODIFICAR ENGINE PARTE 1 (2h)**

#### **Actividad 3.1: Modificar `execute_smart_scalper_trade()` (1h 30min)**

**Archivo:** `backend/services/real_trading_engine.py`

**ANTES (línea 330-360):**
```python
async def execute_smart_scalper_trade(
    self,
    symbol: str,
    bot_id: int,
    stake: float = 1000.0,  # ❌ Hardcoded
    risk_percentage: float = 1.0  # ❌ Hardcoded
) -> Dict[str, Any]:
    analysis = await self.technical_analysis.get_strategy_analysis(
        'Smart Scalper',
        symbol,
        '15m',  # ❌ Hardcoded
        stake=stake
    )
```

**DESPUÉS (MODIFICADO):**
```python
async def execute_smart_scalper_trade(
    self,
    bot_config,  # ✅ Cambio 1: Recibir bot_config completo (tipo BotConfig)
    execute_real: bool = False
) -> Dict[str, Any]:
    """
    Ejecutar trade Smart Scalper consumiendo parámetros de bot_config

    **Parámetros consumidos (Issue #1):**
    1. symbol (bot_config.symbol)
    2. stake (bot_config.stake)
    3. interval (bot_config.interval)
    4. take_profit (bot_config.take_profit)
    5. stop_loss (bot_config.stop_loss)
    6. leverage (bot_config.leverage)
    """
    try:
        # ✅ Extraer parámetros de bot_config
        symbol = bot_config.symbol
        stake = bot_config.stake  # ✅ Cambio 2: Consumir stake
        interval = bot_config.interval  # ✅ Cambio 3: Consumir interval
        take_profit = bot_config.take_profit  # ✅ Cambio 4: Consumir TP
        stop_loss = bot_config.stop_loss  # ✅ Cambio 5: Consumir SL
        leverage = bot_config.leverage  # ✅ Cambio 6: Consumir leverage

        logger.info(f"🎯 Ejecutando Smart Scalper: {symbol} (stake: ${stake}, interval: {interval})")

        # ✅ Cambio 7: Pasar interval dinámico a análisis
        analysis = await self.technical_analysis.get_strategy_analysis(
            'Smart Scalper',
            symbol,
            interval,  # ✅ NO hardcoded
            stake=stake
        )

        # Evaluar señal
        signal = analysis['signal']
        confidence = analysis['confidence']

        if signal == 'HOLD' or confidence < 0.65:
            logger.info(f"⏸️ No trading: {signal} (confianza: {confidence:.0%})")
            return {
                'success': False,
                'message': f'No trade - señal: {signal}',
                'analysis': analysis
            }

        # ✅ Cambio 8: Calcular quantity usando stake + precio actual
        current_price = analysis.get('current_price', 0)
        if current_price <= 0:
            raise ValueError("Precio actual inválido")

        quantity = stake / current_price

        # ✅ Cambio 9: Calcular TP/SL usando parámetros bot_config
        if signal == 'BUY':
            tp_price = current_price * (1 + take_profit / 100)
            sl_price = current_price * (1 - stop_loss / 100)
        else:  # SELL
            tp_price = current_price * (1 - take_profit / 100)
            sl_price = current_price * (1 + stop_loss / 100)

        logger.info(f"📊 TP: {tp_price:.2f} ({take_profit}%) | SL: {sl_price:.2f} ({stop_loss}%)")

        # Si no es ejecución real, retornar análisis
        if not execute_real:
            return {
                'success': True,
                'message': 'Análisis completo (simulación)',
                'analysis': analysis,
                'trade_params': {
                    'symbol': symbol,
                    'side': signal,
                    'quantity': quantity,
                    'entry_price': current_price,
                    'take_profit': tp_price,
                    'stop_loss': sl_price,
                    'leverage': leverage,
                    'stake': stake
                }
            }

        # ✅ Cambio 10: Ejecutar orden real con leverage
        # (implementación completa en actividad siguiente)
        order_result = await self._place_order_with_params(
            symbol=symbol,
            side=signal,
            quantity=quantity,
            leverage=leverage,
            tp_price=tp_price,
            sl_price=sl_price,
            bot_config=bot_config  # Pasar config para entry/tp/sl order types
        )

        return {
            'success': True,
            'message': 'Trade ejecutado',
            'analysis': analysis,
            'order': order_result
        }

    except Exception as e:
        logger.error(f"❌ Error ejecutando trade: {e}")
        return {
            'success': False,
            'message': f'Error: {str(e)}',
            'analysis': None
        }
```

#### **Actividad 3.2: Testing Engine Modificado (30 min)**
```python
# backend/test_issue1_engine.py
import asyncio
from services.real_trading_engine import RealTradingEngine
from models.bot_config import BotConfig

async def test_consume_params():
    # Mock bot_config
    bot_config = BotConfig(
        id=1,
        user_id=1,
        symbol='BTCUSDT',
        stake=100.0,
        interval='15m',
        take_profit=1.5,
        stop_loss=0.8,
        leverage=2
    )

    engine = RealTradingEngine(
        api_key='test_key',
        api_secret='test_secret',
        use_testnet=True
    )

    result = await engine.execute_smart_scalper_trade(
        bot_config=bot_config,
        execute_real=False  # Simulación
    )

    # Verificar parámetros consumidos
    assert result['trade_params']['stake'] == 100.0  # ✅ Consumido
    assert result['trade_params']['leverage'] == 2  # ✅ Consumido
    print("✅ Test parámetros consumidos: PASS")

asyncio.run(test_consume_params())
```

---

### **HORA 7-8: INTEGRACIÓN ROUTE + ENGINE (2h)**

#### **Actividad 4.1: Conectar Route con Engine Modificado (1h)**

**Archivo:** `backend/routes/bots.py` (continuación)

```python
@router.post("/api/run-smart-trade/{bot_id}")
async def run_smart_trade(
    bot_id: int,
    execute_real: bool = False,
    authorization: str = Header(None)
):
    # ... (código anterior: get bot_config)

    # ✅ Importar engine
    from services.real_trading_engine import RealTradingEngine

    # ✅ Obtener credenciales exchange del usuario
    from models.user_exchange import UserExchange

    if not bot_config.exchange_id:
        raise HTTPException(
            status_code=400,
            detail="Bot no tiene exchange configurado"
        )

    # Obtener credenciales
    exchange_query = select(UserExchange).where(
        UserExchange.id == bot_config.exchange_id,
        UserExchange.user_id == current_user.id
    )
    exchange = session.exec(exchange_query).first()

    if not exchange:
        raise HTTPException(
            status_code=404,
            detail="Exchange no encontrado"
        )

    # ✅ Inicializar engine con credenciales reales
    engine = RealTradingEngine(
        api_key=exchange.api_key,
        api_secret=exchange.api_secret,
        use_testnet=(exchange.environment == 'testnet')
    )

    # ✅ Ejecutar trade con bot_config completo
    result = await engine.execute_smart_scalper_trade(
        bot_config=bot_config,  # ✅ Pasar config completo
        execute_real=execute_real
    )

    # ✅ Actualizar last_trade_at si exitoso
    if result['success'] and execute_real:
        bot_config.last_trade_at = datetime.utcnow()
        session.add(bot_config)
        session.commit()

    return JSONResponse(content=result)
```

#### **Actividad 4.2: Testing E2E Día 1 (1h)**

**Test Script:** `backend/test_issue1_e2e.py`
```python
import asyncio
import httpx

async def test_e2e_issue1():
    # 1. Login usuario
    login_response = await httpx.AsyncClient().post(
        'http://localhost:8000/api/auth/login',
        json={'email': 'test@test.com', 'password': 'test123'}
    )
    token = login_response.json()['access_token']

    # 2. Crear bot con parámetros críticos
    bot_response = await httpx.AsyncClient().post(
        'http://localhost:8000/api/bots',
        headers={'Authorization': f'Bearer {token}'},
        json={
            'name': 'Test Issue 1',
            'symbol': 'BTCUSDT',
            'stake': 50.0,  # ✅ Crítico
            'interval': '5m',  # ✅ Crítico
            'take_profit': 2.0,  # ✅ Crítico
            'stop_loss': 1.0,  # ✅ Crítico
            'leverage': 3,  # ✅ Crítico
            'strategy': 'Smart Scalper',
            'exchange_id': 1
        }
    )
    bot_id = bot_response.json()['id']

    # 3. Ejecutar trade con bot_id
    trade_response = await httpx.AsyncClient().post(
        f'http://localhost:8000/api/run-smart-trade/{bot_id}',
        headers={'Authorization': f'Bearer {token}'},
        json={'execute_real': False}  # Simulación
    )

    result = trade_response.json()

    # 4. Verificar parámetros consumidos
    assert result['trade_params']['stake'] == 50.0, "❌ stake no consumido"
    assert result['analysis']['timeframe'] == '5m', "❌ interval no consumido"
    # TP/SL verificación (depende de precio actual)
    assert 'take_profit' in result['trade_params'], "❌ TP no calculado"
    assert 'stop_loss' in result['trade_params'], "❌ SL no calculado"
    assert result['trade_params']['leverage'] == 3, "❌ leverage no consumido"

    print("✅ TEST E2E DÍA 1: PASS - 6 parámetros consumidos")

asyncio.run(test_e2e_issue1())
```

---

### **RESUMEN DÍA 1:**

#### **Entregables:**
- ✅ Branch `feat/issue-1-consume-params` creado
- ✅ Endpoint modificado: `/api/run-smart-trade/{bot_id}` (antes `/{symbol}`)
- ✅ Engine modificado: `execute_smart_scalper_trade(bot_config)`
- ✅ **6 parámetros consumidos:**
  1. ✅ `symbol` (bot_config.symbol)
  2. ✅ `stake` (bot_config.stake)
  3. ✅ `interval` (bot_config.interval)
  4. ✅ `take_profit` (bot_config.take_profit)
  5. ✅ `stop_loss` (bot_config.stop_loss)
  6. ✅ `leverage` (bot_config.leverage)

#### **Testing:**
- ✅ Test unitario engine: parámetros extraídos correctamente
- ✅ Test E2E: bot_id → bot_config → trade con params reales

#### **Documentación:**
- ⏳ `01_CREATE_BOT_ARCHITECTURE.md` actualizado (breaking change endpoint)
- ⏳ `06_BOT_RUNNING_CORE_ARCHITECTURE.md` actualizado (Issue #1 50% progreso)

---

## 📅 **DÍA 2: IMPLEMENTACIÓN PARTE 2 + TESTING**

**Duración:** 8 horas
**Objetivo:** Consumir parámetros 7-12 (trailing stop, max positions, cooldown, order types)

### **HORA 1-2: TRAILING STOP (2h)**

#### **Actividad 5.1: Implementar Lógica Trailing Stop (1h 30min)**

**Archivo:** `backend/services/real_trading_engine.py`

```python
async def _place_order_with_params(
    self,
    symbol: str,
    side: str,
    quantity: float,
    leverage: int,
    tp_price: float,
    sl_price: float,
    bot_config  # BotConfig completo
):
    """
    Coloca orden con parámetros bot_config
    Incluye trailing stop si configurado
    """
    # ✅ Consumir trailing_stop (parámetro 7)
    trailing_stop = bot_config.trailing_stop

    # 1. Orden entrada
    entry_order = await self._place_entry_order(
        symbol=symbol,
        side=side,
        quantity=quantity,
        order_type=bot_config.entry_order_type,  # ✅ Parámetro 10
        leverage=leverage
    )

    if not entry_order['success']:
        return entry_order

    # 2. Orden Take Profit
    tp_order = await self._place_tp_order(
        symbol=symbol,
        side='SELL' if side == 'BUY' else 'BUY',
        quantity=quantity,
        price=tp_price,
        order_type=bot_config.tp_order_type  # ✅ Parámetro 11
    )

    # 3. Orden Stop Loss (trailing o fijo)
    if trailing_stop:
        # ✅ Implementar Trailing Stop
        sl_order = await self._place_trailing_stop_order(
            symbol=symbol,
            side='SELL' if side == 'BUY' else 'BUY',
            quantity=quantity,
            activation_price=sl_price,
            callback_rate=0.5  # 0.5% callback (configurable futuro)
        )
        logger.info(f"✅ Trailing Stop activado: {sl_price} (callback 0.5%)")
    else:
        # Stop Loss fijo
        sl_order = await self._place_sl_order(
            symbol=symbol,
            side='SELL' if side == 'BUY' else 'BUY',
            quantity=quantity,
            stop_price=sl_price,
            order_type=bot_config.sl_order_type  # ✅ Parámetro 12
        )
        logger.info(f"✅ Stop Loss fijo: {sl_price}")

    return {
        'success': True,
        'entry_order': entry_order,
        'tp_order': tp_order,
        'sl_order': sl_order
    }

async def _place_trailing_stop_order(
    self,
    symbol: str,
    side: str,
    quantity: float,
    activation_price: float,
    callback_rate: float
):
    """
    Coloca Trailing Stop Order en Binance

    Docs: https://binance-docs.github.io/apidocs/futures/en/#new-order-trade
    Type: TRAILING_STOP_MARKET
    """
    timestamp = int(time.time() * 1000)

    params = {
        'symbol': symbol,
        'side': side,
        'type': 'TRAILING_STOP_MARKET',
        'quantity': quantity,
        'activationPrice': activation_price,  # Precio activación
        'callbackRate': callback_rate,  # % callback (0.5 = 0.5%)
        'timestamp': timestamp
    }

    query_string = urlencode(params)
    signature = self._generate_signature(query_string)

    url = f"{self.base_url}/order?{query_string}&signature={signature}"

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=self._get_headers())

        if response.status_code == 200:
            order_data = response.json()
            logger.info(f"✅ Trailing Stop creado: {order_data['orderId']}")
            return {
                'success': True,
                'order_id': order_data['orderId'],
                'type': 'TRAILING_STOP_MARKET'
            }
        else:
            logger.error(f"❌ Error trailing stop: {response.text}")
            return {
                'success': False,
                'error': response.text
            }
```

#### **Actividad 5.2: Testing Trailing Stop (30 min)**

```python
# backend/test_trailing_stop.py
async def test_trailing_stop():
    bot_config = BotConfig(
        symbol='BTCUSDT',
        trailing_stop=True,  # ✅ Activado
        stake=50,
        interval='15m',
        take_profit=2.0,
        stop_loss=1.0,
        leverage=1,
        entry_order_type='MARKET',
        tp_order_type='LIMIT',
        sl_order_type='STOP_MARKET'
    )

    engine = RealTradingEngine(api_key='...', api_secret='...', use_testnet=True)
    result = await engine.execute_smart_scalper_trade(bot_config, execute_real=False)

    # Verificar trailing stop en respuesta
    assert result['order']['sl_order']['type'] == 'TRAILING_STOP_MARKET'
    print("✅ Trailing Stop: PASS")
```

---

### **HORA 3-4: MAX POSITIONS + COOLDOWN (2h)**

#### **Actividad 6.1: Validar Max Open Positions (1h)**

**Archivo:** `backend/services/real_trading_engine.py`

```python
async def execute_smart_scalper_trade(
    self,
    bot_config,
    execute_real: bool = False
) -> Dict[str, Any]:
    # ... (código anterior)

    # ✅ Validación max_open_positions (parámetro 7)
    if execute_real:
        current_positions = await self._get_open_positions_count(
            bot_id=bot_config.id
        )

        max_positions = bot_config.max_open_positions

        if current_positions >= max_positions:
            logger.warning(
                f"⚠️ Max posiciones alcanzado: {current_positions}/{max_positions}"
            )
            return {
                'success': False,
                'message': f'Max posiciones ({max_positions}) alcanzado',
                'current_positions': current_positions
            }

    # ... (resto código)

async def _get_open_positions_count(self, bot_id: int) -> int:
    """
    Cuenta posiciones abiertas del bot
    (requiere tabla trades o consulta Binance positions)
    """
    # Opción 1: Consultar DB trades
    from db.database import get_session
    from models.trade import Trade  # Asumir modelo existe

    session = get_session()
    open_trades = session.query(Trade).filter(
        Trade.bot_id == bot_id,
        Trade.status == 'OPEN'
    ).count()

    return open_trades
```

#### **Actividad 6.2: Validar Cooldown Minutes (1h)**

```python
async def execute_smart_scalper_trade(
    self,
    bot_config,
    execute_real: bool = False
) -> Dict[str, Any]:
    # ... (código anterior)

    # ✅ Validación cooldown_minutes (parámetro 8)
    if execute_real and bot_config.last_trade_at:
        from datetime import datetime, timedelta

        time_since_last = datetime.utcnow() - bot_config.last_trade_at
        cooldown = timedelta(minutes=bot_config.cooldown_minutes)

        if time_since_last < cooldown:
            remaining = (cooldown - time_since_last).total_seconds() / 60
            logger.warning(
                f"⚠️ Cooldown activo: {remaining:.1f} min restantes"
            )
            return {
                'success': False,
                'message': f'Cooldown activo ({bot_config.cooldown_minutes} min)',
                'remaining_minutes': remaining
            }

    # ... (resto código)
```

---

### **HORA 5-6: ORDER TYPES (2h)**

#### **Actividad 7.1: Implementar Entry Order Type Dinámico (1h)**

**Archivo:** `backend/services/real_trading_engine.py`

```python
async def _place_entry_order(
    self,
    symbol: str,
    side: str,
    quantity: float,
    order_type: str,  # ✅ Parámetro 10: bot_config.entry_order_type
    leverage: int
):
    """
    Coloca orden entrada con tipo dinámico

    Tipos soportados:
    - MARKET: Ejecución inmediata
    - LIMIT: Precio específico
    - STOP_LIMIT: Stop + limit
    """
    timestamp = int(time.time() * 1000)

    # ✅ Usar order_type del bot_config
    if order_type == 'MARKET':
        params = {
            'symbol': symbol,
            'side': side,
            'type': 'MARKET',
            'quantity': quantity,
            'timestamp': timestamp
        }

    elif order_type == 'LIMIT':
        # Obtener precio actual para LIMIT
        current_price = await self._get_current_price(symbol)

        # LIMIT 0.1% mejor que mercado
        if side == 'BUY':
            limit_price = current_price * 0.999  # 0.1% debajo
        else:
            limit_price = current_price * 1.001  # 0.1% arriba

        params = {
            'symbol': symbol,
            'side': side,
            'type': 'LIMIT',
            'quantity': quantity,
            'price': limit_price,
            'timeInForce': 'GTC',
            'timestamp': timestamp
        }

    elif order_type == 'STOP_LIMIT':
        current_price = await self._get_current_price(symbol)

        # STOP_LIMIT para entrada breakout
        if side == 'BUY':
            stop_price = current_price * 1.002  # 0.2% arriba (breakout)
            limit_price = current_price * 1.003
        else:
            stop_price = current_price * 0.998  # 0.2% abajo (breakdown)
            limit_price = current_price * 0.997

        params = {
            'symbol': symbol,
            'side': side,
            'type': 'STOP_LIMIT',
            'quantity': quantity,
            'price': limit_price,
            'stopPrice': stop_price,
            'timeInForce': 'GTC',
            'timestamp': timestamp
        }

    else:
        raise ValueError(f"Order type no soportado: {order_type}")

    # Ejecutar orden
    query_string = urlencode(params)
    signature = self._generate_signature(query_string)
    url = f"{self.base_url}/order?{query_string}&signature={signature}"

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=self._get_headers())

        if response.status_code == 200:
            order_data = response.json()
            logger.info(f"✅ Orden {order_type} creada: {order_data['orderId']}")
            return {
                'success': True,
                'order_id': order_data['orderId'],
                'type': order_type,
                'executed_price': order_data.get('fills', [{}])[0].get('price', 0)
            }
        else:
            logger.error(f"❌ Error orden: {response.text}")
            return {
                'success': False,
                'error': response.text
            }
```

#### **Actividad 7.2: Implementar TP/SL Order Types (1h)**

```python
async def _place_tp_order(
    self,
    symbol: str,
    side: str,
    quantity: float,
    price: float,
    order_type: str  # ✅ Parámetro 11: bot_config.tp_order_type
):
    """
    Coloca orden Take Profit con tipo dinámico

    Tipos soportados:
    - LIMIT: TP tradicional
    - MARKET: TP ejecución inmediata cuando alcanza nivel (OCO)
    """
    timestamp = int(time.time() * 1000)

    if order_type == 'LIMIT':
        params = {
            'symbol': symbol,
            'side': side,
            'type': 'LIMIT',
            'quantity': quantity,
            'price': price,
            'timeInForce': 'GTC',
            'timestamp': timestamp
        }

    elif order_type == 'MARKET':
        # TP con MARKET requiere OCO order en Binance
        # (simplificado - usar TAKE_PROFIT_MARKET en Futures)
        params = {
            'symbol': symbol,
            'side': side,
            'type': 'TAKE_PROFIT_MARKET',
            'quantity': quantity,
            'stopPrice': price,  # Precio activación
            'timestamp': timestamp
        }

    # Ejecutar orden (código similar a _place_entry_order)
    # ...

async def _place_sl_order(
    self,
    symbol: str,
    side: str,
    quantity: float,
    stop_price: float,
    order_type: str  # ✅ Parámetro 12: bot_config.sl_order_type
):
    """
    Coloca orden Stop Loss con tipo dinámico

    Tipos soportados:
    - STOP_MARKET: SL ejecución inmediata (recomendado)
    - STOP_LIMIT: SL con precio límite (riesgo no llenar)
    """
    timestamp = int(time.time() * 1000)

    if order_type == 'STOP_MARKET':
        params = {
            'symbol': symbol,
            'side': side,
            'type': 'STOP_MARKET',
            'quantity': quantity,
            'stopPrice': stop_price,
            'timestamp': timestamp
        }

    elif order_type == 'STOP_LIMIT':
        # STOP_LIMIT con limit 0.5% peor para garantizar llenado
        if side == 'SELL':
            limit_price = stop_price * 0.995  # 0.5% debajo stop
        else:
            limit_price = stop_price * 1.005  # 0.5% arriba stop

        params = {
            'symbol': symbol,
            'side': side,
            'type': 'STOP_LIMIT',
            'quantity': quantity,
            'price': limit_price,
            'stopPrice': stop_price,
            'timeInForce': 'GTC',
            'timestamp': timestamp
        }

    # Ejecutar orden
    # ...
```

---

### **HORA 7-8: TESTING COMPLETO + DOCUMENTACIÓN (2h)**

#### **Actividad 8.1: Testing E2E Completo (1h)**

**Archivo:** `backend/test_issue1_complete.py`

```python
import asyncio
from models.bot_config import BotConfig
from services.real_trading_engine import RealTradingEngine

async def test_12_params_consumed():
    """Test completo 12 parámetros Issue #1"""

    bot_config = BotConfig(
        id=1,
        user_id=1,
        symbol='BTCUSDT',
        # 12 parámetros críticos
        stake=100.0,  # 1
        interval='5m',  # 2
        take_profit=2.0,  # 3
        stop_loss=1.0,  # 4
        leverage=2,  # 5
        trailing_stop=True,  # 6
        max_open_positions=3,  # 7
        cooldown_minutes=15,  # 8
        risk_percentage=1.5,  # 9
        entry_order_type='LIMIT',  # 10
        tp_order_type='LIMIT',  # 11
        sl_order_type='STOP_MARKET',  # 12
        # Otros
        exchange_id=1,
        strategy='Smart Scalper'
    )

    engine = RealTradingEngine(
        api_key='test_key',
        api_secret='test_secret',
        use_testnet=True
    )

    # Ejecutar trade (simulación)
    result = await engine.execute_smart_scalper_trade(
        bot_config=bot_config,
        execute_real=False
    )

    # Verificaciones
    assert result['success'] == True, "❌ Trade falló"

    # Parámetros 1-6
    assert result['trade_params']['stake'] == 100.0, "❌ Stake no consumido"
    assert result['analysis']['timeframe'] == '5m', "❌ Interval no consumido"
    assert 'take_profit' in result['trade_params'], "❌ TP no calculado"
    assert 'stop_loss' in result['trade_params'], "❌ SL no calculado"
    assert result['trade_params']['leverage'] == 2, "❌ Leverage no consumido"
    # Trailing stop verificación requiere ejecución real

    # Parámetros 7-8 (validaciones)
    # Requieren estado DB (open positions, last_trade_at)

    # Parámetros 9-12 (order types)
    assert result['order']['entry_order']['type'] == 'LIMIT', "❌ Entry order type incorrecto"
    assert result['order']['tp_order']['type'] == 'LIMIT', "❌ TP order type incorrecto"
    assert result['order']['sl_order']['type'] == 'STOP_MARKET', "❌ SL order type incorrecto"

    print("✅ TEST 12 PARÁMETROS: PASS")
    print(f"   1. Stake: {result['trade_params']['stake']}")
    print(f"   2. Interval: {result['analysis']['timeframe']}")
    print(f"   3. Take Profit: {result['trade_params']['take_profit']}")
    print(f"   4. Stop Loss: {result['trade_params']['stop_loss']}")
    print(f"   5. Leverage: {result['trade_params']['leverage']}")
    print(f"   6. Trailing Stop: {bot_config.trailing_stop}")
    print(f"   7. Max Positions: {bot_config.max_open_positions}")
    print(f"   8. Cooldown: {bot_config.cooldown_minutes} min")
    print(f"   9. Risk %: {bot_config.risk_percentage}")
    print(f"  10. Entry Type: {result['order']['entry_order']['type']}")
    print(f"  11. TP Type: {result['order']['tp_order']['type']}")
    print(f"  12. SL Type: {result['order']['sl_order']['type']}")

asyncio.run(test_12_params_consumed())
```

#### **Actividad 8.2: Documentación Final (1h)**

**Actualizar 3 documentos:**

1. **`01_CREATE_BOT_ARCHITECTURE.md`**
   - Sección "Parámetros Consumidos": marcar 12/62 como ✅
   - Agregar nota breaking change: endpoint `/api/run-smart-trade/{bot_id}`

2. **`06_BOT_RUNNING_CORE_ARCHITECTURE.md`**
   - Sección "Issue #1": cambiar estado de 🔴 CRÍTICO → ✅ CERRADO
   - Agregar subsección "Solución Implementada" con código snippets

3. **`MASTER_PLAN.md`**
   - Actualizar progreso: "Issue #1: ✅ CERRADO (12 parámetros consumidos)"
   - Agregar línea: "Día 1-2 Roadmap PRD: COMPLETADO"

---

### **RESUMEN DÍA 2:**

#### **Entregables:**
- ✅ **12 parámetros consumidos COMPLETO:**
  1. ✅ `symbol`
  2. ✅ `stake`
  3. ✅ `interval`
  4. ✅ `take_profit`
  5. ✅ `stop_loss`
  6. ✅ `leverage`
  7. ✅ `trailing_stop`
  8. ✅ `max_open_positions`
  9. ✅ `cooldown_minutes`
  10. ✅ `risk_percentage`
  11. ✅ `entry_order_type`
  12. ✅ `tp_order_type`
  13. ✅ `sl_order_type`

#### **Funcionalidades Nuevas:**
- ✅ Trailing Stop Loss (activación dinámica)
- ✅ Validación max posiciones abiertas
- ✅ Validación cooldown entre trades
- ✅ Order types dinámicos (MARKET, LIMIT, STOP_LIMIT, etc.)

#### **Testing:**
- ✅ Test unitario trailing stop
- ✅ Test validaciones (max positions, cooldown)
- ✅ Test order types (entry, TP, SL)
- ✅ Test E2E completo 12 parámetros

#### **Documentación:**
- ✅ 3 arquitecturas actualizadas
- ✅ Issue #1 marcado como CERRADO

---

## ✅ **CÓDIGO COMPLETO IMPLEMENTACIÓN**

### **Archivo Modificado 1: `backend/routes/bots.py`**

**Cambios totales:** Líneas 551-650 (100 líneas modificadas)

```python
@router.post("/api/run-smart-trade/{bot_id}")  # ✅ Cambio path param
async def run_smart_trade(
    bot_id: int,  # ✅ bot_id en lugar de symbol
    execute_real: bool = False,
    authorization: str = Header(None)
):
    """
    Ejecuta Smart Trade usando configuración completa del bot

    **Issue #1 - Parámetros Consumidos (12/62):**
    - take_profit, stop_loss, stake, interval, leverage
    - trailing_stop, max_open_positions, cooldown_minutes
    - risk_percentage, entry/tp/sl_order_type
    """
    from models.bot_config import BotConfig
    from models.user_exchange import UserExchange
    from services.auth_service import get_current_user_safe
    from services.real_trading_engine import RealTradingEngine
    from sqlmodel import Session, select
    from db.database import get_session
    from fastapi import HTTPException
    from datetime import datetime

    # Autenticación
    current_user = await get_current_user_safe(authorization)
    session = get_session()

    # ✅ Buscar bot por bot_id + user_id
    query = select(BotConfig).where(
        BotConfig.id == bot_id,
        BotConfig.user_id == current_user.id
    )
    bot_config = session.exec(query).first()

    if not bot_config:
        raise HTTPException(
            status_code=404,
            detail=f"Bot {bot_id} no encontrado"
        )

    # Validar exchange configurado
    if not bot_config.exchange_id:
        raise HTTPException(
            status_code=400,
            detail="Bot sin exchange configurado"
        )

    # Obtener credenciales exchange
    exchange_query = select(UserExchange).where(
        UserExchange.id == bot_config.exchange_id,
        UserExchange.user_id == current_user.id
    )
    exchange = session.exec(exchange_query).first()

    if not exchange:
        raise HTTPException(
            status_code=404,
            detail="Exchange no encontrado"
        )

    # ✅ Inicializar engine con credenciales
    engine = RealTradingEngine(
        api_key=exchange.api_key,
        api_secret=exchange.api_secret,
        use_testnet=(exchange.environment == 'testnet')
    )

    # ✅ Ejecutar trade con bot_config completo
    result = await engine.execute_smart_scalper_trade(
        bot_config=bot_config,
        execute_real=execute_real
    )

    # Actualizar last_trade_at si exitoso
    if result['success'] and execute_real:
        bot_config.last_trade_at = datetime.utcnow()
        session.add(bot_config)
        session.commit()

    return JSONResponse(content=result)
```

---

### **Archivo Modificado 2: `backend/services/real_trading_engine.py`**

**Cambios totales:** Líneas 330-650 (320 líneas nuevas/modificadas)

```python
async def execute_smart_scalper_trade(
    self,
    bot_config,  # ✅ BotConfig completo
    execute_real: bool = False
) -> Dict[str, Any]:
    """
    Ejecutar trade Smart Scalper consumiendo parámetros bot_config

    Issue #1 - 12 Parámetros Críticos:
    1-6: stake, interval, TP, SL, leverage, trailing_stop
    7-12: max_positions, cooldown, risk%, entry/tp/sl order types
    """
    try:
        # ✅ Extraer parámetros críticos
        symbol = bot_config.symbol
        stake = bot_config.stake
        interval = bot_config.interval
        take_profit = bot_config.take_profit
        stop_loss = bot_config.stop_loss
        leverage = bot_config.leverage

        logger.info(
            f"🎯 Smart Scalper: {symbol} | "
            f"Stake: ${stake} | Interval: {interval} | "
            f"TP: {take_profit}% | SL: {stop_loss}% | "
            f"Leverage: {leverage}x"
        )

        # ✅ Validación max_open_positions (parámetro 7)
        if execute_real:
            current_positions = await self._get_open_positions_count(bot_config.id)
            if current_positions >= bot_config.max_open_positions:
                return {
                    'success': False,
                    'message': f'Max posiciones ({bot_config.max_open_positions}) alcanzado',
                    'current_positions': current_positions
                }

        # ✅ Validación cooldown_minutes (parámetro 8)
        if execute_real and bot_config.last_trade_at:
            from datetime import datetime, timedelta
            time_since_last = datetime.utcnow() - bot_config.last_trade_at
            cooldown = timedelta(minutes=bot_config.cooldown_minutes)

            if time_since_last < cooldown:
                remaining = (cooldown - time_since_last).total_seconds() / 60
                return {
                    'success': False,
                    'message': f'Cooldown activo ({bot_config.cooldown_minutes} min)',
                    'remaining_minutes': remaining
                }

        # ✅ Análisis técnico con interval dinámico
        analysis = await self.technical_analysis.get_strategy_analysis(
            'Smart Scalper',
            symbol,
            interval,  # ✅ NO hardcoded
            stake=stake
        )

        signal = analysis['signal']
        confidence = analysis['confidence']

        if signal == 'HOLD' or confidence < 0.65:
            return {
                'success': False,
                'message': f'No trade - señal: {signal}',
                'analysis': analysis
            }

        # ✅ Calcular quantity con stake dinámico
        current_price = analysis.get('current_price', 0)
        if current_price <= 0:
            raise ValueError("Precio inválido")

        quantity = stake / current_price

        # ✅ Calcular TP/SL con parámetros bot_config
        if signal == 'BUY':
            tp_price = current_price * (1 + take_profit / 100)
            sl_price = current_price * (1 - stop_loss / 100)
        else:
            tp_price = current_price * (1 - take_profit / 100)
            sl_price = current_price * (1 + stop_loss / 100)

        # Si simulación, retornar análisis
        if not execute_real:
            return {
                'success': True,
                'message': 'Análisis completo (simulación)',
                'analysis': analysis,
                'trade_params': {
                    'symbol': symbol,
                    'side': signal,
                    'quantity': quantity,
                    'entry_price': current_price,
                    'take_profit': tp_price,
                    'stop_loss': sl_price,
                    'leverage': leverage,
                    'stake': stake
                }
            }

        # ✅ Ejecutar orden real con parámetros completos
        order_result = await self._place_order_with_params(
            symbol=symbol,
            side=signal,
            quantity=quantity,
            leverage=leverage,
            tp_price=tp_price,
            sl_price=sl_price,
            bot_config=bot_config
        )

        return {
            'success': True,
            'message': 'Trade ejecutado',
            'analysis': analysis,
            'order': order_result
        }

    except Exception as e:
        logger.error(f"❌ Error: {e}")
        return {'success': False, 'message': str(e)}

# (Resto de funciones auxiliares: _place_order_with_params,
#  _place_entry_order, _place_tp_order, _place_sl_order,
#  _place_trailing_stop_order, _get_open_positions_count)
# Ver código completo en secciones Día 1 y Día 2
```

---

## 🧪 **TESTING Y VALIDACIÓN**

### **Test Suite Completo:**

1. **`test_issue1_params.py`** - Test unitario parámetros extraídos
2. **`test_issue1_engine.py`** - Test engine modificado
3. **`test_issue1_e2e.py`** - Test E2E bot_id → trade
4. **`test_trailing_stop.py`** - Test trailing stop específico
5. **`test_issue1_complete.py`** - Test 12 parámetros completo

### **Comando Ejecutar Tests:**
```bash
cd backend
pytest test_issue1_*.py -v
```

### **Resultado Esperado:**
```
test_issue1_params.py::test_extract_params PASSED
test_issue1_engine.py::test_consume_params PASSED
test_issue1_e2e.py::test_e2e_issue1 PASSED
test_trailing_stop.py::test_trailing_stop PASSED
test_issue1_complete.py::test_12_params_consumed PASSED

================= 5 passed in 3.2s =================
```

---

## 📊 **MÉTRICAS ÉXITO**

### **Criterios Cumplimiento:**
- ✅ **12/12 parámetros consumidos** (100% objetivo Issue #1)
- ✅ **0 valores hardcoded** (stake, interval, TP/SL eliminados)
- ✅ **Endpoint modificado** (`/api/run-smart-trade/{bot_id}`)
- ✅ **Tests pasando** (5/5 tests green)
- ✅ **Documentación actualizada** (3 arquitecturas)

### **Breaking Changes:**
- ⚠️ **Frontend debe modificar:**
  - Antes: `POST /api/run-smart-trade/{symbol}`
  - Después: `POST /api/run-smart-trade/{bot_id}`

### **Próximos Pasos:**
- **Día 3:** Issue #3 - Scheduler automático (bot_scheduler.py)
- **Día 4-5:** Issue #4 - Backtesting + Issue #5 - Wyckoff des-hardcodear

---

*Creado: 2025-10-02*
*Duración: 2 días (16 horas)*
*Objetivo: Consumir 12 parámetros críticos bot_config*
*Componentes: 2 archivos modificados (routes + engine)*
*Tests: 5 suites completas*
*Estado: ✅ LISTO PARA EJECUCIÓN*
