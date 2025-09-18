# SCALPING_MODE_SPEC.md — Implementación por Fases (Estándar Definitivo, DL‑001)

SPEC_REF:
- Concepto: docs/INTELLIGENT_TRADING/OPERATIONAL_MODES/SCALPING_MODE.md#fases-de-evolución
- Núcleo filosófico: docs/INTELLIGENT_TRADING/CORE_PHILOSOPHY.md
- Selección de modos: docs/INTELLIGENT_TRADING/MODE_SELECTION_CONCEPT.md

Cumplimiento: DL-001 (datos reales), DL-002 (solo institucional), DL-008 (auth), GUARDRAILS P1–P9.

---

## Fase 1 — Implementación Actual (Baseline)
- Detectores activos: Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, FVG, Microestructura.
- Orquestación: `POST /api/run-smart-trade/{symbol}`; análisis institucional y retorno de métricas; UI “Indicadores Avanzados”.
- Requisitos de datos: OHLCV ≥ 100 velas; volumen; sin simulación en PRD.
- Aceptación: respuesta < 1.2 s; contratos API existentes intactos; logs y errores centralizados.

---

## Fase 2 — Refinamiento (Obligatorio para PRD)

Objetivo: elevar la precisión de entrada, reducir falsos positivos y exponer robustez.

Requisitos de implementación
- Añadir detectores de confirmación:
  - VSA (Tom Williams): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/07_VOLUME_SPREAD_ANALYSIS.md
  - Market Profile dedicado (POC/VAH/VAL + profile shape): SPEC_REF docs/INTELLIGENT_TRADING/INSTITUTIONAL_ALGORITHMS/08_MARKET_PROFILE.md
- Normalización por volatilidad: todas las reglas de profundidad, wicks, displacements y distancias usan ATR relativo.
- Confluencias explícitas: OB + FVG + POC/VA edges elevan prioridad; registrar flags en detalles.
- Consenso y visibilidad:
  - Exponer `analysis.institutional_high_conf_count` y `analysis.consensus_3of6` en la API.
  - UI muestra badge “3/6 OK” y razones principales.
- Gestión de riesgo y salidas inteligentes (testnet/paper inicialmente):
  - Position sizing adaptativo por ATR y confianza.
  - TP parcial en confluencias; trailing dinámico; SL adaptativo por volatilidad/estructura.

Parametrización DL‑001 (provider del modo)
- Ningún target/stop/umbral fijo en lógica del modo; todo proviene de un `ScalpingModeParamProvider`.
- Parámetros mínimos requeridos:
  - get_algorithm_confidences(): confidencias por algoritmo (wyckoff/ob/liq/stop/fvg/micro)
  - get_target_stop(): `target_profit`, `stop_loss` para el modo
  - get_consensus_params(): `min_signal_confidence`, `min_strong_signals`, `consensus_weights`
  - get_micro_thresholds(): `imbalance_threshold` y ajustes por perfil
  - get_timeframes(), get_risk_params(): marcos temporales y límites de riesgo (sin literales)
  - get_telemetry_flags(): activación/umbral de `consensus_3of6` y high‑confidence reporting

Contratos/API
- Campos nuevos en `analysis.*` (conteo de alta confianza, boolean de consenso, bloque `execution_advice` informativo). No eliminar campos existentes.

Rendimiento y seguridad
- Tiempo de respuesta HTTP < 1.2 s con 100 velas; uso de CPU estable.
- No introducir simulaciones; si proveedor falla → error claro y estados de “degradado”.

Pruebas (manuales y de contrato)
- Casos: post‑hunt reversals, retest OB válidos/invalidaciones, FVG partial/full fill, VSA climax/no demand.
- Verificar con símbolos volátiles y normales; validar latencia y shape de respuesta.

---

## Fase 3 — Potencialización (Roadmap)
- Order Flow L2 (icebergs/blocks) como filtro adicional.
- Ejecución adaptativa (TWAP/VWAP/POV) y medición de slippage/impact.
- Selector de modos con clasificación de régimen y aprendizaje de performance.

---

## Métricas y Monitoreo
- Win rate, Profit Factor, Time‑to‑Profit, Drawdown diario; falsos positivos evitados; conteo de confluencias por trade.

---

## Riesgos y Mitigación
- Sobreajuste umbrales: usar validación cruzada y ajustes por símbolo.
- Latencia adicional: precalcular/compartir cálculos (p. ej., Market Profile) por símbolo.
---

## DL‑001 — Notas de cumplimiento
- Eliminar literales en documentación de lógica (ejemplos pueden mostrar valores, pero la implementación debe obtenerlos del provider).
- UI/UX no puede simular datos; si falten parámetros/datos, mostrar “No data”.

---

## P2 Rollback
Este documento afecta solo especificación. Para revertir cambios: `git restore docs/TECHNICAL_SPECS/MODES_SPECS/SCALPING_MODE_SPEC.md`
