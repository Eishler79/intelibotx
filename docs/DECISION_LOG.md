# DECISION_LOG.md · Registro de Decisiones

> **Regla:** Cada entrada debe tener fecha, ID único (`DL-###`), `SPEC_REF`, impacto y rollback.

---

## 2025-08-12 — DL-002 · Política algoritmos institucionales únicamente
**Contexto:** InteliBotX debe ser solución profesional e institucional, no básica.  
**Decisión:** Solo algoritmos de nivel institucional/Smart Money. Eliminar indicadores retail.  
**Algoritmos ELIMINADOS:** EMA_CROSSOVER, RSI_OVERSOLD, MACD_DIVERGENCE (nivel retail).  
**Algoritmos CORE:** Wyckoff, Order Blocks, Liquidity Grabs, Stop Hunting, Fair Value Gaps.  
**Impacto:** Mayor diferenciación vs competencia retail (3Commas, etc.).  
**Rollback:** Git revert + restaurar enum AlgorithmType.  
**SPEC_REF:** CLAUDE_BASE.md#no-hardcode + advanced_algorithm_selector.py

---

## YYYY-MM-DD — DL-001 · Política no-hardcode / no-simulación / no-rupturas
**Contexto:** Evitar pérdida de persistencia y "sancocho" de código.  
**Decisión:** Toda lógica debe basarse en DB/APIs reales; nada temporal.  
**Alternativas:** Simulación / localStorage → descartadas.  
**Impacto:** Frontend (servicios/API); Backend (persistencia).  
**SPEC_REF:** ENDPOINTS_ANALYSIS.md#persistencia-trading-ops  
**Rollback:** Revertir commits y restaurar schema previo.

---

## 2025-08-12 — DL-003 · Política lazy imports para evitar deadlocks Railway
**Contexto:** Servicio Railway inaccesible por deadlock en startup de FastAPI.  
**Decisión:** Todos los imports de servicios deben ser lazy (dentro de funciones).  
**Implementación:** Smart Scalper services movidos de module-level a function-level imports.  
**Impacto:** Startup tiempo <5s vs >30s timeout previo. Health check funcional.  
**Rollback:** Git revert + restaurar imports de módulo en routes/bots.py.  
**SPEC_REF:** routes/bots.py + main.py startup event

---

## 2025-08-12 — DL-004 · Eliminación definitiva flujo retail - Solo algoritmos institucionales
**Contexto:** Sistema híbrido con algoritmos retail (RSI/MACD/CSV) + institucionales (Smart Scalper) generaba confusión y errores.  
**Decisión:** ELIMINAR completamente flujo retail. SIEMPRE usar algoritmos institucionales Smart Money.  
**Cambios realizados:**  
- ❌ Eliminado: líneas 387-442 routes/bots.py (CSV + StrategyEvaluator retail)  
- ✅ SIEMPRE ejecutar: execute_smart_scalper_analysis (Wyckoff, Order Blocks, etc.)  
- ✅ Frontend estandarizado: scalper_mode=true en todas las llamadas  
- ✅ Corregido: imports TimeframeData para resolver Error 500  
**Impacto:** Usuarios ya no reciben señales retail accidentalmente. Experiencia consistente.  
**Rollback:** Git revert + restaurar if scalper_mode condicional en routes/bots.py.  
**SPEC_REF:** SMART_SCALPER_STRATEGY.md + routes/bots.py + frontend components

---

## YYYY-MM-DD — DL-005 · …