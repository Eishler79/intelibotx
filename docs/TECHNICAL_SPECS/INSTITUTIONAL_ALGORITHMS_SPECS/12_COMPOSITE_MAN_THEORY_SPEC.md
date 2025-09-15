# 12_COMPOSITE_MAN_THEORY_SPEC.md — Especificación Técnica

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/12_COMPOSITE_MAN_THEORY.md

Propósito
- Modelar la manipulación profesional vía fases Wyckoff avanzadas (stopping, building cause, spring/UTAD, SOS/SOW) para anticipar trampas y fades.

Entradas
- OHLCV (≥120), ATR(14), volumen relativo; MTF opcional.

Salidas
- manipulation_events (tipo, probabilidad, fade_direction), composite_action, confidence; details.

Reglas (resumen)
- Detección de clímax y tests; spring/UTAD con condiciones de wick/ATR/volumen; SOS/SOW en salida de rango; probabilidad compuesta.

Integración
- Módulo Composite Man; consenso dual con Order Flow en Anti‑Manipulation.

Rendimiento/Pruebas
- < 60 ms; casos históricos con springs/UTAD y SOS/SOW; validación con VSA/Profile.

Implementación (plan)
- Archivo sugerido: `backend/services/composite_man_analyzer.py`
- Consumo: Anti‑Manipulation (consenso dual con Order Flow) y señales de fades/avoid.
- SPEC_REF maestro: `docs/TECHNICAL_SPECS/ALGORITMOS_SPEC.md`
