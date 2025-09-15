# 03_LIQUIDITY_GRABS_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/03_LIQUIDITY_GRABS.md

Propósito
- Detectar barridos de liquidez con profundidad relativa, reversión y clusters de stops.

Entradas
- OHLCV (≥50), ATR(14), volumen relativo; swings previos (N=20–30).

Salidas
- grab_depth_up/down (ATR), cluster_size, expected_direction; confidence; details.

Reglas (resumen)
- Depth ≥ 0.2×ATR sobre swing previo + reversión en 1–3 velas + volumen ≥ 1.2×.
- cluster_size: conteo de swings previos; depth/cluster/reversión ponderan la confianza.

Integración
- SignalQualityAssessor._evaluate_liquidity_grabs; alto peso en Anti‑Manipulation/Scalping.

Rendimiento/Pruebas
- < 40 ms; casos de up/down sweeps y secuencias; validación con Stop Hunt y Profile.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_liquidity_grabs`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:362-488`
- Integración: disponible en `analysis.institutional_confirmations.liquidity_grabs`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Variables
- \(H_t, L_t, C_t, V_t\); ventana previa \(N=10\); medias \(\overline{V}^{(5)}\).

Definiciones
- \(\text{local\_high}_i = \max(H_{i-9..i})\), \(\text{local\_low}_i = \min(L_{i-9..i})\).

Detección
- “Buy‑side grab” reciente: \(H_i > 1.001\cdot \text{local\_high}_i\) y \(V_i > 1.2\,\overline{V}^{(5)}\) → \(\text{recent\_buy\_grabs}++\).
- “Sell‑side grab” reciente: \(L_i < 0.999\cdot \text{local\_low}_i\) y \(V_i > 1.2\,\overline{V}^{(5)}\) → \(\text{recent\_sell\_grabs}++\).
- Conteos totales históricos (similares con umbrales 1.001/0.999) → \(\text{buy\_side\_grabs}, \text{sell\_side\_grabs}\).

Puntuación
- \(\text{total} = \text{buy} + \text{sell}\), \(\text{recent} = \text{recent\_buy} + \text{recent\_sell}\).
- Si \(\text{total} \ge 3\): \(s_1 = 25 + \min(15, 3\cdot \text{total})\); si \(\text{total} \ge 1\): \(s_1 = 15 + 5\cdot \text{total}\); si no, \(s_1 = 10\).
- Si \(\text{recent} > 0\): \(s_2 = 15 + 8\cdot \text{recent}\); si no, \(s_2 = 5\).
- \( s = s_1 + s_2\), truncado a \([0,100]\).

Dirección esperada
- Si \(\text{recent\_buy} > \text{recent\_sell}\): BEARISH\_LIQUIDITY\_GRAB (esperar bajada). Inverso para alcista; igual → MIXED.
