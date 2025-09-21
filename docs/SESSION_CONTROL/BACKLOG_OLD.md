# BACKLOG.md - Roadmap de Implementación
> **Propósito:** Lista priorizada de acciones pendientes alineadas con el plan F0–F5.

---

## ✅ Prioridad 0 · Fase 0 — Baseline UI/UX (cerrado 2025-09-18)
- ✅ InstitutionalChart y SmartScalperMetrics solo muestran datos reales; fallback UI = “No data” confirmado.
- ✅ Componentes auditados sin `Math.random()`/fallbacks en flujo de trading.
- ✅ Payload real de `/api/run-smart-trade/{symbol}` documentado como baseline para fases siguientes.

---

## ✅ Prioridad 1 · Fase 1 — Parametrización Algoritmos Existentes (cerrado 2025-09-18)
- ✅ ParamProviders 01–06 operativos leyendo `BotConfig` + estadísticas recientes durante ejecución.
- ✅ `SignalQualityAssessor` consume providers y retorno de confirmaciones incluye detalles institucionales para UI.
- ✅ `/api/run-smart-trade/{symbol}` expone `institutional_confirmations_breakdown` y bias Smart Money.
- ✅ Validación manual + `python -m compileall backend/routes/bots.py` registrada en MASTER_PLAN.

---

## ✅ Prioridad 2 · Fase 2 — Implementación Algoritmos 07–12 (cerrado 2025-09-18)
- ✅ Evaluadores institucionales para VSA, Market Profile, Order Flow, Acc/Dist, SMC y Composite Man activos.
- ✅ `DefaultInstitutionalParamProvider` extendido con parámetros DL-001 para los nuevos algoritmos.
- ✅ `POST /api/run-smart-trade/{symbol}` expone confirmaciones `volume_spread_analysis`, `market_profile`, `institutional_order_flow`, `accumulation_distribution`, `smart_money_concepts`, `composite_man`.
- ✅ Validación `python -m compileall backend/services/institutional_params.py backend/services/signal_quality_assessor.py backend/routes/bots.py`.

---

## ✅ Prioridad 3 · Fase 3 — ModeParamProvider + Selector Heurístico (cerrado 2025-09-18)
- ✅ `DefaultModeParamProvider` genera umbrales/pesos a partir de BotConfig + estadísticas recientes.
- ✅ `IntelligentModeSelector` heurístico integrado; decisión registrada en `/api/run-smart-trade/{symbol}`.
- ✅ Payload incluye `mode_decision` (scores, features, confianza) para UI/telemetría.
- ✅ Validación `python -m compileall backend/services/mode_params.py backend/routes/bots.py`.

---

## ✅ Prioridad 4 · Fase 4 — UI/Telemetría y Packaging (cerrado 2025-09-18)
- ✅ SmartScalperMetrics muestra `mode_decision` con acciones recomendadas y métricas.
- ✅ Telemetría histórica almacenada en backend (`bot_states.mode_history`) + logging estructurado.
- ✅ Configuración empaquetada en `configs/mode_defaults.json` para testnet/documentación.

---

## 🔥 Prioridad 5 · Fase 5 — Validación End-to-End (REORGANIZADA CON ISSUES IDENTIFICADOS)

### **🚨 BLOQUE A: BACKEND CRÍTICO (P0 - SISTEMA INUTILIZABLE)**
- **DL-095: Dashboard Endpoints 500 Errors**
  - Corregir imports en `/backend/routes/dashboard_data.py` (TradingOperation debe venir de models, no routes)
  - Implementar manejo de errores robusto y session management
  - Eliminar timeouts y AbortError chains que causan logout espontáneo
  - **EVIDENCIA:** Console logs muestran "Load failed" repetidamente, 500 errors constantes

- **DL-098: Estado Bot No Persiste**
  - Verificar persistencia RUNNING/PAUSED en `updateBot` response
  - Confirmar que navegación no resetea estado del bot
  - Implementar state management robusto para evitar STOPPED inesperado

- **DL-097: Live Trading Feed Desconectado**
  - Verificar `/api/trading-feed/live` retorna operaciones reales
  - Conectar persistencia de `trading_operations` con UI display
  - Confirmar que operaciones se almacenan y muestran correctamente

### **🚨 BLOQUE B: BOT EXECUTION CRÍTICO (P0 - FUNCIONALIDAD PRINCIPAL)**
- **DL-093: Background Bot Execution**
  - **PROBLEMA FUNDAMENTAL:** Bot solo analiza cuando usuario abre modal
  - Implementar scheduler automático para bots RUNNING (cada X minutos)
  - Separar análisis automático vs visualización manual
  - Validar que `execute_real=true` + `signals.signal=BUY/SELL` ejecute operaciones reales

### **🚨 BLOQUE C: UX INSTITUCIONAL CRÍTICO (P0 - INFORMACIÓN INCOHERENTE)**
- **DL-096: Smart Scalper Modal Información Incoherente**
  - Eliminar títulos duplicados (externo + interno)
  - Conectar overlays institucionales en gráfico (order blocks, liquidity grabs, FVG)
  - Traducir features raw a mensajes comprensibles
  - Mostrar top algoritmos con explicación, no cambios aleatorios
  - Convertir manipulation alerts de números crudos a mensajes útiles

- **DL-100: Timeframe Desconectado de Parámetros Usuario**
  - Conectar `BotConfig.timeframe` con todos los análisis institucionales
  - Convertir "5 bars" a timeframe real del usuario
  - Sincronizar gráfico + análisis + selector de modo con parámetros del bot

- **DL-101: Panel 12 Algoritmos Incompleto**
  - Render dinámico completo de `institutional_confirmations_breakdown`
  - Mostrar los 12 algoritmos: VSA, Market Profile, Order Flow, A/D, SMC, Composite
  - Eliminar valores estáticos mezclados con dinámicos
  - Asegurar coherencia entre tarjetas individuales y resumen

### **🎯 BLOQUE D: FUNCIONALIDAD PERDIDA (P1)**
- **DL-099: Secciones Eliminadas Sin Reubicación**
  - Reintegrar Performance Overview (win rate, total trades, PnL)
  - Reintegrar Execution Quality (latencia, success rate)
  - Ubicar métricas de rendimiento en SmartScalperMetrics o nueva ubicación

- **DL-094: Señal Definitiva en Tabla Profesional**
  - Agregar columna "Señal Actual" con BUY/SELL/HOLD + confidence
  - Colores: Verde (BUY), Rojo (SELL), Amarillo (HOLD)
  - Usar `signal_generated` + `signal_confidence` del análisis

- **DL-102: Narrativa UX Inexistente**
  - Crear secuencia lógica: Parámetros → Análisis → Decisión → Señal → Historial
  - Reestructurar modal con hilo conductor coherente
  - Agregar explicaciones contextuales para cada sección

### **📊 BLOQUE E: DATASETS/TELEMETRÍA**
- Mantener `DATASET_SNAPSHOT` limpio y definir exportación (CSV/endpoint)
- Limpiar `console.log` residuales para dataset usable
- Capturar snapshots con `institutional_confirmations`, `mode_decision`, `signals.reason`

### **🔧 BLOQUE F: VALIDACIÓN TÉCNICA**
- Ejecutar simulaciones/backtests tras correcciones backend
- Pruebas de latencia Railway/Vercel después de validación local
- Check-list despliegue testnet (DL-001/002/076, rollback plan)

---

*Actualizado: 2025-09-18*  
*Estado del proyecto → MASTER_PLAN.md*  
*Decisiones formales → DECISION_LOG.md*
