# NEWS_SENTIMENT_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/NEWS_SENTIMENT_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001, DL-002, DL-008, GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Núcleo: Central Bank Comms + Options Flow; categorización impacto.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Requisitos de implementación
- Scoring mejorado: credibilidad de fuente, “surprise indices”, contexto de mercado.
- Consenso news + options; confluencias con Market Profile (niveles imán) y VSA post‑evento.
- Gestión de riesgo: ventanas temporales, stops iniciales amplios y trailing rápido; límites de exposición por evento.

Contratos/API
- Bloque `news_context` (evento, impacto esperado, ventana, confirmación options).

Pruebas
- Casos: FOMC, CPI sorpresa, anuncios regulatorios; validar ventanas/TP/SL.

---

## Fase 3 — Potencialización (Roadmap)
- Feeds premium y baja latencia; ejecución adaptativa (stealth/fragmentación) y circuit‑breakers para “headline whipsaws”.

