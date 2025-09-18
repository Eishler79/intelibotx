# TREND_FOLLOWING_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo, DL‑001)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/TREND_FOLLOWING_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001 (sin literales; parámetros via providers), DL-002, DL-008, GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Núcleo: SMC (BOS/CHoCH), Market Profile (POC/VA), VSA parcial, OB de pullback, Microestructura. Todos los umbrales se parametrizan vía `ModeParamProvider` y `SmcParamProvider`.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Objetivo: fortalecer identificación y explotación de tendencias institucionales manteniendo DL‑001.

Requisitos de implementación
- SMC completo (BOS/CHoCH + invalidaciones + entry zones) con normalización por ATR (`params.atr_period`).
- Market Profile dedicado: migración POC y rechazo/aceptación en VA como filtros (umbrales desde `TrendModeParamProvider`).
- VSA robusto: esfuerzo/resultado; ausencia de oferta/demanda en pullbacks (`params.vsa_thresholds`).
- Gestión de riesgo: trailing progresivo, reducciones parciales en zonas de valor, SL detrás de estructuras clave (`mode_params.risk_model`).

Parametrización DL‑001
- `TrendModeParamProvider` define: `smc_confidence`, `profile_confidence`, `vsa_confidence`, `target_profit`, `stop_loss`, `alignment_confidence`, `triple_weights`, `timeframe_band`, `trend_timeframes`, `trend_risk_params`, `inducement_filters`.
- `SmcParamProvider`, `MarketProfileParamProvider`, `VsaParamProvider` complementan sin literales (ver specs correspondientes).

Contratos/API
- Añadir bloque `trend_context` (p. ej., `bos_level`, `choch_detected`, `poc_migration`, `vsa_strength`) alimentado con datos reales y parámetros declarados.

Pruebas
- Casos: tendencias limpias, reversiones CHoCH, pullbacks a OB con continuación; falso breakout.
- Validar parámetros por estrategia (Smart Scalper vs Trend Hunter) sin hardcodes.

---

## Fase 3 — Potencialización (Roadmap)
- Order Flow v1 para confirmar breakouts reales y evitar traps.
- Ejecución: balance entre Implementation Shortfall y participación (POV adaptativo).


---

## DL‑001 — Notas de cumplimiento
- Ningún target/stop/umbral fijo en la lógica de modo; todo proviene de providers.
- UI no debe simular datos; mostrar “No data” si faltan parámetros.

---

## P2 Rollback
Este documento afecta solo especificación. Para revertir: `git restore docs/TECHNICAL_SPECS/MODES_SPECS/TREND_FOLLOWING_MODE_SPEC.md`
