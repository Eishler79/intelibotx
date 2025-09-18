# BACKLOG.md - Roadmap de Implementación
> **Propósito:** Lista priorizada de acciones pendientes alineadas con el plan F0–F5.

---

## 🚨 Prioridad 0 · Fase 0 — Baseline UI/UX (inmediato)
- **Limpiar datos simulados en InstitutionalChart y SmartScalperMetrics.**  
  `SPEC_REF:` docs/TECHNICAL_SPECS/MODE_SELECTION_SPEC.md, DL-001  
  `Resultado:` “No data” vs datos falsos hasta que lleguen datos reales.
- **Auditar componentes front que dependan de `Math.random()` / fallbacks.**  
  Eliminar simulaciones y dejar hooks preparados para datos reales.
- **Verificar endpoints actuales (`/api/run-smart-trade/{symbol}`) y registrar payload real.**  
  Será la base para fases posteriores.

---

## 🔥 Prioridad 1 · Fase 1 — Parametrización Algoritmos Existentes (01–06)
- **Crear ParamProviders iniciales** para Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, FVG, Microestructura (leer `BotConfig`, `recent_stats`, `symbol_meta`).
- **Refactorizar `SignalQualityAssessor`** para consumir dichos providers (sin cambiar comportamiento macro inicialmente).
- **Exponer detalles adicionales** requeridos en cada spec (e.g., `wyckoff_phase`, `order_block_retests`).
- **Pruebas unitarias/manuales** para validar parámetros por estrategia (Smart Scalper vs Trend Hunter).

---

## 🔥 Prioridad 2 · Fase 2 — Implementación Algoritmos 07–12
- **Desarrollar evaluadores** para VSA, Market Profile, SMC, Order Flow, Accumulation/Distribution, Composite Man siguiendo sus SPEC (`ParamProvider` + `InstitutionalConfirmation`).
- **Integrar en `SignalQualityAssessor`** con pesos iniciales definidos en la documentación.
- **Actualizar `/api/run-smart-trade/{symbol}`** para devolver las nuevas confirmaciones (`institutional_confirmations.*`).
- **Validar con datasets etiquetados** (springs, UTAD, SOS/SOW, FVG, bloques, etc.).

---

## 🔥 Prioridad 3 · Fase 3 — ModeParamProvider + Selector Heurístico
- **Implementar `ModeParamProvider`** para Smart Scalper, Trend Hunter y Anti-Manipulation (pesos, targets, thresholds, consensus N/6).
- **Construir `IntelligentModeSelector` heurístico** (sin ML) usando los parámetros anteriores.  
  Integrarlo en el flujo de `/api/run-smart-trade/{symbol}` y registrar `mode_decision` en la respuesta.
- **Alinear servicios** (`UserTradingService`, etc.) para que usen los parámetros del modo activo.

---

## 🔥 Prioridad 4 · Fase 4 — UI/Telemetría y Packaging
- **Renderizar datos reales** en SmartScalperMetrics / InstitutionalChart (nuevas confirmaciones, modo actual, acciones FADE/FOLLOW).
- **Añadir telemetría básica** (logs, métricas, tiempos de respuesta) para futuras capas ML.
- **Documentar parámetros congelados** y exponerlos en un repositorio de configuración (JSON/YAML).

---

## 🔥 Prioridad 5 · Fase 5 — Validación End-to-End
- **Simulaciones/backtests** con todos los algoritmos y modos activados.
- **Pruebas de latencia** en Railway/Vercel con datos reales.
- **Check-list de despliegue testnet**: validaciones DL-001/002/076 + rollback.
- **Preparar datasets/telemetría** para la etapa ML (modo selector avanzado, aprendizaje continuo).

---

*Actualizado: 2025-09-17*  
*Estado del proyecto → MASTER_PLAN.md*  
*Decisiones formales → DECISION_LOG.md*
