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
