# ANTI_MANIPULATION_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/ANTI_MANIPULATION_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001, DL-002, DL-008, GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Detectores activos: Stop Hunting, Liquidity Grabs, Wyckoff básico, Microestructura (proxies).
- Política: priorizar protección (FADE/FLAT), minimizar exposición y tiempo en mercado.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Objetivo: robustecer detección de manipulación real y actuar en consecuencia.

Requisitos de implementación
- Detectores críticos a integrar:
  - Composite Man avanzado (clímax/tests/spring/UTAD): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/12_COMPOSITE_MAN_THEORY.md
  - Institutional Order Flow (v1 con proxies disciplinados; L2 cuando disponible): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/10_INSTITUTIONAL_ORDER_FLOW.md
  - VSA (climax/no demand/supply/efecto): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/07_VOLUME_SPREAD_ANALYSIS.md
  - A/D Avanzado (transiciones de fase): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/11_ACCUMULATION_DISTRIBUTION.md
- Consenso dual: Composite Man + Order Flow con umbrales altos para acción FADE; nivel medio → PROTECT_CAPITAL (FLAT/evitar nuevas posiciones).
- Confluencias con Market Profile (VA edges) y Stop Hunts/Liquidity: priorizar fades seguros.
- Gestión de riesgo estricta: tamaño reducido, stops ceñidos, capturas parciales rápidas.

Contratos/API
- Exponer en `analysis` un bloque `protection_consensus` con fuentes, confianza y acción sugerida (FADE/FLAT).

Rendimiento y seguridad
- Mismo budget de latencia; sin simulaciones en PRD; transparencia “proxy” si no hay L2.

Pruebas
- Casos: múltiples falsos breakouts, secuencias de hunts, clímax de volumen y absorción, defensa de VA. Validar acciones FADE/FLAT.

---

## Fase 3 — Potencialización (Roadmap)
- Conectar Depth WS (L2) para detección de icebergs/blocks y desequilibrios persistentes.
- Ejecución táctica (stealth/fragmentación) y circuit‑breakers de manipulación.

---

## Métricas y Monitoreo
- Manipulation risk vs activaciones del modo; ratio FADE exitoso; protección capital (DD reducido) y TTP bajo.

