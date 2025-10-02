# TREND_HUNTER_ALGO_REFINEMENTS.md — Especificaciones de Implementación (Estándar Definitivo)

> Objetivo: Elevar la robustez del modo Trend Hunter (Trend Following) bajo la Filosofía Core (anti‑manipulación, institucional‑only) con SMC (BOS/CHoCH) + Market Profile dedicado + VSA como confirmación. Documento de implementación definitiva: firmas/contratos de parámetros, criterios de aceptación y SPEC_REF. Cumple DL‑001/002/008 + GUARDRAILS P1–P9. No cambia endpoints; solo especifica integración.

---

## 🧭 Alcance y Compliance

- Filosofía Core: Bot adaptativo institucional; evitar retail; protección de capital.
- Guardrails: P1–P9; DL‑001 (no literales), DL‑002 (institucional only), DL‑008 (auth).
- Sin cambios de DB ni endpoints; reuso `POST /api/run-smart-trade/{symbol}`.

SPEC_REF:
- Modo: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/TREND_FOLLOWING_MODE.md
- SMC: docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/09_SMART_MONEY_CONCEPTS_SPEC.md
- Market Profile: docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/08_MARKET_PROFILE_SPEC.md
- VSA: docs/TECHNICAL_SPECS/INSTITUTIONAL_ALGORITHMS_SPECS/07_VOLUME_SPREAD_ANALYSIS_SPEC.md

---

## 📌 Principios Transversales (modo Trend Hunter)

- Señal core SMC: BOS confirmado + CHoCH coherente (no inducement) como ancla direccional.
- Market Profile dedicado: POC breakout/migration + VAH/VAL tests para validar tendencia.
- VSA confirmación: actividad profesional y Effort vs Result a favor de la dirección.
- Confluencias: OB/FVG como timing de entrada en pullback post‑BOS.
- Multi‑timeframe: confirmar 15m/1h/4h por provider de modo (sin literales).
- Trazabilidad: detallar niveles (break_level, poc_level, vah/val, confluencias, métricas VSA) en payload.

---

## 🔌 Parametrización DL‑001 (Providers)

- SmcParamProvider (ver SMC spec): atr_period, windows, thresholds, weights y confluencias externas.
- ModeParamProvider (Trend Following):
  - get_triple_weights(), get_alignment_confidence(), get_timeframe_band()
  - get_target_stop(), get_vsa_confidence(), get_profile_confidence()
  - get_trend_timeframes(), get_trend_risk_params(), get_inducement_filters()
- MarketProfileParamProvider (dedicado):
  - get_poc_breakout_window(), get_va_test_rules(), get_profile_shape_weights()

Todos los valores se derivan de `BotConfig` (risk_profile, TP/SL, leverage, cooldown, interval) + `recent_stats` (ATR, volumen) + `symbol_meta` (tick/step). Cero números en lógica.

---

## 🧠 Núcleo Algorítmico (resumen)

1) SMC BOS/CHoCH (ver SMC spec)
- BOS: cierre + confirmación externa (periods/cierre/volumen) y filtro inducement (Liquidity Grabs cerca del break).
- CHoCH: cambio de sesgo coherente con Wyckoff/VSA (penalizar contradicción).

2) Market Profile Dedicado
- POC breakout válido: migración del POC a favor de la tendencia y retest con rechazo (reglas por provider).
- VA tests: rechazo/aceptación en VAH/VAL con ocupación de VA (va_occupancy) congruente.
- Profile shape: P/b/D pondera confianza de tendencia.

3) VSA Confirmación
- Professional Activity y Effort vs Result coherentes con la dirección del BOS.
- No Demand/No Supply atenúan señales débiles.

4) Confluencias para Entrada
- Pullback post‑BOS a OB válido, FVG en zona y microestructura a favor.

---

## 🎯 Criterios de Aceptación

- Devuelve en `institutional_confirmations.smart_money_concepts` (cuando se implemente): `smc_signal`, `break_level`, `confirmation_strength`, `entry_zone`, `structure_details`, `confluences`.
- Market Profile (dedicado) aporta: `poc_level`, `poc_breakout_valid`, `va_test`, `profile_type`, `va_occupancy`.
- VSA aporta: `dominant_signal`, `score`, `bias` (institucional/neutro) y métricas básicas.
- Triple confirmación computa con `mode_params.triple_weights` y `alignment_confidence`.

---

## 🔄 Integración (sin cambios de endpoints)

- Backend: reusar `POST /api/run-smart-trade/{symbol}`; añadir confirmaciones en `signals.institutional_confirmations` (SMC/Profile/VSA) según providers.
- Frontend: UI no simula; muestra valores reales y oculta si faltan; no defaults ni `Math.random`.

---

## 🛡️ Confluencias con 01–08 (blindaje)

- Wyckoff: penalizar BOS si contradice fase; boost si Spring/UTAD confirmado + VSA.
- Order Blocks: validar pullback/inval. δ(ATR); confluencia sube confianza.
- Liquidity Grabs: inducement filter cerca del break; evita falsas rupturas.
- Stop Hunting: CHoCH tras hunting con VSA clímax = fuerte giro.
- FVG: en zona de entrada aumenta score; rellenos parciales anotados.
- Microestructura: migración POC y VA congruentes obligatorios para confianza alta.
- Market Profile (dedicado): shape y VA tests ponderan.

Todos los pesos provienen de providers.

---

## 🧪 Performance/Pruebas (conceptual)

- Pruebas en símbolos con tendencia sostenida; validar estabilidad del break y retests.
- Métricas objetivo (configurables por modo): win_rate, PF, duración media, DD máximo.

---

## 🧯 Rollback Plan (P2)

- Este documento afecta solo especificación. Si la integración futura falla, restaurar con:
`git restore docs/TECHNICAL_SPECS/MODE_ALGORITHM_REFINEMENTS/TREND_HUNTER_ALGO_REFINEMENTS.md`

---

Autor: InteliBotX (Refinamientos Modo Trend Hunter)

