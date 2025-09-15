# 04_STOP_HUNTING_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/04_STOP_HUNTING.md

Propósito
- Detectar cacerías de stops con wicks normalizados por ATR, reversión y contexto de valor.

Entradas
- OHLCV (≥30), ATR(14), volumen; VAH/VAL opcional.

Salidas
- wick_up/dn_ratio (ATR), reversal flags, at_value_edge; confidence; details.

Reglas (resumen)
- wick/ATR > umbral y reversión confirmada; cercanía a VA edges suma confianza.

Integración
- SignalQualityAssessor._evaluate_stop_hunting; relevante en Anti‑Manipulation/Scalping/Volatility.

Rendimiento/Pruebas
- < 30 ms; casos de hunts en bordes VA y falsos hunts en alta vol.

Implementación (estado actual)
- Código: `backend/services/signal_quality_assessor.py:_evaluate_stop_hunting`
- Rango (referencia ALGORITMOS_SPEC): `services/signal_quality_assessor.py:490-627`
- Integración: disponible en `analysis.institutional_confirmations.stop_hunting`
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Variables
- \(O_t, H_t, L_t, C_t, V_t\); cuerpo \(b_i = |C_i - O_i|\); mechas \(w^\uparrow_i = H_i - \max(O_i, C_i)\), \(w^\downarrow_i = \min(O_i, C_i) - L_i\).

Detección patrón base
- Hunt alcista en \(i\): \(w^\uparrow_i > 2\,b_i\), \(H_i > \max(H_{i-5..i-1})\), \(V_i > 1.5\,\overline{V}^{(3)}\), y \(C_{i+1} < 0.98\,C_i\).
- Hunt bajista simétrico: \(w^\downarrow_i > 2\,b_i\), \(L_i < \min(L_{i-5..i-1})\), \(V_i > 1.5\,\overline{V}^{(3)}\), y \(C_{i+1} > 1.02\,C_i\).

Conteos recientes
- En las últimas 10 velas: condiciones relajadas \(w > 1.5\,b\) y nuevos extremos → \(\text{recent\_up/down}\).

Puntuación
- \(\text{total} = \text{up} + \text{down}\), \(\text{recent} = \text{recent\_up} + \text{recent\_down}\).
- Si \(\text{total} \ge 2\): \(s_1 = 20 + \min(20, 5\cdot \text{total})\); si \(\text{total} \ge 1\): \(s_1 = 15 + 8\cdot \text{total}\); si no, \(s_1 = 8\).
- Si \(\text{recent} > 0\): \(s_2 = 15 + 10\cdot \text{recent}\); si no, \(s_2 = 5\).
- \( s = s_1 + s_2\), truncado a \([0,100]\).

Dirección implícita
- Si \(\text{recent\_down} > \text{recent\_up}\): BULLISH\_SETUP (limpieza de ventas); si inverso: BEARISH\_SETUP; empate: MIXED.
