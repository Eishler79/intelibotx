# 06_MARKET_MICROSTRUCTURE_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/06_MARKET_MICROSTRUCTURE.md

Propósito
- Calcular POC/VAH/VAL, forma de perfil y métricas de microestructura (dominant side, va_occupancy) a partir de OHLCV.

Entradas
- OHLCV (≥100), resoluciones por símbolo; opcional L2 futuro.

Salidas
- point_of_control, value_area_high/low, profile_type, dominant_side, va_occupancy; details.

Reglas (resumen)
- Bins por tick/precision del símbolo; VA = 70%; profile_type por distribución; va_occupancy = % últimos N cierres dentro de VA.

Integración
- Servicio dedicado; SQA debe consumirlo, no duplicar cálculo.

Rendimiento/Pruebas
- < 40 ms; validación en símbolos con distintos ticks; estabilidad de POC/VA entre ventanas cercanas.

Implementación (estado actual)
- Cálculo: `backend/services/market_microstructure_analyzer.py`
- Evaluación en SQA: `backend/services/signal_quality_assessor.py:_evaluate_market_microstructure`
- Rango (referencia ALGORITMOS_SPEC SQA): `services/signal_quality_assessor.py:760-926`
- Integración: expuesto en `analysis.microstructure` (POC/VA niveles) y como confirmación institucional.
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`

---

## Modelo Matemático (según código actual)

Parte A — Analyzer (POC/VA)
- Volumen a precio por barra: \(p_i = \text{round}((H_i+L_i+C_i)/3, \text{tick})\); \(\text{vol\_at\_price}[p_i] += V_i\).
- POC: \(\arg\max_p \text{vol\_at\_price}[p]\).
- VA: ordenar precios por volumen desc., acumular hasta 70% del volumen → \([VAL, VAH]\).
- Dominant side: \(\sum V_i\) de velas alcistas vs bajistas con umbral 1.2×.

Parte B — Evaluación en SQA
- Estructura: conteos HH/LL recientes; volumen concentración: ratio de volumen máximo/total en “price buckets” (umbral 0.3 alto, 0.2 medio).
- Order flow proxy: \(\text{bullish\_pressure} = \sum (|C_i-O_i| - 0.5\,w^\uparrow_i)\) para velas alcistas; similar bajista; comparar con factor 1.5.
- Score: \( s = s_\text{estructura} + s_\text{concentración} + s_\text{flow}\) (25/20/25 máximos por componente); bias SMART\_MONEY si \(s\ge 60\), NEUTRAL si \(s\ge 40\).
