# SMART_SCALPER_ALGO_REFINEMENTS.md — Especificaciones de Implementación (Estándar Definitivo)

> Objetivo: Elevar la robustez del modo Smart Scalper bajo la Filosofía Core (anti‑manipulación, institucional‑only, ganancias rápidas consistentes) corrigiendo falencias detectadas en cada algoritmo y agregando gestión de riesgo + salidas inteligentes. Documento de implementación definitiva (no “parches” temporales ni pseudocódigo): incluye firmas de funciones, código Python listo para integrar, criterios de aceptación y SPEC_REF. Cumple DL‑001/002/008 + GUARDRAILS P1–P9.

---

## 🧭 Alcance y Compliance

- Filosofía Core: UN bot adaptativo, protección de capital, 0.5–1.5% rápido, SOLO institucional.
- Guardrails: P1–P9 obligatorios; DL‑001 (sin simulación/HC), DL‑002 (no retail), DL‑008 (auth central).
- No cambia esquemas DB por defecto; si se persisten nuevas métricas, registrar en `docs/MIGRATIONS.md`.

Referencias código actuales:
- Orquestación endpoint: `backend/routes/bots.py:355` → `execute_smart_scalper_analysis(...)`
- Filtro institucional (6/12): `backend/services/signal_quality_assessor.py`
- Detector institucional: `backend/services/institutional_detector.py`
- Microestructura (POC/VAH/VAL): `backend/services/market_microstructure_analyzer.py`
- Módulos gestión riesgo/salidas (no integrados): `backend/smarttrade/*`

---

## 📌 Principios Transversales (aplican a todos)

- Normalización por volatilidad: usar ATR(14) para comparar wicks, penetraciones, displacements y distancias.
- Confluencias: ponderar al alza cuando coincidan señales (Order Block + FVG + POC/VAH/VAL; VSA confirma esfuerzo/resultado; HTF coherente).
- Multi‑timeframe: confirmar patrones intradía (1m/5m) con 15m; opcional 1h para tendencias.
- Evidencia: cada confirmación debe poblar `details` con métricas (niveles, ratios, edad, confluencias) para trazabilidad.
- Consenso explícito: exponer `high_confidence_count` (score≥70) y `consensus_3of6` boolean en la API (`run-smart-trade`).

Helpers a (re)usar
- Preferir `calculate_atr` de `services.ta_alternative` (ya disponible).
- Agregar utilidades internas donde se indique (funciones privadas `def _...`) dentro de `SignalQualityAssessor`.

---

## 🏛️ 1) Wyckoff Method — Fases + Springs/UTAD (Refuerzo)

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py:_evaluate_wyckoff_analysis`
- (opcional) `backend/services/institutional_detector.py:_analyze_market_phase`

Falencias actuales
- Clasificador de fase simplificado; sin PS/SC/ST/Spring/UTAD ni timing de rango.

Implementación (reemplazo de función)
Archivo/Función: `backend/services/signal_quality_assessor.py:_evaluate_wyckoff_analysis`
```python
from services.ta_alternative import calculate_atr

def _evaluate_wyckoff_analysis(
    self,
    price_data: pd.DataFrame,
    volume_data: List[float],
    market_structure: Dict[str, Any],
    timeframe: str = "15m",
    timeframe_data: Optional[Dict[str, Any]] = None  # {'5m': TimeframeData, '15m': TimeframeData}
) -> InstitutionalConfirmation:
    """Wyckoff Method con detección de PS/SC/AR/ST y Spring/UTAD.
    - Normaliza umbrales por ATR(14)
    - Confirma con 5m/15m si timeframe_data disponible
    """
    try:
        if len(price_data) < 60:
            return InstitutionalConfirmation(
                name="Wyckoff Analysis",
                score=15,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": "Insufficient data for Wyckoff enhanced analysis"}
            )

        opens = price_data['open'].values
        highs = price_data['high'].values
        lows  = price_data['low'].values
        closes= price_data['close'].values
        vols  = np.array(volume_data[-len(closes):]) if len(volume_data) >= len(closes) else np.array(volume_data)

        # ATR y rango
        atr = calculate_atr(highs.tolist(), lows.tolist(), closes.tolist(), period=14) or 1e-9
        lookback = min(120, len(closes))
        window_closes = closes[-lookback:]
        range_low = window_closes.min()
        range_high = window_closes.max()
        range_height_atr = (range_high - range_low) / atr

        # PS/SC/AR/ST aproximados (señales de stopping action y tests)
        recent = slice(-20, None)
        ultra_vol = vols[-1] > 2.0 * (vols[-20:].mean() if len(vols) >= 20 else vols.mean())
        stopping_action = ultra_vol and range_height_atr > 2.0

        # Spring/UTAD (ruptura mínima y cierre dentro del rango)
        wick_down = highs[-1] - max(opens[-1], closes[-1])
        wick_up   = min(opens[-1], closes[-1]) - lows[-1]
        is_spring = lows[-1] < range_low * 0.999 and closes[-1] > range_low and (wick_up/atr) > 0.6 and ultra_vol
        is_utad   = highs[-1] > range_high * 1.001 and closes[-1] < range_high and (wick_down/atr) > 0.6 and ultra_vol

        # Scoring y bias
        score = 0
        details = {
            'range_low': float(range_low), 'range_high': float(range_high),
            'range_height_atr': float(range_height_atr), 'stopping_action': stopping_action,
            'is_spring': bool(is_spring), 'is_utad': bool(is_utad)
        }

        if stopping_action: score += 20
        if is_spring:       score += 30
        if is_utad:         score += 25

        # Confirmación MTF (ejemplo mínimo; ampliar con SMC)
        mtf_ok = True if timeframe_data else True
        if mtf_ok: score += 10

        bias = "SMART_MONEY" if score >= 50 else ("INSTITUTIONAL_NEUTRAL" if score >= 30 else "RETAIL_TRAP")

        return InstitutionalConfirmation(name="Wyckoff Analysis", score=min(score,100), bias=bias, details=details)
    except Exception as e:
        return InstitutionalConfirmation(name="Wyckoff Analysis", score=0, bias="INSTITUTIONAL_NEUTRAL", details={"error": str(e)})
```

Criterios de aceptación
- `details` incluye flags de stopping action y `is_spring`/`is_utad` con rangos y ATR.
- Reducción de falsos positivos en laterales; coherencia con 15m cuando disponible.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md`

---

## 📦 2) Order Blocks — Definición, Retest e Invalidación

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py:_evaluate_order_blocks`

Falencias actuales:
- Validación/retest/invalidación débiles; ventana 3 velas; sin confluencias HTF/POC/FVG.

Cambios propuestos:
- Definir OB: última vela contraria antes de impulso con displacement ≥ m×ATR y volumen > k×media.
- Retest válido: wick dentro de la zona ±δ (en ATR) sin cierre neto dentro.
- Invalidación: cierre dentro del bloque superando margen δ.
- Confluencias: OB cerca FVG y/o POC/VAH/VAL otorga bonus.

Pseudocódigo:
```python
displacement = abs(closes[i+1] - closes[i]) / atr
is_ob = (contraria and displacement > m and volume[i] > k*vol_sma)
retest_ok = (low[-1] <= ob_high+δ and close[-1] > ob_high)  # bull OB ejemplo
invalid = (close[-1] < ob_low - δ)
score = base * decay(age) + confluence_bonus - invalid_penalty
```

Aceptación:
- Menos OB falsos en sideways; `details.order_blocks_analysis` muestra `retested`, `invalidated`, `confluences`.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/02_ORDER_BLOCKS.md`

---

## 🎯 3) Liquidity Grabs — Profundidad y Clusters

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py:_evaluate_liquidity_grabs`

Implementación (reemplazo de función)
Archivo/Función: `backend/services/signal_quality_assessor.py:_evaluate_liquidity_grabs`
```python
from services.ta_alternative import calculate_atr

def _evaluate_liquidity_grabs(
    self,
    price_data: pd.DataFrame,
    volume_data: List[float]
) -> InstitutionalConfirmation:
    """Detección de barridos de liquidez con profundidad (ATR) y clusters de stops."""
    try:
        if len(price_data) < 30:
            return InstitutionalConfirmation(name="Liquidity Grabs", score=10, bias="INSTITUTIONAL_NEUTRAL", details={"error": "Insufficient data"})

        h = price_data['high'].values; l = price_data['low'].values
        c = price_data['close'].values; o = price_data['open'].values
        v = np.array(volume_data[-len(c):]) if len(volume_data) >= len(c) else np.array(volume_data)
        atr = calculate_atr(h.tolist(), l.tolist(), c.tolist(), period=14) or 1e-9

        N = min(30, len(h)-1)
        prev_high = max(h[-N:-1]); prev_low = min(l[-N:-1])
        depth_up = (h[-1] - prev_high) / atr
        depth_dn = (prev_low - l[-1]) / atr
        reversal_up = c[-1] < h[-1] * 0.998
        reversal_dn = c[-1] > l[-1] * 1.002

        # clusters: conteo de swings previos
        def count_swings(hh, ll, win=20):
            cnt = 0
            for i in range(len(hh)-win, len(hh)-1):
                if i <= 1: continue
                if hh[i] > max(hh[i-2:i]): cnt += 1
                if ll[i] < min(ll[i-2:i]): cnt += 1
            return max(cnt, 1)

        cluster_size = count_swings(h, l, win=min(20, len(h)-1))
        vol_boost = v[-1] / (v[-20:].mean() if len(v) >= 20 else v.mean())

        score = 0; direction = "MIXED"
        if depth_up > 0.2 and reversal_up and vol_boost > 1.2:
            score += min(35, depth_up*15 + cluster_size*2)
            direction = "BEARISH_AFTER_UP_SWEEP"
        if depth_dn > 0.2 and reversal_dn and vol_boost > 1.2:
            score += min(35, depth_dn*15 + cluster_size*2)
            direction = "BULLISH_AFTER_DOWN_SWEEP" if direction == "MIXED" else direction

        bias = "SMART_MONEY" if score >= 40 else ("INSTITUTIONAL_NEUTRAL" if score >= 25 else "INSTITUTIONAL_NEUTRAL")
        details = {
            'grab_depth_up_atr': float(depth_up), 'grab_depth_dn_atr': float(depth_dn),
            'cluster_size': int(cluster_size), 'vol_boost': float(vol_boost), 'expected_direction': direction
        }

        return InstitutionalConfirmation(name="Liquidity Grabs", score=min(score,100), bias=bias, details=details)
    except Exception as e:
        return InstitutionalConfirmation(name="Liquidity Grabs", score=0, bias="INSTITUTIONAL_NEUTRAL", details={"error": str(e)})
```

---

## ⚙️ 4) Execution Loop + Persistence (DL‑001) — Testnet Live Trading

Objetivo
- Definir el flujo de activación/ejecución y persistencia de operaciones para que Trading Live muestre órdenes reales (TESTNET), sin crear endpoints nuevos.

Componentes existentes
- Orquestación: `POST /api/run-smart-trade/{symbol}` (bots.py) — ya decide señal y puede ejecutar `execute_real`.
- Persistencia feed: `POST /api/bots/{bot_id}/trading-operations` + `GET /api/trading-feed/live`.
- Testnet orders: `services/http_testnet_service.py`.

Execution Gate (filtro de calidad)
- Criterios mínimos parametrizados por BotConfig:
  - `institutional_quality.overall_score ≥ τ_high(bot_config)`
  - `high_confidence_count ≥ 3` (o `consensus_3of6 = true` si se expone)
  - `multi_tf.signal` alinea con BUY/SELL seleccionado
  - `manipulation_risk ≤ τ_risk(bot_config)`

Pseudocódigo (bots.py)
```python
def _passes_execution_gate(iq, multi_tf, direction, bot_config) -> bool:
    tau_high = 60  # o f_tau_high(bot_config)
    if iq.overall_score < tau_high: return False
    hc = iq.institutional_confirmations and sum(1 for k,v in iq.institutional_confirmations.items() if getattr(v,'score',0) >= 70) or 0
    if hc < 3: return False
    if direction == 'BUY' and multi_tf.signal != 'BUY': return False
    if direction == 'SELL' and multi_tf.signal != 'SELL': return False
    return True

# Dentro de execute_smart_scalper_analysis(): si signal in ['BUY','SELL'] y _passes_execution_gate(...):
if execute_real:
    order_result = await create_testnet_order(...)
    # Persistir operación para Trading Live
    await persist_trading_operation(bot_config, current_user, symbol, direction, quantity, current_price, algorithm_selection, confidence)
```

Persistencia (Trading Live)
- Crear `TradingOperation` tras ejecutar orden en testnet, con `bot_id`, `user_id`, `symbol`, `side`, `quantity`, `price`, `strategy`, `algorithm_used`, `confidence`. Trading Live (`GET /api/trading-feed/live`) lo mostrará.

Frontend (Live Testnet)
- Agregar toggle “Live Testnet” en la vista avanzada por bot para enviar `execute_real=true` en la invocación al endpoint existente.
- La UI muestra SOLO datos reales; si no hay resultados, “No data”; sin `Math.random()` ni fallbacks.

Keys por usuario (opcional recomendado)
- Reemplazar uso de env globals en `http_testnet_service.py` por credenciales de `UserExchange` del usuario (multi‑tenant), cuando se dispare una orden.

Especificación de no‑cambio
- No se crean endpoints nuevos; se expande la orquestación y se usa el CRUD de `trading-operations` ya existente.

Criterios de aceptación
- `details` incluye `grab_depth_*_atr`, `cluster_size`, `expected_direction`.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/03_LIQUIDITY_GRABS.md`

---

## 🕳️ 4) Stop Hunting — Normalización ATR + Contexto

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py:_evaluate_stop_hunting`

Falencias actuales:
- Wick/cuerpo fijos; sin horario/news; sin HTF/valor.

Implementación (reemplazo de función)
Archivo/Función: `backend/services/signal_quality_assessor.py:_evaluate_stop_hunting`
```python
from services.ta_alternative import calculate_atr

def _evaluate_stop_hunting(
    self,
    price_data: pd.DataFrame,
    volume_data: List[float],
    microstructure: Optional[Any] = None
) -> InstitutionalConfirmation:
    """Stop hunts normalizados por ATR y contexto de valor (VAH/VAL) cuando disponible."""
    try:
        if len(price_data) < 20:
            return InstitutionalConfirmation(name="Stop Hunting", score=10, bias="INSTITUTIONAL_NEUTRAL", details={"error": "Insufficient data"})

        o = price_data['open'].values; h = price_data['high'].values
        l = price_data['low' ].values; c = price_data['close'].values
        v = np.array(volume_data[-len(c):]) if len(volume_data) >= len(c) else np.array(volume_data)
        atr = calculate_atr(h.tolist(), l.tolist(), c.tolist(), period=14) or 1e-9

        wick_up  = h[-1] - max(o[-1], c[-1])
        wick_dn  = min(o[-1], c[-1]) - l[-1]
        wick_up_ratio = wick_up/atr; wick_dn_ratio = wick_dn/atr
        rev_down = c[-1] < c[-2] * 0.99
        rev_up   = c[-1] > c[-2] * 1.01

        at_edge = False
        if microstructure:
            vah = getattr(microstructure, 'value_area_high', None)
            val = getattr(microstructure, 'value_area_low',  None)
            if vah and abs(c[-1] - vah)/atr < 0.5: at_edge = True
            if val and abs(c[-1] - val)/atr < 0.5: at_edge = True

        score = 0
        if wick_up_ratio > 1.0 and rev_down: score += 25
        if wick_dn_ratio > 1.0 and rev_up:   score += 25
        if at_edge:                           score += 10

        bias = "SMART_MONEY" if score >= 40 else ("INSTITUTIONAL_NEUTRAL" if score >= 25 else "INSTITUTIONAL_NEUTRAL")
        details = {
            'wick_up_atr': float(wick_up_ratio), 'wick_dn_atr': float(wick_dn_ratio),
            'reversal': {'down': rev_down, 'up': rev_up}, 'at_value_edge': at_edge
        }
        return InstitutionalConfirmation(name="Stop Hunting", score=min(score,100), bias=bias, details=details)
    except Exception as e:
        return InstitutionalConfirmation(name="Stop Hunting", score=0, bias="INSTITUTIONAL_NEUTRAL", details={"error": str(e)})
```

Criterios de aceptación
- `details` reporta `wick_*_atr`, reversión y proximidad a VAH/VAL.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/04_STOP_HUNTING.md`

---

## ⚡ 5) Fair Value Gaps — Partial Fill, Edad y HTF

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py:_evaluate_fair_value_gaps`

Falencias actuales:
- Fill binario; sin “partial fill/edad”; sin HTF.

Implementación (reemplazo de función)
Archivo/Función: `backend/services/signal_quality_assessor.py:_evaluate_fair_value_gaps`
```python
def _evaluate_fair_value_gaps(
    self,
    price_data: pd.DataFrame,
    timeframe_data: Optional[Dict[str, Any]] = None,
    microstructure: Optional[Any] = None
) -> InstitutionalConfirmation:
    """FVG con partial fill, edad y confirmación HTF opcional."""
    try:
        if len(price_data) < 10:
            return InstitutionalConfirmation(name="Fair Value Gaps", score=10, bias="INSTITUTIONAL_NEUTRAL", details={"error": "Insufficient data"})

        h = price_data['high'].values; l = price_data['low'].values; c = price_data['close'].values
        cur = float(c[-1])
        gaps = {'bull': [], 'bear': []}
        for i in range(1, len(h)-1):
            if l[i+1] > h[i-1]:  # bullish FVG
                gap_low, gap_high = h[i-1], l[i+1]
                gaps['bull'].append({'low': gap_low, 'high': gap_high, 'age': len(h)-i-1})
            if h[i+1] < l[i-1]:  # bearish FVG
                gap_low, gap_high = h[i+1], l[i-1]
                gaps['bear'].append({'low': gap_low, 'high': gap_high, 'age': len(h)-i-1})

        def fill_ratio(gap, price):
            size = abs(gap['high'] - gap['low'])
            if size <= 0: return 1.0
            mid = (gap['high'] + gap['low'])/2
            if gap in gaps['bull']:
                if price <= gap['high']: return 1.0
                if price >= gap['low']:  return 0.0
            else:  # bearish
                if price >= gap['low']: return 1.0
                if price <= gap['high']: return 0.0
            # Aproximación al ratio parcial hacia el midpoint
            return max(0.0, min(1.0, abs(price - gap['low']) / max(size, 1e-9)))

        def htf_confirmed(gap):
            tf15 = timeframe_data.get('15m') if timeframe_data else None
            return bool(tf15)

        best_bull = max(gaps['bull'], key=lambda g: (g['high']-g['low'])) if gaps['bull'] else None
        best_bear = max(gaps['bear'], key=lambda g: (g['high']-g['low'])) if gaps['bear'] else None

        score = 0; conf = "INSTITUTIONAL_NEUTRAL"; flags = []
        for label, gap in [("BULL", best_bull), ("BEAR", best_bear)]:
            if not gap: continue
            size_pct = abs(gap['high'] - gap['low']) / max(cur, 1e-9)
            fr = fill_ratio(gap, cur)
            age_decay = 2 ** (-(gap['age']/50.0))
            s = size_pct * (1 - min(fr, 1.0)) * age_decay * 100
            if timeframe_data and htf_confirmed(gap): s *= 1.1; flags.append(f"HTF_{label}")
            if microstructure and abs(((gap['high']+gap['low'])/2) - getattr(microstructure, 'point_of_control', 0)) / max(cur,1) < 0.002:
                s += 5; flags.append(f"POC_{label}")
            score += s

        if score >= 40: conf = "SMART_MONEY"
        details = {'best_bull': best_bull, 'best_bear': best_bear, 'flags': flags}
        return InstitutionalConfirmation(name="Fair Value Gaps", score=min(int(score),100), bias=conf, details=details)
    except Exception as e:
        return InstitutionalConfirmation(name="Fair Value Gaps", score=0, bias="INSTITUTIONAL_NEUTRAL", details={"error": str(e)})
```

Criterios de aceptación
- `details` incluye `flags` HTF/POC, `best_*` con `age` y niveles.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/05_FAIR_VALUE_GAPS.md`

---

## 🔬 6) Market Microstructure — Unificación y Bins

Ubicación a modificar:
- Reusar objeto de `backend/services/market_microstructure_analyzer.py` en SQA: eliminar duplicidades en `_evaluate_market_microstructure` y consumir POC/VAH/VAL/footprint.
- Mejorar bucketización por `tick_size` y exponer `profile_type` (balanced, P, b, d) + `va_occupancy`.

Falencias actuales:
- Doble cálculo SQA vs Analyzer; bucketización simple; order flow proxy.

Cambios propuestos:
- Centralizar cálculo en el Analyzer; SQA solo pondera/evalúa.
- Bins por tick o `price*0.0001`; shape vía distribución volumen‑a‑precio.

Interfaz y uso
- Modificar `SignalQualityAssessor.assess_signal_quality(...)` para aceptar `microstructure: Optional[MarketMicrostructure]` y `timeframe_data: Optional[Dict[str, TimeframeData]]` (compatibilidad hacia atrás: argumentos opcionales con default `None`).
- En `backend/routes/bots.py` pasar `microstructure` y `timeframe_data` ya calculados.

Implementación (uso del Analyzer desde SQA)
Archivo/Función: `backend/services/signal_quality_assessor.py:_evaluate_market_microstructure`
```python
def _evaluate_market_microstructure(
    self,
    price_data: pd.DataFrame,
    volume_data: List[float],
    microstructure: Optional[Any] = None
) -> InstitutionalConfirmation:
    """Evaluación delegada al MarketMicrostructureAnalyzer con shape/VA occupancy."""
    try:
        if microstructure is None:
            return InstitutionalConfirmation(name="Market Microstructure", score=12, bias="INSTITUTIONAL_NEUTRAL", details={"note": "no_microstructure_passed"})

        poc = float(getattr(microstructure, 'point_of_control', 0))
        vah = float(getattr(microstructure, 'value_area_high', 0))
        val = float(getattr(microstructure, 'value_area_low',  0))
        dom = getattr(microstructure, 'dominant_side', None)

        # VA occupancy aproximado (últimas 30 velas)
        closes = price_data['close'].values[-30:]
        in_va = ((closes >= val) & (closes <= vah)).sum()
        va_occupancy = in_va / max(len(closes), 1)

        score = 20 + int(va_occupancy * 30)
        bias = "SMART_MONEY" if score >= 40 else "INSTITUTIONAL_NEUTRAL"
        details = {
            'poc': poc, 'vah': vah, 'val': val, 'dominant_side': getattr(dom, 'value', str(dom)),
            'va_occupancy': float(va_occupancy)
        }
        return InstitutionalConfirmation(name="Market Microstructure", score=score, bias=bias, details=details)
    except Exception as e:
        return InstitutionalConfirmation(name="Market Microstructure", score=0, bias="INSTITUTIONAL_NEUTRAL", details={"error": str(e)})
```

Aceptación:
- Consistencia entre Analyzer y SQA; `analysis` reporta `profile_type`, `va_occupancy`.

SPEC_REF:
- `// SPEC_REF: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/06_MARKET_MICROSTRUCTURE.md`

---

## 🧠 Consenso 3/6 y Normalización (API)

Ubicación a modificar:
- `backend/services/signal_quality_assessor.py` — añadir `high_confidence_count` (score≥70) y `consensus_3of6` en `_calculate_institutional_quality`.
- `backend/routes/bots.py:POST /api/run-smart-trade/{symbol}` — incluir en `analysis.*` para UI.

Implementación
`backend/services/signal_quality_assessor.py:_calculate_institutional_quality`
```python
# tras calcular total_score y preparar counts
high_confidence_count = sum(1 for _n, conf in confirmations.items() if conf.score >= 70)
meets_consensus_3of6 = high_confidence_count >= 3

# incluir en retorno (ampliar la tupla o incorporar en un objeto si se decide)
return total_score, confidence_level, recommendation, {
    'high_confidence_count': high_confidence_count,
    'consensus_3of6': meets_consensus_3of6
}
```

`backend/routes/bots.py` — incluir en `analysis`
```python
"analysis": {
  ...,
  "institutional_high_conf_count": meta.get('high_confidence_count'),
  "consensus_3of6": meta.get('consensus_3of6')
}
```

Aceptación
- API refleja conteo y boolean; UI puede mostrar badge “3/6 OK”.

SPEC_REF
- `// SPEC_REF: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md#multi-algoritmo`

---

## 🛡️ DL‑001 — Eliminar Simulación/Fallback en PRD

Ubicación a modificar:
- `backend/services/binance_real_data.py:_generate_fallback_data`, `_generate_fallback_indicators`

Regla:
- En PRD (`ENVIRONMENT=production`), nunca generar datos simulados; devolver error con causa y política de reintentos. Mantener fallback SOLO en desarrollo con flag explícita.

Aceptación:
- PRD sin simulación/HC; logs claros; UI muestra estados de “sin datos”/“degradado” si aplica.

SPEC_REF:
- `// SPEC_REF: docs/GOVERNANCE/GUARDRAILS.md#dl-001`

---

## 🔧 Gestión de Riesgo y Salidas Inteligentes (Integración SmartTrade)

Meta: que el bot capture beneficios de forma inteligente y minimice exposición.

Componentes existentes:
- `backend/smarttrade/modules/*` (DCA, Trailing TP, TP fijo/percent/sugerido, SL dinámico) y `smart_trade_service.py` (orquestación). Aún no están integrados al endpoint institucional.

Plan de integración (paper/testnet primero, estándar definitivo):
1) Crear un adaptador en `backend/routes/bots.py` tras la decisión “BUY/SELL” con consenso≥umbral:
   - Construir `TradeState` con `base_price=current_price`.
   - Inicializar `SmartTradeService` con parámetros adaptativos por símbolo/ATR:
     - Position sizing dinámico: riesgo por trade = 0.5–1.5% del capital estimado, tamaño = f(ATR, confianza, volatilidad).
     - Trailing TP: activar a +1.0–1.5% con offset 0.2–0.4% variable por volatilidad.
     - SL dinámico: fijo/percent/“suggested” con stops tras VAL/ob edge si `ANTI_MANIPULATION`.
2) Ejecutar `process_price_update()` con nuevos ticks (paper feed o testnet) y cerrar por TP/SL/trailing; registrar métricas (duración, profit, slippage esperado, ciclos).
3) En PRD, iniciar en testnet; migrar a real con políticas de control y límites.

Implementación sugerida (fragmentos definitivos):
Archivo: `backend/routes/bots.py` dentro de `execute_smart_scalper_analysis` tras decidir BUY/SELL
```python
# after determining `signal`, `confidence`, and having `timeframe_data` and OHLCV arrays
from smarttrade.smart_trade_service import SmartTradeService
from smarttrade.models.trade_state import TradeState
from services.ta_alternative import calculate_atr

highs = main_data['highs']; lows = main_data['lows']; closes = main_data['closes']
atr = calculate_atr(highs, lows, closes, period=14) or 1e-9
atr_pct = atr / max(closes[-1], 1e-9)

# Parametrización adaptativa
tp_activation = 0.01 if atr_pct < 0.03 else 0.015
trailing_offset = 0.002 if atr_pct < 0.03 else 0.004

trade_state = TradeState(base_price=closes[-1])
trade_service = SmartTradeService(
    trailing_activation_pct=tp_activation,
    trailing_offset=trailing_offset
)

# Ejecutar un ciclo de evaluación (paper/testnet)
trade_service.process_price_update(trade_state, float(closes[-1]))

# Incluir en la respuesta análisis de salida potencial
execution_advice = {
    'tp_activation_pct': tp_activation,
    'trailing_offset_pct': trailing_offset,
    'atr_pct': atr_pct
}
```

Aceptación:
- Cierres no “brutos”: TP parcial en confluencias (OB/FVG/POC), trailing por reversión microestructura/VSA, SL adaptativo por volatilidad.
- Registra KPIs por trade para retroalimentación (win rate, PF, avg duration, partial exit hits).

SPEC_REF:
- `// SPEC_REF: docs/TECHNICAL_SPECS/EXECUTION_ENGINE_SPEC.md`
- `// SPEC_REF: docs/TECHNICAL_SPECS/OPTIMIZATION_MODE_INTELL.md#p6`

---

## 🧪 Pruebas y Telemetría

- Fixtures OHLCV “reales” anonimizados: springs/UTAD, retests OB válidos/invalidos, sweeps profundos/superficiales, FVG fill/no fill.
- Telemetría: registrar qué confirmaciones activaron BUY/SELL y parámetros (`depth_score`, `fill_ratio`, etc.).
- KPIs: win rate, PF, time‑to‑profit, drawdown diario semanal.

---

## 📅 Tareas (listas para Claude)

1) Wyckoff (fases + spring/UTAD + MTF) — SQA y Detector
2) Order Blocks (definición+retest+invalidación+confluencias) — SQA
3) Liquidity Grabs (depth+clusters+reversal) — SQA
4) Stop Hunting (wick/ATR + value edge + reversión) — SQA
5) FVG (partial fill + edad + HTF + confluencias) — SQA
6) Microestructura (unificar Analyzer→SQA + bins + shape + VA occupancy)
7) Consenso 3/6 y `high_confidence_count` exposed en API
8) DL‑001: deshabilitar simulación/fallback en PRD para binance_real_data
9) Integrar `smarttrade` (paper/testnet) después del consenso institucional (position sizing, TP parcial, trailing, SL dinámico)

Cada tarea debe:
- Mantener compatibilidad (`analysis`/`signals` shape) y performance (<1.2s respuesta HTTP con 100 velas).
- Incluir SPEC_REF en cambios y actualizar `CLAUDE_INDEX.md` si aplica.

---

Creado: 2025‑09‑13  
Autor: InteliBotX (Refinamientos Modo Smart Scalper)  
Compliance: DL‑001 · DL‑002 · DL‑008 · GUARDRAILS P1–P9
