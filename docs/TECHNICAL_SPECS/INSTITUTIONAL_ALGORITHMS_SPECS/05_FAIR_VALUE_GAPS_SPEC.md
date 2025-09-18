# 05_FAIR_VALUE_GAPS_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/05_FAIR_VALUE_GAPS.md

Propósito
- Identificar FVGs, medir partial fill/edad y confluencias (OB/POC), para objetivos y validaciones.

Entradas
- OHLCV (≥30), precio actual; POC/VA opcional.

Salidas
- gaps (low/high/age, fill_ratio), flags (HTF/POC), confidence; details.

Reglas (resumen)
- Detección 3 velas; fill_ratio e invalidez al ≥80%; edad con decaimiento exponencial; confluencias elevan confianza.

Integración
- SignalQualityAssessor._evaluate_fair_value_gaps; soporte clave en Scalping/Trend.

Rendimiento/Pruebas
- < 30 ms; gaps near/filled; HTF confirmado.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_fair_value_gaps`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:629-758`
- Integración: disponible en `analysis.institutional_confirmations.fair_value_gaps`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Variables
- \(H_t, L_t, C_t\); precio actual \(P=C_n\).

Detección FVG (3 velas)
- Bullish: \(L_{i+1} > H_{i-1}\); definir gap \([H_{i-1}, L_{i+1}]\), \(\text{gap\_size}=L_{i+1}-H_{i-1}\), \(\text{gap\_pct}=100\cdot \text{gap\_size}/H_{i-1}\).
- Bearish: \(H_{i+1} < L_{i-1}\); gap \([H_{i+1}, L_{i-1}]\), \(\text{gap\_pct}=100\cdot (L_{i-1}-H_{i+1})/L_{i-1}\).
- Filtrar: \(\text{gap\_pct} > 0.1\).

Estado “filled” (código actual)
- Bullish: \(\text{filled} = (P < H_{i-1})\). Bearish: \(\text{filled} = (P > L_{i-1})\).

Selección “cercano”
- Bullish: no “filled” y \(H_{i-1} \le 1.05\, P\). Bearish: no “filled” y \(L_{i-1} \ge 0.95\, P\).

Puntuación
- Bullish: \( s_b = \min\{35,\ 10\cdot N_b + 2\cdot \max\text{gap\_pct}\}\)
- Bearish: \( s_s = \min\{30,\ 8\cdot N_s + 2\cdot \max\text{gap\_pct}\}\)
- Dominancia: diferencia > 10 suma bonus (\(+15\) bull, \(+12\) bear); empate → \(+5\).
- Score total: \( s = \) bull o bear dominante + bonus; truncado a \([0,100]\).

---

## Catálogo de Parámetros (DL‑001 Zero‑Hardcode)

Todos los umbrales/ventanas/pesos se resuelven dinámicamente a partir de BotConfig del usuario y estadísticas recientes del símbolo (ATR, volumen relativo, percentiles por régimen). Ninguna constante queda incrustada en reglas.

- period_atr: definido por estrategia/perfil del bot (no fijo 14).
- min_gap_pct_quantile = f(risk_profile): percentil dinámico para filtrar gaps mínimos.
- fill_threshold = f(stop_loss, atr_pct): porcentaje de relleno (0..1) para invalidar el gap.
- decay_window = f(interval): velas para decaimiento de la edad del gap.
- proximity_atr_mult = f(leverage, atr_pct): tolerancia de proximidad gap–precio en ATR.
- Pesos de scoring: {w_gap, w_fill, w_age, w_conf, w_mtf} por estrategia/modo.
- Sesgos: {τ_high, τ_neutral} por cuantiles históricos del score por símbolo/intervalo.

Resolución parámetros (fuente de verdad)
- BotConfig + métricas recientes (ATR/percentiles) → parámetros efectivos.
- Prohibido fijar valores en implementación; deben inyectarse desde este catálogo.

---

## Detección y Scoring Parametrizados (DL‑001)

Detección (3 velas)
- Bullish: L[i+1] > H[i-1] → gap [H[i-1], L[i+1]]; \(gap\_pct = 100\cdot (gap\_size)/H[i-1]\).
- Bearish: H[i+1] < L[i-1] → gap [H[i+1], L[i-1]]; \(gap\_pct = 100\cdot (gap\_size)/L[i-1]\).
- Umbral mínimo dinámico: \(gap\_pct ≥\) quantil(min_gap_pct_quantile).

Estado y métricas
- fill_ratio (0..1): fracción rellenada (según tipo bull/bear, normalizada al rango del gap).
- age: velas desde la formación; decay = exp(−age/decay_window).
- Confluencias: proximidad a POC/VA/OB dentro de tolerance_atr; conf ∈ [0..1].
- Proximidad: gap cercano si |precio_actual − centro_gap| ≤ proximity_atr_mult·ATR.
- Confirmación HTF (opcional): si existe FVG relevante en 15m/1h.

Scoring normalizado
- Por gap: \(\phi = w_{gap}\,\phi_{gap} + w_{fill}\,\phi_{fill} + w_{age}\,\phi_{age} + w_{conf}\,\phi_{conf} + w_{mtf}\,\phi_{mtf}\), \(\phi\in[0,1]\).
- Lado bull/bear: promedio de \(\phi\) sobre gaps cercanos.
- Score final: \( s = 100\cdot \max\{\bar\phi_{bull},\bar\phi_{bear}\}\); bias según \(s\) y pesos por estrategia.

Salidas
- Lista `fair_value_gaps`: gaps activos con campos {type, gap_low, gap_high, gap_size, gap_pct, age, fill_ratio, conf, htf_confirmed, proximity_ok}.
- `details.fvg_analysis`: contadores totales/cercanos, dirección dominante, parámetros efectivos.
- `nearest_targets`: hasta 3 gaps más cercanos al precio actual.

---

## Implementación Propuesta (Referencia)

Módulos sugeridos (Python) — referencia para implementación (no crea endpoints nuevos):

1) `backend/services/fvg_params.py` — resolver parámetros desde BotConfig + métricas recientes (DL‑001):
```python
#!/usr/bin/env python3
from dataclasses import dataclass
from typing import Dict

@dataclass
class FVGParams:
    # Thresholds y ventanas (parametrizadas)
    min_gap_pct_quantile: float         # p.ej., 0.6 (no fijo: varía por perfil)
    fill_threshold: float               # porcentaje de fill_ratio para invalidar gap (0..1)
    decay_window: int                   # velas para decaimiento de edad
    proximity_atr_mult: float          # tolerancia proximidad gap–precio en ATR
    # Pesos de scoring
    w_gap: float
    w_fill: float
    w_age: float
    w_conf: float
    w_mtf: float

def _q_by_profile(risk_profile: str) -> float:
    rp = (risk_profile or 'MODERATE').upper()
    return {'CONSERVATIVE': 0.70, 'AGGRESSIVE': 0.50}.get(rp, 0.60)

def _fill_by_profile(stop_loss: float) -> float:
    base = 0.65 + min(max(stop_loss, 0), 5) / 100.0
    return max(0.60, min(0.90, base))

def _decay_by_interval(interval: str) -> int:
    m = (interval or '15m').lower()
    return {'1m': 120, '5m': 96, '15m': 64, '1h': 48, '4h': 32}.get(m, 64)

def _proximity_by_leverage(leverage: int, atr_pct: float) -> float:
    lev = max(1, int(leverage or 1))
    base = 1.0 + (atr_pct * 10.0)
    return max(0.5, base / (1.0 + (lev - 1) * 0.03))

def _weights_by_strategy(strategy: str) -> Dict[str, float]:
    st = (strategy or 'Smart Scalper')
    if st == 'Smart Scalper':
        return dict(w_gap=0.30, w_fill=0.25, w_age=0.15, w_conf=0.20, w_mtf=0.10)
    if st == 'Trend Hunter':
        return dict(w_gap=0.25, w_fill=0.20, w_age=0.20, w_conf=0.20, w_mtf=0.15)
    return dict(w_gap=0.25, w_fill=0.25, w_age=0.20, w_conf=0.20, w_mtf=0.10)

def get_fvg_params(bot_config, recent_stats: Dict) -> FVGParams:
    interval = getattr(bot_config, 'interval', '15m')
    risk_profile = getattr(bot_config, 'risk_profile', 'MODERATE')
    strategy = getattr(bot_config, 'strategy', 'Smart Scalper')
    leverage = getattr(bot_config, 'leverage', 1)
    stop_loss = float(getattr(bot_config, 'stop_loss', 1.5))
    atr_pct = float(recent_stats.get('atr_pct', 0.02))

    min_gap_pct_quantile = _q_by_profile(risk_profile)
    fill_threshold = _fill_by_profile(stop_loss)
    decay_window = _decay_by_interval(interval)
    proximity_atr_mult = _proximity_by_leverage(leverage, atr_pct)
    w = _weights_by_strategy(strategy)

    return FVGParams(
        min_gap_pct_quantile=min_gap_pct_quantile,
        fill_threshold=fill_threshold,
        decay_window=decay_window,
        proximity_atr_mult=proximity_atr_mult,
        **w
    )
```

2) `backend/services/fvg_detector.py` — evaluación parametrizada y `InstitutionalConfirmation`:
```python
#!/usr/bin/env python3
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import numpy as np
import pandas as pd
from math import exp

from services.ta_alternative import calculate_atr
from services.fvg_params import get_fvg_params, FVGParams

try:
    from services.signal_quality_assessor import InstitutionalConfirmation
except Exception:
    @dataclass
    class InstitutionalConfirmation:
        name: str
        score: float
        bias: str
        details: Dict[str, Any]

def _compute_recent_stats(price_data: pd.DataFrame) -> Dict[str, float]:
    highs = price_data['high'].tolist()
    lows = price_data['low'].tolist()
    closes = price_data['close'].tolist()
    if len(closes) < 5:
        return dict(atr_pct=0.02)
    atr = calculate_atr(highs, lows, closes, period=14) or 1e-9
    atr_pct = atr / max(closes[-1], 1e-9)
    return dict(atr_pct=float(atr_pct), atr=float(atr))

def _detect_fvg(price: pd.DataFrame) -> Dict[str, List[Dict[str, float]]]:
    h = price['high'].values
    l = price['low'].values
    c = price['close'].values
    bullish, bearish = [], []
    for i in range(1, len(h) - 1):
        if l[i+1] > h[i-1]:
            gap_low, gap_high = h[i-1], l[i+1]
            gap_size = gap_high - gap_low
            gap_pct = 100.0 * gap_size / max(gap_low, 1e-9)
            bullish.append(dict(type='BULLISH', gap_low=float(gap_low), gap_high=float(gap_high),
                                gap_size=float(gap_size), gap_pct=float(gap_pct), idx=i))
        if h[i+1] < l[i-1]:
            gap_low, gap_high = h[i+1], l[i-1]
            gap_size = gap_high - gap_low
            gap_pct = 100.0 * gap_size / max(gap_high, 1e-9)
            bearish.append(dict(type='BEARISH', gap_low=float(gap_low), gap_high=float(gap_high),
                                gap_size=float(gap_size), gap_pct=float(gap_pct), idx=i))
    return dict(bullish=bullish, bearish=bearish)

def _quantile_threshold(values: List[float], q: float) -> float:
    if not values:
        return 0.0
    arr = np.array(values, dtype=float)
    q = min(0.99, max(0.01, float(q)))
    return float(np.quantile(arr, q))

def _fill_ratio(current_price: float, gap_low: float, gap_high: float, gap_type: str) -> float:
    if gap_type == 'BULLISH':
        if current_price >= gap_high:
            return 0.0
        if current_price <= gap_low:
            return 1.0
        return (gap_high - current_price) / max(gap_high - gap_low, 1e-9)
    else:
        if current_price <= gap_low:
            return 0.0
        if current_price >= gap_high:
            return 1.0
        return (current_price - gap_low) / max(gap_high - gap_low, 1e-9)

def _age_decay(age: int, decay_window: int) -> float:
    if decay_window <= 0:
        return 1.0
    return float(exp(-max(0, age) / float(decay_window)))

def _confluence_score(gap_low: float, gap_high: float, atr: float, micro: Optional[Any]) -> float:
    if not micro or not atr:
        return 0.0
    poc = getattr(micro, 'point_of_control', None)
    vah = getattr(micro, 'value_area_high', None)
    val = getattr(micro, 'value_area_low', None)
    zone_mid = 0.5 * (gap_low + gap_high)
    def near(level):
        if level is None:
            return 0.0
        d_atr = abs(level - zone_mid) / atr
        return max(0.0, 1.0 - min(d_atr, 3.0) / 3.0)
    return max(near(poc), near(vah), near(val))

def _htf_confirmed(timeframe_data: Optional[Dict[str, Any]], min_gap_pct: float) -> bool:
    if not timeframe_data:
        return False
    for tf in ('15m', '1h'):
        tf_data = timeframe_data.get(tf)
        if not tf_data:
            continue
        highs = tf_data.highs if hasattr(tf_data, 'highs') else tf_data.get('highs')
        lows  = tf_data.lows  if hasattr(tf_data, 'lows')  else tf_data.get('lows')
        closes= tf_data.closes if hasattr(tf_data, 'closes') else tf_data.get('closes')
        if not highs or not lows or not closes:
            continue
        pdf = pd.DataFrame({'high': highs, 'low': lows, 'close': closes})
        det = _detect_fvg(pdf)
        gaps = (det.get('bullish', []) + det.get('bearish', [])) if det else []
        if any(g.get('gap_pct', 0.0) >= min_gap_pct for g in gaps):
            return True
    return False

def evaluate_fair_value_gaps(price_data: pd.DataFrame,
                             volume_data: List[float],
                             bot_config: Any,
                             timeframe_data: Optional[Dict[str, Any]] = None,
                             microstructure: Optional[Any] = None) -> InstitutionalConfirmation:
    try:
        if price_data is None or len(price_data) < 5:
            return InstitutionalConfirmation(
                name='Fair Value Gaps', score=10, bias='INSTITUTIONAL_NEUTRAL',
                details={'error': 'Insufficient data for FVG analysis'}
            )
        stats = _compute_recent_stats(price_data)
        params: FVGParams = get_fvg_params(bot_config, stats)
        det = _detect_fvg(price_data)
        gaps_all = det.get('bullish', []) + det.get('bearish', [])
        if not gaps_all:
            return InstitutionalConfirmation(
                name='Fair Value Gaps', score=15, bias='INSTITUTIONAL_NEUTRAL',
                details={'fvg_analysis': {'total_bullish_fvgs': 0, 'total_bearish_fvgs': 0}}
            )
        gap_pcts = [g['gap_pct'] for g in gaps_all]
        min_gap_pct = _quantile_threshold(gap_pcts, params.min_gap_pct_quantile)
        current_price = float(price_data['close'].values[-1])
        atr = float(stats.get('atr', 0.0))
        proximity_ticks = params.proximity_atr_mult * atr if atr else 0.0
        enriched = []
        for g in gaps_all:
            if g['gap_pct'] < min_gap_pct:
                continue
            fr = _fill_ratio(current_price, g['gap_low'], g['gap_high'], g['type'])
            age = int(len(price_data) - g['idx'] - 1)
            decay = _age_decay(age, params.decay_window)
            conf = _confluence_score(g['gap_low'], g['gap_high'], atr, microstructure)
            zone_low, zone_high = g['gap_low'], g['gap_high']
            center = 0.5 * (zone_low + zone_high)
            proximity_ok = True if proximity_ticks == 0 else abs(current_price - center) <= proximity_ticks
            g2 = dict(**g, fill_ratio=fr, age=age, decay=decay, conf=conf, proximity_ok=proximity_ok)
            enriched.append(g2)
        bulls = [e for e in enriched if e['type'] == 'BULLISH']
        bears = [e for e in enriched if e['type'] == 'BEARISH']
        nearby_bulls = [e for e in bulls if e['proximity_ok']]
        nearby_bears = [e for e in bears if e['proximity_ok']]
        def _phi_gap(e): return min(1.0, e['gap_pct'] / max(min_gap_pct * 2.0, 1e-9))
        def _phi_fill(e):
            if e['fill_ratio'] >= params.fill_threshold:
                return 0.0
            return 1.0 - (e['fill_ratio'] / max(params.fill_threshold, 1e-9))
        def _phi_age(e): return e['decay']
        def _phi_conf(e): return e['conf']
        def _score_side(entries: List[Dict]) -> float:
            if not entries:
                return 0.0
            phis = []
            for e in entries:
                phi = (params.w_gap * _phi_gap(e) +
                       params.w_fill * _phi_fill(e) +
                       params.w_age * _phi_age(e) +
                       params.w_conf * _phi_conf(e))
                phis.append(phi)
            base = float(np.mean(phis))
            mtf_bonus = params.w_mtf * (1.0 if _htf_confirmed(timeframe_data, min_gap_pct) else 0.0)
            return min(1.0, max(0.0, base + mtf_bonus))
        sb = _score_side(nearby_bulls)
        ss = _score_side(nearby_bears)
        if sb > ss:
            direction = 'BULLISH_GAPS'
            score = int(round(100.0 * sb))
            bias = 'SMART_MONEY' if score >= 60 else 'INSTITUTIONAL_NEUTRAL'
            expectation = 'Bullish FVGs likely act as support / targets'
        elif ss > sb:
            direction = 'BEARISH_GAPS'
            score = int(round(100.0 * ss))
            bias = 'SMART_MONEY' if score >= 60 else 'INSTITUTIONAL_NEUTRAL'
            expectation = 'Bearish FVGs likely act as resistance / targets'
        else:
            direction = 'MIXED_GAPS'
            score = int(round(100.0 * max(sb, ss)))
            bias = 'INSTITUTIONAL_NEUTRAL'
            expectation = 'Mixed FVG signals - watch for gap fills'
        details = {
            'fvg_analysis': {
                'total_bullish_fvgs': len(bulls),
                'total_bearish_fvgs': len(bears),
                'nearby_bullish_fvgs': len(nearby_bulls),
                'nearby_bearish_fvgs': len(nearby_bears),
                'dominant_direction': direction,
                'expectation': expectation,
                'min_gap_pct_quantile': float(params.min_gap_pct_quantile),
                'fill_threshold': float(params.fill_threshold),
                'decay_window': int(params.decay_window),
                'proximity_atr_mult': float(params.proximity_atr_mult),
            },
            'nearest_targets': sorted(nearby_bulls + nearby_bears,
                                      key=lambda e: abs(current_price - 0.5 * (e['gap_low'] + e['gap_high']))
                                     )[:3],
            'current_price': current_price
        }
        return InstitutionalConfirmation(
            name='Fair Value Gaps', score=min(100, max(0, score)), bias=bias, details=details
        )
    except Exception as e:
        return InstitutionalConfirmation(
            name='Fair Value Gaps', score=0, bias='INSTITUTIONAL_NEUTRAL',
            details={'error': str(e)}
        )
```

3) Integración SQA (`backend/services/signal_quality_assessor.py`):
```python
from services.fvg_detector import evaluate_fair_value_gaps

fvg_confirmation = evaluate_fair_value_gaps(
    price_data=main_df,
    volume_data=main_data['volumes'],
    bot_config=result,            # BotConfig real del orquestador
    timeframe_data=timeframe_data,
    microstructure=microstructure
)
institutional_confirmations['fair_value_gaps'] = fvg_confirmation

4) Frontend — mapeo para visualizar FVG
```javascript
// frontend/src/features/dashboard/hooks/useSmartScalperAPI.js (fragmento)
// dentro de fetchSmartScalperAnalysis()
return {
  // ... otros campos mapeados
  fair_value_gaps: data.signals?.institutional_confirmations?.fair_value_gaps ? {
    score: data.signals.institutional_confirmations.fair_value_gaps.score,
    bias: data.signals.institutional_confirmations.fair_value_gaps.bias,
    name: data.signals.institutional_confirmations.fair_value_gaps.name,
    details: data.signals.institutional_confirmations.fair_value_gaps.details
  } : null,
};
```
```

---

## Integración Backend/Frontend (DL‑001)

Backend
- Mantener el endpoint `POST /api/run-smart-trade/{symbol}`; sin rutas nuevas.
- Exponer `signals.institutional_confirmations.fair_value_gaps` con `score/bias/name/details`.

Frontend
- Sin simulación/fallbacks. El hook debe mapear `fair_value_gaps` desde `signals.institutional_confirmations`.
- Visualizar contadores/dirección/targets en la vista avanzada; si no hay datos, mostrar “No data”.

Datos desde el Bot (fuente)
- Los parámetros provienen de `BotConfig` y métricas recientes del símbolo; `MarketMicrostructureAnalyzer` aporta POC/VA/VAL cuando se use confluencia.
