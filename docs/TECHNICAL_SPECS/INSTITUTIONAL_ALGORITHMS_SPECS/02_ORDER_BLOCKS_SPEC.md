# 02_ORDER_BLOCKS_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/02_ORDER_BLOCKS.md

Propósito
- Identificar bloques institucionales válidos, su retest e invalidación; priorizar con confluencias (FVG/POC).

Entradas
- OHLCV (≥60), ATR(14), volumen relativo; POC/VA opcional.

Salidas
- order_blocks (lista con low/high/strength/age)
- dominant_direction (BULLISH_BLOCKS/BEARISH_BLOCKS/MIXED)
- confidence [0..1]; details (retested/invalidated, confluencias)

Reglas (resumen)
- OB: última vela contraria antes de impulso con displacement ≥ 1×ATR y volumen ≥ 1.5×media20.
- Retest válido: wick dentro de zona ±δ (δ=0.15×ATR) sin cierre neto; invalidación: cierre más allá de δ opuesto.
- Confluencias: OB cerca FVG o POC/VA edge suma prioridad.

Integración
- SignalQualityAssessor._evaluate_order_blocks; peso alto en Scalping y Trend (pullbacks).

Rendimiento/Pruebas
- < 50 ms; casos de retest/invalidación y confluencias; compatibilidad con distintos símbolos.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_order_blocks`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:245-360`
- Integración: disponible en `analysis.institutional_confirmations.order_blocks`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Variables
- \(O_t, H_t, L_t, C_t, V_t\); precio actual \(P = C_n\); medias \(\overline{V}^{(5)}, \overline{V}^{(10)}\).

Detección de bloques
- Bullish OB en \(t=i\) si:
  - \(C_i < O_i\) (vela bajista),
  - \(V_i > 1.2\,\overline{V}^{(5)}\),
  - \(\min(C_{i+1},C_{i+2},C_{i+3}) > H_i\) (precio no volvió en 3 velas).
  - Zona: \([\min(O_i,C_i),\,\max(O_i,C_i)]\), nivel de referencia \(H_i\).
- Bearish OB simétrico con \(C_i > O_i\), \(V_i > 1.2\,\overline{V}^{(5)}\), y \(\max(C_{i+1},C_{i+2},C_{i+3}) < L_i\).

Relevancia respecto a \(P\)
- Bullish relevante si \(H_i \le 1.02\,P\); Bearish relevante si \(L_i \ge 0.98\,P\).

Fuerza del bloque
\[ \text{strength}_i = \begin{cases} \frac{V_i}{\overline{V}^{(10)}} & i\ge 10 \\ 1 & i<10\end{cases} \]

Puntuación
- Bullish: \( s_\text{bull} = \min\{30,\ 15\cdot \text{strength}\}\)
- Bearish: \( s_\text{bear} = \min\{25,\ 12\cdot \text{strength}\}\)
- Dominancia: si \(s_\text{bull} > s_\text{bear} + 10\) → dirección BULLISH\_BLOCKS (y viceversa); empate → MIXED.

Score final
\[ s = \max(s_\text{bull}, s_\text{bear}) \]

Observación
- El código actual no normaliza por ATR ni computa retest/invalidación explícitos; se sugiere en Fase 2.
