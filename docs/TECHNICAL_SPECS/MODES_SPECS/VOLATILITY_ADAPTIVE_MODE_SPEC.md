# VOLATILITY_ADAPTIVE_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/VOLATILITY_ADAPTIVE_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001, DL-002, DL-008, GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Núcleo: VSA Volatility + Market Profile Adaptive; flash events; clustering.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Requisitos de implementación
- ATR‑normalización de objetivos y SL; time‑boxing por régimen; tamaño de posición adaptable.
- Confluencias con migración POC y microestructura; gating estricto para evitar overtrading.

Contratos/API
- Bloque `volatility_context` (cluster pattern, expected_duration, regime bias).

Pruebas
- Casos: flash crash/pump, períodos de alta persistencia de vol, mean reversion; validar SL/TP adaptativos.

---

## Fase 3 — Potencialización (Roadmap)
- Order Flow v1 en extremos; ejecución adaptativa (stealth/POV) y selector de régimen (HMM/GARCH).

