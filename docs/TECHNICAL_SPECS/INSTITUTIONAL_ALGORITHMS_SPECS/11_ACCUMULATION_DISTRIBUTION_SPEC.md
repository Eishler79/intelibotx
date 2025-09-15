# 11_ACCUMULATION_DISTRIBUTION_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/11_ACCUMULATION_DISTRIBUTION.md

Propósito
- Estimar acumulación/distribución institucional combinando rango, volumen y microestructura con validaciones MTF.

Entradas
- OHLCV (≥80); volumen relativo; microestructura; ATR.

Salidas
- ad_state (ACCUMULATION/DISTRIBUTION/NEUTRAL), score, confidence; details.

Reglas (resumen)
- Señales de absorción (rango lateral + volumen/filtros) y venta discreta; validaciones con Wyckoff/VSA/Profile.

Integración
- Módulo A/D; peso en Anti‑Manipulation y Trend.

Rendimiento/Pruebas
- < 50 ms; casos etiquetados; consistencia con transiciones Wyckoff.

Implementación (plan)
- Archivo sugerido: `backend/services/accumulation_distribution_analyzer.py`
- Consumo: SQA como estado A/D, soporte fuerte en Trend y Anti‑Manip.
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
