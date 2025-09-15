# 01_WYCKOFF_METHOD_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/01_WYCKOFF_METHOD.md

Propósito
- Detectar fases y patrones clave (PS/SC/AR/ST, Spring/UTAD, SOS/SOW) para anticipar manipulación y timing institucional.

Entradas
- OHLCV (≥120 velas), ATR(14), volumen relativo; MTF opcional (5m/15m).

Salidas
- wyckoff_phase (ACCUMULATION/DISTRIBUTION/MARKUP/MARKDOWN)
- flags: stopping_action, is_spring, is_utad
- confidence [0..1]; details (niveles rango, ATR, volumen relativo)

Precondiciones
- Min 120 velas; volumen disponible; ATR válido.

Reglas (resumen)
- Rango: min/max últimos 120; altura normalizada por ATR.
- Stopping action: volumen relativo ≥ 2× media 20 + rango ≥ 2× ATR.
- Spring/UTAD: ruptura leve del rango + cierre dentro + wick/ATR relevante + volumen alto.
- MTF: coherencia 5m/15m opcional eleva confianza.

Integración
- SignalQualityAssessor._evaluate_wyckoff_analysis: aplicar reglas; devolver InstitutionalConfirmation con score y bias.
- Pesos por modo: Scalping (medio), Anti‑Manipulation (alto cuando spring/UTAD/stopping).

Rendimiento
- O(lookback); sin llamadas externas; < 50 ms por símbolo.

Pruebas/Validación
- Casos etiquetados de springs/UTAD y clímax; evaluar score/bias y consistencia con VSA/Profile.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_wyckoff_analysis`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:138-243`
- Integración: consumido por `POST /api/run-smart-trade/{symbol}` y visible en `analysis.*`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Variables
- Secuencias OHLCV: \(O_t, H_t, L_t, C_t, V_t\), \(t=1..n\), con \(n\ge 60\).
- Ventanas: \(\overline{C}^{(5)} = \frac{1}{5}\sum_{k=0}^{4} C_{n-k}\); \(\overline{C}^{(5@20)} = \frac{1}{5}\sum_{k=15}^{19} C_{n-k}\). Análogamente para \(V\).

Componentes de puntuación
1) Fase Wyckoff (market_structure.wyckoff_phase):
\[
 s_\text{phase} = \begin{cases}
 35 & \text{si phase} \in \{\text{ACCUMULATION},\text{MARKUP}\}\\
 25 & \text{si phase} \in \{\text{DISTRIBUTION},\text{MARKDOWN}\}\\
 15 & \text{en otro caso}
 \end{cases}
\]

2) Divergencia precio–volumen (ventanas 5 vs 20):
\[
 r_p = \frac{\overline{C}^{(5)} - \overline{C}^{(5@20)}}{\overline{C}^{(5@20)}},\quad
 r_v = \frac{\overline{V}^{(5)} - \overline{V}^{(5@20)}}{\overline{V}^{(5@20)}}
\]
\[
 s_\text{div} = \begin{cases}
 30 & r_p < -0.02\ \wedge\ r_v > 0.10\\
 25 & r_p > 0.02\ \wedge\ r_v < -0.10\\
 15 & \text{datos suficientes sin condiciones}\\
 10 & \text{datos insuficientes}
 \end{cases}
\]

Score total y sesgo
\[ s = s_\text{phase} + s_\text{div} \in [0,100] \]
\[
 \text{bias} = \begin{cases}
 \text{SMART\_MONEY} & s \ge 50\\
 \text{INSTITUTIONAL\_NEUTRAL} & 30 \le s < 50\\
 \text{RETAIL\_TRAP} & s < 30
 \end{cases}
\]

Observaciones
- El código actual aplica umbrales fijos (±2% precio, ±10% volumen). La Fase 2 propone normalización por ATR y detección explícita de Spring/UTAD.
