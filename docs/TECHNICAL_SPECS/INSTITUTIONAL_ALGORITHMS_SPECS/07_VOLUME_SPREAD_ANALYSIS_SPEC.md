# 07_VOLUME_SPREAD_ANALYSIS_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/07_VOLUME_SPREAD_ANALYSIS.md

Propósito
- Confirmar fortaleza/debilidad institucional por relación Volumen–Spread–Cierre (climax, no demand/no supply, effort/result).

Entradas
- OHLCV (≥60), medias de volumen; MTF opcional.

Salidas
- vsa_type (NO_DEMAND/NO_SUPPLY/CLIMAX/PROFESSIONAL/RETAIL), strength, confidence; details.

Reglas (resumen)
- Clasificar por volumen relativo, spread relativo y posición de cierre; effort vs result en ventanas recientes; clímax por umbrales de extremos.

Integración
- Módulo VSA; consumo por SQA como confirmación tras detectores primarios.

Rendimiento/Pruebas
- < 30 ms; casos etiquetados de climax y no supply/demand; consistencia con otras señales.

Implementación (plan)
- Archivo: `backend/services/volume_spread_analyzer.py` (crear)
- Integración (referencia ALGORITMOS_SPEC):
  - Import en `backend/routes/bots.py`
  - Instanciación del analizador y uso en el flujo de análisis institucional
- Consumo en SQA: como confirmación de señales primarias (Scalping/Trend/Anti‑Manip)
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
