# 12_COMPOSITE_MAN_THEORY_SPEC.md — Especificación Técnica Completa (DL‑001)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/12_COMPOSITE_MAN_THEORY.md
- Wyckoff Advanced Patterns: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md

Propósito
- Modelar la manipulación profesional (Composite Man) a través de clímax de compra/venta, construcción de causa, springs/UTAD y SOS/SOW, generando señales de protección (FADE/FLAT) y confirmando inicios de tendencias institucionales.

Entradas
- OHLCV con `lookback_bars = f_interval(bot_config.interval)` (≥120 barras).
- ATR con `period_atr = f_atr_period(bot_config.strategy)` (no fijo 14).
- Volumen relativo y métricas de microestructura/order flow (absorption, imbalance) según disponibilidad.
- Confirmaciones MTF (5m/15m/1h) opcionales si el modo lo requiere.

Salidas
- `composite_signal` (SPRING, UTAD, SOS, SOW, CLIMAX, TRANSITION, NEUTRAL).
- `manipulation_events`: lista de eventos `{type, probability, fade_direction}`.
- `composite_action`: acción sugerida (FADE, PROTECT, FOLLOW, NONE).
- `confidence` [0..1]; `details` (niveles, métricas, confluencias).

Precondiciones
- Datos mínimos según `lookback_bars`; ATR válido; volumen reciente disponible.
- Si no se cumplen, retornar `INSTITUTIONAL_NEUTRAL` con detalle `{"error": "INSUFFICIENT_DATA"}` (DL‑001).

Integración
- Analizador en `backend/services/composite_man_analyzer.py` (nuevo).
- Consumido por `SignalQualityAssessor._evaluate_composite_man` devolviendo `InstitutionalConfirmation` en `institutional_confirmations['composite_man']`.
- Consenso dual con Order Flow en Anti‑Manipulation Mode y como confirmación en Trend Hunter / Smart Scalper.

Rendimiento/Pruebas
- Complejidad O(lookback); < 60 ms por símbolo.
- Validar con casos etiquetados (springs, UTAD, SOS/SOW) y coherencia con VSA/Profile.

Diagnóstico P1 (antes de implementar)
- `rg -n "composite_man" backend` para confirmar inexistencia actual.
- Verificar payload de `POST /api/run-smart-trade/{symbol}` y puntos UI donde se mostrará la señal (SmartScalperMetrics/InstitutionalChart).

Rollback (P2)
- Cambios revertibles documentando commit base; si se añaden campos públicos, registrar en `docs/MIGRATIONS.md`.

---

## Catálogo de Parámetros (DL‑001 Zero‑Hardcode)

Todos los umbrales/ventanas/pesos provienen de tablas parametrizadas en función de BotConfig (estrategia, risk_profile, leverage, cooldown_minutes, interval), `recent_stats` (ATR, percentiles de volumen/rango) y `symbol_meta` (tick/step). No se permiten literales dentro del analizador.

- `period_atr`: periodo ATR por estrategia/perfil.
- `lookback_bars`: tamaño ventana principal según intervalo/modo.
- `theta_climax_volume`: percentil de volumen para detectar clímax (compra/venta).
- `theta_climax_wick`: múltiplos ATR para wicks extremos.
- `theta_cause_duration`: duración mínima (barras) para considerar “building cause”.
- `theta_spring_depth_atr`, `theta_spring_volume`: profundidad y volumen mínimo para spring válidos.
- `theta_utad_extension_atr`, `theta_utad_volume`: extensión/volumen para UTAD.
- `theta_sos_strength`, `theta_sow_strength`: fuerza mínima Signs of Strength/Weakness (cierre vs rango + volumen).
- `validation_tests_min`: nº mínimo de tests posteriores a spring/UTAD.
- `theta_transition`: score mínimo para marcar transición de fase.
- `mtf_weight`: peso extra cuando MTF (5m/15m/1h) es coherente.
- `orderflow_weight`: contribución de Order Flow (absorciones, icebergs, imbalances).
- `vsa_weight`: contribución VSA (clímax, no demand/supply, Effort vs Result).
- `profile_weight`: contribución Market Profile (POC, VAH/VAL, profile_type).
- `session_weight`: ajuste por sesión (Asia/London/NY) cuando se dispone de telemetría.
- Pesos scoring: `{w_climax, w_cause, w_tests, w_sos_sow, w_mtf, w_confluence}` normalizados por estrategia/modo.
- Umbrales finales: `{tau_manipulation, tau_transition, tau_neutral}` derivados de distribución histórica del score por símbolo.

---

## ParamProvider DL‑001

```python
from dataclasses import dataclass
from typing import Protocol, Any, Dict

@dataclass
class CompositeManParams:
    period_atr: int
    lookback_bars: int
    theta_climax_volume: float
    theta_climax_wick: float
    theta_cause_duration: int
    theta_spring_depth_atr: float
    theta_spring_volume: float
    theta_utad_extension_atr: float
    theta_utad_volume: float
    theta_sos_strength: float
    theta_sow_strength: float
    theta_transition: float
    validation_tests_min: int
    mtf_weight: float
    orderflow_weight: float
    vsa_weight: float
    profile_weight: float
    session_weight: Dict[str, float]
    w_climax: float
    w_cause: float
    w_tests: float
    w_sos_sow: float
    w_mtf: float
    w_confluence: float
    tau_manipulation: float
    tau_transition: float
    tau_neutral: float

class CompositeManParamProvider(Protocol):
    def get_base_params(self, bot_config: Any, recent_stats: Dict[str, float]) -> Dict[str, Any]: ...
    def get_weights(self, bot_config: Any) -> Dict[str, float]: ...
    def get_bias_thresholds(self, bot_config: Any) -> Dict[str, float]: ...

def resolve_composite_params(bot_config: Any, recent_stats: Dict[str, float], provider: CompositeManParamProvider) -> CompositeManParams:
    base = provider.get_base_params(bot_config, recent_stats)
    weights = provider.get_weights(bot_config)
    bias = provider.get_bias_thresholds(bot_config)
    return CompositeManParams(
        period_atr=int(base['period_atr']),
        lookback_bars=int(base['lookback_bars']),
        theta_climax_volume=float(base['theta_climax_volume']),
        theta_climax_wick=float(base['theta_climax_wick']),
        theta_cause_duration=int(base['theta_cause_duration']),
        theta_spring_depth_atr=float(base['theta_spring_depth_atr']),
        theta_spring_volume=float(base['theta_spring_volume']),
        theta_utad_extension_atr=float(base['theta_utad_extension_atr']),
        theta_utad_volume=float(base['theta_utad_volume']),
        theta_sos_strength=float(base['theta_sos_strength']),
        theta_sow_strength=float(base['theta_sow_strength']),
        theta_transition=float(base['theta_transition']),
        validation_tests_min=int(base['validation_tests_min']),
        mtf_weight=float(base['mtf_weight']),
        orderflow_weight=float(base['orderflow_weight']),
        vsa_weight=float(base['vsa_weight']),
        profile_weight=float(base['profile_weight']),
        session_weight=dict(base['session_weight']),
        w_climax=float(weights['w_climax']),
        w_cause=float(weights['w_cause']),
        w_tests=float(weights['w_tests']),
        w_sos_sow=float(weights['w_sos_sow']),
        w_mtf=float(weights['w_mtf']),
        w_confluence=float(weights['w_confluence']),
        tau_manipulation=float(bias['tau_manipulation']),
        tau_transition=float(bias['tau_transition']),
        tau_neutral=float(bias['tau_neutral'])
    )
```

---

## Señales Parametrizadas (DL‑001)

Convenciones
- `vol_rel(x)`: volumen relativo en ventana x.
- `wick_atr(x)`: longitud de wick normalizada por ATR.
- `cause_duration`: duración de rango/cause building.
- `spring_score`, `utad_score`: scores basados en profundidad (ATR), volumen, absorción y tests.
- `sos_score`, `sow_score`: fuerza de signs of strength/weakness (cierre, rango, volumen).
- `mtf_alignment`: confirmación multi-timeframe.
- `orderflow_confluence`, `vsa_confluence`, `profile_confluence`, `fvg_confluence`: señales complementarias.

### 1. Clímax y Stopping Action
- `vol_rel(climax_window) ≥ theta_climax_volume`.
- `wick_atr(climax_bar) ≥ theta_climax_wick`.
- `orderflow_confluence ≥ orderflow_weight` (absorción/iceberg) opcional.
- Resultado: evento `CLIMAX_BUYING` o `CLIMAX_SELLING` con `fade_direction` opuesto.

### 2. Building Cause (Rango)
- `cause_duration ≥ theta_cause_duration`.
- Volumen balanceado dentro del rango; `absorption_rate` en extremos.
- Se etiqueta fase `CAUSE_BUILDUP` y se guarda metadata (rango superior/inferior, volumen acumulado).

### 3. Springs y UTAD
- `spring_score ≥ theta_spring_depth_atr` y `vol_rel(spring_window) ≥ theta_spring_volume`.
- Tests posteriores `tests_count ≥ validation_tests_min` con wicks secantes.
- Para UTAD: `utad_score ≥ theta_utad_extension_atr` + volumen de venta mayor que `theta_utad_volume`.
- Confluencias: `vsa_confluence` (clímax + no supply/demand) y `profile_confluence` en VA edges.

### 4. SOS / SOW
- `sos_score ≥ theta_sos_strength` o `sow_score ≥ theta_sow_strength`.
- Confirmar `mtf_alignment` y `orderflow_confluence` (imbalance a favor).
- Señal `FOLLOW` con dirección BULLISH/BEARISH según caso.

### 5. Transición de Fase
- `transition_score = weighted_sum(w_climax,…,w_confluence)`.
- Si `transition_score ≥ theta_transition` → estado `TRANSITION` (ej. de acumulación a markup).
- Persistencia mínima `validation_tests_min` y `mtf_alignment` obligatoria.

### 6. Divergencias Composite Man
- `price_trend_strength` vs `volume_trend_strength` divergentes.
- `orderflow_confluence` o `fvg_confluence` alertan trampas (ej. spring en FVG + absorción).
- Genera evento `COMPOSITE_DIVERGENCE` con probabilidad proporcional a la divergencia.

### Scoring y Sesgos
- Score final = suma ponderada (`w_climax,…,w_confluence`).
- Bias:
  - `score ≥ tau_manipulation` → `composite_action = FADE` y `composite_signal` según evento dominante.
  - `score ≥ tau_transition` → `composite_action = PROTECT` (mantener flat) si no hay dirección clara.
  - Debajo de `tau_transition` → `composite_action = FOLLOW` si hay SOS/SOW válidos; de lo contrario `NONE`.

---

## Salidas Técnicas

```json
{
  "composite_man": {
    "composite_signal": "SPRING",
    "composite_action": "FADE",
    "confidence": 0.78,
    "manipulation_events": [
      {"type": "SPRING", "probability": 0.82, "fade_direction": "BUY"},
      {"type": "CLIMAX_SELLING", "probability": 0.65, "fade_direction": "BUY"}
    ],
    "details": {
      "range_bounds": {"upper": 27450.5, "lower": 26880.0},
      "tests_count": 3,
      "mtf_alignment": true,
      "orderflow_confluence": 0.71,
      "vsa_climax": true,
      "profile_support": "POC_DEFENSE"
    }
  }
}
```

Payload real se incluye en `institutional_confirmations['composite_man']` dentro de `signals` de `POST /api/run-smart-trade/{symbol}`.

---

## Integración Backend / Frontend

- **Backend**: añadir `composite_man_analyzer.py` con función `analyze_composite_man(params, data, confluences)` y `_evaluate_composite_man` en `SignalQualityAssessor` usando `CompositeManParamProvider`.
- **Endpoint**: `POST /api/run-smart-trade/{symbol}` incorpora la nueva confirmación bajo `signals.institutional_confirmations.composite_man` sin crear rutas nuevas.
- **Frontend**:
  - SmartScalperMetrics / InstitutionalChart deben consumir datos reales (sin `Math.random`).
  - Mostrar `composite_signal`, `composite_action`, `confidence`, eventos y confluencias.
  - Si faltan datos → “No data available”.

---

## Confluencias con Otros Algoritmos

- **Wyckoff**: Composite Man extiende Wyckoff; la fase detectada debe coincidir con `wyckoff_phase`. Contradicciones reducen score.
- **Order Flow (10)**: absorciones, icebergs y defensa de niveles elevan probabilidad de spring/UTAD. Anti‑Manipulation usa consenso dual FADE cuando ambos > umbral.
- **VSA (7)**: clímax/no demand/supply respaldan springs o UTAD; sin confirmación, bajar confidence.
- **Market Profile (8)**: VAH/VAL/POC ayudan a validar springs/UTAD (p.ej. spring en VAL).
- **A/D (11)**: si transición A/D concuerda con Composite Man, subir `w_confluence`.
- **FVG (5)**: spring/UTAD dentro de FVG sin rellenar aumenta alerta de fade.

---

## Integración con Modos

- **Anti-Manipulation**: pesos altos para clímax y UTAD; acción FADE/PROTECT. ModeParamProvider debe mapear `composite_action` a decisiones automáticas.
- **Smart Scalper**: usar springs/UTAD y clímax confirmados como micro-reversals; peso moderado en consenso 3/6 si disponible.
- **Trend Hunter**: usar SOS/SOW como confirmación de continuación tras acumulación/distribución. Ajustar `TrendModeParamProvider` para incluir `composite_signal` en `trend_context`.

---

## UX / UI

- Panel “Algoritmos Avanzados”: mostrar evento principal, acción sugerida, confianza y resumen de confluencias.
- InstitutionalChart: resaltar springs/UTAD/SOS/SOW como anotaciones (sin datos sintéticos).
- Alertas: si `composite_action = FADE`, indicar “Composite Man manipulation detected, fade recommended”.

---

## Pruebas y Métricas

- Casos históricos: springs clásicos (BTC 2020, ETH 2018), UTAD (rally traps), SOS/SOW en tendencias fuertes.
- Métricas: tasa de éxito FADE, falsos positivos, lead time antes de movimiento, precisión transitions.
- Ensayar con bots distintos (Smart Scalper, Trend Hunter, Anti-Manipulation) para validar pesos.

---

## Cumplimiento DL‑001 / DL‑002

- Sin literales en la lógica; todo proviene de `CompositeManParamProvider` y providers de modo.
- No retail indicators; solo metodologías institucionales (Wyckoff, Order Flow, VSA, Profile).
- Frente a aportes incompletos, retornar estado neutral con detalles.

---

## Rollback

Este documento solo actualiza especificación. Para revertir: `git restore docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/12_COMPOSITE_MAN_THEORY_SPEC.md`
