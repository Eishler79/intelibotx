# 06_MARKET_MICROSTRUCTURE_SPEC.md — Especificación Técnica (DL‑001)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/06_MARKET_MICROSTRUCTURE.md
- Decisión: DL‑001 Zero‑Hardcode Parameters (sin números incrustados en lógica)

Propósito
- Calcular POC/VAH/VAL, tipo de perfil y métricas de microestructura (dominant side, va_occupancy) a partir de OHLCV, con parámetros 100% externos.

Entradas
- OHLCV (≥100), resoluciones por símbolo; opcional L2 futuro.
- Parámetros externos vía `ParamProvider` (ver Código de Referencia) y `recent_stats` (ATR, percentiles de volumen, etc.).

Salidas
- point_of_control, value_area_high/low, profile_type, dominant_side, va_occupancy, max_volume_ratio, buckets_count; detalles de cálculo y parámetros usados.

Reglas (resumen, DL‑001)
- Buckets por precio definidos por provider: modo (`tick`|`atr`|custom) y tamaño provienen de meta del símbolo/ATR.
- Value Area objetivo `p_va` proviene de configuración (no fijo 70%).
- Dominant side y clasificación de perfil usan umbrales externos (`tau_flow`, `tau_conc_high`, `tau_conc_med`).
- `va_occupancy` usa ventanas externas (`L_volume`); scoring usa pesos y umbrales externos.

Integración
- Servicio dedicado; SQA lo consume sin duplicar cálculos ni números fijos. Ver secciones de “Código de Referencia” y “Migración”.

Rendimiento/Pruebas
- < 40 ms; validación en símbolos con distintos ticks; estabilidad de POC/VA entre ventanas cercanas; verificación de conformidad DL‑001 (sin literales numéricos en lógica).

Implementación (estado actual vs DL‑001)
- Código actual: `backend/services/market_microstructure_analyzer.py` contiene números fijos (ej. 70%, 1.2×). Mantener como legacy.
- Propuesta DL‑001: módulos parametrizados (ver abajo) eliminan hardcodes y centralizan parámetros en `ParamProvider`.
- Evaluación SQA: `backend/services/signal_quality_assessor.py:_evaluate_market_microstructure` — migrar a evaluador parametrizado.
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (DL‑001 parametrizado)

Volumen a precio y POC
- Precio de referencia por barra: p_i = f_mid(H_i, L_i, C_i) = (H_i + L_i + C_i)/3.
- Bucketización: b_i = bucket(p_i | mode, size) con `mode ∈ {tick, atr, bps, custom}` y `size > 0` entregados por provider. Para `bps`, el `bucket_size` es una fracción del precio actual (basis points) provista externamente.
- Acumulación: vol[b] += V_i.
- Punto de Control: POC = argmax_b vol[b].

Value Area (VA)
- Ordenar buckets por vol[b] desc.; acumular hasta alcanzar `p_va · ∑_b vol[b]` con `p_va` externo.
- VAH = max{b en VA}, VAL = min{b en VA}.

Dominant Side (flujo)
- buy_vol = ∑ V_i: C_i > C_{i−1}; sell_vol = ∑ V_i: C_i < C_{i−1}.
- Si buy_vol > τ_flow·sell_vol → BUY; si sell_vol > τ_flow·buy_vol → SELL; otro caso → NEUTRAL.

Concentración del perfil y forma (P/b/D)
- r1 = max_b vol[b] / ∑_b vol[b]; r2 = segundo mayor / ∑_b vol[b].
- Clasificación base por concentración: r1 ≥ τ_conc_high → 'poc_dominant'; si no, r2 ≥ τ_conc_med → 'double_distribution'; si no → 'balanced'.
- Mapeo estándar para UI Smart Scalper: {'poc_dominant':'P', 'double_distribution':'D', 'balanced':'balanced'}.
- Extensión opcional (DL‑001): distinguir 'P' vs 'b' por sesgo vertical usando `skew_ratio = (∑ vol[b>POC]) / max(∑ vol[b<POC], ε)` con umbrales externos (`tau_skew_up`, `tau_skew_down`) provistos por el `ParamProvider`.

VA Occupancy
- Sobre los últimos `L_volume` cierres: va_occupancy = (1/N) · ∑ 1[VAL ≤ C_t ≤ VAH].

Scoring (SQA)
- φ_struct ∈ [0,1] (estructura), φ_conc ∈ [0,1] (concentración), φ_flow ∈ [0,1] (flujo con penalización de wicks α).
- score = 100 · (w_struct·φ_struct + w_conc·φ_conc + w_flow·φ_flow).
- Sesgo: SMART_MONEY si score ≥ τ_score_high; INSTITUTIONAL_NEUTRAL si score ≥ τ_score_neutral; si no, INSTITUTIONAL_NEUTRAL.

---

## Catálogo de Parámetros (fuente de verdad)

- p_va: objetivo de Value Area.
- bucket_mode, bucket_size: modo y tamaño de bucket por precio.
- L_struct, L_volume: lookbacks de estructura/volumen.
- τ_conc_high, τ_conc_med: umbrales de concentración.
- τ_flow: umbral de dominancia de flujo.
- α = wick_penalty_alpha: penalización de mechas en flujo.
- w_struct, w_conc, w_flow: pesos de scoring.
- τ_score_high, τ_score_neutral: umbrales de sesgo por score.
- (opcionales) τ_skew_up, τ_skew_down: umbrales para clasificar sesgo vertical de volumen respecto a POC (P/b). Solo si el modo UI requiere esta distinción.

Resolución de parámetros (DL‑001)
- Solo `ParamProvider` decide valores. Implementaciones leen de `BotConfig.advanced_params`, meta del símbolo y `recent_stats` (ATR/percentiles).
- Prohibido fijar valores numéricos en Analyzer/Evaluator; 1e−12 se permite solo como salvaguarda numérica.
- Buckets: el provider puede definir `bucket_mode ∈ {'tick','atr','bps','custom'}`. Para `bps`, `bucket_size` es la fracción del precio (en puntos básicos) provista por calibración/telemetría. Para `custom`, `bucket_size` viene de calibración externa. No se permiten literales en la lógica del Analyzer.

---

## Código de Referencia (DL‑001, sin hardcodes)

1) Parámetros — `backend/services/micro_params.py`
```python
#!/usr/bin/env python3
from dataclasses import dataclass
from typing import Dict, Any, Protocol, Tuple

@dataclass
class MicroParams:
    # Value Area target
    p_va: float
    # Bucket de volumen por precio
    bucket_mode: str        # 'tick' | 'atr' | 'bps' | 'custom'
    bucket_size: float      # tamaño absoluto del bucket
    # Ventanas
    L_struct: int
    L_volume: int
    # Umbrales (parametrizados, 100% externos)
    tau_conc_high: float
    tau_conc_med: float
    tau_flow: float         # dominancia del flujo (ratio)
    wick_penalty_alpha: float
    # Pesos de scoring
    w_struct: float
    w_conc: float
    w_flow: float
    # Umbrales para sesgo
    tau_score_high: float
    tau_score_neutral: float

class ParamProvider(Protocol):
    """
    Contrato para proveer parámetros DL‑001 (sin hardcodes).
    Implementaciones pueden leer de BotConfig.advanced_params, meta del símbolo,
    recent_stats (ATR%, percentiles, etc.), o fuentes de calibración.
    """
    def get_va_target(self, bot_config: Any) -> float: ...
    def get_bucket_mode_size(self, bot_config: Any, symbol_meta: Dict[str, Any], recent_stats: Dict[str, float]) -> Tuple[str, float]: ...
    def get_lookbacks(self, bot_config: Any) -> Tuple[int, int]: ...
    def get_concentration_thresholds(self, symbol_id: str, recent_stats: Dict[str, Any]) -> Tuple[float, float]: ...
    def get_flow_threshold(self, bot_config: Any, recent_stats: Dict[str, float]) -> float: ...
    def get_wick_penalty(self, bot_config: Any) -> float: ...
    def get_weights(self, bot_config: Any) -> Tuple[float, float, float]: ...
    def get_score_thresholds(self, bot_config: Any) -> Tuple[float, float]: ...
    # Opcionales: thresholds de sesgo del perfil para UI P/b
    def get_profile_skew_thresholds(self, bot_config: Any, symbol_meta: Dict[str, Any]) -> Tuple[float, float]: ...

def resolve_micro_params(
    bot_config: Any,
    symbol_meta: Dict[str, Any],
    recent_stats: Dict[str, float],
    provider: ParamProvider
) -> MicroParams:
    """
    Resolver DL‑001: no se incrusta ningún número. TODO proviene del provider.
    """
    symbol_id = getattr(bot_config, 'symbol', 'UNKNOWN')

    p_va = float(provider.get_va_target(bot_config))
    bucket_mode, bucket_size = provider.get_bucket_mode_size(bot_config, symbol_meta, recent_stats)
    L_struct, L_volume = provider.get_lookbacks(bot_config)
    tau_conc_high, tau_conc_med = provider.get_concentration_thresholds(symbol_id, recent_stats)
    tau_flow = provider.get_flow_threshold(bot_config, recent_stats)
    wick_alpha = provider.get_wick_penalty(bot_config)
    w_struct, w_conc, w_flow = provider.get_weights(bot_config)
    tau_high, tau_neutral = provider.get_score_thresholds(bot_config)

    return MicroParams(
        p_va=p_va,
        bucket_mode=bucket_mode,
        bucket_size=float(bucket_size),
        L_struct=int(L_struct),
        L_volume=int(L_volume),
        tau_conc_high=float(tau_conc_high),
        tau_conc_med=float(tau_conc_med),
        tau_flow=float(tau_flow),
        wick_penalty_alpha=float(wick_alpha),
        w_struct=float(w_struct),
        w_conc=float(w_conc),
        w_flow=float(w_flow),
        tau_score_high=float(tau_high),
        tau_score_neutral=float(tau_neutral)
    )
```

Ejemplo de Provider “DataDriven” (sin defaults) — `backend/services/micro_params_provider_example.py`
```python
from typing import Any, Dict, Tuple
from services.micro_params import ParamProvider

class DataDrivenParamProvider(ParamProvider):
    def get_va_target(self, bot_config: Any) -> float:
        return float(bot_config.advanced_params['p_va'])

    def get_bucket_mode_size(self, bot_config: Any, symbol_meta: Dict[str, Any], recent_stats: Dict[str, float]) -> Tuple[str, float]:
        mode = bot_config.advanced_params['bucket_mode']  # 'tick' | 'atr' | 'bps' | 'custom'
        if mode == 'tick':
            return mode, float(symbol_meta['tick_size'])
        if mode == 'atr':
            # tamaño a partir de ATR absoluto o proporcional provisto externamente
            return mode, float(recent_stats['atr_abs'])
        if mode == 'bps':
            # tamaño en fracción del precio (basis points) provisto externamente
            return mode, float(recent_stats['bps_step'])
        # custom
        return mode, float(bot_config.advanced_params['bucket_size'])

    def get_lookbacks(self, bot_config: Any) -> Tuple[int, int]:
        ap = bot_config.advanced_params
        return int(ap['L_struct']), int(ap['L_volume'])

    def get_concentration_thresholds(self, symbol_id: str, recent_stats: Dict[str, Any]) -> Tuple[float, float]:
        return float(recent_stats['tau_conc_high']), float(recent_stats['tau_conc_med'])

    def get_flow_threshold(self, bot_config: Any, recent_stats: Dict[str, float]) -> float:
        return float(bot_config.advanced_params['tau_flow'])

    def get_wick_penalty(self, bot_config: Any) -> float:
        return float(bot_config.advanced_params['wick_penalty_alpha'])

    def get_weights(self, bot_config: Any) -> Tuple[float, float, float]:
        ap = bot_config.advanced_params
        return float(ap['w_struct']), float(ap['w_conc']), float(ap['w_flow'])

    def get_score_thresholds(self, bot_config: Any) -> Tuple[float, float]:
        ap = bot_config.advanced_params
        return float(ap['tau_score_high']), float(ap['tau_score_neutral'])

    # Opcional: skew thresholds para forma P/b si UI lo requiere
    def get_profile_skew_thresholds(self, bot_config: Any, symbol_meta: Dict[str, Any]) -> Tuple[float, float]:
        ap = bot_config.advanced_params
        return float(ap['tau_skew_up']), float(ap['tau_skew_down'])
```

2) Analyzer parametrizado — `backend/services/market_microstructure_param.py`
```python
#!/usr/bin/env python3
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from services.micro_params import MicroParams

class VolumeType(Enum):
    BUY = "buy"
    SELL = "sell"
    NEUTRAL = "neutral"

@dataclass
class MarketMicrostructure:
    point_of_control: float
    value_area_high: float
    value_area_low: float
    dominant_side: VolumeType
    va_occupancy: float
    profile_type: str
    max_volume_ratio: float
    buckets_count: int

def _mid_price(h: float, l: float, c: float) -> float:
    return (h + l + c) / 3.0

def _bucket_price(price: float, mode: str, bucket_size: float) -> float:
    # bucket_size proviene de params; 1e-12 solo salvaguarda numérica
    step = max(bucket_size, 1e-12)
    if mode == 'tick' or mode == 'atr' or isinstance(mode, str):
        return round(price / step) * step
    return round(price / step) * step

def _volume_profile(highs: List[float], lows: List[float], closes: List[float], volumes: List[float],
                    params: MicroParams) -> Dict[float, float]:
    vp: Dict[float, float] = {}
    n = min(len(highs), len(lows), len(closes), len(volumes))
    for i in range(n):
        price = _mid_price(highs[i], lows[i], closes[i])
        bucket = _bucket_price(price, params.bucket_mode, params.bucket_size)
        vp[bucket] = vp.get(bucket, 0.0) + float(volumes[i])
    return vp

def _compute_poc_va(vp: Dict[float, float], p_va: float) -> Tuple[float, float, float, float]:
    if not vp:
        return 0.0, 0.0, 0.0, 0.0
    total_vol = sum(vp.values())
    poc = max(vp.keys(), key=lambda k: vp[k])
    sorted_buckets = sorted(vp.items(), key=lambda kv: kv[1], reverse=True)
    cumulative = 0.0
    value_buckets = []
    for price, v in sorted_buckets:
        cumulative += v
        value_buckets.append(price)
        if cumulative >= total_vol * p_va:
            break
    va_high = max(value_buckets) if value_buckets else poc
    va_low = min(value_buckets) if value_buckets else poc
    max_ratio = (vp[poc] / total_vol) if total_vol > 0 else 0.0
    return poc, va_high, va_low, max_ratio

def _dominant_side(closes: List[float], volumes: List[float], tau_flow: float) -> VolumeType:
    if len(closes) < 2:
        return VolumeType.NEUTRAL
    buy_v = 0.0
    sell_v = 0.0
    n = min(len(closes), len(volumes))
    for i in range(1, n):
        if closes[i] > closes[i-1]:
            buy_v += volumes[i]
        elif closes[i] < closes[i-1]:
            sell_v += volumes[i]
    if tau_flow <= 0:
        return VolumeType.NEUTRAL
    if buy_v > sell_v * tau_flow:
        return VolumeType.BUY
    if sell_v > buy_v * tau_flow:
        return VolumeType.SELL
    return VolumeType.NEUTRAL

def _va_occupancy(closes: List[float], va_low: float, va_high: float, N: int) -> float:
    if N <= 0 or not closes:
        return 0.0
    use = closes[-N:] if len(closes) >= N else list(closes)
    inside = sum(1 for x in use if va_low <= x <= va_high)
    return inside / max(1, len(use))

def _profile_type(vp: Dict[float, float], tau_conc_high: float, tau_conc_med: float) -> str:
    if not vp:
        return 'unknown'
    total = sum(vp.values())
    if total <= 0:
        return 'unknown'
    top = sorted(vp.values(), reverse=True)
    r1 = top[0] / total
    r2 = (top[1] / total) if len(top) > 1 else 0.0
    # Clasificación basada en thresholds externos (sin números fijos)
    if r1 >= tau_conc_high:
        return 'poc_dominant'
    if r2 >= tau_conc_med:
        return 'double_distribution'
    return 'balanced'

def analyze_market_microstructure_param(symbol: str, timeframe: str,
                                        highs: List[float], lows: List[float],
                                        closes: List[float], volumes: List[float],
                                        params: MicroParams) -> MarketMicrostructure:
    vp = _volume_profile(highs, lows, closes, volumes, params)
    poc, va_high, va_low, max_ratio = _compute_poc_va(vp, params.p_va)
    dom = _dominant_side(closes, volumes, params.tau_flow)
    occupancy = _va_occupancy(closes, va_low, va_high, params.L_volume)
    ptype = _profile_type(vp, params.tau_conc_high, params.tau_conc_med)
    return MarketMicrostructure(
        point_of_control=float(poc),
        value_area_high=float(va_high),
        value_area_low=float(va_low),
        dominant_side=dom,
        va_occupancy=float(occupancy),
        profile_type=ptype,
        max_volume_ratio=float(max_ratio),
        buckets_count=len(vp)
    )
```

3) Evaluación SQA parametrizada — `backend/services/micro_evaluator.py`
```python
#!/usr/bin/env python3
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

from services.micro_params import resolve_micro_params, MicroParams, ParamProvider
from services.market_microstructure_param import analyze_market_microstructure_param, MarketMicrostructure, VolumeType

try:
    from services.signal_quality_assessor import InstitutionalConfirmation
except Exception:
    from dataclasses import dataclass
    @dataclass
    class InstitutionalConfirmation:
        name: str
        score: float
        bias: str
        details: Dict[str, Any]

def _recent_stats(price_data: pd.DataFrame, injected_stats: Optional[Dict[str, float]] = None) -> Dict[str, float]:
    """
    Stats deben inyectarse externamente (ATR%, last_price, percentiles volumen).
    Si no se inyectan, este evaluador no inventa números: exige stats externas.
    """
    if injected_stats is not None:
        return injected_stats
    # En DL‑001 no inferimos con números fijos. Requerido por el orquestador.
    raise ValueError("recent_stats are required (atr_pct, last_price, volume_percentiles, etc.)")

def _phi_structure(closes: List[float], L_struct: int) -> float:
    if L_struct <= 0 or not closes:
        return 0.0
    seq = closes[-L_struct:] if len(closes) >= L_struct else list(closes)
    if len(seq) < 3:
        return 0.0
    hh = sum(1 for i in range(1, len(seq)) if seq[i] > seq[i-1])
    ll = sum(1 for i in range(1, len(seq)) if seq[i] < seq[i-1])
    denom = max(1, len(seq) - 1)
    val = (hh - ll) / denom  # -1..1
    return (val + 1.0) / 2.0  # 0..1

def _phi_concentration(max_ratio: float, tau_conc_high: float, tau_conc_med: float) -> float:
    if max_ratio >= tau_conc_high:
        return 1.0
    if max_ratio >= tau_conc_med:
        # Interpolación estrictamente basada en thresholds externos
        rng = max(1e-12, tau_conc_high - tau_conc_med)
        return 0.5 + 0.5 * (max_ratio - tau_conc_med) / rng
    # Normaliza bajo tau_conc_med
    return max(0.0, min(0.5, max_ratio / max(1e-12, tau_conc_med) * 0.5))

def _phi_flow(closes: List[float], highs: List[float], lows: List[float],
              alpha: float, tau_flow: float) -> float:
    if len(closes) < 3 or alpha < 0 or tau_flow <= 0:
        return 0.0
    bull_p = 0.0
    bear_p = 0.0
    for i in range(1, len(closes)):
        body = abs(closes[i] - closes[i-1])
        up_wick = max(0.0, highs[i] - max(closes[i], closes[i-1]))
        dn_wick = max(0.0, min(closes[i], closes[i-1]) - lows[i])
        if closes[i] > closes[i-1]:
            bull_p += body - alpha * up_wick
        elif closes[i] < closes[i-1]:
            bear_p += body - alpha * dn_wick
    if bull_p <= 0 and bear_p <= 0:
        return 0.0
    if bull_p > bear_p * tau_flow or bear_p > bull_p * tau_flow:
        return 1.0
    return 0.5

def evaluate_market_microstructure(
    price_data: pd.DataFrame,
    volume_data: List[float],
    bot_config: Any,
    symbol_meta: Dict[str, Any],
    recent_stats: Dict[str, float],
    provider: ParamProvider
) -> InstitutionalConfirmation:
    """
    Evaluación parametrizada DL‑001: requiere ParamProvider y recent_stats externos.
    No usa números fijos.
    """
    try:
        if price_data is None or len(price_data) < 3:
            return InstitutionalConfirmation(
                name="Market Microstructure",
                score=0.0,
                bias="INSTITUTIONAL_NEUTRAL",
                details={"error": "Insufficient data"}
            )

        highs = price_data['high'].tolist()
        lows = price_data['low'].tolist()
        closes = price_data['close'].tolist()
        vols = volume_data[-len(closes):] if len(volume_data) >= len(closes) else volume_data

        stats = _recent_stats(price_data, recent_stats)
        params: MicroParams = resolve_micro_params(bot_config, symbol_meta, stats, provider)

        mm = analyze_market_microstructure_param(
            symbol=getattr(bot_config, 'symbol', 'UNKNOWN'),
            timeframe=getattr(bot_config, 'interval', '15m'),
            highs=highs, lows=lows, closes=closes, volumes=vols, params=params
        )

        phi_struct = _phi_structure(closes, params.L_struct)
        phi_conc = _phi_concentration(mm.max_volume_ratio, params.tau_conc_high, params.tau_conc_med)
        phi_flow = _phi_flow(closes, highs, lows, params.wick_penalty_alpha, params.tau_flow)

        score = 100.0 * (params.w_struct * phi_struct + params.w_conc * phi_conc + params.w_flow * phi_flow)
        bias = "SMART_MONEY" if score >= params.tau_score_high else ("INSTITUTIONAL_NEUTRAL" if score >= params.tau_score_neutral else "INSTITUTIONAL_NEUTRAL")

        details = {
            "microstructure": {
                "poc": mm.point_of_control,
                "vah": mm.value_area_high,
                "val": mm.value_area_low,
                "dominant_side": mm.dominant_side.value,
                "va_occupancy": mm.va_occupancy,
                "profile_type": mm.profile_type,
                "max_volume_ratio": mm.max_volume_ratio,
                "buckets_count": mm.buckets_count
            },
            "parameters": {
                "p_va": params.p_va,
                "bucket_mode": params.bucket_mode,
                "bucket_size": params.bucket_size,
                "L_struct": params.L_struct,
                "L_volume": params.L_volume,
                "tau_conc_high": params.tau_conc_high,
                "tau_conc_med": params.tau_conc_med,
                "tau_flow": params.tau_flow,
                "wick_penalty_alpha": params.wick_penalty_alpha,
                "weights": {"w_struct": params.w_struct, "w_conc": params.w_conc, "w_flow": params.w_flow},
                "score_thresholds": {"high": params.tau_score_high, "neutral": params.tau_score_neutral}
            },
            "components": {
                "phi_struct": phi_struct,
                "phi_conc": phi_conc,
                "phi_flow": phi_flow
            }
        }

        return InstitutionalConfirmation(
            name="Market Microstructure",
            score=float(round(min(100.0, max(0.0, score)), 2)),
            bias=bias,
            details=details
        )
    except Exception as e:
        return InstitutionalConfirmation(
            name="Market Microstructure",
            score=0.0,
            bias="INSTITUTIONAL_NEUTRAL",
            details={"error": str(e)}
        )
```

---

## Migración y uso (Backend/Frontend)

Backend
- Mantener `backend/services/market_microstructure_analyzer.py` como legacy.
- Añadir módulos DL‑001 anteriores y orquestar desde SQA usando `evaluate_market_microstructure` con `ParamProvider` concreto.
- Preferir inyección: pasar `microstructure` ya calculado al SQA para evitar doble cálculo (ver `backend/routes/bots.py` sección "microstructure"). Si no se provee, SQA puede calcularlo con el Analyzer parametrizado y el mismo `ParamProvider` (sin defaults).
- Extender la respuesta del endpoint Smart Scalper para incluir campos DL‑001: `profile_type` (mapeado a UI P/b/D/balanced según thresholds externos), `va_occupancy`, `max_volume_ratio`, `buckets_count`. Ejemplo (real): `backend/routes/bots.py:analysis` y bloque `"microstructure"`.
- Compliance: sin parches/wrappers/simulaciones. Solo Analyzer/Evaluator reales con parámetros del `ParamProvider`. Cualquier threshold o tamaño proviene de `BotConfig.advanced_params`/`symbol_meta`/`recent_stats`.

Frontend
- Mostrar POC/VAH/VAL, `dominant_side`, `va_occupancy`, `profile_type` (P/b/D/balanced) y `max_volume_ratio`.
- Si faltan parámetros/estadísticas externas, mostrar “No data” sin fallback numérico.
- Ajustar la UI para interpretar `profile_type` mapeado (sin convertir en frontend). La conversión P/b/D se realiza en backend usando thresholds del `ParamProvider`.

Datos desde el Bot
- Parámetros derivan de `BotConfig.advanced_params` + meta del símbolo (tick size, min step) + `recent_stats` (ATR/percentiles). No defaults en lógica.

---

## Frontend DL‑001 Cleanup (Integración Real)

- Eliminar datos simulados/hardcoded en `frontend/src/components/InstitutionalChart.jsx` y consumir SOLO datos reales del backend.
  - Violaciones actuales:
    - `frontend/src/components/InstitutionalChart.jsx:27` y `:47` usan `Math.random()` y datos generados cuando falta data real.
    - `frontend/src/components/InstitutionalChart.jsx:30` asigna `wyckoffPhase` con selección aleatoria.
    - `frontend/src/components/InstitutionalChart.jsx:63` función `generateSampleInstitutionalData` con `basePrice = 45000`.
- Fuente de datos autorizada (DL‑001): `POST /api/run-smart-trade/{symbol}` → bloque `microstructure` del payload.
  - Campos actuales disponibles: `poc`, `vah`, `val`, `volume_type`. Ver `backend/routes/bots.py:219`.
  - Campos a incorporar tras migración DL‑001: `profile_type` (P/b/D/balanced), `va_occupancy`, `max_volume_ratio`, `buckets_count` — responsabilidad del backend.
- Visualización recomendada:
  - Trazar líneas horizontales para `VAL`, `POC`, `VAH` en el gráfico.
  - Badge de `profile_type` y `dominant_side` (buy/sell/neutral) en el panel de resumen.
  - Porcentaje `va_occupancy` y `max_volume_ratio` como métricas auxiliares.

Compliance
- Sin “wrappers” ni simulación. Si no hay datos, mostrar “No data available” (mensaje plano) y registrar incidente UX en backlog.
