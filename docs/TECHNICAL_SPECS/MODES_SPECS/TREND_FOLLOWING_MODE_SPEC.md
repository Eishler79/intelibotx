# TREND_FOLLOWING_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/TREND_FOLLOWING_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001, DL-002, DL-008, GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Núcleo: SMC (BOS/CHoCH), Market Profile (POC/VA), VSA parcial, OB de pullback, Microestructura.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Objetivo: fortalecer identificación y explotación de tendencias institucionales.

Requisitos de implementación
- SMC completo (BOS/CHoCH + invalidaciones + entry zones) con normalización por ATR.
- Market Profile dedicado: migración POC y rechazo/aceptación en VA como filtros de continuación.
- VSA robusto: esfuerzo/resultado; ausencia de oferta/demanda en pullbacks.
- Gestión de riesgo: trailing progresivo, reducciones parciales en zonas de valor, SL detrás de estructuras clave.

Contratos/API
- Añadir bloque `trend_context` (p. ej., `bos_level`, `choch_detected`, `poc_migration`, `vsa_strength`).

Pruebas
- Casos: tendencias limpias, reversiones CHoCH, pullbacks a OB con continuación; falso breakout.

---

## Fase 3 — Potencialización (Roadmap)
- Order Flow v1 para confirmar breakouts reales y evitar traps.
- Ejecución: balance entre Implementation Shortfall y participación (POV adaptativo).

